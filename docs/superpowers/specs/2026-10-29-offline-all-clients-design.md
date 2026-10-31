# 全端离线配置下载设计

用户授权：在同一离线表单中选择客户端、Full/Lite/Custom 业务方案及该客户端支持的参数，直接下载对应配置；全程不用 CLI，保持默认分流和安全边界，验证后推 main。

## 设计决定

- 覆盖现有业务生成器的 20 个维护入口，不新增客户端支持承诺。默认选 FlClash / Full；切换客户端不把不支持的参数带入新端。
- 复用 `business-profile-output.js` 的入口与依赖目录、`business-profiles.js` 的权威业务目录和安全计划、现有平台投影器。共享纯函数供 CLI 与浏览器使用，Ruby 仅在构建时解析可信 YAML。
- 浏览器从构建时内嵌的可信模板生成文本，不接收订阅、不读取个人文件、不执行下载的 JS、不调用网络。可选方案的 YAML 使用 JSON 兼容 YAML 形式，验证解析结果与既有 CLI 等价；Full 默认保留发布源的 LF 文本，二进制附件保留原字节。
- 单文件直接下载原生扩展名；含伴随清单、手工分流列表或 AEROVE 资源的入口下载保留目录结构的 ZIP。仅引用已发布远程资产，不重建共享 fused/MRS。
- ZIP 复用官方 `fflate@0.8.3` MIT UMD，同步离线 API；版本、来源、完整性和许可证随仓库记录。库内异步接口不在表单使用。
- 参数由各端能力目录提供。三份 Mihomo JS 支持原有五项；AEROVE 保持 DNS 由 App 托管且 off；OpenClash 使用既有四个运行时默认值，保留环境优先。静态端仅提供已有原生测速/QUIC映射，不新增订阅 DNS、倍率或节点运行时。
- Egern 的 QUIC 更改需要配套规则资产重建，本次保持原行为；QX 不把 UDP fallback 冒充 QUIC 开关。SR/Surge/Loon 对 QUIC 的原生范围更宽，界面明确标示。
- 保留节点、server/SNI/Host、拨号链、DNS 快照、保护规则与 App 管理的 DNS/TUN/端口边界。生成结果不代表设备连接验收，也不声称全端性能收益。

## 验收

1. 20 入口的 Full 默认与冻结基线对照；Lite、Custom 子集和空集与原有平台投影语义相同，安全残余与依赖闭包保留。
2. 参数支持范围、非法值、未知客户端、跨端状态切换、原生 numeric badInput 与修正恢复均有直接回归。
3. 多文件 ZIP 实际解压并核对路径、文件内容、二进制哈希；浏览器实际下载代表性 JS/YAML/JSON/conf/shell/ZIP，生成期间无网络请求。
4. 相关共享投影、JS/QuickJS、严格产物合同、同步合同与文档链接检查通过；桌面亮暗和 390px 表单及改动文档实际渲染检查通过。
5. 默认客户端与规则资产无改动；正常提交推 main，读回远端 SHA、干净工作区与该提交 CI。

## 参考

现有仓库全端 CLI 和 FlClash 离线导出是主要实现来源。多文件打包调研比较了 [fflate](https://github.com/101arrowz/fflate)、[client-zip](https://github.com/Touffy/client-zip) 和 [JSZip](https://github.com/Stuk/jszip)；复用 fflate 避免自写 ZIP 编码器，并保持无运行期外部依赖。
