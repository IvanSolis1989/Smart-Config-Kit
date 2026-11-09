<a id="sub-store-官方版本与本仓库边界"></a>
# Official Sub-Store versions and repository boundaries

**English** | [简体中文](report.zh-CN.md)


Review date: 2026-10-19. Exact retrieval times, original responses, and both hash layers are in [manifest.json](manifest.json); sources are in [sources.json](sources.json). Seven originals cover latest backend/frontend releases, the ten most recent releases, and pinned-commit README/configuration documentation.

| Product | Stable release | Publication time UTC | Pinned source |
| --- | --- | --- | --- |
| Sub-Store backend | [2.42.6](https://github.com/sub-store-org/Sub-Store/releases/tag/2.42.6) | 2026-10-18 04:39:27 | `1f0318bc6feb46fbe204836f32ca7acab37ea67e` |
| Sub-Store Front-End | [2.34.1](https://github.com/sub-store-org/Sub-Store-Front-End/releases/tag/2.34.1) | 2026-10-15 08:27:03 | `8dc19320894a9dbb3569e8bf3e41057491e39b90` |

Backend 2.42.6 notes only a version increment; no capability is inferred. Recent releases include lifetime duration in 2.42.5, simultaneous processed/raw results through `produceArtifact(..., { includeRaw: true })` in 2.42.4, sing-box TLS certificate_sha256 conversion in 2.42.3, and Loon tls-profile/server-dns, sing-box WireGuard/Tailscale, and MASQUE conversion. Frontend 2.34.1 follows lifetime duration; 2.34.0 adds EasyTier protocol filtering. These are subscription-conversion/UI capabilities, not evidence that target apps support those protocols or that current rules need changes. See [backend releases](https://github.com/sub-store-org/Sub-Store/releases) and [frontend releases](https://github.com/sub-store-org/Sub-Store-Front-End/releases).

Repository `SubStore/` aggregation scripts and browser-sync extension continue managing subscriptions; `rulesets/source/routing-graph.js` remains rule authority. Existing workflows have no interface gap requiring `includeRaw` or lifetime duration. This review changed no SubStore runtime code, deployed no service, and synchronized no private subscription. New protocol conversions still require validation against the target client’s actual core version and final node fields.

This review preserved originals and checked versions/impact boundaries. It performed no new Sub-Store service upgrade, end-to-end subscription publication, or protocol connection test.
