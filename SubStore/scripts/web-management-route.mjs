// Web management alias v1.0.0 — Build 2026-10-18.
// Independent of the existing backend and extension access paths.
// Change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

/**
 * Select the legacy router's prefix for this request only.
 * Return the original environment on every nonmatch. On a literal alias match,
 * clone bindings and replace only the legacy prefix; never mutate env or URL.
 * No credentials are generated, read from storage, logged or returned to users.
 */
export function webManagementEnvForRequest(request, env) {
  const prefix = env?.SUB_STORE_WEB_BACKEND_PATH;
  if (typeof prefix !== 'string' || prefix.length !== 69 || !/^\/web-[a-f0-9]{64}$/u.test(prefix)) return env;
  let pathname;
  try { pathname = new URL(request.url).pathname; }
  catch { return env; }
  if (pathname !== prefix && !pathname.startsWith(prefix + '/')) return env;
  return { ...env, SUB_STORE_FRONTEND_BACKEND_PATH: prefix };
}
