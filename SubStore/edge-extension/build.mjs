import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function buildEntries(root = path.dirname(fileURLToPath(import.meta.url)), {check = false} = {}) {
  const helper = fs.readFileSync(path.join(root, 'extractors.js'), 'utf8').trimEnd();
  const outputs = [
    ['page-main.bundle.js', 'page-hook.js', 'MAIN'],
    ['page-bridge.bundle.js', 'bridge.js', 'ISOLATED'],
  ];
  for (const [target, entry, world] of outputs) {
    const expected = `// Generated ${world} entry. Run node build.mjs; do not edit.\n` + helper + '\n' + fs.readFileSync(path.join(root, entry), 'utf8').trimEnd() + '\n';
    const destination = path.join(root, target);
    if (check) {
      if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== expected) throw new Error('Stale browser entry: ' + target);
    } else fs.writeFileSync(destination, expected);
  }
  return outputs.map(([target]) => target);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildEntries(undefined, {check: process.argv.includes('--check')});
  console.log(process.argv.includes('--check') ? 'Browser entries match their sources.' : 'Built independent MAIN/ISOLATED entries.');
}
