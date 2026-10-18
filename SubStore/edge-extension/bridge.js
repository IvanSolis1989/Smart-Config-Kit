// Subscription isolated bridge v1.4.0 — 2026-10-18.
(() => {
  'use strict';
  const extractors = globalThis.SCKISubStoreExtractors;
  const SOURCE = 'scki-substore-link-v2';
  const INSTALLED = '__sckiSubstoreBridgeV2';
  if (!extractors || !extractors.validCandidate(window.location.origin + '/') || Object.prototype.hasOwnProperty.call(window, INSTALLED)) return;
  Object.defineProperty(window, INSTALLED, { value: true });
  // getRandomValues is also available on authorized HTTP/IP panels, where
  // randomUUID is restricted to secure contexts.
  const documentNonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  let retired = false;
  let enabled = false, reportedObserver = false, mainReady = false;
  const names = () => { try { return extractors.siteNames(document); } catch { return []; } };
  function forward(message) {
    try { const pending = chrome.runtime.sendMessage({ ...message, documentNonce, siteNames: names() }); pending?.catch?.(() => {}); } catch {}
  }
  function requestReplay() {
    if (!enabled) return;
    try { window.postMessage({ source: SOURCE, kind: 'ready' }, window.location.origin); } catch {}
  }
  function observerReady() {
    mainReady = true;
    if (enabled && !reportedObserver) { reportedObserver = true; forward({ type: 'PAGE_OBSERVER_STATUS', stage: 'observer_ready' }); }
  }
  window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length !== 3 || data.source !== SOURCE) return;
    if (data.kind === 'observer_ready' && data.status === 'ready') { observerReady(); return; }
    if (!enabled) return;
    if (data.kind === 'subscription' && extractors.validCandidate(data.url)) forward({ type: 'OBSERVED_SUBSCRIPTION', candidateUrl: data.url });
    else if (data.kind === 'ambiguous' && Number.isSafeInteger(data.count) && data.count > 1) forward({ type: 'OBSERVATION_AMBIGUOUS' });
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'VERIFY_DOCUMENT' && _sender?.id === chrome.runtime.id) {
      sendResponse?.({ present: !retired, origin: window.location.origin, documentNonce }); return;
    }
    if (message?.type === 'REQUEST_REPLAY') { requestReplay(); sendResponse?.({ ok: true }); }
  });
  function activate() {
    retired = false;
    try {
    Promise.resolve(chrome.runtime.sendMessage({ type: 'PAGE_CONTEXT', documentNonce, siteNames: names() })).then(reply => {
      if (reply?.allowed !== true) return;
      enabled = true;
      if (mainReady) observerReady();
      requestReplay();
      window.setTimeout(requestReplay, 1000);
      window.setTimeout(requestReplay, 3000);
    }).catch(() => {});
    } catch {}
  }
  window.addEventListener('pagehide', () => {
    retired = true; enabled = false;
    forward({ type: 'DOCUMENT_RETIRED' });
  });
  window.addEventListener('pageshow', event => { if (event.persisted) activate(); });
  activate();
})();
