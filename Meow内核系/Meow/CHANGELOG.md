<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Meow / meow-rs changelog" width="100%">
</picture>

<a id="meow--meow-rs--变更日志"></a>

# Meow / meow-rs — Changelog

[Usage](README.md) · [Support queue](../../docs/support-queue.md#meow) · [Documentation](../../docs/README.md)

## v6.0.21-meow.6 / v6.0.21-meow.4 (2026-10-28)

- Moved Google FCM from download updates to Google services. The 15 domain and 26 IPv4 predicates, rule order and 55 policy groups remained unchanged. Other push services, DNS and fake-IP were unchanged.

<a id="2026-10-24--官方客户端入口补全"></a>

## 2026-10-24 — Official client entry points completed

- Added official core, Android Meow and iOS meow project links to README. Added the Meow card and native YAML download button to the root page/download directory, keeping official-application pending acceptance separate.

## v6.0.20-meow.3 (2026-10-24)

- Organized official Meow native YAML and AEROVE Lite JS into parallel client directories, each with README, reference and changelog, sharing the generator and family adapter manifest.
- This directory covers YAML import for the official core and Android/iOS clients only; configuration semantics and acceptance boundaries were unchanged.

## v6.0.20-meow.2 (2026-10-24)

- Replaced the AEROVE-specific directory with a shared Meow entry and standardized JS as `Meow(meow).js`. AEROVE retained consumer documentation; old raw URLs required updating.
- Added native `Meow(meow).yaml` for the official core/Android/iOS, using provider filtering and a REJECT empty-pool sentinel, with native DNS/geodata projection.
- Real official v0.26.1 `-t` passed. CI added archive SHA verification and real-core validation. Application acceptance, HTTP downloads and real routing remained pending.

## v6.0.20-meow.1 (2026-10-24)

- Added pre-adapted routing JS, generator and input/output hash manifest, reusing node classification, grouping and ordered fused rules without changing routing authority.
- Preserved application DNS, hosts, sniffing, ports, mode, controller and TUN. No Mihomo global settings or TLS fingerprints were injected. Failures throw and preserve original input.
- Added support-queue status `pre-adapted-awaiting-app`. Application admission, direct logical rules, native core, Android QuickJS and real routing remained pending.
- Regenerated the candidate through the upstream refresh chain and included it in release batches. Independent CI checks generation drift/local JS behavior without removing pending status.
