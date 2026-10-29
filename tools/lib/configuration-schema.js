'use strict';

// One trusted local schema for the existing writer, CLI and offline form.
const profiles = require('../runtime/subscription-adapter-profiles.json');
const definitions = {
  healthCheckProfile: { name:'SCKI_HEALTH_CHECK_PROFILE', values:['standard','power-save'], default:'standard', label:'节点测速', description:'标准 300 秒 / 省电 900 秒；保留按使用测速。' },
  quicPolicy: { name:'SCKI_QUIC_POLICY', values:['block-foreign','follow-rules'], default:'block-foreign', label:'海外 QUIC', description:'保留仓库默认拦截，或显式按后续规则处理。' },
  zeroTierPlanetProxy: { name:'SCKI_ZEROTIER_PLANET_PROXY', values:[true,false], default:false, label:'ZeroTier Planet 代理', description:'仅设备本地显式选择；默认关闭。', preserveOnUpdate:true },
  subscriptionAdapterProfile: { name:'SCKI_SUBSCRIPTION_ADAPTER_PROFILE', values:Object.keys(profiles.profiles), default:profiles.default, label:'订阅节点 DNS', description:'adaptive 为默认；hosts-only 仅接收活动节点精确 IP 映射。', optional:true, preserveOnUpdate:true },
  maxNodeMultiplier: { name:'SCKI_MAX_NODE_MULTIPLIER', type:'nullable-positive-number', default:null, label:'节点倍率上限', description:'留空关闭筛选；只过滤明确高于上限的倍率。', optional:true, preserveOnUpdate:true },
};

function isValidValue(key, value) {
  if (!Object.hasOwn(definitions,key)) return false;
  const definition = definitions[key];
  return definition.type === 'nullable-positive-number'
    ? value === null || typeof value === 'number' && Number.isFinite(value) && value > 0
    : definition.values.includes(value);
}

function validateLocalOptions(options) {
  if (!options || Object.getPrototypeOf(options) !== Object.prototype || !Object.keys(options).length) throw new Error('localOptions must be a nonempty plain object');
  for (const [key,value] of Object.entries(options)) if (!isValidValue(key,value)) throw new Error(`Invalid trusted local option: ${key}`);
  return options;
}

module.exports = { definitions, isValidValue, validateLocalOptions };
