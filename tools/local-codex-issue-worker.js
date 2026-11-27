#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { Worker, validateConfig, acquireLock, readJSON, redact } = require('./lib/local-codex-worker');

async function main(args = process.argv.slice(2)) {
  const configIndex = args.indexOf('--config');
  if (configIndex < 0 || !args[configIndex + 1]) throw new Error('Usage: node local-codex-issue-worker.js --config ABSOLUTE_PATH [--once|--status|--smoke|--retry TASK_KEY|--resume-publish TASK_KEY]\nTo reuse trusted changes: --retry TASK_KEY --once --seed-patch PATH');
  const file = path.resolve(args[configIndex + 1]);
  const config = validateConfig(readJSON(file));
  const retryIndex = args.indexOf('--retry');
  const seedIndex = args.indexOf('--seed-patch');
  let seedPatch;
  if (seedIndex >= 0) {
    if (retryIndex < 0 || !args[retryIndex + 1] || !args[seedIndex + 1] || !args.includes('--once')
        || ['--smoke', '--status', '--resume-publish'].some(flag => args.includes(flag))) {
      throw new Error('--seed-patch requires --retry TASK_KEY --once');
    }
    seedPatch = path.resolve(args[seedIndex + 1]);
    if (!fs.lstatSync(seedPatch).isFile()) throw new Error('The retry patch must be a regular local file');
  }
  if (args.includes('--status')) {
    const stateFile = path.join(config.stateDir, 'state.json');
    const state = fs.existsSync(stateFile) ? readJSON(stateFile) : {};
    const lockFile = path.join(config.stateDir, 'worker.lock');
    let running = false; let pid = null;
    if (fs.existsSync(lockFile)) { pid = readJSON(lockFile).pid; try { process.kill(pid, 0); running = true; } catch {} }
    console.log(JSON.stringify({ repository: config.repository, model: config.model, effort: config.effort, running, pid,
      paused: fs.existsSync(path.join(config.stateDir, 'PAUSED')), lastPollAt: state.lastPollAt, lastError: state.lastError,
      tasks: Object.values(state.tasks || {}).map(r => ({ taskKey: r.task.taskKey, mode: r.task.mode, status: r.status,
        outcome: r.outcome, model: r.model, effort: r.effort, threadId: r.threadId, turnId: r.turnId, sessionUrl: r.sessionUrl, commitSha: r.commitSha,
        validationRunUrl: r.validationRunUrl, commentId: r.commentId, error: r.error })) }, null, 2));
    return;
  }
  const release = await acquireLock(config.stateDir);
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  const worker = new Worker(config, { signal: controller.signal });
  try {
    await worker.initialize();
    if (args.includes('--smoke')) { await worker.smoke(); return; }
    const resumeIndex = args.indexOf('--resume-publish');
    if (resumeIndex >= 0) { await worker.resumePublication(args[resumeIndex + 1]); return; }
    if (seedPatch) {
      if (fs.existsSync(path.join(config.stateDir, 'PAUSED'))) throw new Error('The worker is paused');
      const key = args[retryIndex + 1];
      if (worker.state.tasks[key]?.task.mode !== 'handle') throw new Error('A trusted patch requires a recorded Issue handling task');
      const record = worker.retry(key);
      await worker.process(record, { seedPatch });
      if (record.status !== 'completed' || !record.commitSha) throw new Error(record.error || `Seeded retry ended in status ${record.status}`);
      return;
    }
    if (retryIndex >= 0) worker.retry(args[retryIndex + 1]);
    do {
      if (!fs.existsSync(path.join(config.stateDir, 'PAUSED'))) {
        try { await worker.poll(); }
        catch (error) { worker.state.lastError = redact(error.message); worker.save(); worker.log(`Poll failed: ${error.message}`); if (args.includes('--once')) throw error; }
      }
      if (args.includes('--once') || controller.signal.aborted) break;
      await new Promise(resolve => {
        const done = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', done); resolve(); };
        const timer = setTimeout(done, config.pollSeconds * 1000);
        controller.signal.addEventListener('abort', done, { once: true });
      });
    } while (!controller.signal.aborted);
  } finally { process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop); await release(); }
}
if (require.main === module) main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
module.exports = { main };
