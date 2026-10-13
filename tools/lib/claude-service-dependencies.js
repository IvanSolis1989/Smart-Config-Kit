'use strict';

// Independent audit contract; does not generate routing rules or client exceptions.
const { firstMatch, normalizeHost, digest } = require('./ordered-rule-semantics');
const VERSION = '1.0.0';
const INVENTORY_PATH = 'rulesets/source/claude-service-dependencies.json';
const REPORT_PATH = 'rulesets/generated/claude-service-dependencies.json';
const STAGES = ['login', 'api', 'upload', 'update-cdn', 'telemetry'];
const OWNED_SUFFIXES = new Set(['claudeusercontent.com', 'claudemcpcontent.com', 'livepreview.claude.ai', 'livepreview.claude.app']);
const SHARED_ROOTS = ['googleapis.com', 'googleusercontent.com', 'auth0.com', 'sentry.io', 'statsigapi.net', 'datadoghq.com', 'growthbook.io', 'usefathom.com', 'intercom.io', 'intercomcdn.com', 'cloudflare.com', 'jsdelivr.net', 'githubusercontent.com'];
const LEVELS = ['official-current', 'official-historical', 'third-party-lead'];
const plain = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const within = (host, suffix) => host === suffix || host.endsWith(`.${suffix}`);
const legalHost = (host) => typeof host === 'string' && normalizeHost(host) === host && host.includes('.') && !host.includes('_') && !host.endsWith('.');
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function serialize(value) { return `${JSON.stringify(canonical(value), null, 2)}\n`; }
function isOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') &&
      (['code.claude.com', 'platform.claude.com', 'support.claude.com', 'docs.anthropic.com', 'www.anthropic.com', 'claude.ai'].includes(url.hostname) || (url.hostname === 'github.com' && url.pathname.startsWith('/anthropics/')));
  } catch { return false; }
}
function validateInventory(inventory) {
  const errors = [];
  const error = (message) => errors.push(message);
  if (!plain(inventory)) return { ok: false, errors: ['inventory must be an object'] };
  if (inventory.schema_version !== 1 || inventory.version !== VERSION) error('schema_version 1 and independent version 1.0.0 required');
  if (!validDate(inventory.checked_date)) error('checked_date must be a real YYYY-MM-DD date');
  if (!nonempty(inventory.scope)) error('scope required');
  if (!Array.isArray(inventory.unresolved_questions) || inventory.unresolved_questions.some((value) => !nonempty(value))) error('unresolved_questions must be a string array');
  if (!Array.isArray(inventory.sources) || !inventory.sources.length) error('sources required');
  const sources = new Map();
  for (const source of Array.isArray(inventory.sources) ? inventory.sources : []) {
    if (!plain(source)) { error('source must be an object'); continue; }
    if (!nonempty(source.id) || sources.has(source.id)) error(`invalid or duplicate source id: ${source.id}`);
    sources.set(source.id, source);
    if (!['anthropic', 'third-party'].includes(source.authority) || !LEVELS.includes(source.level)) error(`${source.id}: invalid source authority/level`);
    if (!nonempty(source.locator) || !nonempty(source.supports) || !validDate(source.checked_date)) error(`${source.id}: source locator/supports/checked_date required`);
    try { if (new URL(source.url).protocol !== 'https:') error(`${source.id}: HTTPS source required`); } catch { error(`${source.id}: valid source URL required`); }
    if (source.level.startsWith('official-') && (source.authority !== 'anthropic' || !isOfficialUrl(source.url))) error(`${source.id}: official evidence needs an Anthropic primary source URL`);
    if (source.level === 'third-party-lead' && source.authority !== 'third-party') error(`${source.id}: third-party lead cannot claim official authority`);
  }
  if (!Array.isArray(inventory.entries) || !inventory.entries.length) error('entries required');
  const ids = new Set();
  const stages = new Set();
  for (const entry of Array.isArray(inventory.entries) ? inventory.entries : []) {
    if (!plain(entry)) { error('entry must be an object'); continue; }
    const id = entry.id || '(missing id)';
    if (!nonempty(entry.id) || ids.has(entry.id)) error(`${id}: invalid or duplicate id`);
    ids.add(entry.id);
    if (!legalHost(entry.domain)) error(`${id}: normalized DNS host required; URL, wildcard, keyword and CIDR are forbidden`);
    if (!['exact', 'controlled-suffix'].includes(entry.scope)) error(`${id}: scope must be exact or controlled-suffix`);
    if (entry.scope === 'controlled-suffix' && !OWNED_SUFFIXES.has(entry.domain)) error(`${id}: suffix not in documented first-party dynamic-origin boundaries`);
    if (typeof entry.include_apex !== 'boolean' || (entry.scope === 'exact' && entry.include_apex !== true)) error(`${id}: explicit include_apex required (true for exact host)`);
    if (!Array.isArray(entry.service_stages) || !entry.service_stages.length || entry.service_stages.some((value) => !STAGES.includes(value)) || new Set(entry.service_stages).size !== entry.service_stages.length) error(`${id}: invalid service_stages`);
    else entry.service_stages.forEach((stage) => stages.add(stage));
    if (!['required', 'conditional', 'optional', 'unverified'].includes(entry.necessity)) error(`${id}: invalid necessity`);
    if (!['confirmed', 'pending-verification'].includes(entry.evidence_status)) error(`${id}: invalid evidence_status`);
    if (!nonempty(entry.role) || !nonempty(entry.condition) || !nonempty(entry.restriction)) error(`${id}: role, condition and restriction required`);
    if (typeof entry.shared_domain !== 'boolean') error(`${id}: shared_domain required`);
    if (legalHost(entry.domain) && SHARED_ROOTS.some((root) => within(entry.domain, root)) && entry.shared_domain !== true) error(`${id}: known shared vendor domain must be marked shared`);
    if (entry.shared_domain && entry.scope !== 'exact') error(`${id}: shared infrastructure suffix is prohibited`);
    const ev = entry.evidence;
    if (!plain(ev) || !LEVELS.includes(ev.level) || !validDate(ev.checked_date) || !Array.isArray(ev.source_ids) || !ev.source_ids.length || ev.source_ids.some((source) => !sources.has(source))) error(`${id}: complete evidence with resolvable sources required`);
    else {
      if (ev.checked_date !== inventory.checked_date) error(`${id}: evidence check date must match inventory check date`);
      if (ev.level === 'official-current' && !ev.source_ids.some((source) => sources.get(source)?.level === 'official-current' && sources.get(source)?.authority === 'anthropic')) error(`${id}: official-current entry needs official-current primary evidence`);
      if (entry.evidence_status === 'confirmed' && ev.level !== 'official-current') error(`${id}: current confirmed role cannot be based on historical evidence or third-party lead`);
      if (entry.scope === 'controlled-suffix' && (entry.evidence_status !== 'confirmed' || ev.level !== 'official-current')) error(`${id}: controlled suffix needs current official confirmation`);
    }
    if (entry.evidence_status === 'pending-verification' && entry.necessity !== 'unverified') error(`${id}: pending role must have unverified necessity`);
    if (entry.evidence_status === 'confirmed' && entry.necessity === 'unverified') error(`${id}: confirmed role needs explicit necessity`);
    if (!plain(entry.policy) || !Array.isArray(entry.policy.allowed) || entry.policy.allowed.some((policy) => !nonempty(policy)) || new Set(entry.policy.allowed).size !== entry.policy.allowed.length) error(`${id}: explicit distinct allowed policy array required`);
    else {
      if (entry.evidence_status === 'confirmed' && (!nonempty(entry.policy.target) || !entry.policy.allowed.includes(entry.policy.target))) error(`${id}: confirmed entry needs a target among allowed policies`);
      if (entry.evidence_status === 'pending-verification' && (entry.policy.target !== null || entry.policy.allowed.length)) error(`${id}: pending role cannot enforce a policy`);
      if (['required', 'conditional'].includes(entry.necessity) && entry.policy.allowed.some((policy) => ['REJECT', 'block', '🛑 广告拦截'].includes(policy))) error(`${id}: required/conditional access must not allow a blocking policy`);
    }
    if (!Array.isArray(entry.witnesses) || !entry.witnesses.length || entry.witnesses.some((host) => !legalHost(host) || (entry.scope === 'exact' ? host !== entry.domain : !within(host, entry.domain) || (!entry.include_apex && host === entry.domain))) || new Set(entry.witnesses).size !== entry.witnesses.length) error(`${id}: legal distinct in-scope witnesses required`);
  }
  for (const stage of STAGES) if (!stages.has(stage)) error(`missing service stage: ${stage}`);
  return { ok: errors.length === 0, errors };
}

function buildReport(inventory, model) {
  const validation = validateInventory(inventory);
  if (!validation.ok) throw new Error(`invalid Claude dependency inventory:\n${validation.errors.join('\n')}`);
  if (!model || !/^[a-f0-9]{64}$/.test(model.identity || '') || !Array.isArray(model.rules) || !(model.providers instanceof Map)) throw new Error('current ordered semantic model with identity required');
  const rows = inventory.entries.map((entry) => {
    const routes = entry.witnesses.map((host) => {
      const domainProjection = firstMatch(model, { host }, { mode: 'domain-projection' });
      // Host-only full mode deliberately does not invent process/IP/DNS metadata.
      const fullStatic = firstMatch(model, { host }, { mode: 'full' });
      let assessment;
      if (entry.evidence_status !== 'confirmed') assessment = 'pending-verification';
      else if (domainProjection.status === 'unknown') assessment = 'domain-projection-unknown';
      else if (entry.necessity === 'optional') assessment = ['REJECT', 'block', '🛑 广告拦截'].includes(domainProjection.policy) ? 'optional-blocked' : 'optional-observed';
      else if (entry.shared_domain) assessment = 'shared-host-observed';
      else assessment = entry.policy.allowed.includes(domainProjection.policy) ? 'allowed-domain-projection' : 'policy-gap-pending-review';
      return { host, witness_kind: entry.scope === 'exact' ? 'documented-or-candidate-host' : 'synthetic-in-scope-host', assessment, domainProjection, fullStatic };
    });
    return { ...entry, routes, coverage: entry.scope === 'exact' ? 'exact-host-only' : 'finite-suffix-witnesses-only' };
  });
  const routes = rows.flatMap((row) => row.routes);
  const enforcedUnknowns = rows.filter((row) => row.evidence_status === 'confirmed' && !row.shared_domain && ['required', 'conditional'].includes(row.necessity)).flatMap((row) => row.routes.filter((route) => route.domainProjection.status === 'unknown'));
  const gaps = rows.flatMap((row) => row.routes.filter((route) => route.assessment === 'policy-gap-pending-review').map((route) => ({ id: row.id, necessity: row.necessity, service_stages: row.service_stages, host: route.host, target: row.policy.target, allowed: row.policy.allowed, current: route.domainProjection })));
  const report = {
    schema_version: 1, version: VERSION, inventory_path: INVENTORY_PATH,
    inventory_identity: digest(serialize(inventory)), semantic_identity: model.identity,
    checked_date: inventory.checked_date, scope: inventory.scope,
    limits: ['Domain projection is pure-domain first-match evidence, not a live route.', 'Full-static host-only probes preserve earlier missing process, IP, DNS and core predicates as unknown.', 'Controlled suffixes use finite synthetic witnesses; no universal coverage is proved.', 'Shared host roles do not authorize routing all vendor tenants or URL paths.', 'Optional telemetry may be rejected. Pending roles never authorize exceptions.', 'No real account sign-in, API call, upload, application update or message was exercised.'],
    summary: { entries: rows.length, witnesses: routes.length, confirmed: rows.filter((row) => row.evidence_status === 'confirmed').length, pending: rows.filter((row) => row.evidence_status !== 'confirmed').length, policy_gap_count: gaps.length, required_policy_gap_count: gaps.filter((gap) => gap.necessity === 'required').length, conditional_policy_gap_count: gaps.filter((gap) => gap.necessity === 'conditional').length, optional_blocked_count: routes.filter((route) => route.assessment === 'optional-blocked').length, domain_projection_unknown_count: routes.filter((route) => route.domainProjection.status === 'unknown').length, enforced_domain_projection_unknown_count: enforcedUnknowns.length, full_static_unknown_count: routes.filter((route) => route.fullStatic.status === 'unknown').length },
    coverage: { ok: gaps.length === 0 && enforcedUnknowns.length === 0, scope: 'finite-domain-projection-only', service_health_proved: false, findings: gaps.map((gap) => ({ id: gap.id, host: gap.host, status: 'known-policy-gap-pending-review' })) },
    sources: inventory.sources, unresolved_questions: inventory.unresolved_questions, policy_gaps: gaps, entries: rows,
  };
  report.report_identity = digest(serialize(report));
  return report;
}

function checkReport(report, expected) {
  if (!plain(expected)) return { ok: false, reason: 'generated Claude dependency report missing' };
  if (expected.inventory_identity !== report.inventory_identity) return { ok: false, reason: 'inventory identity changed; regenerate report' };
  if (expected.semantic_identity !== report.semantic_identity) return { ok: false, reason: 'ordered routing semantic identity changed; regenerate report' };
  if (serialize(expected) !== serialize(report)) return { ok: false, reason: 'generated Claude dependency report content differs from current evidence' };
  return { ok: true, reason: 'saved report matches current inventory and ordered semantic identity' };
}

module.exports = { VERSION, INVENTORY_PATH, REPORT_PATH, STAGES, validateInventory, buildReport, checkReport, serialize };
