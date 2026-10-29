'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { clientDirectory } = require('./client-layout');
const { getBusinessProfileCatalog, buildProfilePlan } = require('./business-profiles');
const { buildBusinessProfileScriptTemplate, buildBusinessProfileRuntimePlan, emitBusinessProfileScript } = require('./business-profile-script');

const ROOT = path.resolve(__dirname, '../..');
const canonicalLF = value => value.replace(/\r\n/g, '\n');

function buildFlClashBrowserBundle() {
  const catalog = getBusinessProfileCatalog();
  const plan = buildProfilePlan({ profile: 'custom', enable: [] });
  const sourcePath = `${clientDirectory('FlClash')}/FlClash(mihomo).js`;
  const canonicalSource = canonicalLF(fs.readFileSync(path.join(ROOT, sourcePath), 'utf8'));
  const template = buildBusinessProfileScriptTemplate(canonicalSource, { runtimeContract: 'in-place' });
  const scriptTemplate = { prefix: canonicalLF(template.prefix), suffix: canonicalLF(template.suffix) };
  const basePlan = buildBusinessProfileRuntimePlan(plan, catalog);
  if (catalog.services.length !== 24 || new Set(catalog.services.map(service => service.id)).size !== catalog.services.length ||
      catalog.services.some(service => typeof plan.fallbacks[service.group] !== 'string') ||
      catalog.presets.lite.some(id => !catalog.services.some(service => service.id === id))) {
    throw new Error('Source business catalog cannot form a complete trusted FlClash browser bundle');
  }
  return {
    schemaVersion: 1,
    client: 'flclash', sourcePath, sourceVersion: plan.sourceVersion,
    sourceSha256: crypto.createHash('sha256').update(canonicalSource).digest('hex'),
    lineEndings: 'canonical-lf', canonicalSource,
    services: catalog.services.map(({ id, key, group }) => ({ id, key, group })),
    protectedGroups: catalog.protectedGroups.slice(),
    presets: { lite: catalog.presets.lite.slice() },
    basePlan, scriptTemplate,
    fallbackExplanation: catalog.fallbackExplanation,
  };
}

// The browser receives only the trusted bundle built above and explicit UI
// business choices. No canonical main, user code, network or dynamic code runs.
// This function and the shared emitter are rendered together below.
function generateFlClashScript(bundle, options) {
  function record(value) {
    return value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
  }
  if (!record(bundle) || bundle.schemaVersion !== 1 || bundle.client !== 'flclash' || bundle.lineEndings !== 'canonical-lf' ||
      typeof bundle.canonicalSource !== 'string' || bundle.canonicalSource.includes('\r') ||
      typeof bundle.sourceVersion !== 'string' || !/^v\d+\.\d+\.\d+(?:[-.][A-Za-z0-9]+)*$/.test(bundle.sourceVersion) ||
      typeof bundle.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(bundle.sourceSha256) ||
      !Array.isArray(bundle.services) || bundle.services.length !== 24 || !record(bundle.basePlan) ||
      !Array.isArray(bundle.protectedGroups) || !Array.isArray(bundle.presets?.lite)) throw new Error('Invalid trusted FlClash business bundle');
  if (!record(options) || !Object.prototype.hasOwnProperty.call(options, 'profile') ||
      Object.keys(options).some(key => !['profile', 'enable'].includes(key)) ||
      Object.keys(options).some(key => !Object.prototype.hasOwnProperty.call(Object.getOwnPropertyDescriptor(options, key), 'value'))) {
    throw new Error('Business profile options must be a plain data object with profile and optional enable');
  }
  const profile = options.profile;
  if (typeof profile !== 'string' || !['full', 'lite', 'custom'].includes(profile)) throw new Error('Business profile must be full, lite or custom');
  const supplied = Object.prototype.hasOwnProperty.call(options, 'enable');
  if (profile !== 'custom' && supplied) throw new Error('Business enable is only valid with custom profile');
  const enable = supplied ? options.enable : [];
  if (!Array.isArray(enable) || Array.from(enable).some(id => typeof id !== 'string') || new Set(enable).size !== enable.length) throw new Error('Business enable must contain unique string service ids');
  const serviceIds = bundle.services.map(service => service.id);
  if (new Set(serviceIds).size !== serviceIds.length || serviceIds.some(id => typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id)) ||
      enable.some(id => !serviceIds.includes(id))) throw new Error('Unknown business service');
  const selected = new Set(profile === 'full' ? serviceIds : profile === 'lite' ? bundle.presets.lite : enable);
  const enabledServices = bundle.services.filter(service => selected.has(service.id));
  const disabledServices = bundle.services.filter(service => !selected.has(service.id));
  const runtimePlan = {
    disabledGroups: disabledServices.map(service => service.group),
    fallbacks: Object.fromEntries(disabledServices.map(service => {
      const target = bundle.basePlan.fallbacks[service.group];
      if (typeof target !== 'string' || !bundle.protectedGroups.includes(target)) throw new Error('Invalid trusted business fallback policy');
      return [service.group, target];
    })),
    safetyByProvider: bundle.basePlan.safetyByProvider,
    businessGroups: bundle.basePlan.businessGroups,
    finalRule: bundle.basePlan.finalRule,
  };
  const source = profile === 'full' ? bundle.canonicalSource : emitBusinessProfileScript(bundle.scriptTemplate, runtimePlan);
  if (source.includes('\r')) throw new Error('Trusted browser script template must use canonical LF');
  return {
    filename: `FlClash(mihomo)-${profile}.js`, source,
    summary: {
      profile, enabledServices: enabledServices.map(service => service.id), disabledServices: disabledServices.map(service => service.id),
      disabledGroups: runtimePlan.disabledGroups, protectedGroups: bundle.protectedGroups.slice(),
      sourceVersion: bundle.sourceVersion, sourceSha256: bundle.sourceSha256, runtimeContract: 'in-place',
      lineEndings: 'canonical-lf', fullCanonicalSourceUnchanged: profile === 'full',
      sourceContract: 'Canonical LF of the published Git source; Windows checkout CRLF bytes are not preserved.',
    },
  };
}

function renderFlClashBrowserExporter() {
  return canonicalLF(`${emitBusinessProfileScript.toString()}\n\n${generateFlClashScript.toString()}\n`);
}

module.exports = { buildFlClashBrowserBundle, generateFlClashScript, renderFlClashBrowserExporter };
