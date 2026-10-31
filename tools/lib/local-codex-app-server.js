'use strict';

const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

// Protocol reference: https://learn.chatgpt.com/docs/app-server
// The completion waiter / streamed final-message approach also follows the MIT
// WakeWire adapter: https://github.com/glenncalleja/wakewire/tree/main/src/sinks
// No server payloads or stderr are printed here; the caller owns redacted logging.
const DEFAULT_TIMEOUT_MS = 45 * 60 * 1000;
const DEFAULT_RPC_TIMEOUT_MS = 30 * 1000;
const MAX_LINE_LENGTH = 16 * 1024 * 1024;

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  // A notification may fail before the sequential startup code awaits this.
  promise.catch(() => {});
  return { promise, resolve, reject };
}

function positiveTimeout(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 2147483647) {
    throw new TypeError(`${name} must be a positive timer duration`);
  }
}

function killTreeSync(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') {
    // Use a fixed executable and separate arguments, never a shell command.
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    const result = spawnSync(path.join(systemRoot, 'System32', 'taskkill.exe'),
      ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, shell: false, stdio: 'ignore', timeout: 5000 });
    if (result.error || result.status !== 0) child.kill('SIGKILL');
  } else {
    // The spawned server owns a process group, including any tool subprocesses.
    try { process.kill(-child.pid, 'SIGKILL'); } catch (error) {
      if (error.code !== 'ESRCH') child.kill('SIGKILL');
    }
  }
}

async function waitForChildExit(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  // POSIX kill only queues a signal. Wait for Node to observe/reap our direct
  // child instead of returning from task cancellation immediately after kill().
  await new Promise((resolve, reject) => {
    const onClose = () => { clearTimeout(timer); resolve(); };
    const timer = setTimeout(() => {
      child.removeListener('close', onClose);
      reject(new Error('Codex app-server termination timed out'));
    }, 1000);
    child.once('close', onClose);
  });
}

/**
 * Start one persistent Codex thread and await its first complete turn.
 * Returns {threadId, turnId, status:'completed', text}; all other terminal states
 * reject. onThread must durably save the id before it resolves. onEvent receives
 * raw server messages and must apply any required redaction before storing them.
 * Optional signal cancels a run; rpcTimeoutMs bounds individual RPCs separately.
 */
async function runCodexTask({ command, args = [], cwd, prompt, title,
  timeoutMs = DEFAULT_TIMEOUT_MS, rpcTimeoutMs = DEFAULT_RPC_TIMEOUT_MS,
  onThread = async () => {}, onEvent = () => {}, outputSchema, smoke = false, signal } = {}) {
  if (typeof command !== 'string' || !command.trim()) throw new TypeError('command is required');
  if (!Array.isArray(args) || args.some(arg => typeof arg !== 'string')) throw new TypeError('args must be strings');
  if (typeof cwd !== 'string' || !path.isAbsolute(cwd)) throw new TypeError('cwd must be absolute');
  if (typeof prompt !== 'string' || !prompt.trim()) throw new TypeError('prompt is required');
  if (typeof onThread !== 'function' || typeof onEvent !== 'function') throw new TypeError('callbacks must be functions');
  positiveTimeout(timeoutMs, 'timeoutMs');
  positiveTimeout(rpcTimeoutMs, 'rpcTimeoutMs');
  if (signal?.aborted) throw new Error('Codex task cancelled');

  const child = spawn(command, [...args, 'app-server', '--stdio'], {
    cwd, windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
    detached: process.platform !== 'win32'
  });
  const failure = deferred();
  const terminal = deferred();
  const pending = new Map();
  const completed = new Map();
  const messages = new Map();
  const eventTasks = new Set();
  let sequence = 0;
  let threadId;
  let turnId;
  let failed;
  let stopping = false;
  let turnSubmitted = false;
  let turnFinished = false;
  let lineBuffer = '';

  const fail = error => {
    if (failed || stopping) return;
    failed = error instanceof Error ? error : new Error('Codex task failed');
    failure.reject(failed);
    terminal.reject(failed);
    for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(failed); }
    pending.clear();
  };

  const write = value => {
    if (child.stdin.destroyed || !child.stdin.writable) throw new Error('Codex app-server stdin is closed');
    child.stdin.write(`${JSON.stringify(value)}\n`, error => { if (error) fail(new Error('Codex app-server write failed')); });
  };

  const request = (method, params, duration = rpcTimeoutMs, cleanup = false) => {
    if (failed && !cleanup) return Promise.reject(failed);
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`RPC ${method} timed out`));
      }, duration);
      pending.set(id, { resolve, reject, timer, method });
      try { write({ id, method, params }); } catch (error) {
        clearTimeout(timer); pending.delete(id); reject(error);
      }
    });
  };

  function acceptCompletion(turn) {
    if (!turn || typeof turn.id !== 'string') return fail(new Error('Codex app-server returned an invalid turn'));
    completed.set(turn.id, turn);
    if (turnId === turn.id) terminal.resolve(turn);
  }

  function receive(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      return fail(new Error('Codex app-server returned an invalid RPC message'));
    }
    if (Object.hasOwn(message, 'id') && !message.method) {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id); clearTimeout(entry.timer);
      if (message.error) {
        // Error data and messages can contain credentials or prompt contents.
        const code = Number.isInteger(message.error.code) ? message.error.code : 'unknown';
        entry.reject(new Error(`RPC ${entry.method} failed (code ${code})`));
      } else if (Object.hasOwn(message, 'result')) entry.resolve(message.result);
      else entry.reject(new Error(`RPC ${entry.method} returned neither result nor error`));
      return;
    }
    if (typeof message.method !== 'string') return fail(new Error('Codex app-server returned an invalid RPC message'));
    const params = message.params || {};
    // Capture the turn id before notifying the caller, which may cancel here.
    if (message.method === 'turn/started' && params.threadId === threadId && typeof params.turn?.id === 'string') {
      turnId = params.turn.id;
    }
    if (Object.hasOwn(message, 'id')) {
      try {
        if (['item/commandExecution/requestApproval', 'item/fileChange/requestApproval'].includes(message.method)) {
          write({ id: message.id, result: { decision: 'decline' } });
        } else {
          write({ id: message.id, error: { code: -32601, message: 'Unattended client does not support interactive requests' } });
        }
      } catch { /* Failure below also interrupts and kills the server tree. */ }
      return fail(new Error('Codex app-server issued an interactive server request'));
    }
    try {
      // Treat callback failures as fatal, including asynchronous log persistence.
      const eventTask = Promise.resolve(onEvent(message)).catch(() => fail(new Error('Codex onEvent callback failed')));
      eventTasks.add(eventTask);
      eventTask.then(() => eventTasks.delete(eventTask));
    } catch { return fail(new Error('Codex onEvent callback failed')); }
    if (params.threadId !== threadId) return;
    if (message.method === 'item/completed' && params.item?.type === 'agentMessage' && typeof params.item.text === 'string') {
      messages.set(params.turnId, params.item.text);
    }
    if (message.method === 'turn/completed') acceptCompletion(params.turn);
  }

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    if (stopping) return;
    lineBuffer += chunk;
    let boundary;
    while ((boundary = lineBuffer.indexOf('\n')) !== -1) {
      const line = lineBuffer.slice(0, boundary).replace(/\r$/, '');
      lineBuffer = lineBuffer.slice(boundary + 1);
      if (line.length > MAX_LINE_LENGTH) return fail(new Error('Codex app-server JSON line exceeds limit'));
      if (!line.trim()) continue;
      let message;
      try { message = JSON.parse(line); } catch { return fail(new Error('Codex app-server emitted invalid JSON')); }
      receive(message);
    }
    if (lineBuffer.length > MAX_LINE_LENGTH) fail(new Error('Codex app-server JSON line exceeds limit'));
  });
  // Drain stderr so the server cannot block on a full pipe, without retaining it.
  child.stderr.resume();
  child.stdin.on('error', () => fail(new Error('Codex app-server stdin failed')));
  child.on('error', error => fail(new Error(`Cannot start Codex app-server (${error.code || 'spawn error'})`)));
  child.on('exit', (code, exitSignal) => {
    if (!turnFinished) fail(new Error(`Codex app-server exited before turn completion (code ${code}, signal ${exitSignal || 'none'})`));
  });
  const cancel = () => fail(new Error('Codex task cancelled'));
  const onParentExit = () => killTreeSync(child);
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  process.once('exit', onParentExit);
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => fail(new Error('Codex task timed out')), timeoutMs);
  const guard = promise => Promise.race([promise, failure.promise]);

  try {
    await guard(request('initialize', { clientInfo: { name: 'scki_issue_bridge', version: '1.0.0' } }));
    write({ method: 'initialized', params: {} });
    const started = await guard(request('thread/start', {
      // SandboxMode uses kebab-case; SandboxPolicy.type below uses camelCase.
      // Verified with the installed Codex App's generate-json-schema output.
      cwd, approvalPolicy: 'never', sandbox: smoke ? 'read-only' : 'workspace-write', ephemeral: false
    }));
    threadId = started?.thread?.id;
    if (typeof threadId !== 'string' || !threadId) throw new Error('Codex thread/start returned no thread id');
    try { await guard(Promise.resolve().then(() => onThread(threadId))); }
    catch { throw failed || new Error('Codex onThread callback failed; turn was not started'); }
    if (typeof title === 'string' && title.trim()) {
      await guard(request('thread/name/set', { threadId, name: title }));
    }
    if (failed) throw failed;
    turnSubmitted = true;
    const response = await guard(request('turn/start', {
      threadId, input: [{ type: 'text', text: prompt }], approvalPolicy: 'never',
      sandboxPolicy: smoke ? { type: 'readOnly' } : { type: 'workspaceWrite', writableRoots: [cwd], networkAccess: true },
      ...(outputSchema === undefined ? {} : { outputSchema })
    }));
    if (typeof response?.turn?.id !== 'string' || !response.turn.id) throw new Error('Codex turn/start returned no turn id');
    if (turnId && turnId !== response.turn.id) throw new Error('Codex turn/start returned a mismatched turn id');
    turnId = response.turn.id;
    // A fast server may send completion before acknowledging turn/start.
    if (completed.has(turnId)) terminal.resolve(completed.get(turnId));
    const turn = await guard(terminal.promise);
    await guard(Promise.all([...eventTasks]));
    if (failed) throw failed;
    if (turn.status !== 'completed') throw new Error(`Codex turn ${turn.status || 'has invalid status'}`);
    turnFinished = true;
    const fullMessages = (turn.items || []).filter(item => item.type === 'agentMessage' && typeof item.text === 'string');
    const text = fullMessages.length ? fullMessages[fullMessages.length - 1].text : messages.get(turnId) || '';
    return { threadId, turnId, status: turn.status, text };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
    process.removeListener('SIGINT', cancel);
    process.removeListener('SIGTERM', cancel);
    try {
      if (turnSubmitted && !turnFinished && threadId && turnId && child.exitCode === null && child.signalCode === null) {
        await request('turn/interrupt', { threadId, turnId }, 500, true).catch(() => {});
      }
    } finally {
      stopping = true;
      for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('Codex connection closed')); }
      pending.clear();
      // Terminate the tree while the wrapper still owns its descendants.
      killTreeSync(child);
      child.stdin.destroy();
      child.stdout.destroy();
      child.stderr.destroy();
      try { await waitForChildExit(child); }
      finally { process.removeListener('exit', onParentExit); }
    }
  }
}

module.exports = { runCodexTask };
