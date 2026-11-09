<a id="全端离线配置下载设计"></a>
# All-client offline configuration download design

**English** | [简体中文](2026-10-29-offline-all-clients-design.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

User authorization: select client, Full/Lite/Custom service profile and supported parameters in one offline form, downloading the corresponding configuration without CLI. Retain default routing/safety boundaries; validate before pushing main.

<a id="设计决定"></a>
## Design decisions

- Cover the existing service generator's 20 maintained entries, without new client-support promises. Default to FlClash / Full; switching clients must not carry unsupported parameters into the new client.
- Reuse business-profile-output.js entry/dependency catalogs, business-profiles.js authoritative service catalog/safety plan and existing platform projectors. Share pure functions between CLI/browser; Ruby parses trusted YAML only at build time.
- Browser generation uses build-embedded trusted templates, accepting no subscriptions, reading no personal files, executing no downloaded JS and making no network calls. Optional-profile YAML uses JSON-compatible YAML, with parsed equivalence to CLI verified. Full defaults retain published LF text; binary attachments preserve exact bytes.
- Single files download with native extensions. Entries containing companion manifests, manual routing lists or AEROVE resources download directory-preserving ZIPs. Reference only published remote assets; do not rebuild shared fused/MRS.
- Reuse official MIT `fflate@0.8.3` UMD synchronous offline API; record version, source, integrity and license in the repository. The form does not use asynchronous library interfaces.
- Client capability catalogs define parameters. The three Mihomo JS entries support the original five options; AEROVE keeps App-managed DNS off. OpenClash uses existing four runtime defaults with environment precedence. Static clients offer existing native latency/QUIC mappings only, without new subscription DNS, multipliers or node runtimes.
- Egern QUIC changes require companion asset rebuilding, so retain its existing behavior. QX UDP fallback must not masquerade as a QUIC toggle. SR/Surge/Loon native QUIC scope is broader and must be labeled explicitly.
- Preserve nodes, server/SNI/Host, dialer chains, DNS snapshots, protective rules and App-managed DNS/TUN/port boundaries. Generation does not establish device connection acceptance or all-client performance gains.

<a id="验收"></a>
## Acceptance

1. Compare all 20 Full defaults with the frozen baseline. Lite, Custom subsets/empty sets match existing platform semantics, retaining protective remainder/dependency closure.
2. Direct regressions cover supported parameters, invalid values, unknown clients, cross-client state changes, native numeric badInput and recovery after correction.
3. Actually unzip multi-file outputs and check paths, contents and binary hashes. Real browsers download representative JS/YAML/JSON/conf/shell/ZIP files without generation-time network requests.
4. Pass relevant shared-projection, JS/QuickJS, strict artifact, synchronization and documentation-link checks. Actually render/review desktop light/dark and 390px forms/changed docs.
5. Default clients/rule assets remain unchanged. Commit/push main normally, then read back remote SHA, clean worktree and that commit's CI.

<a id="参考"></a>
## References

Existing all-client CLI and FlClash offline exports are the main implementation sources. Packaging research compared [fflate](https://github.com/101arrowz/fflate), [client-zip](https://github.com/Touffy/client-zip) and [JSZip](https://github.com/Stuk/jszip). Reusing fflate avoids a custom ZIP encoder and retains no runtime external dependencies.
