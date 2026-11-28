# Runtime routing evidence with Mihomo

[简体中文](mihomo-connection-evidence.zh-CN.md) | **English**

Use the connection collector to inspect the rule, policy chain, and destination reported by an active Mihomo core. It can also export connection-shaped inputs for the existing ordered rule comparison. It requires Node.js 18 or later and uses only built-in modules.

## Read saved snapshots

Each `--input` is one independent source in input order. It contains a raw `/connections` object, or a bundle of snapshots taken from one core during a period with a stable configuration. An idle core can return `{"connections":null}`.

```json
{"snapshots":[{"connections":null},{"connections":[]}],"proxySnapshot":{"proxies":{}}}
```

```sh
node tools/collect-mihomo-connections.js --input connections.json --proxies proxies.json
node tools/collect-mihomo-connections.js --input source-a.json --input source-b.json --output report.json --probes-output probes.json
```

For a single input, `--proxies` accepts a raw `/proxies` response. For multiple inputs, attach the corresponding response as `proxySnapshot` inside each bundle. That lets the collector interpret the leaf type in its own source. The report uses numeric source order and capture-local IDs such as `s1-c1`. Equal raw connection IDs in two sources stay separate. Within one source, repeat sightings retain the maximum observed byte counters. A duplicated ID in one snapshot or a reused ID with conflicting match evidence fails the capture.

## Sample a local controller

Use an existing loopback HTTP controller. Set `MIHOMO_SECRET` in the current process when authentication is required.

```sh
node tools/collect-mihomo-connections.js --controller http://127.0.0.1:9090 --samples 3 --interval-ms 1000 --output report.json --probes-output probes.json
```

The collector reads `GET /proxies` once and then `GET /connections` sequentially. The permitted addresses are `127.0.0.1`, `[::1]`, and `localhost`, which maps to IPv4 loopback without DNS. HTTP redirects, URL credentials, additional paths, and simultaneous offline input are refused. For apps that expose only a socket or a named pipe, export JSON through your existing workflow.

Online collection allows up to 60 seconds in total and up to 5 seconds per request. Online and offline input have an 8 MiB limit per response or file and 32 MiB combined. A capture allows up to 120 snapshots, 10,000 rows in one snapshot, 100,000 observations, and 10,000 unique connections in total. The collector prints JSON to stdout and only writes files explicitly requested. Output paths must be distinct and new, with existing parent directories.

## Interpret the output

- `sources` counts snapshots, empty snapshots, observations, and unique connections. An empty snapshot only describes that sampled instant. Short-lived connections can be missed.
- `chains` preserves the controller order. Mihomo reports the leaf at index 0. The collector reports `direct`, `reject`, `proxy`, or `unknown` based on explicit built-ins or the source's own leaf type snapshot. The outcome describes the recorded outbound and does not measure successful delivery.
- The replay probe prefers `sniffHost` when present, matching Mihomo's `RuleHost` for domain rules. The report preserves both values, identifies `ruleHostSource`, and flags a mismatch for review. An explicit empty or literal-IP host can establish that there is no domain, while a missing host leaves domain evidence unknown. An observed destination IP can be replayed as an IP, with DNS behavior at original match time still unknown.
- A fallback candidate records `Match`/`FINAL` or a chain containing the repository's exact fallback group. Review the business context and final configuration before using it to propose any rule change.
- The projection omits raw IDs, source addresses, inbound users, and full process paths from metadata. It also withholds source-sensitive and logical rule payloads, common embedded credentials, and text containing the known controller secret. Destinations, proxy names, and process basenames can still be sensitive. Keep snapshots and reports out of Git, and review them before sharing.

## Replay a comparison

```sh
node tools/validate-ordered-rule-semantics.js --baseline-ref HEAD --mode full --probes probes.json --output comparison.json
```

The comparison evaluates the same observed inputs against HEAD and the current working tree. Unknown fields stay unknown in the static comparison. Review runtime evidence and a tested counterexample before changing any existing policy. The collector only writes its optional report and probes. [Rule quality and source ledger](rule-quality.md)

## Other native evidence

- **Stash 5.0** offers `GET /rules/match` with `resolve=false` for a synthetic destination. Record the rule, outbound, and optional `stage` from the response. An early `dns` or `ingress` refusal can have no active connection to collect. [Stash HTTP API](https://stash.wiki/en/features/http-api#rules) · [Pre-matching rules](https://stash.wiki/en/rules/rule-types#pre-matching)
- **Surge Mac 6.9 or later** can explain the active profile's match and policy chain with `surge-cli rule explain`. Use `surge-cli help rule explain` to confirm the local syntax. Record the profile or module and the matched rule-set entry when returned. [Surge CLI manual](https://manual.nssurge.com/tools/cli.html#routing-and-network-diagnostics-mac-690)

The collector reuses the project's historical RouteCheck-inspired prototype. Mihomo API behavior was checked against the official 1.19.34 source. A local Windows Mihomo 1.19.32 fixture also returned an idle `connections:null`, then reported the synthetic `connect.example` domain rule and `DIRECT` leaf during two snapshots. [Mihomo API](https://wiki.metacubex.one/en/api/#connections) · [Empty snapshot](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/tunnel/statistic/manager.go) · [Domain host selection](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/constant/metadata.go#L262-L267) · [Chain order](https://github.com/MetaCubeX/mihomo/blob/v1.19.34/constant/adapters.go#L76-L93) · [Upstream RouteCheck](https://github.com/Seven1echo/RouteCheck/tree/44e5b7931660d0d106dc3ae7335f9549842cc9fc)

```sh
node --test tools/tests/mihomo-connection-evidence.test.js
```
