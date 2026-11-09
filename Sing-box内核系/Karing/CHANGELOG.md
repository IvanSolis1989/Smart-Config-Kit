<picture>
  <source media="(max-width: 600px)" srcset="../../docs/assets/readme/page-changelog-mobile.svg">
  <img src="../../docs/assets/readme/page-changelog.svg" alt="Karing changelog" width="100%">
</picture>

<a id="karing--变更日志"></a>

# Karing — Changelog

[![Documentation](../../docs/assets/readme/nav-docs.svg)](../../docs/README.md) · [Project home](../../README.md) · [Usage](README.md) · [Documentation](../../docs/README.md)

> Native custom-routing artifacts follow the authoritative routing graph. See README and adapter manifest for platform differences.

## v6.0.21-karing.3 (2026-11-09)

- Issue #196: distinguished custom-rule URL references from application remote-asset registration, adding save-each-group activation steps for affected versions and pinned official-source evidence.
- Added registration boundaries and expected resource counts to the generated manifest, plus a read-only internal-registry audit and positive/negative cases. Import JSON, routing order, URLs and actions were unchanged; unsupported internal fields were not injected.
- This provides verifiable diagnostics/guardrails for registration gaps, not a claim to have fixed Karing's private import implementation. Application downloads, imports and connections remained unverified.

## v6.0.21-karing.2 (2026-10-28)

- Moved Google FCM from download updates to Google services. The 15 domain and 26 IPv4 predicates, order and 55 policy groups remained unchanged, as did other push services, DNS and fake-IP. Karing `currentSelected` and application-managed final-selection boundaries were unchanged.

## v6.0.20-karing.1 (2026-10-24)

- Added native `diversion_rules_custom.json`, retaining generated SingBox route order and independent segment names.
- Reused fused SRS. Complex AND/OR/NOT, port, network and process conditions generate standard headless source JSON; invented nested Karing JSON fields are prohibited.
- Recursively resolved direct/block actions from explicit selector defaults. Proxy exits use `currentSelected`; users bind node groups in the application.
- Bound five external QUIC rule sources to exact SRS-decoded gzip snapshots. Normal generation is offline/deterministic; explicit refresh records provenance/hashes.
- Added manifests, generation readback, read-only drift checks and invalid-input regressions. Real-device Karing import acceptance was not performed.
