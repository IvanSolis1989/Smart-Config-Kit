'use strict';

// Display-only catalog. Never translate or mutate the trusted export bundle.
const EN = {
  'Language / 语言': 'Language / 语言', '简体中文': '简体中文',
  '配置向导 · Smart Config Kit': 'Configuration wizard · Smart Config Kit',
  'SMART CONFIG KIT / 本地配置': 'SMART CONFIG KIT / LOCAL CONFIGURATION',
  '让配置适合你的使用方式': 'Make your configuration work for you',
  '选择客户端、业务方案和可用参数。页面加载后配置在浏览器本地生成，不上传订阅或个人配置，也不会自动应用到设备。': 'Choose a client, service profile, and supported options. After this page loads, configuration is generated locally in your browser. Subscriptions and personal configurations are not uploaded, and nothing is applied to your device automatically.',
  '客户端': 'Client',
  '切换客户端时，各自的参数选择单独保存。': 'Options are kept separately for each client while this page is open.',
  '配置类型': 'Configuration type', '业务方案': 'Service profile', '可选参数': 'Optional settings',
  '这里只显示当前客户端支持的选项；默认保留现有行为。': 'Only options supported by this client are shown. Defaults preserve existing behavior.',
  '选择保留专属规则与策略组的业务。': 'Choose which services keep dedicated rules and policy groups.',
  '完整保留全部业务；精简使用预设；自选可逐项配置。': 'Full keeps all services. Lite uses a preset. Custom lets you choose each service.',
  '完整（Full）': 'Full', '精简（Lite）': 'Lite', '自选（Custom）': 'Custom', '保留的业务': 'Services to keep',
  '广告、安全、直连等基础保护保留；未选业务继续匹配后续基础规则。': 'Core ad blocking, security, and direct-routing protections remain. Unselected services continue to match subsequent base rules.',
  '下载与使用': 'Download and use', '下载配置': 'Download configuration', '导入方法': 'How to import',
  '多文件配置以 ZIP 下载，请保留其中的目录结构。页面不会读取个人文件、运行配置或验证设备。': 'Multi-file configurations download as ZIP archives. Keep their directory structure. This page does not read personal files, run configurations, or validate devices.',
  '高级：下载独立设置 JSON': 'Advanced: download separate settings JSON',
  '业务与本地参数分别导出，直接下载的配置已包含当前选择。': 'Service and local settings export separately. The configuration download already includes your current selections.',
  '下载业务设置 JSON': 'Download service settings JSON', '下载本地参数 JSON': 'Download local settings JSON',
  '本地参数 JSON 适用于此客户端的命令行写入。': 'Local settings JSON can be applied through this client’s command-line workflow.',
  '此客户端的当前选项已直接包含在下载的配置中。': 'This client’s selected options are already included in the downloaded configuration.',
  '此客户端没有可调整的本地参数。': 'This client has no adjustable local settings.',
  '留空：不筛选': 'Leave blank: no filtering', '参数需检查': 'Check settings', '默认': 'Default', '完整': 'Full', '精简': 'Lite', '自选': 'Custom', '无效': 'Invalid',
  '标准（standard）': 'Standard (standard)', '省电（power-save）': 'Power saving (power-save)',
  '拦截（block-foreign）': 'Block (block-foreign)', '按规则（follow-rules）': 'Follow rules (follow-rules)',
  '关闭（off）': 'Off (off)', '拒绝（reject）': 'Reject (reject)', '开启（true）': 'On (true)', '关闭（false）': 'Off (false)',
  '关闭适配（off）': 'Disabled (off)', '显式策略（policy）': 'Explicit policy (policy)', '自适应（adaptive）': 'Adaptive (adaptive)', '精确映射（hosts-only）': 'Exact mappings (hosts-only)',
  '节点测速': 'Node health checks', '海外 QUIC': 'Non-China QUIC', 'Windows 浏览器 UDP': 'Windows browser UDP', 'ZeroTier Planet 代理': 'ZeroTier Planet proxy', '订阅节点 DNS': 'Subscription node DNS', '节点倍率上限': 'Maximum node multiplier',
  '标准 300 秒 / 省电 900 秒；保留按使用测速。': 'Standard: 300 seconds. Power saving: 900 seconds. Lazy health checks remain enabled.',
  '保留仓库默认拦截，或显式按后续规则处理。': 'Keep the repository’s default block, or explicitly follow subsequent rules.',
  '默认关闭；拒绝仅匹配 Windows Chrome、Edge、Firefox 的全部 UDP，需 TUN 接管和进程识别。TCP 不变；HTTP/3 和 UDP 通话可能失败或回退，不保证覆盖全部 WebRTC。': 'Off by default. Reject matches all UDP from Windows Chrome, Edge, and Firefox, requiring TUN interception and process detection. TCP is unchanged. HTTP/3 and UDP calls may fail or fall back; this does not guarantee coverage of all WebRTC traffic.',
  '仅设备本地显式选择；默认关闭。': 'Explicit device-local choice only; off by default.',
  'adaptive 为默认；hosts-only 仅接收活动节点精确 IP 映射。': 'Adaptive is the default. Hosts-only accepts exact IP mappings for active nodes only.',
  '留空关闭筛选；只过滤明确高于上限的倍率。': 'Leave blank to disable filtering. Only explicit multipliers above the limit are filtered.',
  '仅调整原生 url-test 检测间隔：标准 300 秒 / 省电 900 秒。': 'Changes only the native url-test interval: standard 300 seconds, power saving 900 seconds.',
  '原生 all-proxy 限制全部代理 QUIC，范围较海外规则更宽；按规则处理将取消此限制。': 'Native all-proxy restricts all proxied QUIC, a broader scope than overseas rules. Follow rules removes this restriction.',
  '禁用全部 UDP/443，含国内与其他服务；按规则处理将取消此限制。': 'Blocks all UDP/443, including domestic and other services. Follow rules removes this restriction.',
  '标准 300 秒并启用 alive-checking；省电 900 秒并关闭后台主动 alive-checking，与 Mihomo 省电机制不同。': 'Standard: 300 seconds with alive-checking enabled. Power saving: 900 seconds with proactive background alive-checking disabled. This differs from Mihomo’s power-saving behavior.',
  '受管 urltest 组检测间隔：标准 5 分钟 / 省电 15 分钟。': 'Managed urltest group interval: standard 5 minutes, power saving 15 minutes.',
  'v2rayN · Xray 路由': 'v2rayN · Xray routing', 'Karing 分流': 'Karing routing', 'Meow 原生 YAML': 'Meow native YAML', 'AEROVE Lite JS 候选': 'AEROVE Lite JS candidate',
  '下载原生配置后，按对应客户端教程接入自己的节点或订阅；保留各端既有能力边界。': 'Download the native configuration, then follow the client’s guide to add your nodes or subscription. Existing client capability limits still apply.',
  '使用 Smart 内核，新建独立 JS 覆写并关联节点订阅，再刷新配置。': 'Use the Smart core. Create a separate JS override, link your node subscription, then refresh the configuration.',
  '使用标准 Mihomo 内核，新建独立 JS 覆写并关联节点订阅，再刷新配置。': 'Use the standard Mihomo core. Create a separate JS override, link your node subscription, then refresh the configuration.',
  '在扩展的脚本管理中新建本地脚本、粘贴下载内容，返回对应配置选择脚本；旧版按覆写入口关联。关闭 DNS 覆写后重新应用配置。': 'In Extensions → Script management, create a local script and paste the download. Return to the configuration and select the script; older versions use the override entry. Disable DNS override, then reapply the configuration.',
  '将候选 JS 覆写关联已展开节点的订阅；DNS、TUN 等设置由 App 管理，仍待目标设备验收。': 'Link the candidate JS override to a subscription with expanded nodes. DNS, TUN, and related settings are managed by the app. Target-device acceptance is still pending.',
  '用 WinSCP 等文件工具先备份，再上传到 /etc/openclash/custom/openclash_custom_overwrite.sh 并设置执行权限，在 LuCI 重启。此为完整自定义脚本；配套 UCI 设置、订阅和内核仍按 OpenClash 教程核对。': 'Back up first with a file tool such as WinSCP. Upload to /etc/openclash/custom/openclash_custom_overwrite.sh, set executable permissions, and restart in LuCI. This is a complete custom script; verify UCI settings, subscription, and core using the OpenClash guide.',
  'ZIP 中列表可在 LuCI 手工导入并选择目标节点；仅适用于 sing-box 分流后端，apply.sh 为可选维护者自动应用脚本。': 'Import the ZIP’s lists manually in LuCI and choose target nodes. Only the sing-box routing backend is supported. The apply.sh file is an optional maintainer automation script.',
  '仅导入分流规则；节点、DNS 与最终默认动作仍由 Karing App 设置。若导入后未触发规则集下载，请在 Karing 逐组打开 SCKI 分流组并保存以激活注册；注册不等于下载成功，仍需核对下载状态。': 'Imports routing rules only. Nodes, DNS, and the final default action remain managed by Karing. If rule-set downloads do not start after import, open and save each SCKI routing group in Karing to activate registration. Registration does not prove download success; check download status separately.',
  '在 v2rayN 的 Xray 路由设置中导入；仅包含 proxy、direct、block 三种出站，节点与 DNS 由 App 管理。': 'Import in v2rayN’s Xray routing settings. Only proxy, direct, and block outbounds are included. Nodes and DNS are managed by the app.',
  '导入原生配置并接入自己的订阅。测速由原生 smart 管理；调整 QUIC 需配套生成规则资产，当前保留已发布行为，不提供独立开关。': 'Import the native configuration and add your subscription. Native smart manages health checks. Changing QUIC requires matching generated rule assets; the published behavior is retained without a separate toggle.',
  '原生 YAML 含订阅占位地址；正式 App 导入与真实连接验收单独进行，Full 附默认来源清单。': 'The native YAML contains a subscription placeholder. App import and real-connection acceptance are separate steps. Full includes the default provenance manifest.',
  '🤖 AI 服务': '🤖 AI services', '💬 即时通讯': '💬 Messaging', '📱 社交媒体': '📱 Social media', '🧑‍💼 会议协作': '🧑‍💼 Meetings and collaboration', '📺 国内流媒体': '📺 China streaming', '🎵 音乐流媒体': '🎵 Music streaming', '🇭🇰 香港流媒体': '🇭🇰 Hong Kong streaming', '🇹🇼 台湾流媒体': '🇹🇼 Taiwan streaming', '🇯🇵 日韩流媒体': '🇯🇵 Japanese and Korean streaming', '🇪🇺 欧洲流媒体': '🇪🇺 European streaming', '🌐 其他国外流媒体': '🌐 Other non-China streaming', '🕹️ 国内游戏': '🕹️ China games', '🎮 国外游戏': '🎮 Non-China games', '🔍 Google 服务': '🔍 Google services', '🔧 工具与服务': '🔧 Tools and services', 'Ⓜ️ 微软服务': 'Ⓜ️ Microsoft services', '🍎 苹果服务': '🍎 Apple services',
  '未知客户端': 'Unknown client', '无效文件内容': 'Invalid file content', '没有可下载的文件': 'No files are available to download', '无效或重复的文件路径': 'Invalid or duplicate file path', '此客户端不支持本地参数 JSON': 'This client does not support local settings JSON',
  '节点倍率上限必须是大于 0 的数字，或留空。': 'Maximum node multiplier must be a number greater than 0, or blank.',
  '无法生成配置。请检查选择；若问题仍存在，请重新加载页面。': 'Unable to generate configuration. Check your selections; reload the page if the problem persists.',
};
function createConfigurationLocale(catalog, storage) {
  const key = 'scki.configuration.language';
  let language = 'en';
  try { const saved = storage && storage.getItem(key); if (saved === 'zh' || saved === 'en') language = saved; } catch (_) { /* Storage may be disabled. */ }
  const t = source => language === 'zh' ? source : Object.hasOwn(catalog, source) ? catalog[source] : /[\u3400-\u9fff]/u.test(source) ? 'Translation unavailable' : source;
  const choose = value => { if (!['en','zh'].includes(value)) return false; language = value; try { if (storage) storage.setItem(key, value); } catch (_) {} return true; };
  const message = (key, values = {}) => {
    const zh = language === 'zh';
    if (key === 'maximum') return zh ? ' 最多 ' + values.max + '；使用普通数字。' : ' Maximum: ' + values.max + '. Use a regular number.';
    if (key === 'multiplier') return zh ? '节点倍率上限必须是大于 0 的数字' + (values.max !== undefined ? '，最多 ' + values.max : '') + '，或留空。' : 'Maximum node multiplier must be greater than 0' + (values.max !== undefined ? ', at most ' + values.max : '') + ', or blank.';
    if (key === 'invalidOption') return zh ? '无效的本地参数：' + t(values.label) : 'Invalid local option: ' + t(values.label);
    if (key === 'full') return zh ? '完整方案：保留全部 ' + values.count + ' 项可选业务与基础保护' : 'Full: keeps all ' + values.count + ' optional services and core protections';
    if (key === 'kept') return zh ? '保留 ' + values.count + ' 项：' + values.names : 'Keeping ' + values.count + ' services: ' + values.names;
    if (key === 'more') return zh ? ' 等，可在下方调整' : ' and more; adjust below';
    if (key === 'selection') return zh ? values.client + '；业务：' + values.profile + '；参数：' + values.options : values.client + '; profile: ' + values.profile + '; options: ' + values.options;
    if (key === 'baseline') return zh ? '表单 v' + values.version + ' · 配置基线 ' + values.baseline : 'Form v' + values.version + ' · Configuration baseline ' + values.baseline;
    throw new Error('Unknown display message');
  };
  const error = err => {
    if (err && err.uiKey) return message(err.uiKey, err.uiValues);
    const text = String(err && err.message || err || '');
    return Object.hasOwn(catalog, text) ? t(text) : t('无法生成配置。请检查选择；若问题仍存在，请重新加载页面。');
  };
  return { t, choose, message, error, get language() { return language; }, get separator() { return language === 'zh' ? '、' : ', '; } };
}
function validateDisplayCatalog(bundle) {
  for (const text of [...bundle.services.map(s => s.group), ...bundle.clients.flatMap(c => [c.label,c.help,...Object.values(c.localOptionSchema || {}).flatMap(d => [d.label,d.description])])]) {
    if (/[\u3400-\u9fff]/u.test(text) && !Object.hasOwn(EN, text)) throw new Error('Missing configuration display translation: '+text);
  }
}
function renderConfigurationLocale() {
  const json = JSON.stringify(EN).replace(/</g, '\\u003c');
  return `const localeCatalog = ${json};\nconst createConfigurationLocale = ${createConfigurationLocale.toString()};\nlet localeStorage; try { localeStorage = globalThis.localStorage; } catch (_) {}\nconst locale = createConfigurationLocale(localeCatalog, localeStorage);`;
}
function localizeStaticMarkup(markup) {
  const escape = s => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  return markup.replace(/(<[a-z][^>]*>)([^<>]*[\u3400-\u9fff][^<>]*)(<\/[a-z][^>]*>)/giu, (_, open, text, close) => {
    if (!Object.hasOwn(EN,text)) throw new Error('Missing static translation: '+text);
    return open.slice(0,-1)+' data-l10n="'+escape(text)+'">'+escape(EN[text])+close;
  }).replace('aria-label="配置类型"','aria-label="Configuration type" data-l10n-aria="配置类型"');
}
module.exports = { EN, createConfigurationLocale, validateDisplayCatalog, renderConfigurationLocale, localizeStaticMarkup };
