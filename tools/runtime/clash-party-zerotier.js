// Clash Party device selector v1.0.0. Rule data is owned by routing-graph.js.
var SckiClashPartyZeroTier = (function() {
  // >>> SCKI CLASH PARTY ZEROTIER POLICY: BEGIN
  var POLICY = {"groupName":"🛰️ ZeroTier 根节点","disabledChoice":"PASS","targetGroup":"🇺🇸 美国节点","rules":["AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,103.195.103.66/32,no-resolve)),🛰️ ZeroTier 根节点","AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,79.127.159.187/32,no-resolve)),🛰️ ZeroTier 根节点","AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,84.17.53.155/32,no-resolve)),🛰️ ZeroTier 根节点","AND,((NETWORK,UDP),(DST-PORT,9993),(IP-CIDR,185.152.67.145/32,no-resolve)),🛰️ ZeroTier 根节点"]};
  // <<< SCKI CLASH PARTY ZEROTIER POLICY: END

  function apply(config, initiallyEnabled) {
    if (typeof initiallyEnabled !== 'boolean') throw new Error('Invalid SCKI ZeroTier planet proxy option');
    var groups = config['proxy-groups'];
    if (!Array.isArray(groups) || !Array.isArray(config.rules)) throw new Error('SCKI ZeroTier selector requires generated groups and rules');
    var hasTarget = groups.some(function(group) { return group && group.name === POLICY.targetGroup; });
    SckiTrafficOptions.requireZeroTierPlanetProxyTarget(initiallyEnabled, hasTarget ? [POLICY.targetGroup] : []);
    var choices = hasTarget ? (initiallyEnabled ? [POLICY.targetGroup, POLICY.disabledChoice] : [POLICY.disabledChoice, POLICY.targetGroup]) : [POLICY.disabledChoice];

    // Rebuild only our group/rules. Native store-selected restores an explicit
    // device choice after reload/restart; never trust subscription fields as state.
    config['proxy-groups'] = groups.filter(function(group) { return group.name !== POLICY.groupName; });
    config['proxy-groups'].push({ name: POLICY.groupName, type: 'select', proxies: choices });
    SckiTrafficOptions.applyZeroTierPlanetProxy(config.rules, false, []);
    for (var i = config.rules.length - 1; i >= 0; i--) {
      if (POLICY.rules.indexOf(config.rules[i]) >= 0) config.rules.splice(i, 1);
    }
    for (var j = POLICY.rules.length - 1; j >= 0; j--) config.rules.unshift(POLICY.rules[j]);
    return config;
  }

  return { groupName: POLICY.groupName, apply: apply };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SckiClashPartyZeroTier;
