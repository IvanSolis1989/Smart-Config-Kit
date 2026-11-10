[English](REFERENCE.md) | **中文**

# JavaScript 引擎验证参考

本目录将必需的测试依赖与根项目和发布的覆写脚本隔离。请在仓库根目录安装并运行：

```sh
npm --prefix tools/js-engine-tests ci --ignore-scripts
node tools/validate-js-engines.js
node --test tools/tests/js-engines.test.js
```

`--target smart|normal|flclash` 选择单一适配器。依赖缺失时检查失败并显示安装命令；包损坏或 WASM 初始化错误也会失败。CI 按已提交的锁文件安装依赖，并执行两条验证命令。

验证器在实际 QuickJS WebAssembly 引擎中解析并执行完整脚本，包括未调用的函数体和正则表达式，然后调用 `main`。它与使用同一隔离 Node VM 驱动器生成的完整 JSON 配置比较。数组顺序、路由目标、DNS/hosts、提供器、节点、策略组及所有其他 JSON 字段必须一致。对象引用身份在各引擎内部、JSON 序列化前检查；FlClash 必须保留配置、策略组、规则和提供器的原引用。现有 Node 契约测试仍为必需。

用例覆盖普通订阅、有效链式拨号、精确及未知倍率边界、被过滤的链依赖、循环、内联提供器和不支持的远程提供器。无效输入必须保持原样。可选本地常量仅在测试驱动器内存中替换，不改变文件及其默认设置。

语法边界由固定版本引擎的实际全局脚本解析器及 Node 的 `vm.Script` 解析器确定，不使用推测的 ES2020 API 禁用清单。测试明确保留 BigInt、可选链和空值合并，同时拒绝未调用函数中的无效语法。依赖包声明支持大部分 ES2023；执行成功仅证明该固定引擎的结果，不代表所有客户端内置的旧引擎或 Dart/QuickJS 桥完全相同。此门禁也不能替代 Mihomo schema 验证或客户端/真机验收。

## 借鉴与许可证

- 仅为设计参考：MyClash 的 [QuickJS 检查](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/Test/lib/quickjs-check.js) 与 [ES2020 检查](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/Test/lib/es2020-check.js)，固定版本 `bf6c2dbc3b007b791284b437e5283854ce9c0f1a`，[MIT](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/LICENSE)。借鉴实际引擎及 JSON 桥接思路；其缺依赖时跳过、仅比较输出数量以及 ES2020 API 禁用清单不满足本仓库门禁，因此这里使用完整输出比较及强制执行。没有复制 MyClash 源代码。
- 运行库：严格固定 `quickjs-emscripten` `0.32.0`，[官方用法及生命周期管理](https://github.com/justjake/quickjs-emscripten/blob/v0.32.0/README.md)，[MIT 许可证](https://github.com/justjake/quickjs-emscripten/blob/v0.32.0/LICENSE)。采用默认同步 Bellard QuickJS 变体，不使用 quickjs-ng。锁文件固定传递依赖的 WASM 包和完整性哈希；已安装依赖保留上游许可证。

依赖不向来宾上下文暴露宿主文件系统、网络、模块加载器或进程 API。每次执行使用新上下文、15 秒中断期限和 128 MiB 来宾内存上限。宿主回调仅实施期限；console 方法为空操作。成功及失败后均释放句柄和上下文。这些限制仅为测试资源控制，不是通用隔离或安全保证。
