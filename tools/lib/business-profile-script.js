'use strict';

const { getBusinessProfileCatalog, projectMihomoConfig } = require('./business-profiles');
const { runBusinessProfile } = require('./business-profile-runtime');

// This is the one maintained emitter for CLI and browser exports. Building a
// template only processes trusted repository text; it never executes the source.
function buildBusinessProfileScriptTemplate(source, artifact) {
  const marker = 'function main(config)';
  if (typeof source !== 'string' || source.split(marker).length !== 2) throw new Error('JS main(config) anchor missing or duplicated');
  if (!artifact || !['in-place', 'clone'].includes(artifact.runtimeContract)) throw new Error('Explicit maintained script runtime contract is required');
  const successMarker = /return config(\r?\n  } catch \(e\) \{)/g;
  if ([...source.matchAll(successMarker)].length !== 1) throw new Error('Maintained JS successful-completion anchor missing or duplicated');
  const prepared = source.replace(marker, 'function sckiBusinessProfileOriginalMain(config)')
    .replace(successMarker, 'sckiBusinessProfileCompletedConfig = config;\n    return config$1');
  return {
    prefix: prepared +
      '\n// Explicit local business profile, generated from the source graph.\n' +
      '// Subscription fields cannot select or override this plan.\n' + projectMihomoConfig.toString() + '\n' +
      runBusinessProfile.toString() + '\nvar sckiBusinessProfileCompletedConfig = null;\n' +
      'function main(config) { return runBusinessProfile(config, ',
    suffix: `, ${JSON.stringify(artifact.runtimeContract)}, sckiBusinessProfileOriginalMain, function () { return sckiBusinessProfileCompletedConfig; }, function () { sckiBusinessProfileCompletedConfig = null; }); }\n`,
  };
}

function buildBusinessProfileRuntimePlan(plan, catalog = getBusinessProfileCatalog()) {
  if (typeof plan.finalRule !== 'string' || !plan.finalRule.startsWith('MATCH,')) throw new Error('Source final routing rule missing');
  return { disabledGroups: plan.disabledGroups, fallbacks: plan.fallbacks, safetyByProvider: plan.safetyByProvider,
    businessGroups: [...catalog.protectedGroups, ...catalog.services.map(service => service.group)], finalRule: plan.finalRule };
}

// Self contained and intentionally small: the browser calls this same function
// with a build-time trusted template and a strictly selected JSON-only plan.
function emitBusinessProfileScript(template, runtimePlan) {
  if (!template || typeof template.prefix !== 'string' || typeof template.suffix !== 'string') throw new Error('Invalid trusted business script template');
  if (!runtimePlan || typeof runtimePlan !== 'object' || Array.isArray(runtimePlan)) throw new Error('Invalid business runtime plan');
  return template.prefix + JSON.stringify(runtimePlan) + template.suffix;
}

function projectScript(source, plan, artifact) {
  const template = buildBusinessProfileScriptTemplate(source, artifact);
  return emitBusinessProfileScript(template, buildBusinessProfileRuntimePlan(plan));
}

module.exports = { buildBusinessProfileScriptTemplate, buildBusinessProfileRuntimePlan, emitBusinessProfileScript, projectScript };
