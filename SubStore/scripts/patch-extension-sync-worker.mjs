// Extension sync Worker patcher v1.0.1 — Build 2026-10-18.
// Change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.1';

export function patchExtensionSyncWorker(source) {
  if (typeof source !== 'string' || source.length === 0) throw new TypeError('Worker source must be a nonempty string');
  if (source.includes('routeExtensionSyncRequest') || source.includes('scki-extension-sync-route.mjs')) {
    throw new Error('Worker source is already patched or contains a conflicting extension route');
  }
  const baseline = /^([ \t]*)const route = routeLegacyRequest\(request, env2\);(?=\r?$)/gm;
  const fetchBaseline = /^([ \t]*)const response2 = await owner\(env2\)\.fetch\(route\.request\);(?=\r?$)/gm;
  if ((source.match(baseline) || []).length !== 1
    || source.split('const route = routeLegacyRequest(request, env2);').length !== 2
    || (source.match(fetchBaseline) || []).length !== 1) {
    throw new Error('Unsupported or ambiguous Worker baseline: expected one legacy route and backend fetch line');
  }
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  let patched = source.replace(baseline, (_line, indent) => [
    'const extensionRoute = await routeExtensionSyncRequest(request, env2, async (name) => {',
    '  await owner(env2).syncLocalReplica();',
    '  const subscriptionUrl = new URL("/api/sub/" + encodeURIComponent(name), request.url);',
    '  subscriptionUrl.searchParams.set("share", "true");',
    '  const stored = await owner(env2).fetch(new Request(subscriptionUrl.href, { method: "GET", redirect: "manual" }));',
    '  if (!stored.ok) throw new Error("Extension subscription lookup failed");',
    '  const result = await stored.json();',
    '  if (result?.status !== "success" || !result.data) throw new Error("Extension subscription lookup failed");',
    '  return result.data;',
    '});',
    'const route = extensionRoute || routeLegacyRequest(request, env2);',
  ].map((line) => indent + line).join(newline));
  patched = patched.replace(fetchBaseline, (_line, indent) => [
    'const response2 = await owner(env2).fetch(route.request);',
    'if (extensionRoute && response2.status >= 300 && response2.status < 400) {',
    '  return json({ status: "failed", message: "Extension sync backend redirect rejected" }, 502);',
    '}',
  ].map((line) => indent + line).join(newline));
  return 'import { routeExtensionSyncRequest } from "./scki-extension-sync-route.mjs";' + newline + patched;
}
