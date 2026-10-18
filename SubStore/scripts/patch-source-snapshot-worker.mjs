// Source snapshot Worker patcher v1.0.0 — Build 2026-10-18.
// Precise source transformation; change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

const bridge = `function sckiSourceSnapshotFetch(url, init) {
  const context = getActiveSubStoreContext();
  const readSubscription = async (name) => context?.cache?.subs?.find((sub) => sub.name === name);
  let preview = context?.request?.body;
  if (typeof preview === "string") { try { preview = JSON.parse(preview); } catch { preview = null; } }
  const logicalUrl = preview && typeof preview.url === "string" ? preview.url : undefined;
  return fetchWithSourceSnapshot(context?.env, url, init, fetch, readSubscription, logicalUrl);
}
`;

/** Known extension-aware Worker with the reviewed gateway-530 recovery only. */
export function patchSourceSnapshotWorker(source) {
  if (typeof source !== 'string' || !source || /sckiSourceSnapshotFetch|routeSourceSnapshotRequest|scki-source-snapshot\.mjs/.test(source)) throw new Error('Unsupported or already patched source snapshot Worker');
  const route = /^([ \t]*)const extensionRoute = await routeExtensionSyncRequest\(request, env2, async \(name\) => \{\r?\n([\s\S]*?)^\1\}\);(?=\r?$)/gm;
  const direct = ' : await fetch(options.url, fetchOptions);';
  const gateway = 'gatewayResponse, targetUrl, method, headers, signal, fetchTarget: fetch,';
  if ((source.match(route) || []).length !== 1 || source.split('const extensionRoute = await routeExtensionSyncRequest(').length !== 2
    || source.split(direct).length !== 2 || source.split(gateway).length !== 2) throw new Error('Unsupported or ambiguous source snapshot Worker baseline');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const patched = source.replace(route, (_line, indent, callback) => indent + 'const sckiReadSourceSubscription = async (name) => {' + newline + callback
    + indent + '};' + newline + indent + 'const snapshotRoute = await routeSourceSnapshotRequest(request, env2, sckiReadSourceSubscription);' + newline
    + indent + 'const extensionRoute = snapshotRoute || await routeExtensionSyncRequest(request, env2, sckiReadSourceSubscription);')
    .replace(direct, ' : await sckiSourceSnapshotFetch(options.url, fetchOptions);')
    .replace(gateway, 'gatewayResponse, targetUrl, method, headers, signal, fetchTarget: sckiSourceSnapshotFetch,');
  return 'import { routeSourceSnapshotRequest, fetchWithSourceSnapshot } from "./SubStore/scripts/source-snapshot.mjs";' + newline
    + bridge.replace(/\n/g, newline) + patched;
}
