#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { VERSION, LIMITS, createEvidence, collect, createByteBudget } = require('./lib/mihomo-connection-evidence');

const HELP = 'Mihomo connection evidence v' + VERSION + '\n' +
  'Usage:\n' +
  '  node tools/collect-mihomo-connections.js --input snapshot.json [--input another.json] [--proxies proxies.json] [--output report.json] [--probes-output probes.json]\n' +
  '  node tools/collect-mihomo-connections.js --controller http://127.0.0.1:9090 [--samples 1] [--interval-ms 1000] [--output report.json] [--probes-output probes.json]\n' +
  'Each --input is a separate source: one /connections response or {"snapshots":[...],"proxySnapshot":{...}}. --proxies requires one source.\n' +
  'The controller mode calls only GET /proxies and GET /connections on explicit HTTP loopback. MIHOMO_SECRET is read from the environment.\n' +
  'Limits: 60 seconds total and 5 seconds per request, 1..120 snapshots, 1..10000 ms intervals, 8 MiB per file/body and 32 MiB aggregate.\n' +
  'Report JSON is printed to stdout. Explicit output files must be new and distinct, with existing parent directories.\n';

function readJson(file, budget) {
  try {
    if (!fs.statSync(file).isFile()) throw new Error();
    const descriptor = fs.openSync(file, 'r');
    try {
      const stat = fs.fstatSync(descriptor);
      if (!stat.isFile() || stat.size > LIMITS.bytes) throw new Error();
      const bytes = Buffer.alloc(LIMITS.bytes + 1);
      let length = 0;
      while (length < bytes.length) {
        const count = fs.readSync(descriptor, bytes, length, Math.min(65536, bytes.length - length), null);
        if (count === 0) break;
        budget.consume(count);
        length += count;
        if (length > LIMITS.bytes) throw new Error();
      }
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length)));
    } finally {
      fs.closeSync(descriptor);
    }
  } catch {
    throw new Error('Input evidence could not be read or parsed; details withheld.');
  }
}

function parseArguments(args) {
  const options = { inputs: [] };
  const flags = new Map([
    ['--input', 'inputs'], ['--proxies', 'proxies'], ['--controller', 'controller'],
    ['--samples', 'samples'], ['--interval-ms', 'intervalMs'],
    ['--output', 'output'], ['--probes-output', 'probesOutput'],
  ]);
  for (let index = 0; index < args.length; index += 2) {
    const key = flags.get(args[index]);
    const value = args[index + 1];
    if (!key || !value || value.startsWith('--') || (key !== 'inputs' && options[key] !== undefined)) {
      throw new Error('Invalid CLI arguments; use --help.');
    }
    if (key === 'inputs') options.inputs.push(value);
    else options[key] = value;
  }
  if (options.inputs.length > LIMITS.snapshots ||
      Boolean(options.inputs.length) === Boolean(options.controller) ||
      (!options.controller && (options.samples || options.intervalMs)) ||
      (options.proxies && options.inputs.length !== 1) ||
      [options.samples, options.intervalMs].some(value => value !== undefined && !/^\d{1,5}$/.test(value))) {
    throw new Error('Select one evidence mode and valid options; use --help.');
  }
  return options;
}

function offlineEvidence({ inputs, proxies }, secret) {
  const budget = createByteBudget();
  const evidence = createEvidence(secret);
  const standaloneProxies = proxies ? readJson(proxies, budget) : undefined;
  for (const file of inputs) {
    const evidenceInput = readJson(file, budget);
    if (evidenceInput && Object.hasOwn(evidenceInput, 'snapshots')) {
      if (!Array.isArray(evidenceInput.snapshots) || evidenceInput.snapshots.length === 0 ||
          Object.hasOwn(evidenceInput, 'connections') ||
          (standaloneProxies !== undefined && Object.hasOwn(evidenceInput, 'proxySnapshot'))) {
        throw new Error('Invalid source bundle or conflicting proxy type snapshots.');
      }
      const append = evidence.addSource(Object.hasOwn(evidenceInput, 'proxySnapshot') ? evidenceInput.proxySnapshot : standaloneProxies);
      for (const snapshot of evidenceInput.snapshots) append(snapshot);
    } else {
      evidence.addSource(standaloneProxies)(evidenceInput);
    }
  }
  return evidence.finish();
}

function checkOutputPaths(files) {
  const normalized = files.map(file => process.platform === 'win32' ? file.toLowerCase() : file);
  if (new Set(normalized).size !== normalized.length) throw new Error('Output paths must be distinct.');
  for (const file of files) {
    try {
      fs.lstatSync(file);
      throw new Error('Output already exists.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Output path unavailable; refusing overwrite.');
    }
  }
}

function writeOutputs(outputs) {
  const handles = [];
  let saved = false;
  try {
    // Reserve every file before writing either payload. wx protects against overwrites during races.
    for (const { file, content } of outputs) {
      const fd = fs.openSync(file, 'wx', 0o600);
      handles.push({ file, fd, stat: fs.fstatSync(fd), content });
    }
    for (const handle of handles) fs.writeFileSync(handle.fd, handle.content);
    saved = true;
  } catch {
    throw new Error('Output could not be saved; existing files were not overwritten. Reserved outputs are cleaned where possible; partial files may remain if cleanup fails.');
  } finally {
    for (const handle of handles) {
      fs.closeSync(handle.fd);
      if (!saved) {
        try {
          const current = fs.lstatSync(handle.file);
          if (!current.isSymbolicLink() && current.dev === handle.stat.dev && current.ino === handle.stat.ino) fs.unlinkSync(handle.file);
        } catch {
          // Leave any file that cannot be identified as our own reservation.
        }
      }
    }
  }
}

async function main(args) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    process.stdout.write(HELP);
    return;
  }
  const options = parseArguments(args);
  const output = options.output && path.resolve(options.output);
  const probesOutput = options.probesOutput && path.resolve(options.probesOutput);
  checkOutputPaths([output, probesOutput].filter(Boolean));
  const secret = process.env.MIHOMO_SECRET || '';
  const result = options.controller ? await collect({
    controller: options.controller,
    samples: options.samples === undefined ? undefined : Number(options.samples),
    intervalMs: options.intervalMs === undefined ? undefined : Number(options.intervalMs),
    secret,
  }) : offlineEvidence(options, secret);
  const report = JSON.stringify(result.report, null, 2) + '\n';
  const outputs = [];
  if (output) outputs.push({ file: output, content: report });
  if (probesOutput) outputs.push({ file: probesOutput, content: JSON.stringify(result.probes, null, 2) + '\n' });
  writeOutputs(outputs);
  process.stdout.write(report);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(error => {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  });
}

module.exports = { writeOutputs, readJson };
