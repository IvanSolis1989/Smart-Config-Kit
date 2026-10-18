// Extension sync Worker patcher v1.0.0 — Build 2026-10-18.
// Change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

export function patchExtensionSyncWorker(source) {
  if (typeof source !== 'string' || source.length === 0) throw new TypeError('Worker source must be a nonempty string');
  if (source.includes('routeExtensionSyncRequest') || source.includes('scki-extension-sync-route.mjs')) {
    throw new Error('Worker source is already patched or contains a conflicting extension route');
  }
  const baseline = /^([ \t]*)const route = routeLegacyRequest\(request, env2\);(?=\r?$)/gm;
  if ((source.match(baseline) || []).length !== 1
    || source.split('const route = routeLegacyRequest(request, env2);').length !== 2) {
    throw new Error('Unsupported or ambiguous Worker baseline: expected one legacy routing line');
  }
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const patched = source.replace(baseline, (_line, indent) => [
    'const route = (await routeExtensionSyncRequest(request, env2, async (name) => {',
    '  await owner(env2).syncLocalReplica();',
    '  const subscriptionUrl = new URL("/api/sub/" + encodeURIComponent(name), request.url);',
    '  subscriptionUrl.searchParams.set("share", "true");',
    '  const stored = await owner(env2).fetch(new Request(subscriptionUrl.href, { method: "GET", redirect: "error" }));',
    '  if (!stored.ok) throw new Error("Extension subscription lookup failed");',
    '  const result = await stored.json();',
    '  if (result?.status !== "success" || !result.data) throw new Error("Extension subscription lookup failed");',
    '  return result.data;',
    '})) || routeLegacyRequest(request, env2);',
  ].map((line) => indent + line).join(newline));
  return 'import { routeExtensionSyncRequest } from "./scki-extension-sync-route.mjs";' + newline + patched;
}
