// Fusion publication completeness guard v1.0.0 — Build 2026-10-18.
// Subscription publication only; independent of the routing graph.
// Change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

/** Validate policy independently; throw on invalid shape or values, without I/O. */
export function validateFusionContract(contract) {
  const fields = ['schemaVersion', 'minimumNodes', 'requiredNamePrefixes'];
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)
    || Reflect.ownKeys(contract).length !== fields.length
    || !fields.every((field) => Object.prototype.hasOwnProperty.call(contract, field))) {
    throw new Error('Invalid fusion publication contract: expected schemaVersion, minimumNodes and requiredNamePrefixes only');
  }
  if (contract.schemaVersion !== 1) {
    throw new Error('Invalid fusion publication contract: schemaVersion must be 1');
  }
  if (!Number.isSafeInteger(contract.minimumNodes) || contract.minimumNodes <= 0) {
    throw new Error('Invalid fusion publication contract: minimumNodes must be a positive safe integer');
  }

  const prefixes = contract.requiredNamePrefixes;
  if (!Array.isArray(prefixes) || prefixes.length === 0) {
    throw new Error('Invalid fusion publication contract: requiredNamePrefixes must be a nonempty array of unique nonblank strings');
  }
  const seen = new Set();
  for (const prefix of prefixes) {
    if (typeof prefix !== 'string' || prefix.trim().length === 0 || seen.has(prefix)) {
      throw new Error('Invalid fusion publication contract: requiredNamePrefixes must contain unique nonblank strings');
    }
    seen.add(prefix);
  }
}

/**
 * Check an already parsed and schema-validated subscription before publication.
 * Contract: { schemaVersion: 1, minimumNodes, requiredNamePrefixes }.
 * Prefixes are case-sensitive literal starts of the original, untrimmed name.
 * Throws on failure without including input values other than numeric counts.
 * Returns only { nodes, coveredPrefixes }; never mutates or copies proxy data.
 */
export function validateFusionPublication(document, contract) {
  validateFusionContract(contract);
  const prefixes = contract.requiredNamePrefixes;
  const proxies = document?.proxies;
  if (!Array.isArray(proxies) || proxies.length === 0) {
    throw new Error('Fusion publication requires a nonempty document.proxies array');
  }
  // Some providers return HTTP 200 and schema-valid proxy placeholders on
  // subscription failure. Match only confirmed error phrases, not quota data.
  const subscriptionError = /在线设备数量超过套餐允许值|打开官网获取新订阅链接|请复制新订阅链接重新导入更新|使用的设备过多|请去官网获取新订阅链接/u;
  if (proxies.some((proxy) => typeof proxy?.name === 'string' && subscriptionError.test(proxy.name))) {
    throw new Error('Fusion publication contains subscription error placeholder nodes');
  }
  if (proxies.length < contract.minimumNodes) {
    throw new Error(`Fusion publication node count ${proxies.length} is below minimumNodes ${contract.minimumNodes}`);
  }

  let coveredPrefixes = 0;
  for (const prefix of prefixes) {
    if (proxies.some((proxy) => typeof proxy?.name === 'string' && proxy.name.startsWith(prefix))) {
      coveredPrefixes += 1;
    }
  }
  if (coveredPrefixes !== prefixes.length) {
    throw new Error(`Fusion publication is missing required name prefixes: covered ${coveredPrefixes} of ${prefixes.length}`);
  }
  return { nodes: proxies.length, coveredPrefixes };
}
