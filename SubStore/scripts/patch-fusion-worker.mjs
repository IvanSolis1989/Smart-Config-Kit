// Fusion Worker source patcher v1.0.0 — Build 2026-10-18.
// Subscription publication only; change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

// Deliberately exact: a changed validator must be reviewed rather than partially
// rewritten. This block contains no deployment, account or credential values.
const validatorBaseline = String.raw`function sckiValidFusion(content) {
  if (typeof content !== "string" || content.length < 256 || content.length > 5 * 1024 * 1024 || !/^\uFEFF?proxies:\s*\n/.test(content) || /<!doctype|<html/i.test(content)) return false;
  try {
    const parsed = sckiYaml.parse(content, { schema: "core", uniqueKeys: true, maxAliasCount: 20 });
    if (!Array.isArray(parsed?.proxies) || !parsed.proxies.length || parsed.proxies.length > 5000) return false;
    const names = new Set();
    for (const proxy of parsed.proxies) {
      if (!proxy || typeof proxy.name !== "string" || !proxy.name.trim() || names.has(proxy.name) || typeof proxy.type !== "string" || !proxy.type || typeof proxy.server !== "string" || !proxy.server.trim() || !Number.isInteger(proxy.port) || proxy.port < 1 || proxy.port > 65535) return false;
      names.add(proxy.name);
    }
    return true;
  } catch { return false; }
}`;

const coverageCheck = String.raw`    validateFusionPublication({
      proxies: parsed.proxies.map((proxy) => ({
        name: proxy.name.replace(/^(?:\p{Regional_Indicator}{2}|🏳\uFE0F?|🌐)\s+/u, "")
      }))
    }, contract);
`;
const publisherStart = 'async function sckiPublishedFusion(request, env2, receipt) {';
const contractRead = String.raw`
  let contract;
  try {
    contract = await env2.SUB_STORE_DATA.get("static:fusion:contract:v1", "json");
    validateFusionContract(contract);
  } catch {
    return json({ status: "failed", message: "Fusion publication contract unavailable or invalid" }, 503);
  }`;
const fallbackBaseline = String.raw`  } catch {
    try { content = await env2.SUB_STORE_DATA.get(SCKI_FUSION_CACHE_KEY); } catch { content = null; }
    if (!sckiValidFusion(content)) return json({ status: "failed", message: "Fusion publication and saved replica unavailable" }, 503);`;
const recoveryFallback = String.raw`  } catch {
    let recoveryContract;
    try { recoveryContract = await env2.SUB_STORE_DATA.get("static:fusion:recovery-contract:v1", "json"); } catch { recoveryContract = null; }
    recoveryContract ??= contract;
    try { content = await env2.SUB_STORE_DATA.get(SCKI_FUSION_CACHE_KEY); } catch { content = null; }
    if (!sckiValidFusion(content, recoveryContract)) return json({ status: "failed", message: "Fusion publication and saved replica unavailable" }, 503);`;
const guardImport = 'import { validateFusionPublication, validateFusionContract } from "./scki-fusion-publication-guard.mjs";';

/**
 * Return a new Worker source with publication completeness enforced.
 * Reject unsupported, ambiguous or already patched source; perform no I/O.
 * Unrelated source and its original LF/CRLF convention are preserved.
 */
export function patchFusionWorker(source) {
  if (typeof source !== 'string' || source.length === 0) {
    throw new TypeError('Worker source must be a nonempty string');
  }
  if (source.includes('validateFusionPublication') || source.includes('scki-fusion-publication-guard.mjs')
    || source.includes('validateFusionContract') || source.includes('static:fusion:contract:v1')
    || source.includes('static:fusion:recovery-contract:v1')) {
    throw new Error('Worker source is already patched or contains a conflicting publication guard');
  }

  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const baseline = validatorBaseline.replace(/\n/g, newline);
  const fallback = fallbackBaseline.replace(/\n/g, newline);
  if (source.split(baseline).length !== 2
    || source.split(publisherStart).length !== 2
    || source.split(fallback).length !== 2
    || (source.match(/\bfunction\s+sckiPublishedFusion\s*\(/g) || []).length !== 1
    || (source.match(/\bsckiValidFusion\s*\(/g) || []).length !== 3
    || source.split('if (!sckiValidFusion(content))').length !== 3) {
    throw new Error('Unsupported or ambiguous Worker baseline: expected one validator, one publisher and two validation calls');
  }

  const validator = baseline
    .replace('sckiValidFusion(content)', 'sckiValidFusion(content, contract)')
    .replace('    return true;', coverageCheck.replace(/\n/g, newline) + '    return true;');
  const patched = source.replace(baseline, validator)
    .replace(publisherStart, publisherStart + contractRead.replace(/\n/g, newline))
    .replace(fallback, recoveryFallback.replace(/\n/g, newline))
    .replaceAll('sckiValidFusion(content)', 'sckiValidFusion(content, contract)');
  return guardImport + newline + patched;
}
