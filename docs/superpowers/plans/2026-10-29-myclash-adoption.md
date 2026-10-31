# MyClash Adoption Implementation Plan

> **For agentic workers:** Use the scoped parallel ownership assignments recorded below. Follow repository validation and preserve other writers.

**Goal:** 吸收真实引擎验证、业务按需配置、统一本地入口及精确 hosts 兼容，并保持默认行为后发布 main。

**Architecture:** 源图管理业务选择，独立目录承载可选投影；既有默认入口保持完整。可信本地参数通过现有备份读回写入，Node-DNS 新模式独立校验，JS/Ruby 由共享 runtime 同步。

**Tech Stack:** Node.js 24（CI 22）、Ruby 3.3、锁定 quickjs-emscripten、离线 HTML。

**Spec:** [设计](../specs/2026-10-29-myclash-adoption-design.md)

## Global Constraints

- 默认 adaptive、完整业务组、DNS/规则/安全前置不变；不上游刷新。
- 不修改已有节点 server、SNI、Host 或静默解除代理链。
- 生成器写派生产物，单一文件写者；测试与批处理低 CPU 优先级。
- full 原字节，lite/custom 独立目录；订阅无权选择 profile。
- 未完成的真机验收不能写成通过。

## Review Focus

- 精简后的 DNS、fake-ip、逻辑规则引用仍在闭包中。
- 全端代理组删减不留下默认候选或静态引用。
- 参数更新不能执行目标 JS，不能丢失已有本地选择。
- hosts-only snapshot 篡改零写入，旧模式不放宽。
- 输出目录冲突、符号链接和写入失败保持已有文件。

## Tasks

- [x] **1. 引擎验证** — `tools/validate-js-engines.js`、`tools/js-engine-tests/`、专用 fixture/test 与 JS CI；先失败样例，再三种脚本完整输出对照。
- [x] **2. 业务配置** — `rulesets/source/business-profiles.json`、源图导出、`tools/lib/business-profiles.js`、`tools/generate-business-profile.js` 与跨端投影测试；接口 `resolveBusinessProfile/buildProfilePlan/generateBusinessProfile`。
- [x] **3. 统一入口** — `tools/configure.js`、本地参数 schema 扩展、离线表单及测试；接入任务 2，复用原子备份和读回。
- [x] **4. hosts-only** — JS/Ruby runtime、profile 合同及测试；主线程在稳定后同步三 JS 和两 OpenClash，不影响默认配置。
- [x] **5. 集成与发布准备** — 版本/CHANGELOG、官方字段证据、使用文档、实际渲染；按受影响范围运行合同及全端投影，独立审查，确认默认差异后提交、推 main、检查远端与 CI。

责任：引擎 worker 只写引擎工具/JS CI；业务 worker 只写业务模块/源图导出；hosts worker 只写 Node-DNS 源及相关测试；主线程拥有统一入口、适配器同步、版本、文档与发布。共享生成器在各模块稳定后顺序运行。

本地集成与验证已完成，证据见 [验证记录](../../reports/2026-10-29-myclash-adoption.md)。main 提交、推送及远端 CI 的最终状态以本次交付读回为准。
