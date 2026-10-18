// Extension-owned hidden host. The iframe retains its real localhost Origin.
(() => {
  'use strict';
  let frame, currentKey;
  const localOrigin = value => {
    const url = new URL(value);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) throw Error();
    return url.origin;
  };
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'CONFIGURE_LOCAL_OFFSCREEN' || sender?.id !== chrome.runtime.id || sender.tab ||
        (sender.url !== undefined && sender.url !== chrome.runtime.getURL('background.js'))) return false;
    try {
      const frontendUrl = localOrigin(message.frontendUrl), backendUrl = localOrigin(message.backendUrl);
      if (!/^[a-f0-9]{64}$/.test(message.nonce)) throw Error();
      const key = frontendUrl + '|' + backendUrl + '|' + message.nonce;
      if (key !== currentKey) {
        frame?.remove();
        const createdFrame = document.createElement('iframe');
        frame = createdFrame; currentKey = key;
        createdFrame.src = frontendUrl + '/?api=' + encodeURIComponent(backendUrl);
        createdFrame.addEventListener('load', () => {
          if (frame === createdFrame && currentKey === key) createdFrame.contentWindow.postMessage({ type: 'BIND_LOCAL_OFFSCREEN',
            frontendUrl, backendUrl, nonce: message.nonce }, frontendUrl);
        }, { once: true });
        document.body.append(createdFrame);
      }
      sendResponse({ configured: true });
    } catch { sendResponse({ configured: false }); }
    return false;
  });
})();
