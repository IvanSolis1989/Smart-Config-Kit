<a id="karing短目录与-readme-发布状态"></a>
# Karing, short directories and README publication status

**English** | [简体中文](2026-10-24-karing-kernel-layout.zh-CN.md)

> English translation of the dated reference below. Historical findings, uncertainties, and original illustrative code are retained; translation is not a new compatibility or device-validation claim.

Goal: add native Karing routing support, organize clients by short core-family directories, improve README presentation, commit/push main and confirm CI/new links. The user explicitly authorized committing/pushing main; rendered Markdown must receive visual review before publication.

- Directory mapping: `tools/client-layout.json`. Five top-level core-family directories retain original client subdirectories; public rulesets URLs stay unchanged.
- Karing: 97 rules, 19 complex-match source assets. Text input hashes normalize LF; binary bytes remain intact. DNS, node groups and default actions are App-managed; no Karing device import/connection acceptance yet.
- Runtime preservation: all 177 runtime files exist at mapped paths; 175 match after normalization, with the other 2 differing only in generated paths/metadata. Complete outputs of the same fixture match for all three JS scripts.
- README: 28 self-contained glass-style SVGs, including 3 desktop and 3 mobile images. Root README reviewed in desktop light/dark and 390px layouts; 27 READMEs rendered through GitHub GFM API and inspected, with all 312 local link targets present. Screenshots/report are in ignored `.cache/readme-preview/`.
- Validation: previous repository-wide Node run had 601 tests, 595 passed, 0 failed, 6 skipped. After adding cross-line-ending regressions, 11 Karing/layout tests passed; artifact contracts passed 2498 checks / 22 artifacts; generated assets, quality receipts and Karing --check passed. CI will actually run checks with two official sing-box core versions.
- Historical evidence: `docs/upstream/2026-10-19/**` restored to original content, with no subtree diff. Nine archive hashes and 14 historical path bindings passed.
- No upstream rule refresh. Runtime content of Egern's original 140 assets and both SingBox JSON files is retained. Build dependencies/new paths are synchronized to CI.

Next: review staged rename diffs, commit main, push, then check that commit's CI, online README images and full-response hashes for new download URLs.
