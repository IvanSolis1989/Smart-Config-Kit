**English** | [中文](client-capability-matrix.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="assets/readme/page-client-support-mobile.svg">
  <img src="assets/readme/page-client-support.svg" width="100%" alt="Client capabilities and adapter limitations">
</picture>

# Cross-client capability matrix

Browse by core family, then inspect subscription input, dynamic grouping, endpoint DNS hints and optional sidecars. Each capability lists its state, mode and evidence.

<p>
  <a href="guide/downloads.md"><img src="assets/readme/nav-downloads.svg" width="145" height="38" alt="Downloads"></a>
  <a href="README.md"><img src="assets/readme/nav-docs.svg" width="145" height="38" alt="Documentation"></a>
  <a href="guide/dns-and-verification.md"><img src="assets/readme/nav-verify.svg" width="145" height="38" alt="Validation and troubleshooting"></a>
</p>

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Validation and troubleshooting](guide/dns-and-verification.md)

> Generated from `docs/client-capability-matrix.json` and its display-only translation catalog. After changing claims or evidence, run `node tools/generate-client-capability-matrix.js`; CI rejects drift with `--check`.

This matrix describes **integration points owned by this repository's artifacts**, not a client's advertised protocol list. A client's ability to import subscriptions does not mean these artifacts can read, rewrite or project them at runtime.

- **Built-in**: The artifact has a trusted runtime hook that performs the capability during subscription refresh.
- **Documented manual setup**: Only local configuration, Mixin or native-field instructions are provided, not an automatic sidecar that reads provider source configurations.
- **Unavailable / not applicable**: The artifact owns only routing, shunt rules or static outbounds. It is not a subscription-DNS converter.

## Browse by family

- **Mihomo family**: [Clash Party (Smart / Normal)](#clash-party) · [Clash Meta for Android (CMFA)](#cmfa) · [OpenClash (Normal / Smart)](#openclash) · [FlClash override](#flclash)
- **sing-box family**: [sing-box (1.14 / 1.13 static configuration)](#sing-box) · [Karing (native diversion adapter)](#karing)
- **Xray family**: [v2rayN Xray routing fallback](#v2rayn-xray)
- **Dual-core family**: [Passwall](#passwall) · [Passwall2](#passwall2)
- **Independent clients**: [Shadowrocket](#shadowrocket) · [Surge](#surge) · [Loon](#loon) · [Quantumult X](#quantumult-x) · [Stash](#stash) · [Egern](#egern)

## Mihomo family

<a id="clash-party"></a>

### Clash Party (Smart / Normal)

Artifacts: [ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js), [ClashParty(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js)

- **Subscription input · Built-in**
  The JS override receives the subscription configuration directly.

  `subscription_input` → `runtime_hook`. Evidence: [ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

- **Dynamic grouping · Built-in**
  Refresh classifies endpoints and rebuilds the fixed policy groups.

  `dynamic_grouping` → `runtime_hook`. Evidence: [ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

- **Endpoint DNS hints · Built-in**
  Projects restricted DNS hints for active endpoint FQDNs only.

  `node_dns_hint` → `restricted_projection`. Evidence: [ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

- **Optional Node-DNS sidecar · Built-in**
  The profile is part of the trusted override, not a subscription field.

  `optional_node_dns_sidecar` → `integrated_runtime_profile`. Evidence: [ClashParty(mihomo-smart).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js)

<a id="cmfa"></a>

### Clash Meta for Android (CMFA)

Artifacts: [CMFA(mihomo).yaml](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

- **Subscription input · Documented manual setup**
  Set the proxy-provider subscription URL; the client fetches it.

  `subscription_input` → `provider_node_feed`. Evidence: [CMFA(mihomo).yaml](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

- **Dynamic grouping · Built-in**
  Mihomo filters select regional group members by endpoint name at runtime.

  `dynamic_grouping` → `engine_filter`. Evidence: [CMFA(mihomo).yaml](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml)

- **Endpoint DNS hints · Documented manual setup**
  Static YAML requires endpoint DNS to be merged in a local Mixin.

  `node_dns_hint` → `manual_mihomo_overlay`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads the provider's source configuration.

  `optional_node_dns_sidecar` → `local_overlay_only`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="openclash"></a>

### OpenClash (Normal / Smart)

Artifacts: [OpenClash(mihomo).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh), [OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **Subscription input · Built-in**
  The Ruby override reads the original subscription before writing configuration.

  `subscription_input` → `runtime_hook`. Evidence: [OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **Dynamic grouping · Built-in**
  The Ruby override rebuilds regional groups from subscription endpoints.

  `dynamic_grouping` → `runtime_hook`. Evidence: [OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **Endpoint DNS hints · Built-in**
  Projects private DNS for active endpoints into exact policies only.

  `node_dns_hint` → `restricted_projection`. Evidence: [OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

- **Optional Node-DNS sidecar · Built-in**
  A trusted shell profile controls projection depth.

  `optional_node_dns_sidecar` → `integrated_runtime_profile`. Evidence: [OpenClash(mihomo-smart).sh](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh)

<a id="flclash"></a>

### FlClash override

Artifacts: [FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

- **Subscription input · Built-in**
  Once linked, the JS override receives refreshed subscription configuration.

  `subscription_input` → `runtime_hook`. Evidence: [README.zh-CN.md](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.zh-CN.md)

- **Dynamic grouping · Built-in**
  Refresh classifies endpoints and rebuilds the fixed policy groups.

  `dynamic_grouping` → `runtime_hook`. Evidence: [FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

- **Endpoint DNS hints · Built-in**
  Projects DNS hints for active endpoint FQDNs only.

  `node_dns_hint` → `restricted_projection`. Evidence: [FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

- **Optional Node-DNS sidecar · Built-in**
  The profile is part of the override and cannot be changed by the subscription.

  `optional_node_dns_sidecar` → `integrated_runtime_profile`. Evidence: [FlClash(mihomo).js](../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js)

## sing-box family

<a id="sing-box"></a>

### sing-box (1.14 / 1.13 static configuration)

Artifacts: [SingBox(sing-box)-full.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json), [SingBox(sing-box)-1.13.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json)

- **Subscription input · Documented manual setup**
  Replace or integrate endpoint outbounds in the static JSON.

  `subscription_input` → `manual_outbound_wiring`. Evidence: [README.zh-CN.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.zh-CN.md)

- **Dynamic grouping · Documented manual setup**
  selector/urltest selects only the integrated static outbounds.

  `dynamic_grouping` → `static_selector`. Evidence: [SingBox(sing-box)-full.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json)

- **Endpoint DNS hints · Documented manual setup**
  Configure DNS manually using sing-box-native structures.

  `node_dns_hint` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No subscription-DNS conversion sidecar is supplied.

  `optional_node_dns_sidecar` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="karing"></a>

### Karing (native diversion adapter)

Artifacts: [diversion_rules_custom.json](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/diversion_rules_custom.json)

- **Subscription input · Documented manual setup**
  Import native diversion JSON; add endpoint subscriptions separately.

  `subscription_input` → `native_diversion_import`. Evidence: [README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

- **Dynamic grouping · Documented manual setup**
  Proxy rules use the current selection by default; bind service and regional groups in the app.

  `dynamic_grouping` → `app_managed_node_groups`. Evidence: [README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

- **Endpoint DNS hints · Documented manual setup**
  Karing manages DNS in the app; the native diversion file does not take over subscription DNS.

  `node_dns_hint` → `app_managed_dns`. Evidence: [README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

- **Optional Node-DNS sidecar · Unavailable / not applicable**
  No Node-DNS sidecar reads the provider configuration.

  `optional_node_dns_sidecar` → `not_provided`. Evidence: [README.md](../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

## Xray family

<a id="v2rayn-xray"></a>

### v2rayN Xray routing fallback

Artifacts: [v2rayN(xray).json](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json)

- **Subscription input · Unavailable / not applicable**
  The JSON supplies Xray routing only; v2rayN manages endpoints.

  `subscription_input` → `routing_only`. Evidence: [README.zh-CN.md](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.zh-CN.md)

- **Dynamic grouping · Unavailable / not applicable**
  The three-exit Xray fallback does not rebuild endpoint groups.

  `dynamic_grouping` → `none`. Evidence: [README.zh-CN.md](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.zh-CN.md)

- **Endpoint DNS hints · Unavailable / not applicable**
  The routing fallback does not own a DNS runtime.

  `node_dns_hint` → `not_owned_by_artifact`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Unavailable / not applicable**
  Do not treat routing JSON as a subscription sidecar.

  `optional_node_dns_sidecar` → `not_applicable`. Evidence: [README.zh-CN.md](../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.zh-CN.md)

## Dual-core family

<a id="passwall"></a>

### Passwall

Artifacts: [Passwall(xray+sing-box)-apply.sh](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh)

- **Subscription input · Unavailable / not applicable**
  This entry supplies only a UCI shunt-rule fallback.

  `subscription_input` → `uci_shunt_only`. Evidence: [README.zh-CN.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.zh-CN.md)

- **Dynamic grouping · Unavailable / not applicable**
  Shunt rules cannot represent Mihomo nested groups.

  `dynamic_grouping` → `none`. Evidence: [README.zh-CN.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.zh-CN.md)

- **Endpoint DNS hints · Unavailable / not applicable**
  The shunt/UCI reference does not own a Mihomo DNS runtime.

  `node_dns_hint` → `not_owned_by_artifact`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Unavailable / not applicable**
  No subscription Node-DNS sidecar is supplied.

  `optional_node_dns_sidecar` → `not_applicable`. Evidence: [README.zh-CN.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.zh-CN.md)

<a id="passwall2"></a>

### Passwall2

Artifacts: [Passwall2(xray+sing-box)-apply.sh](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh)

- **Subscription input · Unavailable / not applicable**
  This entry supplies only a UCI shunt-rule fallback.

  `subscription_input` → `uci_shunt_only`. Evidence: [README.zh-CN.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.zh-CN.md)

- **Dynamic grouping · Unavailable / not applicable**
  The focused shunt model does not rebuild endpoint groups.

  `dynamic_grouping` → `none`. Evidence: [README.zh-CN.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.zh-CN.md)

- **Endpoint DNS hints · Unavailable / not applicable**
  The shunt/UCI reference does not own a Mihomo DNS runtime.

  `node_dns_hint` → `not_owned_by_artifact`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Unavailable / not applicable**
  No subscription Node-DNS sidecar is supplied.

  `optional_node_dns_sidecar` → `not_applicable`. Evidence: [README.zh-CN.md](../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.zh-CN.md)

## Independent clients

<a id="shadowrocket"></a>

### Shadowrocket

Artifacts: [Shadowrocket.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf)

- **Subscription input · Documented manual setup**
  Add the endpoint subscription separately in the client.

  `subscription_input` → `client_external_node_feed`. Evidence: [README.zh-CN.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/README.zh-CN.md)

- **Dynamic grouping · Built-in**
  Policy groups aggregate endpoints using name regular expressions.

  `dynamic_grouping` → `client_regex_filter`. Evidence: [Shadowrocket.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf)

- **Endpoint DNS hints · Documented manual setup**
  Configure DNS manually using Shadowrocket-native fields.

  `node_dns_hint` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads provider YAML.

  `optional_node_dns_sidecar` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="surge"></a>

### Surge

Artifacts: [Surge.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf)

- **Subscription input · Documented manual setup**
  Integrate the endpoint subscription as a sub-configuration.

  `subscription_input` → `client_external_node_feed`. Evidence: [README.zh-CN.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/README.zh-CN.md)

- **Dynamic grouping · Built-in**
  url-test filters candidates using endpoint-name regular expressions.

  `dynamic_grouping` → `client_regex_filter`. Evidence: [Surge.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf)

- **Endpoint DNS hints · Documented manual setup**
  Configure DNS manually using Surge-native fields.

  `node_dns_hint` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads the provider's source configuration.

  `optional_node_dns_sidecar` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="loon"></a>

### Loon

Artifacts: [Loon.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf)

- **Subscription input · Documented manual setup**
  Paste the endpoint subscription in the Node panel.

  `subscription_input` → `client_external_node_feed`. Evidence: [README.zh-CN.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/README.zh-CN.md)

- **Dynamic grouping · Built-in**
  Remote Filter NameRegex automatically filters endpoints.

  `dynamic_grouping` → `client_regex_filter`. Evidence: [Loon.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf)

- **Endpoint DNS hints · Documented manual setup**
  Configure DNS manually using Loon-native fields.

  `node_dns_hint` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads the provider's source configuration.

  `optional_node_dns_sidecar` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="quantumult-x"></a>

### Quantumult X

Artifacts: [QuantumultX.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf)

- **Subscription input · Documented manual setup**
  Enter the subscription manually in server_remote.

  `subscription_input` → `client_external_node_feed`. Evidence: [README.zh-CN.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/README.zh-CN.md)

- **Dynamic grouping · Built-in**
  Policies filter endpoints using server-tag regular expressions.

  `dynamic_grouping` → `client_regex_filter`. Evidence: [QuantumultX.conf](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf)

- **Endpoint DNS hints · Documented manual setup**
  Configure DNS manually using Quantumult X-native fields.

  `node_dns_hint` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads the provider's source configuration.

  `optional_node_dns_sidecar` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="stash"></a>

### Stash

Artifacts: [Stash.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml)

- **Subscription input · Documented manual setup**
  Set the Subscribe provider URL; the client fetches it.

  `subscription_input` → `provider_node_feed`. Evidence: [README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/README.md)

- **Dynamic grouping · Built-in**
  Inherited YAML filters select downloaded endpoints.

  `dynamic_grouping` → `engine_filter`. Evidence: [Stash.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml)

- **Endpoint DNS hints · Documented manual setup**
  Do not edit generated outputs; merge in the client's local layer.

  `node_dns_hint` → `manual_mihomo_overlay`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads the provider's source configuration.

  `optional_node_dns_sidecar` → `local_overlay_only`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

<a id="egern"></a>

### Egern

Artifacts: [Egern.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml)

- **Subscription input · Documented manual setup**
  Add endpoints through the Egern Profile Subscribe URL.

  `subscription_input` → `profile_external_node_feed`. Evidence: [README.md](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/README.md)

- **Dynamic grouping · Built-in**
  Egern smart regional groups select endpoints using native engine rules.

  `dynamic_grouping` → `engine_smart_filter`. Evidence: [Egern.yaml](../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml)

- **Endpoint DNS hints · Documented manual setup**
  Configure static-profile DNS in the local native DNS layer.

  `node_dns_hint` → `manual_native_config`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)

- **Optional Node-DNS sidecar · Documented manual setup**
  No automatic sidecar reads the provider's source configuration.

  `optional_node_dns_sidecar` → `local_overlay_only`. Evidence: [private-node-dns.zh-CN.md](../docs/private-node-dns.zh-CN.md)


## Interpretation boundaries

- `runtime_hook` / `restricted_projection` exist only in this repository's Clash Party, OpenClash and FlClash overrides. Profiles are trusted local settings, not subscription input.
- `engine_filter`, `client_regex_filter` and `engine_smart_filter` describe selection through declared regular expressions or native smart mechanisms. They do not grant runtime authority to write subscription DNS.
- `manual_mihomo_overlay` / `manual_native_config` require DNS merging in the client's local configuration layer. Do not overwrite the global DNS baseline or copy Mihomo fields into Apple-client, sing-box or Passwall formats.
- Every evidence entry is a repository file and mechanically checked marker. `tools/validate-artifact-contracts.js` verifies the schema, 15 products, four fixed columns, file existence and exact markers.

Further reading: [Private endpoint DNS: restricted projection and client boundaries](./private-node-dns.md).
