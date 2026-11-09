<a id="proxy-override-借鉴设计方案spec"></a>
# Proxy-override design-adoption proposal (spec)

**English** | [简体中文](2026-05-30-proxy-override-借鉴设计.zh-CN.md)


> Research subject: https://github.com/Sgraqwq/Proxy-override
> Date: 2026-05-30 | Status at that time: design agreed, awaiting phased implementation
> Decision-maker: repository owner | Research/design: Claude Code

This is a historical design record. Its comparisons, risk ratings, capability assessments, and proposals describe the 2026-05-30 discussion, not current verification or authorization to implement obsolete plans. Original configuration examples and comments are retained verbatim; later references and acceptance records govern current behavior.

---

<a id="0-背景"></a>
## 0. Background

`Sgraqwq/Proxy-override` was described as a “minimal, zero-configuration” routing repository: three files, sixteen groups, nine rule sets, targeting Mihomo-family/FlClash/Mihomo/Egern clients. After two research rounds, the original assessment was that this repository already covered 80% of its design and offered additional regional grouping, Smart/LightGBM, residential-node subdivisions, 52 groups, and 384 providers. Those existing capabilities were to be preserved, not reduced. Seven potentially incremental ideas were identified; the owner selected six, deferring #7 Egern.

---

<a id="1-借鉴点清单与决策"></a>
## 1. Adoption candidates and decisions

| # | Candidate | Value | Assessed risk | Decision at that time |
|---|------|:---:|:---:|------|
| #2 | Earlier direct rules for China SDKs/CDNs | ⭐⭐⭐ | 🟢 Low | ✅ Implement |
| #3 | Complete fake-ip-filter for remote control/games/P2P | ⭐⭐ | 🟢 Low | ✅ Implement |
| #5 | `direct-nameserver-follow-policy: true` | ⭐ | 🟢 Low | ✅ Implement after documentation review |
| #6 | Additional node-filter keywords | ⭐ | 🟡 Medium | ✅ Implement |
| #4 | Encrypted DoH-over-IP bootstrap | ⭐⭐ | 🟡 Medium | ✅ Implement after deeper research |
| #1 | Fine-grained QUIC exemptions and rejection | ⭐⭐⭐ | 🟡 Medium | ✅ Implement last |
| #7 | Egern client support | ⭐ | 🔴 High | ❌ Defer |

**Owner-specified order, easy to difficult:** #2 → #3 → #5 → #6 → **#4** → **#1**.

---

<a id="2-各项详细设计"></a>
## 2. Detailed designs

<a id="2-国内-sdkcdn-直连前置批-a"></a>
### #2 Earlier direct rules for China SDKs/CDNs (batch A)

**Proposed change:** add DIRECT rules in the China-sites section or a new early China-direct section. Original examples identify Umeng (Alibaba), JPush, 360’s frontend CDN, BootCDN, Qiniu, and Upyun:

```
DOMAIN,msg.umeng.com,DIRECT        # 友盟（阿里，国内）
DOMAIN-SUFFIX,jpush.cn,DIRECT       # 极光推送（国内）
DOMAIN-SUFFIX,jpush.io,DIRECT
DOMAIN-SUFFIX,baomitu.com,DIRECT    # 360 前端 CDN
DOMAIN-SUFFIX,bootcss.com,DIRECT    # BootCDN
DOMAIN-SUFFIX,staticfile.org,DIRECT # 七牛 CDN
DOMAIN-SUFFIX,upaiyun.com,DIRECT    # 又拍云
```

**Distinction:** do not add `adjust.com`/`appsflyer.com`, which are non-China attribution SDKs, to avoid incorrectly directing their traffic.

**Artifact scope:** all twelve artifacts, using each native rule syntax.

**Observed state then:** only two mainline matches; zero for baomitu/bootcss/staticfile/upaiyun.

**Assessed risk:** low. Check conflicts with existing rules and place before RULE-SET,cn.

<a id="3-fake-ip-filter-补全批-a"></a>
### #3 Complete fake-ip-filter (batch A)

**Proposed change:** add the following, considered to require real IPs for hole punching/direct connections. Original comments distinguish remote-control, gaming, and Bilibili P2P entries:

```
+.todesk.com  +.oray.com  +.sunlogin.com  +.teamviewer.com  +.anydesk.com   # 远控
+.battlenet.com.cn  +.wotgame.cn  +.wggames.cn  +.wowsgame.cn               # 游戏
+.mcdn.bilivideo.cn                                                          # B站P2P
```

**Artifact scope:** Mihomo family (Clash Party/CMFA/two OpenClash variants/FlClash) and SingBox configurations with fake-IP.

**Observed state then:** mainline/OpenClash had only two remote-control entries and no game-CDN/P2P entries.

**Original risk assessment:** very low, additive only. This historical assessment is not evidence that additions are universally safe.

<a id="5-direct-nameserver-follow-policy批-a"></a>
### #5 direct-nameserver-follow-policy (batch A)

**Proposed change:** add `direct-nameserver-follow-policy: true` to DNS so direct-nameserver also follows nameserver-policy.

**Artifact scope:** Mihomo family.

**Prerequisite:** ⚠️ WebFetch official documentation to confirm field semantics and minimum version (§2.4); local REFERENCE did not yet include it.

**Assessed risk:** low.

<a id="6-节点过滤关键词补充批-b"></a>
### #6 Additional node-filter keywords (batch B)

**Proposed change:** extend INFO_PATTERNS / artifact exclude fields with `免费 | 试用 | 应急 | Sign | Login | Register | Help | FAQ` (the first three mean free, trial, and emergency).

**Exclude from the proposal:** `更新` (update, which could reject a legitimate “updated node”) and `地址` (address, with false-positive risk). Proxy-override included them, but they were assessed as too risky here.

**Artifact scope:** §1.5 cross-artifact equivalence: JS REGION_DB/INFO_PATTERNS, CMFA filter, OpenClash Ruby, and SR/independent-core/Surge/Loon/QX exclude fields.

**Assessed risk:** medium; legitimate names containing Login/Sign could be rejected, although considered uncommon. **Regression tests are required**, modeled after test-kr-boundary.js.

<a id="4-doh-over-ip-加密-bootstrap批-d先研究透"></a>
### #4 Encrypted DoH-over-IP bootstrap (batch D, research first)

**Owner-selected proposal:** switch `default-nameserver`/bootstrap to DoH-over-IP:

```
https://223.5.5.5/dns-query
https://223.6.6.6/dns-query
https://8.8.8.8/dns-query
https://1.1.1.1/dns-query
```

**Original rationale versus Proxy-override’s DoT:** port 443 was expected to be less frequently blocked than 853, with DNS carried inside HTTPS and redundant upstreams: two Alibaba endpoints for China-network latency and Google/Cloudflare alternatives outside China. The original stronger claims about near-universal reachability and concealment are design assumptions, not measured guarantees.

**Recorded official basis:** Mihomo `default-nameserver` requires IP addresses but permits encrypted DNS: host must be an IP, while the scheme can be https://. Two REFERENCE-mihomo-wiki.md files were updated.

**Cross-artifact feasibility table for #4:**

| Artifact | Plaintext bootstrap field | DoH-over-IP feasibility assessed then | Conclusion then |
|------|------|:---:|------|
| Clash Party / CMFA / two OpenClash variants / FlClash | Plain-IP `default-nameserver` | ✅ Accepts https://IP/dns-query | Full encryption considered feasible |
| Surge | `dns-server` (DoH capable) / `encrypted-dns-server` | ✅ https://IP in encrypted-dns-server | Full encryption considered feasible |
| Loon | `dns-server` supports only system/plain IP | ⚠️ doh-server/doh3-server can use IP; dns-server cannot be encrypted | IP-based DoH with plaintext fallback retained |
| Quantumult X | `server=` plain IP only; only first `doh-server=` effective | ⚠️ Same limitation class as Loon | Same approach as Loon |
| SingBox | DNS server + address_resolver | ⚠️ HTTPS server supported; generator.js and sing-box 1.11/1.12 syntax differences require checking during implementation | Pending verification |
| v2rayN(xray) / both Passwall variants | Core-dependent | ⚠️ Pending verification | Pending verification |

**Plaintext fallback proposal:** mixed `default-nameserver`, with DoH-over-IP preferred and one plaintext IP retained to reduce outage risk if port 443 is also intercepted or initial requests fail. Mihomo’s concurrent versus sequential query behavior must be verified because it determines whether this is actually fallback.

**Research TODO:** WebFetch sing-box /configuration/dns/server/https/, v2rayN(xray) DNS, and Passwall.

<a id="1-quic-精细化批-c最后"></a>
### #1 Fine-grained QUIC (batch C, last)

**Proposed change:** insert a QUIC layer after ad blocking and before service routing, in Mihomo syntax. Original policy names are retained:

```
AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,youtube)),📹 YouTube
AND,((DST-PORT,443),(NETWORK,UDP),(GEOSITE,google)),🔧 工具与服务
AND,((DST-PORT,443),(NETWORK,UDP),(RULE-SET,microsoft)),Ⓜ️ 微软服务
AND,((DST-PORT,443),(NETWORK,UDP),(RULE-SET,apple)),🍎 苹果服务
AND,((DST-PORT,443),(NETWORK,UDP),(NOT,((GEOSITE,cn)))),REJECT
```

**Proposed interaction:** the design expected existing QUIC sniffing (SNI at lines 159–163) to enable GEOSITE matching, treating them as complementary rather than conflicting. This still requires actual validation.

**Artifact adaptation:** Mihomo family AND/NOT; Surge/Loon `AND,((...),(...))`; QX `[filter] ...`; SingBox route.rules network/port logic; SR AND support still requires confirmation.

**Trade-off:** non-exempt non-China UDP applications, including some games/WebRTC, may be affected. The historical proposal was **enabled by default, with README instructions to disable it**.

**Assessed risk:** medium. Validate exact AND/NOT syntax and sniffer interaction for every artifact.

---

<a id="3-实施批次计划每批一个-pr独立-1-联动--5-自检--版本changelog"></a>
## 3. Implementation batches (one PR each, independent §1 synchronization, §5 checks, versions/CHANGELOG)

| Batch | Contents | Assessed risk | Prerequisite |
|---|------|:---:|------|
| **A** | #2 + #3 + #5 | 🟢 Low | Review follow-policy documentation for #5 |
| **B** | #6 filter keywords | 🟡 Medium | Write regressions |
| **C** | #1 fine-grained QUIC | 🟡 Medium | Check each artifact’s AND/NOT syntax |
| **D** | #4 DoH-over-IP bootstrap | 🟡 Medium | Check sing-box/Xray-family/v2rayN/Passwall first; see #4 TODO |

Each batch must follow AGENTS.md: §1 all-artifact synchronization, §1.5 equivalence auditing for #6 node classification, §2 official-documentation review, §5 self-checks, and §1.3 versions/CHANGELOG.

---

<a id="4-实施前-todo研究未尽项"></a>
## 4. Pre-implementation TODO (unfinished research)

1. **#5:** WebFetch Mihomo wiki to confirm `direct-nameserver-follow-policy` semantics/minimum version and update REFERENCE.
2. **#4 sing-box:** WebFetch `/configuration/dns/server/https/` to verify DoH-over-IP server syntax, 1.11/1.12 differences, and current generator.js output.
3. **#4 Xray-family/v2rayN/Passwall:** verify encrypted-IP bootstrap support.
4. **#4 fallback semantics:** verify whether Mihomo default-nameserver queries multiple upstreams concurrently or sequentially, determining whether plaintext fallback is effective.
5. **#1:** verify exact AND/NOT syntax for independent-core/Surge/Loon/QX/SR/SingBox artifacts.

---

<a id="5-已完成的前置本会话-2026-05-30"></a>
## 5. Prerequisites completed in the 2026-05-30 session

- ✅ Two `REFERENCE-mihomo-wiki.md` files updated to state that `default-nameserver` can use encrypted DNS, providing the recorded basis for #4.
- ✅ Historical research assessment: approximately 80% of Proxy-override’s design was already covered with additional capabilities here; seven incremental candidates were identified above. This is the original design assessment, not a new comparative benchmark.
