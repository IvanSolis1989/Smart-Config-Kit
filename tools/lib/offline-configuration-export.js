'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { artifactInventory, safeSource, addLocalDependencies } = require('./business-profile-output');
const { getBusinessProfileCatalog, buildProfilePlan, projectMihomoConfig } = require('./business-profiles');
const { parseYaml } = require('./business-profile-platforms');
const { buildBusinessProfileScriptTemplate, buildBusinessProfileRuntimePlan, emitBusinessProfileScript } = require('./business-profile-script');
const { renderBusinessProfilePlatformCore, openClashPattern, extractOpenClashYaml, renderOpenClashProjection,
  projectSingBox, projectEgern, projectConf, projectKaring, projectXray, projectPasswall } = require('./business-profile-platform-core');
const { readFlClashDataOptions, readFlClashServiceIds, resolveFlClashLocalOptions } = require('./flclash-browser-local-options');
const { buildClientOptionSpec, applyClientOptions, browserRuntimeSource, bindClientOptionSource } = require('./offline-client-options');

const ROOT = path.resolve(__dirname, '../..');
const lf = value => value.replace(/\r\n/g, '\n');
const CLIENTS = [
  ['smart','Clash Party · Smart JS'], ['normal','Clash Party · Normal JS'], ['flclash','FlClash'],
  ['cmfa','CMFA / ClashMi'], ['openclash-normal','OpenClash Normal'], ['openclash-smart','OpenClash Smart'],
  ['stash','Stash'], ['egern','Egern'], ['shadowrocket','Shadowrocket'], ['surge','Surge'], ['loon','Loon'],
  ['quantumultx','Quantumult X'], ['singbox-1.14','sing-box 1.14'], ['singbox-1.13','sing-box 1.13'],
  ['v2rayn','v2rayN · Xray 路由'], ['passwall','Passwall'], ['passwall2','Passwall2'], ['karing','Karing 分流'],
  ['meow','Meow 原生 YAML'], ['aerove-lite','AEROVE Lite JS 候选'],
];

function offlineOptionKey(schema, effective) {
  return JSON.stringify(Object.keys(schema).map(key => [key, effective[key]]));
}

function buildOfflineConfigurationBundle() {
  const catalog = getBusinessProfileCatalog(), sourcePlan = buildProfilePlan({ profile: 'custom', enable: [] });
  const inventory = artifactInventory();
  if (inventory.length !== CLIENTS.length) throw new Error('Offline client inventory differs from the maintained entrypoint catalog');
  const basePlan = {
    finalRule: sourcePlan.finalRule, protectedGroups: sourcePlan.protectedGroups,
    safetyByProvider: sourcePlan.safetyByProvider, surgeSafetyBySegment: sourcePlan.surgeSafetyBySegment,
    nativeSafetySegments: sourcePlan.nativeSafetySegments, segmentPolicies: sourcePlan.segmentPolicies,
    fallbacks: sourcePlan.fallbacks, nativeFallbacks: sourcePlan.nativeFallbacks,
  };
  const dependencies = [];
  addLocalDependencies(dependencies, ROOT, { ...sourcePlan, profile: 'full', disabledSegments: [] });
  const dependencyData = dependencies.map(item => {
    const bytes = fs.readFileSync(safeSource(ROOT, item.path));
    return { path: item.path, ...(/\.(?:mrs|srs)$/i.test(item.path) ? { base64: bytes.toString('base64') } : { content: lf(bytes.toString('utf8')) }) };
  });
  const clients = inventory.map((artifact, index) => {
    const [id, label] = CLIENTS[index], canonicalSource = lf(fs.readFileSync(safeSource(ROOT, artifact.path), 'utf8'));
    const optionSpec = buildClientOptionSpec(id, canonicalSource);
    const extension = path.extname(artifact.path);
    const mimeType = ({ '.js': 'text/javascript;charset=utf-8', '.json': 'application/json;charset=utf-8', '.yaml': 'application/yaml;charset=utf-8', '.sh': 'text/x-shellscript;charset=utf-8' })[extension] || 'text/plain;charset=utf-8';
    let help = '下载原生配置后，按对应客户端教程接入自己的节点或订阅；保留各端既有能力边界。';
    if (id === 'smart') help = '使用 Smart 内核，新建独立 JS 覆写并关联节点订阅，再刷新配置。';
    if (id === 'normal') help = '使用标准 Mihomo 内核，新建独立 JS 覆写并关联节点订阅，再刷新配置。';
    if (id === 'flclash') help = '新建独立的粘贴覆写，粘贴下载的脚本并关联订阅；关闭 DNS 覆写后刷新配置。';
    if (id === 'aerove-lite') help = '将候选 JS 覆写关联已展开节点的订阅；DNS、TUN 等设置由 App 管理，仍待目标设备验收。';
    if (artifact.kind === 'openclash') help = '用 WinSCP 等文件工具先备份，再上传到 /etc/openclash/custom/openclash_custom_overwrite.sh 并设置执行权限，在 LuCI 重启。此为完整自定义脚本；配套 UCI 设置、订阅和内核仍按 OpenClash 教程核对。';
    if (artifact.kind === 'passwall') help = 'ZIP 中列表可在 LuCI 手工导入并选择目标节点；仅适用于 sing-box 分流后端，apply.sh 为可选维护者自动应用脚本。';
    if (id === 'karing') help = '仅导入分流规则；节点、DNS 与最终默认动作仍由 Karing App 设置。';
    if (id === 'v2rayn') help = '在 v2rayN 的 Xray 路由设置中导入；仅包含 proxy、direct、block 三种出站，节点与 DNS 由 App 管理。';
    if (id === 'egern') help = '导入原生配置并接入自己的订阅。测速由原生 smart 管理；调整 QUIC 需配套生成规则资产，当前保留已发布行为，不提供独立开关。';
    if (id === 'meow') help = '原生 YAML 含订阅占位地址；正式 App 导入与真实连接验收单独进行，Full 附默认来源清单。';
    const client = { id, label, kind: artifact.kind, path: artifact.path, runtimeContract: artifact.runtimeContract || null,
      mimeType, help, localOptionSchema: optionSpec.schema, optionSpec, canonicalSource,
      sourceSha256: crypto.createHash('sha256').update(canonicalSource).digest('hex'), companions: [] };
    if (artifact.kind === 'script') {
      const raw = buildBusinessProfileScriptTemplate(canonicalSource, artifact);
      client.scriptTemplate = { prefix: lf(raw.prefix), suffix: lf(raw.suffix) };
      const complete = emitBusinessProfileScript(client.scriptTemplate, buildBusinessProfileRuntimePlan(sourcePlan, catalog));
      client.profileOptionSpec = JSON.parse(JSON.stringify(buildClientOptionSpec(id, complete)));
      if (client.profileOptionSpec.templates.slots.some(slot => slot.end > client.scriptTemplate.prefix.length)) throw new Error(`Local option escaped trusted script prefix: ${id}`);
      bindClientOptionSource(client.profileOptionSpec, client.scriptTemplate.prefix);
    }
    if (['mihomo-yaml','egern'].includes(artifact.kind)) {
      client.modelsByOptions = {};
      let choices = [{}];
      for (const [key, definition] of Object.entries(optionSpec.schema)) {
        if (!Array.isArray(definition.values)) throw new Error(`Dynamic local options cannot be compiled into native YAML: ${id}/${key}`);
        choices = choices.flatMap(choice => definition.values.map(value => ({ ...choice, [key]: value })));
      }
      for (const choice of choices) {
        const model = parseYaml(applyClientOptions(optionSpec, canonicalSource, choice));
        // JSON-compatible YAML must round-trip through the independent YAML
        // parser before any model is included in the browser's trusted bundle.
        const encoded = JSON.stringify(model, null, 2) + '\n';
        if (JSON.stringify(parseYaml(encoded)) !== JSON.stringify(model)) throw new Error(`JSON-compatible YAML round-trip failed: ${id}`);
        client.modelsByOptions[offlineOptionKey(optionSpec.schema, choice)] = model;
      }
    }
    if (artifact.kind === 'openclash') {
      const blocks = [...canonicalSource.matchAll(openClashPattern())];
      if (blocks.length !== 2 || optionSpec.templates.slots.some(slot => blocks.some(block => {
        const start = block.index + block[1].length, end = start + block[2].length;
        return slot.start < end && slot.end > start;
      }))) throw new Error(`OpenClash local parameters overlap native override content: ${id}`);
      client.model = parseYaml(extractOpenClashYaml(canonicalSource));
      if (JSON.stringify(parseYaml(JSON.stringify(client.model))) !== JSON.stringify(client.model)) throw new Error(`OpenClash JSON-compatible YAML round-trip failed: ${id}`);
    }
    const directory = artifact.path.slice(0, artifact.path.lastIndexOf('/'));
    if (artifact.kind === 'passwall') client.companions = dependencyData.filter(file => file.path.startsWith(directory + '/shunt-rules/')).map(file => ({ ...file, segment: path.basename(file.path, '.list') }));
    if (id === 'aerove-lite') client.companions = dependencyData.filter(file => file.path.startsWith(directory + '/rule-assets/'));
    if (['meow','aerove-lite'].includes(id)) client.companions = client.companions.concat(dependencyData.filter(file => file.path === 'Meow内核系/adapter-manifest.json').map(file => ({ ...file, fullDefaultOnly: true })));
    if (id === 'karing') client.companions = dependencyData.filter(file => file.path === 'Sing-box内核系/Karing/adapter-manifest.json').map(file => ({ ...file, fullDefaultOnly: true }));
    return client;
  });
  return { schemaVersion: 1, sourceVersion: sourcePlan.sourceVersion, lineEndings: 'canonical-lf',
    services: catalog.services, presets: catalog.presets, protectedGroups: catalog.protectedGroups,
    fallbackExplanation: catalog.fallbackExplanation, basePlan, clients };
}

function selectOfflineProfile(bundle, options) {
  if (typeof options.profile !== 'string' || !['full','lite','custom'].includes(options.profile)) throw new Error('Business profile must be full, lite or custom');
  const supplied = Object.prototype.hasOwnProperty.call(options, 'enable');
  if (options.profile !== 'custom' && supplied) throw new Error('Business enable is only valid with Custom');
  const enable = readFlClashServiceIds(supplied ? options.enable : []);
  if (enable.some(id => !bundle.services.some(service => service.id === id))) throw new Error('Unknown business service');
  const selected = new Set(options.profile === 'full' ? bundle.services.map(service => service.id) : options.profile === 'lite' ? bundle.presets.lite : enable);
  const enabled = bundle.services.filter(service => selected.has(service.id)), disabled = bundle.services.filter(service => !selected.has(service.id));
  const disabledGroups = disabled.map(service => service.group), base = bundle.basePlan;
  return { ...base, profile: options.profile, enabled: enabled.map(service => service.id), disabled: disabled.map(service => service.id), disabledGroups,
    fallbacks: Object.fromEntries(disabled.map(service => [service.group, base.fallbacks[service.group]])),
    nativeFallbacks: Object.fromEntries(disabled.map(service => [service.group, base.nativeFallbacks[service.group]])),
    disabledSegments: Object.keys(base.segmentPolicies).filter(id => disabledGroups.includes(base.segmentPolicies[id]) && !base.nativeSafetySegments.includes(id)) };
}

function generateOfflineConfiguration(bundle, requested) {
  if (!bundle || bundle.schemaVersion !== 1 || !Array.isArray(bundle.clients) || !Array.isArray(bundle.services)) throw new Error('Invalid trusted offline configuration bundle');
  const options = readFlClashDataOptions(requested, ['client','profile','enable','localOptions'], 'offline configuration');
  if (typeof options.client !== 'string') throw new Error('Client ID is required');
  const client = bundle.clients.find(item => item.id === options.client);
  if (!client) throw new Error('Unknown offline client');
  const plan = selectOfflineProfile(bundle, options);
  const localOptions = resolveFlClashLocalOptions(client.localOptionSchema, options.localOptions);
  bindClientOptionSource(client.optionSpec, client.canonicalSource);
  const original = applyClientOptions(client.optionSpec, client.canonicalSource, options.localOptions);
  const clone = value => JSON.parse(JSON.stringify(value));
  const encode = value => JSON.stringify(value, null, 2) + '\n';
  let content = original;
  if (plan.profile !== 'full') {
    if (client.kind === 'script') {
      bindClientOptionSource(client.profileOptionSpec, client.scriptTemplate.prefix);
      const prefix = applyClientOptions(client.profileOptionSpec, client.scriptTemplate.prefix, options.localOptions);
      const runtimePlan = { disabledGroups: plan.disabledGroups, fallbacks: plan.fallbacks, safetyByProvider: plan.safetyByProvider,
        businessGroups: bundle.protectedGroups.concat(bundle.services.map(service => service.group)), finalRule: plan.finalRule };
      content = emitBusinessProfileScript({ prefix, suffix: client.scriptTemplate.suffix }, runtimePlan);
    } else if (client.kind === 'mihomo-yaml' || client.kind === 'egern') {
      const model = client.modelsByOptions[offlineOptionKey(client.localOptionSchema, localOptions)];
      if (!model) throw new Error('Missing trusted native YAML local-option preset');
      content = encode(client.kind === 'egern' ? projectEgern(clone(model), plan) : projectMihomoConfig(clone(model), plan));
    } else if (client.kind === 'openclash') content = renderOpenClashProjection(original, encode(projectMihomoConfig(clone(client.model), plan)), plan);
    else if (client.kind === 'sing-box') content = encode(projectSingBox(JSON.parse(original), plan));
    else if (client.kind === 'xray') content = encode(projectXray(JSON.parse(original), plan));
    else if (client.kind === 'karing') content = encode(projectKaring(JSON.parse(original), plan));
    else if (client.kind === 'conf' || client.kind === 'quantumult') content = projectConf(original, plan, client.kind === 'quantumult');
    else if (client.kind === 'passwall') content = projectPasswall(original, plan);
    else throw new Error('Unsupported offline platform');
  }
  const unchanged = content === client.canonicalSource;
  const files = [{ path: client.path, content }];
  for (const companion of client.companions) {
    if (companion.fullDefaultOnly && !(plan.profile === 'full' && unchanged)) continue;
    if (companion.segment && plan.profile !== 'full' && plan.disabledSegments.includes(companion.segment)) continue;
    files.push(companion.base64 !== undefined ? { path: companion.path, base64: companion.base64 } : { path: companion.path, content: companion.content });
  }
  const basename = client.path.slice(client.path.lastIndexOf('/') + 1), extensionAt = basename.lastIndexOf('.');
  const filename = files.length > 1 ? client.id + '-' + plan.profile + '.zip'
    : basename.slice(0, extensionAt) + '-' + plan.profile + basename.slice(extensionAt);
  const preserved = ['sing-box','xray','karing','passwall'].includes(client.kind) ? plan.nativeSafetySegments.filter(id => plan.disabledGroups.includes(plan.segmentPolicies[id])).map(id => ({
    segment: id, status: 'preserved-safety-residual', previousPolicy: plan.segmentPolicies[id], fallbackPolicy: plan.fallbacks[plan.segmentPolicies[id]] })) : [];
  return { filename, mimeType: files.length > 1 ? 'application/zip' : client.mimeType, files,
    summary: { client: client.id, label: client.label, profile: plan.profile, localOptions,
      enabledServices: plan.enabled, disabledServices: plan.disabled, disabledGroups: plan.disabledGroups,
      protectedGroups: bundle.protectedGroups, preservedSafetyResiduals: preserved, help: client.help,
      sourceVersion: bundle.sourceVersion, sourceSha256: client.sourceSha256, lineEndings: 'canonical-lf',
      fullCanonicalSourceUnchanged: unchanged, fileCount: files.length, fallbackExplanation: bundle.fallbackExplanation } };
}

function renderOfflineConfigurationExporter() {
  return lf(browserRuntimeSource() + '\n' + renderBusinessProfilePlatformCore() + '\n' +
    [emitBusinessProfileScript, readFlClashServiceIds, offlineOptionKey, selectOfflineProfile, generateOfflineConfiguration].map(fn => fn.toString()).join('\n\n') + '\n');
}

module.exports = { buildOfflineConfigurationBundle, generateOfflineConfiguration, renderOfflineConfigurationExporter };
