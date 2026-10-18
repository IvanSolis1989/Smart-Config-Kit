// Local snapshot Worker patcher v1.0.0 — Build 2026-10-18.
// Existing native bridge only; change history: SubStore/CHANGELOG.md.
export const VERSION = '1.0.0';

const method = `  async localSnapshotOperation(name, payload) {
    return await this.enqueue(async () => {
      try {
        const wrapped = await this.loadUserData();
        const readSubscription = async (selectedName) => {
          const outer = JSON.parse(await this.loadUserData());
          const config = JSON.parse(outer["sub-store"]);
          return config.subs?.find((sub) => sub.name === selectedName);
        };
        const native = async (httpMethod, path, body) => {
          const run = this.createRun(wrapped);
          const request = new Request("https://local-snapshot.invalid" + path, {
            method: httpMethod, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), redirect: "manual"
          });
          const result = await runSubStoreHttpForUser({ user: run.user, env: run.env, request, subStorePath: new URL(request.url).pathname });
          if (!result.ok) throw new Error("Local snapshot native request failed");
          const decoded = await result.json();
          if (decoded?.status !== "success" || !decoded.data) throw new Error("Local snapshot native request failed");
          return { data: decoded.data, run };
        };
        const previewSubscription = async (candidate) => (await native("POST", "/api/preview/sub?target=JSON&share=true", candidate)).data;
        const writeContent = async (content, before) => {
          if (await this.loadUserData() !== wrapped) throw new Error("Local snapshot state changed");
          const result = await native("PATCH", "/api/sub/" + encodeURIComponent(name) + "?share=true", { content });
          if (await localSnapshotRevision(result.data) !== await localSnapshotRevision({ ...before, content })) throw new Error("Local snapshot content mismatch");
          await result.run.commit();
        };
        return await executeLocalSnapshotOperation(this.env, name, payload, { readSubscription, previewSubscription, writeContent });
      } catch {
        return { status: 503, error: { code: "local_snapshot_unavailable" } };
      }
    });
  }
`;

/** Add one RPC serialized by the existing DO queue; native preview is staged
 * without commit. Only a separately staged content-only PATCH can commit.
 */
export function patchLocalSnapshotWorker(source) {
  if (typeof source !== 'string' || !source || /localSnapshotOperation|routeLocalSnapshotRequest|scki-local-snapshot\.mjs/.test(source)) throw new Error('Unsupported or already patched local snapshot Worker');
  const marker = "  // RPC only: payload comes from the owner's authenticated KV write, never HTTP input.";
  const route = /^([ \t]*)const snapshotRoute = await routeSourceSnapshotRequest\(request, env2, sckiReadSourceSubscription\);(?=\r?$)/gm;
  if (source.split(marker).length !== 2 || (source.match(route) || []).length !== 1 || source.split('const snapshotRoute = await routeSourceSnapshotRequest(').length !== 2
    || (source.match(/\bclass\s+LegacySubStoreDO\s+extends\s+DurableObject\s*\{/g) || []).length !== 1) throw new Error('Unsupported or ambiguous local snapshot Worker baseline');
  const newline = source.includes('\r\n') ? '\r\n' : '\n';
  const patched = source.replace(marker, method.replace(/\n/g, newline) + marker).replace(route, (_line, indent) => [
    'const localSnapshotRoute = await routeLocalSnapshotRequest(request, env2, async (name, payload, signal) => {',
    '  await owner(env2).syncLocalReplica();',
    '  if (signal?.aborted) return { status: 408, error: { code: "local_snapshot_rejected" } };',
    '  return await owner(env2).localSnapshotOperation(name, payload);',
    '});',
    'const snapshotRoute = localSnapshotRoute || await routeSourceSnapshotRequest(request, env2, sckiReadSourceSubscription);',
  ].map(line => indent + line).join(newline));
  return 'import { routeLocalSnapshotRequest, executeLocalSnapshotOperation, localSnapshotRevision } from "./SubStore/scripts/local-snapshot.mjs";' + newline + patched;
}
