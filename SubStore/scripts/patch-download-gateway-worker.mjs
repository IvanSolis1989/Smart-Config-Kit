// Download gateway Worker patcher v1.0.0 — Build 2026-10-18.
// Change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

const gatewayBaseline = String.raw`async function fetchViaGateway(config2, targetUrl, method, headers, signal) {
  const gatewayResponse = await fetch(config2.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ` + '`Bearer ${config2.token}`' + String.raw`
    },
    body: JSON.stringify({ url: targetUrl, method, headers }),
    signal
  });
  if (!gatewayResponse.ok) throw new Error(` + '`download gateway request failed (HTTP ${gatewayResponse.status})`' + String.raw`);
  let data;
  try {
    data = await gatewayResponse.json();
  } catch {
    throw new Error("download gateway response invalid");
  }
  if (!data || !Number.isInteger(data.status) || data.status < 100 || data.status > 599 || !data.headers || typeof data.headers !== "object" || Array.isArray(data.headers)) {
    throw new Error("download gateway response invalid");
  }
  const bytes = decodeBase64(data.bodyBase64);
  return {
    status: data.status,
    headers: data.headers,
    text: () => new TextDecoder().decode(bytes),
    arrayBuffer: () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  };
}`;
const recovery = String.raw`  const recovered = await recoverDownloadGateway530({
    gatewayResponse, targetUrl, method, headers, signal, fetchTarget: fetch,
    observe: (event, status) => console.log("[SCKI-GATEWAY-530]", event, status)
  });
  if (recovered) return recovered;
`;

/** Precisely patch the known gateway; preserve its caller and origin policy. */
export function patchDownloadGatewayWorker(source) {
  if (typeof source !== 'string' || source.length === 0) throw new TypeError('Worker source must be a nonempty string');
  if (source.includes('recoverDownloadGateway530') || source.includes('scki-download-gateway-fallback.mjs')) {
    throw new Error('Worker source is already patched or contains a conflicting gateway recovery');
  }
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const baseline = gatewayBaseline.replace(/\n/g, newline);
  if (source.split(baseline).length !== 2 || (source.match(/\bfunction\s+fetchViaGateway\s*\(/g) || []).length !== 1) {
    throw new Error('Unsupported or ambiguous Worker gateway baseline');
  }
  const patchedGateway = gatewayBaseline.replace('    signal\n', '    signal,\n    redirect: "manual"\n')
    .replace('  if (!gatewayResponse.ok)', recovery + '  if (!gatewayResponse.ok)')
    .replace(/\n/g, newline);
  return 'import { recoverDownloadGateway530 } from "./scki-download-gateway-fallback.mjs";' + newline
    + source.replace(baseline, patchedGateway);
}
