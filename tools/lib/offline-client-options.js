'use strict';

const { definitions } = require('./configuration-schema');
const { parseLocalTrafficOptions, planLocalTrafficOptions } = require('./local-traffic-options');
const { readFlClashDataOptions, resolveFlClashLocalOptions, formatFlClashLocalLiteral } = require('./flclash-browser-local-options');
const { applyCmfaTrafficOptions, applyMobileTrafficOptions } = require('../build-fused-rule-sets');
const { getQuicRules } = require('../../rulesets/source/routing-graph');
const clients = ['smart','normal','flclash','cmfa','openclash-normal','openclash-smart','stash','egern','shadowrocket','surge','loon','quantumultx','singbox-1.14','singbox-1.13','v2rayn','passwall','passwall2','karing','meow','aerove-lite'];
const clientOptionSources = new WeakMap();

// The trusted bundle loader binds each deserialized spec once. Keep the original
// string by reference outside serializable metadata, including for large Xray.
function bindClientOptionSource(spec, source) {
  if (typeof source !== 'string') throw new Error('Invalid trusted option source');
  if (clientOptionSources.has(spec) && clientOptionSources.get(spec) !== source) throw new Error('Trusted option source already bound');
  clientOptionSources.set(spec,source);
  return spec;
}

// Compile trusted maintained artifacts to typed literal slots or finite native
// variants. Nothing here runs the configuration; browser code needs no parser.
function buildClientOptionSpec(clientId, source) {
  if (!clients.includes(clientId) || typeof source !== 'string') throw new Error('Unknown client or invalid trusted source');
  const spec = { clientId, schema: {}, kind: 'native', templates: {} };
  bindClientOptionSource(spec,source);
  const js = ['smart','normal','flclash','aerove-lite'].includes(clientId);
  const shell = clientId.startsWith('openclash-');
  let keys = js ? Object.keys(definitions).filter(key => clientId !== 'aerove-lite' || !['subscriptionAdapterProfile','browserUdpPolicy'].includes(key))
    : shell ? ['healthCheckProfile','quicPolicy','subscriptionAdapterProfile','maxNodeMultiplier']
    : ['cmfa','stash','meow','shadowrocket','surge','loon','singbox-1.14','singbox-1.13'].includes(clientId) ? ['healthCheckProfile','quicPolicy']
    : clientId === 'quantumultx' ? ['healthCheckProfile'] : ['karing','v2rayn'].includes(clientId) ? ['quicPolicy'] : [];
  for (const key of keys) spec.schema[key] = JSON.parse(JSON.stringify(definitions[key]));
  if (clientId === 'v2rayn') {
    const guards=getQuicRules('block-foreign'), data=JSON.parse(source);
    const managed=data.filter(rule=>guards.some(guard=>rule.remarks?.startsWith(`inline ${guard} -> `)));
    if (managed.length!==guards.length || new Set(managed.map(rule=>rule.id)).size!==guards.length || guards.some(guard=>managed.filter(rule=>rule.remarks.startsWith(`inline ${guard} -> `)).length!==1)) throw new Error('Xray trusted QUIC guard drift');
    spec.kind='xray-managed';
    spec.templates.managed=managed.map(({id,remarks})=>({id,remarks}));
    return spec;
  }
  if (['shadowrocket','surge'].includes(clientId)) spec.schema.quicPolicy.description = '原生 all-proxy 限制全部代理 QUIC，范围较海外规则更宽；按规则处理将取消此限制。';
  if (clientId === 'loon') spec.schema.quicPolicy.description = '禁用全部 UDP/443，含国内与其他服务；按规则处理将取消此限制。';
  if (['shadowrocket','surge','loon'].includes(clientId)) spec.schema.healthCheckProfile.description = '仅调整原生 url-test 检测间隔：标准 300 秒 / 省电 900 秒。';
  if (clientId === 'quantumultx') spec.schema.healthCheckProfile.description = '标准 300 秒并启用 alive-checking；省电 900 秒并关闭后台主动 alive-checking，与 Mihomo 省电机制不同。';
  if (clientId.startsWith('singbox-')) spec.schema.healthCheckProfile.description = '受管 urltest 组检测间隔：标准 5 分钟 / 省电 15 分钟。';
  if (js || shell) {
    spec.kind = 'slots';
    spec.templates.slots = [];
    const parsed = js ? parseLocalTrafficOptions(source, clientId) : null;
    if (js && clientId !== 'aerove-lite') {
      for (const profile of spec.schema.subscriptionAdapterProfile.values) planLocalTrafficOptions(source,source,{subscriptionAdapterProfile:profile});
    }
    if (shell) {
      const catalog=/module SckiSubscriptionAdapterProfiles\r?\n[\s\S]*?MODES\s*=\s*\{([\s\S]*?)^\s*\}\.freeze/m.exec(source);
      for (const profile of spec.schema.subscriptionAdapterProfile.values.filter(value=>value!=='off')) {
        const entry=new RegExp(`"${profile}" => \\{ "id" => "${profile}"\\.freeze, "node_dns_projection" => "${profile}"\\.freeze \\}\\.freeze`);
        if (!catalog || !entry.test(catalog[1]) || !/^  off\|policy\|adaptive\|hosts-only\)/m.test(source)) throw new Error(`Source lacks the selected Node-DNS capability: ${profile}`);
      }
    }
    if (clientId === 'aerove-lite' && parsed.options.subscriptionAdapterProfile !== 'off') throw new Error('AEROVE DNS must remain off');
    for (const key of keys) {
      let start, end, literal;
      if (js) {
        const decl = parsed.declarations[key];
        if (!decl) throw new Error(`Missing trusted option ${key}`);
        const match = /^(.*?=\s*)("[^"\r\n]*"|'[^'\r\n]*'|[^;\s/]+)/.exec(decl.line);
        start = decl.start + match[1].length; literal = match[2]; end = start + literal.length;
        spec.schema[key].default = parsed.options[key];
      } else {
        const names = {healthCheckProfile:'SCKI_DEFAULT_HEALTH_CHECK_PROFILE',quicPolicy:'SCKI_DEFAULT_QUIC_POLICY'};
        const name = names[key] || definitions[key].name;
        const re = names[key] ? new RegExp(`^${name}="([^"\\r\\n]*)"`, 'm')
          : new RegExp(`^${name}="\\$\\{${name}:-([^}\\r\\n]*)\\}"`, 'm');
        const match = re.exec(source);
        if (!match) throw new Error(`Missing shell default ${key}`);
        literal = match[1]; start = match.index + match[0].indexOf(names[key] ? '="' : ':-') + 2; end = start + literal.length;
        spec.schema[key].default = key === 'maxNodeMultiplier' ? literal === '' ? null : Number(literal) : literal;
        if (key === 'maxNodeMultiplier') spec.schema[key].max = 1e20;
      }
      spec.templates.slots.push({key,start,end,literal});
    }
    return spec;
  }
  const health = spec.schema.healthCheckProfile ? ['standard','power-save'] : ['standard'];
  const quic = spec.schema.quicPolicy ? ['block-foreign','follow-rules'] : ['block-foreign'];
  for (const h of health) for (const q of quic) {
    let output = source;
    // Preserve default bytes exactly, including original formatting and EOL.
    if (h !== 'standard' || q !== 'block-foreign') {
      const options = {healthCheckProfile:h,quicPolicy:q};
      if (['cmfa','stash','meow'].includes(clientId)) {
        if (h !== 'standard') {
          if (clientId !== 'meow') output = applyCmfaTrafficOptions(output,options);
          else {
            const eol=output.includes('\r\n')?'\r\n':'\n', normalized=output.replace(/\r\n/g,'\n');
            const group=normalized.slice(normalized.indexOf('\nproxy-groups:\n'),normalized.indexOf('\nproxy-providers:\n'));
            const provider=normalized.slice(normalized.indexOf('\nproxy-providers:\n'),normalized.indexOf('\nrule-providers:\n'));
            const compiled=applyCmfaTrafficOptions(provider+group+'\nrules:\n',options);
            const boundary=compiled.indexOf('\nproxy-groups:\n');
            output=normalized.replace(group,compiled.slice(boundary,compiled.indexOf('\nrules:\n'))).replace(provider,compiled.slice(0,boundary));
            if(eol==='\r\n') output=output.replace(/\n/g,eol);
          }
        }
        if (q === 'follow-rules') {
          const guards = new Set(getQuicRules('block-foreign'));
          const counts = new Map([...guards].map(guard=>[guard,0]));
          output = output.split(/(?<=\n)/).filter(line => {
            let rule=line.replace(/\r?\n$/, '').replace(/^- /,'');
            if (rule.startsWith('"')) { try { rule=JSON.parse(rule.replace(/\\U([0-9a-fA-F]{8})/g,(_match,hex)=>String.fromCodePoint(parseInt(hex,16)))); } catch {} }
            if(guards.has(rule)) {counts.set(rule,counts.get(rule)+1);return false;}
            return true;
          }).join('');
          if([...counts.values()].some(count=>count!==1)) throw new Error('Mihomo trusted QUIC guard drift');
        }
      } else if (['shadowrocket','surge','loon','quantumultx'].includes(clientId)) output = applyMobileTrafficOptions(output,clientId,options);
      else if (clientId === 'karing') {
        const fs=require('node:fs'), path=require('node:path'), root=path.resolve(__dirname,'../..');
        const manifest=JSON.parse(fs.readFileSync(path.join(root,'Sing-box内核系/Karing/adapter-manifest.json'),'utf8'));
        const native=JSON.parse(fs.readFileSync(path.join(root,'Sing-box内核系/SingBox/SingBox(sing-box)-1.13.json'),'utf8'));
        const indices=new Set(native.route.rules.flatMap((rule,index)=>rule.network==='udp' && JSON.stringify(rule.port)==='[443]' && Object.keys(rule).every(k=>['network','port','rule_set','action','outbound'].includes(k)) && (!rule.rule_set || rule.rule_set.length===1 && ['youtube','google','microsoft','apple','cn'].some(site=>rule.rule_set[0]===`geosite-${site}`)) ? [index] : []));
        if(indices.size!==6) throw new Error('Karing native QUIC source drift');
        const names=new Set();
        for (const mapping of manifest.mappings) if (indices.has(mapping.source_rule_index) && mapping.generated_asset) names.add(mapping.name);
        if (names.size!==6) throw new Error('Karing trusted QUIC guard drift');
        const data=JSON.parse(output);
        if (data.rules.filter(rule=>names.has(rule.name)).length!==6) throw new Error('Karing trusted source drift');
        data.rules=data.rules.filter(rule=>!names.has(rule.name));
        output=JSON.stringify(data,null,2)+'\n';
      } else if (clientId.startsWith('singbox-')) {
        const data = JSON.parse(output);
        if (h !== 'standard') for (const outbound of data.outbounds) if (outbound.type === 'urltest') outbound.interval = '15m';
        if (q === 'follow-rules') {
          // Exact maintained native guard catalog, including China's DIRECT
          // exception; never delete arbitrary UDP or port rules.
          const expected = ['youtube','google','microsoft','apple','cn'].map(site => ({rule_set:[`geosite-${site}`],port:[443],network:'udp',action:'route',outbound:({'youtube':'📹 YouTube',google:'🔍 Google 服务',microsoft:'Ⓜ️ 微软服务',apple:'🍎 苹果服务',cn:'DIRECT'})[site]}));
          expected.push({port:[443],network:'udp',action:'reject'});
          const equal = (a,b) => JSON.stringify(Object.keys(a).sort().map(k=>[k,a[k]])) === JSON.stringify(Object.keys(b).sort().map(k=>[k,b[k]]));
          for (const guard of expected) {
            const matches = data.route.rules.filter(rule=>equal(rule,guard));
            if (matches.length !== 1) throw new Error('SingBox trusted QUIC guard drift');
            data.route.rules = data.route.rules.filter(rule=>!equal(rule,guard));
          }
        }
        output = JSON.stringify(data,null,2) + '\n';
      }
    }
    // A common-prefix/suffix delta avoids storing complete copies per preset.
    let start=0,end=source.length,finish=output.length;
    while(start<end && start<finish && source[start]===output[start]) start++;
    while(end>start && finish>start && source[end-1]===output[finish-1]) {end--;finish--;}
    spec.templates[`${h}/${q}`] = {start,end,text:output.slice(start,finish)};
  }
  return spec;
}

function applyClientOptions(spec, source, requested) {
  if (!clientOptionSources.has(spec) || clientOptionSources.get(spec)!==source) throw new Error('Trusted option source differs from bound canonical source');
  const effective = resolveFlClashLocalOptions(spec.schema, requested);
  for (const key of Object.keys(effective)) if (spec.schema[key].max && effective[key] > spec.schema[key].max) throw new Error(`Invalid local option value: ${key}`);
  if (spec.kind === 'xray-managed') {
    if (effective.quicPolicy === 'block-foreign') return source;
    const data=JSON.parse(source), managed=spec.templates.managed;
    for (const entry of managed) if (data.filter(rule=>rule.id===entry.id && rule.remarks===entry.remarks).length!==1) throw new Error('Xray trusted source drift');
    return JSON.stringify(data.filter(rule=>!managed.some(entry=>rule.id===entry.id && rule.remarks===entry.remarks)),null,2)+'\n';
  }
  if (spec.kind === 'slots') {
    for (const slot of spec.templates.slots.slice().sort((a,b)=>b.start-a.start)) {
      if (source.slice(slot.start,slot.end) !== slot.literal) throw new Error('Trusted option source changed before application');
      const value=effective[slot.key];
      if (value === spec.schema[slot.key].default) continue;
      let text=formatFlClashLocalLiteral(value);
      if (spec.clientId.startsWith('openclash-')) text=value===null?'':typeof value==='string'?value:decimalClientOption(value);
      source=source.slice(0,slot.start)+text+source.slice(slot.end);
    }
    return source;
  }
  const variant = spec.templates[`${effective.healthCheckProfile || 'standard'}/${effective.quicPolicy || 'block-foreign'}`];
  if (!variant) throw new Error('Missing trusted native option preset');
  return source.slice(0,variant.start)+variant.text+source.slice(variant.end);
}

function decimalClientOption(value) {
  const parts=String(value).split('e');
  if(parts.length===1) return parts[0];
  const digits=parts[0].replace('.',''), point=(parts[0].indexOf('.')<0?parts[0].length:parts[0].indexOf('.'))+Number(parts[1]);
  return point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point);
}

function browserRuntimeSource() {
  return 'const clientOptionSources = new WeakMap();\n'+[bindClientOptionSource,readFlClashDataOptions,resolveFlClashLocalOptions,formatFlClashLocalLiteral,decimalClientOption,applyClientOptions].map(fn=>fn.toString()).join('\n');
}
module.exports={buildClientOptionSpec,applyClientOptions,browserRuntimeSource,bindClientOptionSource};
