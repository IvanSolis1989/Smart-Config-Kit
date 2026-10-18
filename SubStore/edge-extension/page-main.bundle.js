// Generated MAIN entry. Run node build.mjs; do not edit.
// Credential-free subscription extractors — canonical source for both worlds.
// Safe to load independently in MAIN and ISOLATED worlds; no I/O or persistence.
(() => {
  'use strict';
  const EXPORT = 'SCKISubStoreExtractors';
  if (Object.prototype.hasOwnProperty.call(globalThis, EXPORT)) return;

  const LINK_KEYS = new Set(['subscribe_url', 'subscription_url', 'sub_url']);
  const SIGNALS = new Set(['api:subscribe_url', 'api:subscription_url', 'api:sub_url',
    'dom:clipboard', 'dom:subscribe-attribute', 'dom:labeled-input', 'dom:client-import', 'dom:subscription-link']);
  const SUB_LABEL = /订阅|\b(?:subscription|subscribe)\b/i;
  const CREDENTIAL_LABEL = /password|passwd|\bpwd\b|e[-_ ]?mail|username|login|credential|cookie|session|auth|密码|邮箱|电子邮件/i;
  const CONTROL_SELECTOR = '[data-clipboard-text], [data-clipboard], [data-subscribe-url], input, textarea, rb-text-field, a[href]';
  const LINK_LABEL = /复制订阅|订阅链接|\bsubscription\b/i;
  const OTHER_LABEL = /邀请|支付|充值|账单|购买|\b(?:invite|invitation|referral|payment|checkout|invoice|billing|purchase)\b/i;
  const OTHER_PATH = /\/(?:invite|invitation|referral|register|signup|pay|payment|checkout|invoice|order|billing|purchase)(?:\/|$)/i;
  const FORMAT_VALUES = new Set(['clash', 'clashmeta', 'clash-meta', 'meta', 'mihomo', 'singbox', 'sing-box', 'surge', 'surge2', 'surge3', 'surge4', 'surge5',
    'loon', 'quantumult', 'quantumultx', 'quantumult-x', 'qx', 'shadowrocket', 'ss', 'ssr', 'v2ray', 'v2rayn', 'vmess', 'trojan', 'hiddify', 'surfboard', 'base64', 'raw', 'mixed', 'json', 'yaml', 'uri']);
  const FORMAT_KEYS = new Set(['format', 'target', 'type', 'client', 'flag']);
  const FORMAT_FLAGS = new Set(['clash', 'singbox', 'sing-box', 'surge', 'loon', 'qx', 'quantumult', 'quantumultx', 'shadowrocket', 'hiddify', 'surfboard', 'ss', 'ssr', 'v2ray']);
  const SITE_META_SELECTOR = 'meta[property="og:site_name"], meta[name="application-name"], meta[name="apple-mobile-web-app-title"]';
  const SITE_BRAND_SELECTOR = 'header [data-brand], header .brand, header .navbar-brand, header .logo, header a[rel~="home"], header img[alt], [role="banner"] [data-brand], [role="banner"] .brand, [role="banner"] .navbar-brand, [role="banner"] .logo, [role="banner"] a[rel~="home"], [role="banner"] img[alt], nav .brand, nav .navbar-brand';
  const GENERIC_SITE_NAME = /^(?:首页|主页|仪表盘|控制台|控制面板|用户中心|个人中心|账户中心|登录|登入|注册|欢迎|home|homepage|dashboard|control\s*panel|user\s*cent(?:er|re)|account|my\s*account|login|log\s*in|sign\s*in|sign\s*up|register|welcome)$/i;

  function ownData(object, key) {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(object, key);
      return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') ? descriptor.value : undefined;
    } catch { return undefined; }
  }

  function validCandidate(value) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || value.length >= 8192 ||
        /[\\\s\p{Cc}\p{Cf}]/u.test(value) || /%(?:25)*(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(value)) return false;
    try {
      const url = new URL(value);
      const authority = value.slice(value.indexOf('://') + 3).split(/[/?#]/, 1)[0];
      return ['http:', 'https:'].includes(url.protocol) && Boolean(authority) && Boolean(url.hostname) && !url.username && !url.password && !authority.includes('@');
    } catch { return false; }
  }

  function importParameter(url, keys) {
    const values = keys.flatMap(key => url.searchParams.getAll(key));
    // Decode exactly once via URLSearchParams. Multiple or double-encoded
    // targets are rejected rather than selecting an arbitrary account.
    return values.length === 1 && validCandidate(values[0]) ? values[0] : null;
  }

  function unwrapImportLink(value) {
    if (typeof value !== 'string' || value.length > 32768 || /[\s\p{Cc}\p{Cf}]/u.test(value)) return null;
    try {
      const hiddify = /^hiddify:\/\/import\/(.+)$/i.exec(value);
      if (hiddify) {
        if (validCandidate(hiddify[1])) return hiddify[1];
        const decoded = decodeURIComponent(hiddify[1]);
        return validCandidate(decoded) ? decoded : null;
      }
      const parsed = new URL(value);
      // Official Loon universal import link: same actions as loon://import.
      if (parsed.origin === 'https://www.nsloon.com' && parsed.pathname === '/openloon/import') return importParameter(parsed, ['sub', 'nodelist']);
      if (validCandidate(value)) return value;
      if (parsed.username || parsed.password) return null;
      const action = (parsed.hostname + parsed.pathname).replace(/^\/+|\/+$/g, '');
      if (parsed.protocol === 'clash:' && action === 'install-config') return importParameter(parsed, ['url']);
      if (parsed.protocol === 'sing-box:' && action === 'import-remote-profile') return importParameter(parsed, ['url']);
      // https://manual.nssurge.com/tools/url-scheme.html
      if (['surge:', 'surgeconfig:'].includes(parsed.protocol) && action === 'install-config') return importParameter(parsed, ['url']);
      // https://github.com/Loon0x00/LoonManual/blob/master/docs/cn/scheme.md
      if (parsed.protocol === 'loon:' && action === 'import') return importParameter(parsed, ['sub', 'nodelist']);
    } catch {}
    return null;
  }

  function subscriptionResponse(responseURL) {
    if (!validCandidate(responseURL)) return false;
    const path = new URL(responseURL).pathname;
    if (/^\/(?:api\/v[1-9]\/)?user\/getSubscribe\/?$/i.test(path)) return true;
    if (OTHER_PATH.test(path)) return false;
    // Explicit subscription endpoints only; not arbitrary account/profile APIs.
    return /^\/(?:api(?:\/v[1-9][0-9]*)?\/)?(?:user\/)?(?:subscribe|subscription|subscriptions)(?:\/(?:get|current|info|fetch))?\/?$/i.test(path);
  }

  function sensitiveKey(key) {
    const compact = key.toLowerCase().replace(/[-_]/g, '');
    return compact === 'url' || /^(?:password|passwd|pwd|email|cookie|headers?|body|requests?|auth|token|accesstoken|refreshtoken|secret|credentials?|localstorage|sessionstorage)/.test(compact);
  }

  function networkCandidates(payload, responseURL) {
    const found = [];
    try {
      if (!subscriptionResponse(responseURL)) return found;
      const visited = new WeakSet();
      let inspected = 0;
      function walk(object, depth) {
        if (!object || typeof object !== 'object' || depth > 4 || visited.has(object)) return;
        visited.add(object);
        for (const key of Object.keys(object)) {
          if (++inspected > 1024) throw new Error('extractor_budget');
          if (sensitiveKey(key)) continue;
          const value = ownData(object, key);
          if (LINK_KEYS.has(key)) {
            const url = unwrapImportLink(value);
            if (url) found.push({ url, signal: 'api:' + key });
          } else if (value && typeof value === 'object') walk(value, depth + 1);
        }
      }
      walk(payload, 0);
      return found;
    } catch { return []; }
  }

  function attribute(element, key) {
    try { const value = element.getAttribute(key); return typeof value === 'string' ? value : ''; }
    catch { return ''; }
  }

  function tag(element) {
    try { return typeof element.tagName === 'string' ? element.tagName.toLowerCase() : ''; }
    catch { return ''; }
  }

  function shortText(element) {
    try { return typeof element.textContent === 'string' ? element.textContent.slice(0, 512) : ''; }
    catch { return ''; }
  }

  function cleanSiteName(value) {
    if (typeof value !== 'string' || value.length > 512) return '';
    const clean = value
      .replace(/[\p{Cc}\p{Cf}]/gu, '')
      .replace(/(?:[a-z][a-z0-9+.-]*:\/\/|www\.)[^\s<>"'`]+/giu, ' ')
      .replace(/[^\s<>"'`|｜;,]+@[^\s<>"'`|｜;,]+/gu, ' ')
      .replace(/\b(?:token|auth(?:_data)?|api[_-]?key|access[_-]?key|password|passwd|secret|session|sid|email)\s*[:=]\s*[^\s|｜;,]+/giu, ' ')
      .replace(/(?:%[a-f0-9]{2}){6,}/giu, ' ')
      .replace(/[a-z0-9+/_=-]{24,}/giu, ' ')
      .replace(/\b\d{7,}\b/gu, ' ')
      .replace(/\s+/gu, ' ')
      .replace(/^[\s|｜:：;,·•\-–—»]+|[\s|｜:：;,·•\-–—»]+$/gu, '')
      .trim();
    if (!clean || GENERIC_SITE_NAME.test(clean) || !/[\p{L}\p{N}]/u.test(clean)) return '';
    return clean.slice(0, 80).replace(/[\ud800-\udbff]$/u, '');
  }

  function siteNames(document) {
    const names = [];
    const seen = new Set();
    function selected(selector, limit) {
      try {
        const nodes = document.querySelectorAll(selector);
        const result = [];
        for (let index = 0; index < Math.min(nodes.length, limit); index++) result.push(nodes[index]);
        return result;
      } catch { return []; }
    }
    function add(value, splitTitle = false) {
      if (typeof value !== 'string' || value.length > 512) return;
      // Only title separators create extra candidates; never split a page's
      // body into words or search it for brand/account data.
      const parts = splitTitle ? value.split(/\s+[|｜·•\-–—»]\s+|[|｜]/u) : [value];
      for (const part of parts.slice(0, 12)) {
        const name = cleanSiteName(part);
        const key = name.toLowerCase();
        if (!name || seen.has(key)) continue;
        seen.add(key);
        names.push(name);
        if (names.length >= 12) return;
      }
    }
    try {
      for (const meta of selected(SITE_META_SELECTOR, 24)) {
        add(attribute(meta, 'content'));
        if (names.length >= 12) return names;
      }
      try { add(document.title, true); } catch {}
      if (names.length >= 12) return names;
      for (const element of selected(SITE_BRAND_SELECTOR, 32)) {
        if (['input', 'textarea', 'select', 'form', 'option', 'script', 'style'].includes(tag(element))) continue;
        try {
          if (element.closest?.('form') || element.querySelector?.('input, textarea, select, form')) continue;
        } catch { continue; }
        const label = attribute(element, 'data-brand') || attribute(element, 'aria-label') || attribute(element, 'title') || attribute(element, 'alt');
        add(label || shortText(element));
        if (names.length >= 12) return names;
      }
    } catch {}
    return names;
  }

  function controlLabel(element) {
    const values = [attribute(element, 'aria-label'), attribute(element, 'title'), attribute(element, 'data-original-title'), componentAttribute(element, 'label')];
    if (['a', 'button', 'span', 'label'].includes(tag(element))) values.push(shortText(element));
    return values.join(' ');
  }

  function componentAttribute(element, key) {
    const reflected = attribute(element, key);
    if (reflected || tag(element) !== 'rb-text-field') return reflected;
    try { const value = element[key]; return typeof value === 'string' ? value : ''; }
    catch { return ''; }
  }

  function credentialControl(element) {
    if (!['input', 'textarea', 'rb-text-field'].includes(tag(element))) return false;
    return CREDENTIAL_LABEL.test([
      componentAttribute(element, 'type'), componentAttribute(element, 'label'), attribute(element, 'name'), attribute(element, 'id'), attribute(element, 'autocomplete'),
      attribute(element, 'aria-label'), attribute(element, 'placeholder'),
    ].join(' '));
  }

  function inputLabel(element, document) {
    const labels = [componentAttribute(element, 'label'), attribute(element, 'aria-label'), attribute(element, 'placeholder')];
    try {
      const associated = element.labels;
      if (associated) for (let index = 0; index < Math.min(associated.length, 8); index++) labels.push(shortText(associated[index]));
      const enclosing = element.closest?.('label');
      if (enclosing) labels.push(shortText(enclosing));
      for (const adjacent of [element.previousElementSibling, element.nextElementSibling]) if (tag(adjacent) === 'label') labels.push(shortText(adjacent));
      const ids = attribute(element, 'aria-labelledby').split(/\s+/).filter(Boolean).slice(0, 8);
      for (const id of ids) labels.push(shortText(document.getElementById?.(id)));
    } catch {}
    return labels.join(' ');
  }

  function obviousOtherURL(value) {
    try { return OTHER_PATH.test(new URL(value).pathname); }
    catch { return true; }
  }

  function subscriptionURL(value) {
    try {
      const url = new URL(value);
      if (OTHER_PATH.test(url.pathname)) return false;
      if (/\/(?:subscribe|subscription|subscriptions|link|sub)(?:\/|$)/i.test(url.pathname)) return true;
      return [...url.searchParams.keys()].some(key => /^(?:token|sub_token|subscription_token|subscribe_token|access_token)$/i.test(key));
    } catch { return false; }
  }

  function domCandidates(document) {
    const found = [];
    try {
      const roots = [{ root: document, depth: 0 }];
      const queued = new WeakSet([document]);
      let controlCount = 0;
      let elementCount = 0;
      let rootCount = 0;
      while (roots.length) {
        const { root, depth } = roots.shift();
        if (++rootCount > 32) throw new Error('extractor_budget');
        const controls = root.querySelectorAll(CONTROL_SELECTOR);
        controlCount += controls.length;
        if (controlCount > 1024) throw new Error('extractor_budget');
        for (const element of controls) {
          if (credentialControl(element)) continue;
          const label = controlLabel(element);
          const unrelated = OTHER_LABEL.test(label);
          const explicit = unwrapImportLink(attribute(element, 'data-subscribe-url'));
          if (explicit && !obviousOtherURL(explicit) && !unrelated) found.push({ url: explicit, signal: 'dom:subscribe-attribute' });
          for (const key of ['data-clipboard-text', 'data-clipboard']) {
            const url = unwrapImportLink(attribute(element, key));
            if (url && !unrelated && !obviousOtherURL(url) && (subscriptionURL(url) || SUB_LABEL.test(label))) found.push({ url, signal: 'dom:clipboard' });
          }
          if (['input', 'textarea', 'rb-text-field'].includes(tag(element))) {
            const type = componentAttribute(element, 'type').toLowerCase();
            const nearby = inputLabel(element, root);
            if ((tag(element) === 'textarea' || ['', 'text', 'url', 'search', 'hidden'].includes(type)) &&
                SUB_LABEL.test(nearby) && !OTHER_LABEL.test(nearby) && !CREDENTIAL_LABEL.test(nearby)) {
              let value;
              try { value = element.value; } catch {}
              const url = unwrapImportLink(value);
              if (url && !obviousOtherURL(url)) found.push({ url, signal: 'dom:labeled-input' });
            }
          }
          if (tag(element) !== 'a') continue;
          const href = attribute(element, 'href');
          const url = unwrapImportLink(href);
          if (!url || unrelated || obviousOtherURL(url)) continue;
          if (!/^https?:\/\//i.test(href) || /^https:\/\/www\.nsloon\.com\/openloon\/import\?/i.test(href)) found.push({ url, signal: 'dom:client-import' });
          else if (LINK_LABEL.test(label) && subscriptionURL(url)) found.push({ url, signal: 'dom:subscription-link' });
        }
        // Element structure alone discovers open roots. Never inspect page-wide
        // text, scripts, closed roots, or unrelated input values.
        const elements = root.querySelectorAll('*');
        elementCount += elements.length;
        if (elementCount > 4096) throw new Error('extractor_budget');
        for (const element of elements) {
          let shadow;
          try { shadow = element.shadowRoot; } catch {}
          if (!shadow || queued.has(shadow)) continue;
          if (depth >= 4) throw new Error('extractor_budget');
          queued.add(shadow);
          roots.push({ root: shadow, depth: depth + 1 });
        }
      }
      return found;
    } catch { return []; }
  }

  function formatParameter(key, value) {
    const lower = key.toLowerCase();
    return (FORMAT_KEYS.has(lower) && FORMAT_VALUES.has(value.toLowerCase())) ||
      (FORMAT_FLAGS.has(lower) && /^(?:0|1|2|3|4|5|true|false)$/i.test(value));
  }

  function identity(value) {
    const parsed = new URL(value);
    const remaining = new Map();
    let formats = 0;
    for (const [key, value] of parsed.searchParams) {
      if (formatParameter(key, value)) { formats++; continue; }
      if (!remaining.has(key)) remaining.set(key, []);
      remaining.get(key).push(value);
    }
    // Query key order is immaterial; duplicate values retain order because
    // servers may select the first/last token. Fragments remain part of identity.
    const query = [...remaining.keys()].sort().map(key => [key, remaining.get(key)]);
    return { key: JSON.stringify([parsed.origin, parsed.pathname, query, parsed.hash]), formats };
  }

  function before(left, right) {
    for (let index = 0; index < left.length; index++) {
      if (left[index] !== right[index]) return left[index] < right[index];
    }
    return false;
  }

  function selectCandidates(list) {
    if (!Array.isArray(list)) return { status: 'none', count: 0 };
    const identities = new Map();
    try {
      for (const entry of list) {
        if (!entry || typeof entry !== 'object') continue;
        const url = unwrapImportLink(ownData(entry, 'url'));
        if (!url) continue;
        const rawSignal = ownData(entry, 'signal');
        const signal = SIGNALS.has(rawSignal) ? rawSignal : 'unknown';
        const key = identity(url);
        const candidate = { url, signal };
        const rank = [key.formats, signal.startsWith('api:') ? 0 : signal === 'dom:subscribe-attribute' ? 1 : 2, url, signal];
        const previous = identities.get(key.key);
        if (!previous || before(rank, previous.rank)) {
          identities.set(key.key, { candidate, rank });
        }
      }
      if (identities.size === 0) return { status: 'none', count: 0 };
      if (identities.size > 1) return { status: 'ambiguous', count: identities.size };
      return { status: 'one', candidate: identities.values().next().value.candidate };
    } catch { return { status: 'none', count: 0 }; }
  }

  Object.defineProperty(globalThis, EXPORT, { value: Object.freeze({ validCandidate, unwrapImportLink, subscriptionResponse, networkCandidates, domCandidates, siteNames, selectCandidates }), enumerable: true });
})();
// Subscription response and semantic-control observer v1.3.0 — 2026-10-18.
// MAIN world. Registration determines the site; this observer never logs in.
(() => {
  'use strict';
  const extractors = globalThis.SCKISubStoreExtractors;
  const SOURCE = 'scki-substore-link-v2';
  const INSTALLED = '__sckiSubstorePageHookV2';
  if (!extractors || !extractors.validCandidate(window.location.origin + '/') || Object.prototype.hasOwnProperty.call(window, INSTALLED)) return;
  Object.defineProperty(window, INSTALLED, { value: true });
  let latest = null;
  let networkObserved = false;
  let domSignature = '';
  let domObserver = null;
  let domPoll = null;
  function observerReady() {
    try { window.postMessage({ source: SOURCE, kind: 'observer_ready', status: 'ready' }, window.location.origin); } catch {}
  }

  function publish(selection) {
    if (selection.status === 'none') return;
    latest = selection;
    try {
      const data = selection.status === 'one' ? { source: SOURCE, kind: 'subscription', url: selection.candidate.url } :
        { source: SOURCE, kind: 'ambiguous', count: selection.count };
      window.postMessage(data, window.location.origin);
    } catch { /* Closing documents must not affect the page. */ }
  }
  function targetResponse(responseUrl, status) {
    return status >= 200 && status < 300 && extractors.subscriptionResponse(responseUrl);
  }
  function observePayload(payload, responseURL) {
    const selection = extractors.selectCandidates(extractors.networkCandidates(payload, responseURL));
    if (selection.status === 'none') return;
    networkObserved = true;
    domObserver?.disconnect();
    if (domPoll !== null) window.clearInterval(domPoll);
    publish(selection);
  }
  function scanDOM() {
    // A subscription API response takes precedence over client-format controls.
    if (networkObserved) return;
    try {
      const selection = extractors.selectCandidates(extractors.domCandidates(document));
      const signature = selection.status === 'one' ? selection.candidate.url : selection.status + ':' + (selection.count || 0);
      if (signature === domSignature) return;
      domSignature = signature;
      if (selection.status === 'none') { latest = null; return; }
      publish(selection);
    } catch { /* A page without a usable DOM simply has no DOM candidates. */ }
  }
  let scanScheduled = false;
  function scheduleScan() {
    if (networkObserved || scanScheduled) return;
    scanScheduled = true;
    window.setTimeout(() => { scanScheduled = false; scanDOM(); }, 250);
  }

  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== 2) return;
    if (data.source === SOURCE && data.kind === 'ready') {
      observerReady();
      const previous = latest;
      scanDOM();
      if (latest !== null && latest === previous) publish(latest);
    }
  });

  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
      // Preserve the original promise, response, receiver, and synchronous errors.
      const result = Reflect.apply(originalFetch, this, args);
      try {
        Promise.resolve(result).then(response => {
          try {
            if (!targetResponse(response.url, response.status)) return;
            Promise.resolve(response.clone().json()).then(payload => observePayload(payload, response.url)).catch(() => {});
          } catch { /* The original response body stays untouched. */ }
        }).catch(() => {});
      } catch { /* Observation cannot change the request result. */ }
      return result;
    };
  }
  if (typeof window.XMLHttpRequest === 'function') {
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = new Proxy(OriginalXHR, {
      construct(target, args, newTarget) {
        const xhr = Reflect.construct(target, args, newTarget);
        try {
          xhr.addEventListener('load', () => {
            try {
              if (!targetResponse(xhr.responseURL, xhr.status)) return;
              if (xhr.responseType === 'json') observePayload(xhr.response, xhr.responseURL);
              else if (xhr.responseType === '' || xhr.responseType === 'text') observePayload(JSON.parse(xhr.responseText), xhr.responseURL);
            } catch { /* Ignore unsupported or non-JSON responses. */ }
          });
        } catch { /* Preserve normal native construction. */ }
        return xhr;
      },
    });
  }
  try {
    document.addEventListener('DOMContentLoaded', scheduleScan, { once: true });
    document.addEventListener('visibilitychange', scheduleScan);
    window.addEventListener('focus', scheduleScan);
    if (typeof MutationObserver === 'function') {
      domObserver = new MutationObserver(scheduleScan);
      domObserver.observe(document, { subtree: true, childList: true, attributes: true,
        attributeFilter: ['value', 'href', 'data-clipboard-text', 'data-clipboard', 'data-subscribe-url', 'aria-label'] });
    }
    // Assigning an input/custom-element .value does not emit a DOM mutation.
    // Check visible controls only; this never makes an HTTP request.
    if (typeof window.setInterval === 'function') domPoll = window.setInterval(() => {
      if (!networkObserved && document.visibilityState === 'visible') scanDOM();
    }, 3000);
    scheduleScan();
  } catch { /* Network observation remains available without DOM support. */ }
  observerReady();
})();
