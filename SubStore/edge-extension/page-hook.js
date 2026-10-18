// Subscription response and semantic-control observer v1.4.0 — 2026-10-18.
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
  // Each URL is already bounded below 8192 characters by the extractors.
  // Repeated responses do not grow this document-scoped candidate set.
  const NETWORK_CANDIDATE_LIMIT = 64;
  const networkCandidates = new Map();
  let networkAmbiguity = null;
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
  function publishNetwork(selection) {
    if (selection.status === 'ambiguous') {
      networkAmbiguity = selection;
      networkCandidates.clear();
    }
    publish(selection);
  }
  function observePayload(payload, responseURL) {
    const incoming = extractors.networkCandidates(payload, responseURL);
    const selection = extractors.selectCandidates(incoming);
    // Unusable responses cannot erase previously observed accounts or ambiguity.
    if (selection.status === 'none') return;
    networkObserved = true;
    domObserver?.disconnect();
    if (domPoll !== null) window.clearInterval(domPoll);
    if (networkAmbiguity) { publish(networkAmbiguity); return; }
    if (selection.status === 'ambiguous') { publishNetwork(selection); return; }
    for (const candidate of incoming) {
      if (networkCandidates.has(candidate.url)) continue;
      if (networkCandidates.size >= NETWORK_CANDIDATE_LIMIT) {
        // This count is the observed URL count at overflow; the unretained set
        // cannot safely establish one account. Stay closed for this document.
        publishNetwork({ status: 'ambiguous', count: NETWORK_CANDIDATE_LIMIT + 1 });
        return;
      }
      networkCandidates.set(candidate.url, candidate);
    }
    // Fetch and XHR share one account identity decision. Once ambiguous, no
    // later single response or ready handshake can make this document writable.
    publishNetwork(extractors.selectCandidates([...networkCandidates.values()]));
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
