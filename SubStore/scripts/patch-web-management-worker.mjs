// Web management Worker alias patcher v1.0.0 — Build 2026-10-18.
// Pure source transformation; change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

/**
 * Add alias environment selection to one reviewed, extension-aware router call.
 * Keep the extension route first and leave unrelated source/line endings intact.
 * Perform no I/O, deployment or secret creation/update.
 */
export function patchWebManagementWorker(source) {
  if (typeof source !== 'string' || source.length === 0) throw new TypeError('Worker source must be a nonempty string');
  if (source.includes('webManagementEnvForRequest') || source.includes('scki-web-management-route.mjs')) {
    throw new Error('Worker source is already patched or contains a conflicting web management alias');
  }
  const original = 'const route = extensionRoute || routeLegacyRequest(request, env2);';
  const baseline = /^([ \t]*)const route = extensionRoute \|\| routeLegacyRequest\(request, env2\);(?=\r?$)/gm;
  if ((source.match(baseline) || []).length !== 1 || source.split(original).length !== 2
    || (source.match(/\bconst\s+route\s*=\s*extensionRoute\s*\|\|\s*routeLegacyRequest\s*\(/g) || []).length !== 1) {
    throw new Error('Unsupported or ambiguous Worker baseline: expected one extension-aware legacy routing line');
  }
  const patched = source.replace(baseline, (_line, indent) => indent
    + 'const route = extensionRoute || routeLegacyRequest(request, webManagementEnvForRequest(request, env2));');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  return 'import { webManagementEnvForRequest } from "./scki-web-management-route.mjs";' + newline + patched;
}
