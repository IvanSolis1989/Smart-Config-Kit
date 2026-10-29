'use strict';

const { projectMihomoConfig } = require('./business-profiles');

// Self contained apart from the shared pure projector. Both functions are
// embedded in generated scripts; the subscription never selects the contract.
function runBusinessProfile(config, plan, contract, originalMain, completedConfig, resetCompleted) {
  function complete(output) {
    var completed = completedConfig();
    return completed && output && typeof output === 'object' && output.proxies === completed.proxies &&
      Array.isArray(output.rules) && output.rules[output.rules.length - 1] === plan.finalRule &&
      Array.isArray(output['proxy-groups']) && plan.businessGroups.every(function (name) {
        return output['proxy-groups'].some(function (group) { return group && group.name === name; });
      }) && output['rule-providers'] && typeof output['rule-providers'] === 'object' &&
      Object.keys(output['rule-providers']).length > 0 && Object.keys(output['rule-providers']).every(function (name) { return name.indexOf('scki-fused-') === 0; });
  }
  function mutableDataObject(value) {
    if (!value || typeof value !== 'object' || !Object.isExtensible(value)) return false;
    return Object.keys(value).every(function (key) {
      var property = Object.getOwnPropertyDescriptor(value, key);
      return property && Object.prototype.hasOwnProperty.call(property, 'value') && property.writable && property.configurable &&
        key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
    });
  }
  function replaceArray(target, values) {
    Array.prototype.splice.call(target, 0, target.length);
    for (var i = 0; i < values.length; i++) Array.prototype.push.call(target, values[i]);
  }
  function replaceObject(target, values) {
    Object.keys(target).forEach(function (key) { delete target[key]; });
    Object.keys(values).forEach(function (key) { target[key] = values[key]; });
  }
  function commit(output) {
    var arrays = ['proxies', 'rules', 'proxy-groups'], preserved = {}, snapshots = {};
    // Preflight every write before the first bridge mutation. Frozen arrays,
    // accessors and non-writable containers are refused without a partial write.
    if (!mutableDataObject(config)) throw new Error('Input config is not a mutable data object');
    arrays.forEach(function (key) {
      if (!Array.isArray(config[key])) return;
      if (!mutableDataObject(config[key]) || !Object.getOwnPropertyDescriptor(config[key], 'length').writable) throw new Error('Input array is not mutable: ' + key);
      preserved[key] = config[key]; snapshots[key] = config[key].slice();
    });
    var originalProviders = config['rule-providers'];
    if (originalProviders && Object.prototype.toString.call(originalProviders) === '[object Object]') {
      if (!mutableDataObject(originalProviders)) throw new Error('Input rule-providers is not mutable');
      preserved['rule-providers'] = originalProviders;
      snapshots['rule-providers'] = Object.assign({}, originalProviders);
    }
    var original = Object.assign({}, config);
    try {
      arrays.forEach(function (key) { if (preserved[key]) replaceArray(preserved[key], output[key]); });
      if (preserved['rule-providers']) replaceObject(preserved['rule-providers'], output['rule-providers']);
      Object.keys(config).forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(output, key)) delete config[key]; });
      Object.keys(output).forEach(function (key) { config[key] = preserved[key] || output[key]; });
      return config;
    } catch (error) {
      // Ordinary JSON/bridge containers passed all descriptor checks. Retain
      // their identities while restoring their values on an unexpected write.
      arrays.forEach(function (key) { if (preserved[key]) replaceArray(preserved[key], snapshots[key]); });
      if (preserved['rule-providers']) replaceObject(preserved['rule-providers'], snapshots['rule-providers']);
      replaceObject(config, original);
      throw error;
    }
  }
  resetCompleted();
  // Refuse prototype-control keys before invoking either maintained runtime.
  // This is a failed-input boundary, so preserve the original input verbatim.
  if (config && typeof config === 'object' && ['__proto__', 'constructor', 'prototype'].some(function (key) {
    return Object.prototype.hasOwnProperty.call(config, key);
  })) return config;
  if (contract === 'clone') {
    // AEROVE owns its input clone and DNS refusal semantics. Preserve both its
    // successful new-candidate result and any error from its maintained main.
    var candidate = originalMain(config);
    if (!complete(candidate)) return candidate;
    return projectMihomoConfig(candidate, plan);
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) return config;
  try {
    if (!mutableDataObject(config)) return config;
    var draft = JSON.parse(JSON.stringify(config));
    var baseline = originalMain(draft);
    if (!complete(baseline)) return config;
    // The projector is pure. Node/DNS dependencies and the complete output are
    // validated on the draft before committing any original bridge container.
    return commit(projectMihomoConfig(baseline, plan));
  } catch (error) {
    if (typeof console !== 'undefined' && console && typeof console.error === 'function') console.error('[SCKI business profile] Refused: ' + error.message);
    return config;
  }
}

module.exports = { runBusinessProfile };
