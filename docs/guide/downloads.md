**English** | [中文](downloads.zh-CN.md)

<picture>
  <source media="(max-width: 600px)" srcset="../assets/readme/page-downloads-mobile.svg">
  <img src="../assets/readme/page-downloads.svg" alt="Configuration downloads" width="100%">
</picture>

# Configuration downloads

Find your client, select the matching format, and follow its import guide.

[![Documentation](../assets/readme/nav-docs.svg)](../README.md) [![Post-import validation](../assets/readme/nav-verify.svg)](dns-and-verification.md#verification)

[Project home](../../README.md) · [Documentation](../README.md) · [Post-import validation](dns-and-verification.md#verification)

Download buttons open Raw files on `main`; right-click to copy a URL. The **15 established client entries and 19 distinct files** have import guides. There are also **two Meow-family candidates**: official Meow YAML and AEROVE Lite JS. Compatible entries may share a file. Candidate app validation is recorded separately.

[Mihomo](#mihomo) · [sing-box](#sing-box) · [Xray](#xray) · [Dual-core](#dual-core) · [Independent clients](#independent) · [Meow adapters](#meow)

## <a id="mihomo"></a>Mihomo family

### Clash Party / Clash Verge Rev / Mihomo Party

Associate a JS override with your endpoint subscription. Use Normal for Clash Verge Rev unless the vernesong Smart core and model are installed.

[![Download Smart JS](../assets/readme/button-smart-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo-smart%29.js) [![Download Normal JS](../assets/readme/button-normal-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/ClashParty%28mihomo%29.js) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Party/README.md)

### CMFA / ClashMi

Native Mihomo YAML. ClashMi manages TUN in the app; inspect the effective configuration after import.

[![Download CMFA YAML](../assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/README.md)

### OpenClash

Choose either Smart or Normal SH and install it at the fixed custom-script path in the guide. UI CONF is a separate companion UCI snapshot; upload each to its proper location. They are not interchangeable.

[![Download Smart SH](../assets/readme/button-smart-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo-smart%29.sh) [![Download Normal SH](../assets/readme/button-normal-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.sh) [![Download UI CONF](../assets/readme/button-ui-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/OpenClash%28mihomo%29.conf) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/OpenClash/README.md)

### FlClash

The recommended JS override attaches to the active subscription and uses url-test regional groups. CMFA YAML is a static alternative. The app manages TUN and ports.

[![Download FlClash JS](../assets/readme/button-flclash-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/FlClash%28mihomo%29.js) [![Download alternative CMFA YAML](../assets/readme/button-cmfa-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/FlClash/README.md)

## <a id="sing-box"></a>sing-box family

### sing-box / Hiddify / HomeProxy

Full requires sing-box 1.14.3 or later and was checked with official 1.14.3. The 1.13 variant was checked with official 1.13.14. Replace example endpoints and verify the actual core version and full-configuration import mode.

[![Download sing-box JSON](../assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) [![Download sing-box 1.13 JSON](../assets/readme/button-sing-box-113.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-1.13.json) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/README.md)

For Hiddify 4.1.1, first check the 1.13 variant and full-configuration mode. A core check does not validate app import or connectivity. HomeProxy rebuilds configuration from UCI; there is no verified Full JSON-to-UCI converter, so lossless import is not promised.

### Karing

Import custom diversion JSON only. Service proxy rules target currentSelected; configure endpoint groups, DNS, TUN and the default action manually in the app.

[![Download Karing diversion JSON](../assets/readme/button-karing-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/diversion_rules_custom.json) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/Karing/README.md)

## <a id="xray"></a>Xray family

### v2rayN

Prefer Mihomo YAML or sing-box JSON according to the active core. Xray JSON is for routing-settings import only and has three exits: proxy / direct / block.

[![Download mihomo YAML](../assets/readme/button-mihomo-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Mihomo%E5%86%85%E6%A0%B8%E7%B3%BB/Clash%20Meta%20For%20Android/CMFA%28mihomo%29.yaml) [![Download sing-box JSON](../assets/readme/button-sing-box-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Sing-box%E5%86%85%E6%A0%B8%E7%B3%BB/SingBox/SingBox%28sing-box%29-full.json) [![Download Xray routing JSON](../assets/readme/button-xray-json.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/v2rayN%28xray%29.json) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Xray%E5%86%85%E6%A0%B8%E7%B3%BB/v2rayN/README.md)

## <a id="dual-core"></a>Passwall dual-core family

### Passwall

Full-featured LuCI plugin. This repository's fused SRS routing requires a sing-box backend; the script checks before writing settings.

[![Download Passwall SH](../assets/readme/button-passwall-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/Passwall%28xray%2Bsing-box%29-apply.sh) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall/README.md)

### Passwall2

A focused routing LuCI plugin maintained alongside Passwall. This repository's fused SRS assets likewise require the sing-box routing backend.

[![Download Passwall2 SH](../assets/readme/button-passwall2-sh.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/Passwall2%28xray%2Bsing-box%29-apply.sh) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E5%8F%8C%E5%86%85%E6%A0%B8%E7%B3%BB/Passwall2/README.md)

## <a id="independent"></a>Independent clients

### Shadowrocket

Use native Shadowrocket CONF and follow its guide for rules and policies. Do not substitute configurations for other Apple-platform clients.

[![Download Shadowrocket CONF](../assets/readme/button-shadowrocket-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/Shadowrocket.conf) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Shadowrocket/README.md)

### Surge

Use native Surge CONF. Its DNS fields differ from Shadowrocket and Loon; follow the Surge guide.

[![Download Surge CONF](../assets/readme/button-surge-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/Surge.conf) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Surge/README.md)

### Loon

Use native Loon CONF, retaining its DNS, Remote Filter and rule syntax.

[![Download Loon CONF](../assets/readme/button-loon-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/Loon.conf) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Loon/README.md)

### Quantumult X

Use native Quantumult X CONF; policy / filter_remote / filter_local have client-specific syntax.

[![Download Quantumult X CONF](../assets/readme/button-quantumult-x-conf.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/QuantumultX.conf) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Quantumult%20X/README.md)

### Stash

Use Stash YAML generated by trimming CMFA to supported Clash Premium-compatible fields. It does not provide Smart + LightGBM route selection.

[![Download Stash YAML](../assets/readme/button-stash-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/Stash.yaml) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Stash/README.md)

### Egern

Use native Egern YAML and its adapted rule sets. Egern cannot directly consume Mihomo MRS.

[![Download Egern YAML](../assets/readme/button-egern-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/Egern.yaml) [![Import guide](../assets/readme/nav-tutorial.svg)](../../%E7%8B%AC%E7%AB%8B%E5%86%85%E6%A0%B8%E7%B3%BB/Egern/README.md)

## <a id="meow"></a>Meow family

Both clients use the shared routing source, but formats, import procedures and validation status are maintained separately.

### Official Meow (Android / iOS) and core

Replace the subscription placeholder in the native YAML before use. Official core validation passed; full Android/iOS import and connectivity are tracked in the[official app queue](../support-queue.md#meow-official-apps).

[![Download Meow YAML](../assets/readme/button-meow-yaml.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Meow/Meow%28meow%29.yaml) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Meow内核系/Meow/README.md)

### AEROVE Lite

The JS override requires a main(config) host and a subscription with expanded endpoints. It references matching MRS shards to preserve Lite resource budgets. The production Meow validation chain is connected; the candidate passed the pinned Rust reader and unchanged app header/entry budgets. Pinned-APK full-asset and actual-routing validation are tracked in the[AEROVE queue](../support-queue.md#aerove-lite-meow).

[![Download AEROVE Lite JS](../assets/readme/button-aerove-lite-js.svg)](https://raw.githubusercontent.com/IvanSolis1989/Smart-Config-Kit/main/Meow%E5%86%85%E6%A0%B8%E7%B3%BB/Aerove%20Lite/AeroveLite%28meow%29.js) [![Import guide](../assets/readme/nav-tutorial.svg)](../../Meow内核系/Aerove%20Lite/README.md)

## Before use

1. **Client and core:** verify the actual core, especially in multi-core clients such as v2rayN.
2. **Import type:** scripts, full configurations, native routing rules and UCI snapshots use different entry points.
3. **Your endpoints:** this repository supplies none. Prepare your own working subscription or endpoints first.

Client files are grouped by core family. Directory migration changed old Raw URLs; reimport if you still use those URLs. Shared rulesets asset URLs are unchanged. To combine subscriptions, read the [Sub-Store guide](../../SubStore/README.md). After import, follow the [runtime validation checklist](dns-and-verification.md#verification); protocol requirements are covered in [client support guide](client-support.md).

---

[← Project home](../../README.md) · [Documentation index](../README.md)
