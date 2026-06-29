# License Gate

更新时间：2026-06-28

本项目是 GPL-3.0 二开项目。Tauri 版公开分发前必须通过本 gate。

## 决策

- 二开项目继续采用 GPL-3.0。
- 保留原作者、原项目、GPL、修改说明和 fork 来源。
- 公开分发建议使用新名称、新 logo、新 app id，避免与原 Mineradio 品牌混淆。
- 不允许直接集成 GPL-3.0 不兼容的 QQ 开源项目代码。
- QQ 开源项目可以研究协议和请求方式；复制代码前必须完成 license 审核。
- GSAP 只使用可合法分发的标准能力，不引入会员/闭源插件。
- NeteaseCloudMusicApi 继续保留原 license 和 NOTICE。
- 新增依赖必须进入 license allowlist。
- AI depth 为对齐 Electron baseline 使用远程 `@xenova/transformers` jsDelivr runtime 和 HuggingFace 模型来源；`@xenova/transformers@2.17.2` 已按 npm metadata 复核为 Apache-2.0，基础模型 `LiheYoung/depth-anything-small-hf` 已按 HuggingFace metadata 复核为 Apache-2.0，`Xenova/depth-anything-small-hf` 是 Transformers.js/ONNX 转换仓库并记录 `base_model=LiheYoung/depth-anything-small-hf`。远程模型仍需 WebView2 真实下载/推理/视觉效果手测后才能关闭能力 gate。

## License Allowlist

允许：

- GPL-3.0-compatible
- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- 0BSD
- Unlicense
- CC0-1.0
- MIT-0
- MIT/X11
- BlueOak-1.0.0
- CC-BY-4.0
- CDLA-Permissive-2.0
- Unicode-3.0
- Unicode-DFS-2016
- Apache-2.0 WITH LLVM-exception
- LGPL-2.1-or-later
- ISC
- MPL-2.0

禁止：

- 无 license
- 自定义不可分发 license
- 闭源二进制依赖且无明确再分发授权
- GPL-3.0 incompatible license
- 未确认授权的商业插件或会员插件

## Release Checklist

- [x] 新项目根 license 为 GPL-3.0。 — 根目录 `LICENSE` 为 GPL-3.0 全文。
- [x] README 明确二开/fork 来源和修改状态。  — P10.b 已将 README 改为 Tauri 二开迁移主线说明，明确 `zzstar101/Mineradio` 新仓库/updater channel、旧 Electron baseline 仅作参考、不承诺旧用户数据迁移、公开发布前 gate 未完成。
- [ ] NOTICE 或 THIRD_PARTY_NOTICES 列出所有第三方依赖。  — P10.b 已更新 NOTICE 并新增 `THIRD_PARTY_NOTICES.md`，覆盖当前直接 manifest 依赖/关键技术及 gate 状态；2026-06-29 transitive license check 已通过，仍需安装包内 notices 真实包含和最终 notices 文本验证后再勾选。
- [x] Tauri/Rust crates license 已检查。 — 2026-06-29 新增 `npm run license-transitive:check`，通过 `cargo metadata --locked` 审计 Tauri Rust 直接/传递依赖 license；当前真实检查覆盖 npm/Rust 合计 782 个包并通过 GPL-3.0 兼容 allowlist。
- [x] Bun/npm dependencies license 已检查。 — 2026-06-29 新增 `npm run license-transitive:check`，适配 Bun `node_modules/.bun` 安装布局、跳过未安装的 optional platform packages，并显式记录 `qq-music-api` / legacy `jade` transitive metadata 缺口 override；当前真实检查覆盖 npm/Rust 合计 782 个包并通过。
- [x] NeteaseCloudMusicApi license 已记录。 — `LICENSE_GATE.md` / `THIRD_PARTY_NOTICES.md` 已记录 NeteaseCloudMusicApi fallback 为 ISC，hana-music-api 主用为 MIT。
- [x] Three.js license 已记录。 — `LICENSE_GATE.md` / `THIRD_PARTY_NOTICES.md` 已记录 npm `three` 和 baseline vendor Three.js 为 MIT。
- [x] GSAP 使用范围已确认不含会员/闭源插件。 — 2026-06-29 code-side scan 仅发现 `gsap` 与标准包 `gsap/CustomEase` lazy import；未发现 Club/member/private plugin import，`license-transitive:check` 对 `gsap` 使用显式 standard-package allowlist。
- [x] QQ provider 参考项目 license 审核完成。  — DECISIONS.md A6 已锁 `jsososo/QQMusicApi` / npm `qq-music-api` 为 GPL-3.0 可接入；`sansenjian/qq-music-api` 因 README 非商业附加条款与 GPL-3.0 冲突不接入。
- [ ] 打包产物包含必要 license/notice 文件。  — 2026-06-29 packaged notices code-side policy complete：`tauri.conf.json` 已通过 `bundle.resources` 声明打包 `LICENSE`、`NOTICE.md`、`THIRD_PARTY_NOTICES.md`、`PRIVACY.md`、`SECURITY.md`，并新增 `npm run packaged-notices:check` 防回退；仍需 Windows 安装包/安装后目录产物验证后再勾选。
- [ ] Release notes 不暗示本项目是网易云、QQ 音乐或原 Mineradio 官方版本。 — 2026-06-29 release notes policy code-side guard complete：新增 `docs/migration/release-notes-template.md` 和 `npm run release-notes-policy:check`，静态要求发布说明声明 `Mineradio Tauri Rewrite`、GPL-3.0 二开/fork/rewrite、`zzstar101/Mineradio` 发布通道、非网易云音乐/QQ 音乐/原 Mineradio 官方版本、旧 Electron patch JSON updater 不迁移，以及 B2 未签名时 detection-only 不下载/安装更新。真实 GitHub Release notes 尚未发布/核验，所以不勾选。

## 发布前未解决项

以下项目均为公开发布硬门槛。它们不是可以跳过的延期能力，也不能只凭代码侧接入记录关闭；必须有审核记录、打包产物证据或明确发布决策后才能勾选 Release Checklist 和 `CAPABILITY_PARITY_CHECKLIST.md` 的 License / Update gate。

- Rust crates full audit：2026-06-29 code-side complete；`npm run license-transitive:check` 基于最终当前 `Cargo.lock` / Tauri plugin 集合执行 `cargo metadata --locked` 并通过。若后续新增 Rust 依赖或 Tauri plugin，必须重新运行并更新本 gate。
- npm transitive full audit：2026-06-29 code-side complete；`npm run license-transitive:check` 基于当前 workspace manifests、Bun `.bun` 安装目录和实际可安装依赖闭包通过。若后续新增 npm 依赖，必须重新运行并更新本 gate。
- GSAP standard-only final check：2026-06-29 code-side complete；源码扫描只发现 `gsap` 与标准包 `gsap/CustomEase`，未发现 Club/member/闭源插件、私有插件或未授权商业资产。若后续新增 GSAP 插件 import，必须重新审核。
- Direct dependency allowlist enforcement：`npm run license:check` 会检查 Tauri 迁移目标 workspace manifests 和 `apps/desktop/src-tauri/Cargo.toml` 的直接依赖，要求它们全部进入 Dependency Audit 表且 Decision 不为 `待审核`。该检查不替代 Rust/npm transitive full audit。
- AI depth remote source enforcement：`npm run ai-depth-remote-policy:check` 会静态锁定 `@xenova/transformers@2.17.2` jsDelivr runtime、`Xenova/depth-anything-small-hf` HuggingFace model id、`allowLocalModels=false`、ONNX WASM `numThreads=1`、remote source license/provenance 审核记录、隐私说明和 release notes 远程下载披露。该检查不替代 WebView2 真实模型下载/推理/视觉效果手测。
- packaged notices inclusion：`npm run packaged-notices:check` 会静态检查 Tauri bundle resources 已声明 `LICENSE`、`NOTICE.md`、`THIRD_PARTY_NOTICES.md`、`PRIVACY.md`、`SECURITY.md`；公开发布前仍必须验证 Windows 安装包/安装后目录真实包含这些文件及必要第三方 license 文本。
- release notes wording：`npm run release-notes-policy:check` 会静态检查 `docs/migration/release-notes-template.md` 具备 GPL-3.0 二开/fork/rewrite、非网易云音乐/QQ 音乐/原 Mineradio 官方身份、`zzstar101/Mineradio`、旧 Electron patch JSON 不迁移和 detection-only updater 限制措辞；真实 GitHub Release notes 必须以该模板为基准并在发布后核验，才能关闭此 gate。
- updater signature/release artifact relation：`npm run updater-policy:check` 会在 B2 pubkey 为空时静态锁定 detection-only：Tauri updater endpoint 仍指向 `zzstar101/Mineradio`，Rust/web 不暴露 download/install helper，UI 保留 `signature-key-missing` 不可安装文案；公开发布前仍必须在最终发布路径下明确 Tauri updater manifest、签名字段、公钥配置、安装包资产和 release 上传资产之间的关系。若继续 detection-only，不得展示可安装更新为已通过 gate，且需在 release notes/UI 中说明。
- transitive license enforcement：`npm run license-transitive:check` 会检查迁移目标 workspace 的 npm 运行/构建依赖闭包与 Tauri Rust crates；Bun optional platform packages 缺失不会导致当前平台失败，GSAP 标准包、`qq-music-api` GPL-3.0、legacy `css`/`uglify-js` metadata 缺口通过脚本 override 明确记录。该检查不替代安装包内 notices 真实包含验证。

## QQ 开源项目审核表

| Project | URL | License | Active | Usage | Copy Code? | Risk | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| jsososo/QQMusicApi | https://github.com/jsososo/QQMusicApi | GPL-3.0 | 是（1.6k stars） | 依赖（npm 包 `qq-music-api`），接入 search/songUrl/lyric/playlist/loginStatus/logout | 否（依赖调用，不拷代码） | 与本项目同 GPL-3.0，无歧义 | 接入 |
| sansenjian/qq-music-api | https://github.com/sansenjian/qq-music-api | MIT 文件 + README 「不可商业用途」附加 | 是（fork of Rain120） | 评估候选 | 否 | MIT 附加非商业条款与 GPL-3.0 「no further restrictions」冲突，组合作品不可在 GPL-3.0 下分发 | 不接入 |

## Dependency Audit 表

| Dependency | Ecosystem | License | Purpose | Distribution Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| tauri | Rust (crate) | MIT/Apache-2.0 | 桌面壳 + updater + window/sidecar 能力 | 直接依赖 license 已按本地 crate metadata 核对；`license-transitive:check` 已覆盖 Rust closure | 通过（direct + transitive checked） |
| @tauri-apps/cli | npm devDependency | MIT/Apache-2.0 | Tauri dev/build CLI | 兼容；安装包包含 notices 仍需验证 | 通过 |
| tauri-build | Rust build-dependency | MIT/Apache-2.0 | Tauri build script integration | 直接依赖 license 已按本地 crate metadata 核对；`license-transitive:check` 已覆盖 Rust closure | 通过（direct + transitive checked） |
| Bun | Runtime | MIT | sidecar runtime/workspace | MIT 兼容 | 通过 |
| Vite | npm | MIT | 前端构建 | MIT 兼容 | 通过 |
| @vitejs/plugin-react | npm | MIT | Vite React transform / Fast Refresh integration | MIT 兼容 | 通过 |
| React | npm | MIT | UI | MIT 兼容 | 通过 |
| react-dom | npm | MIT | UI renderer | MIT 兼容 | 通过 |
| @types/react | npm devDependency | MIT | React TypeScript types | MIT 兼容 | 通过 |
| @types/react-dom | npm devDependency | MIT | React DOM TypeScript types | MIT 兼容 | 通过 |
| Zustand | npm | MIT | 状态管理 | MIT 兼容 | 通过 |
| zod | npm | MIT | schema validation | MIT 兼容 | 通过 |
| @tauri-apps/api | npm | MIT/Apache-2.0 | Tauri 前端 IPC | 兼容 | 通过 |
| TypeScript | npm devDependency | Apache-2.0 | typecheck/build tooling | Apache-2.0 兼容 | 通过 |
| tauri-plugin-dialog | Rust (crate) | MIT/Apache-2.0 | Rust-owned JSON import/export open/save dialogs | 兼容 | 通过 |
| tauri-plugin-global-shortcut 2.3.2 | Rust (crate) | MIT/Apache-2.0 | Tauri 全局热键注册、冲突检测和事件桥接 | 兼容；真实 Windows OS 注册/触发仍需 capability gate 验证 | 通过（code-side 接入） |
| global-hotkey 0.8.0 | Rust (crate, transitive via tauri-plugin-global-shortcut) | MIT/Apache-2.0 | 系统级 hotkey 注册 backend | 兼容；随 Rust crates full audit 复核 | 通过（transitive） |
| tauri-plugin-single-instance | Rust (crate) | MIT/Apache-2.0 | Tauri 单实例注册与二次启动唤醒主窗口 | 直接依赖 license 已按本地 crate metadata 核对；Windows packaged duplicate-launch evidence 另由 capability gate 跟踪 | 通过（direct） |
| tauri-plugin-updater 2.10.0 | Rust (crate) | MIT/Apache-2.0 | Tauri updater 检测和签名校验通道；P10.a 只启用 check，download/install 仍受签名 gate 阻挡 | 兼容；公开安装更新仍需 pubkey/signature 或最终风险决策 | 通过（检测接入） |
| tauri-plugin-fs | Rust (crate, transitive via tauri-plugin-dialog) | MIT/Apache-2.0 | dialog FilePath conversion / scoped filesystem support | 兼容 | 通过（transitive） |
| rfd | Rust (crate, transitive via tauri-plugin-dialog) | MIT | native file dialog backend | 兼容 | 通过（transitive） |
| serde | Rust (crate) | MIT/Apache-2.0 | Rust command/config serialization | 直接依赖 license 已按本地 crate metadata 核对；`license-transitive:check` 已覆盖 Rust closure | 通过（direct + transitive checked） |
| serde_json | Rust (crate) | MIT/Apache-2.0 | Rust JSON command payloads and config helpers | 直接依赖 license 已按本地 crate metadata 核对；`license-transitive:check` 已覆盖 Rust closure | 通过（direct + transitive checked） |
| dirs (crate) | Rust (crate) | MIT | app data/log 路径解析 | MIT 兼容 | 通过 |
| time 0.3 | Rust (crate) | MIT/Apache-2.0 | 格式化 Tauri updater `OffsetDateTime` 为 RFC3339 状态字段 | 兼容 | 通过 |
| hana-music-api | npm | MIT | Netease provider（主用） | MIT 兼容；极新 2 stars/v1.1.1，parity 风险见 DECISIONS.md A8 | 通过（带 parity 风险） |
| NeteaseCloudMusicApi | npm | ISC | Netease provider（回退） | ISC 兼容；维护人历史有争议 | 通过（回退路径保留） |
| three | npm | MIT | 3D/WebGL runtime dependency used by visual-engine | MIT 兼容；visual parity and packaged notices still tracked separately | 通过（direct） |
| Three.js | vendor/baseline reference | MIT | Electron baseline `public/vendor` reference for 3D/WebGL behavior | MIT 兼容；legacy baseline artifact notices still need packaged inclusion verification | 通过（baseline reference） |
| @types/three | npm devDependency | MIT | Three.js TypeScript types | MIT 兼容 | 通过 |
| gsap | npm | Standard no-charge license | animation timelines/easing; code imports `gsap` and `gsap/CustomEase` from the standard npm package only | Club/member/闭源插件禁用；direct usage scan found no Club plugin imports, but packaged notices/release wording remain tracked separately | 通过（direct standard package） |
| GSAP | vendor/baseline reference | Standard no-charge license | Electron baseline `public/vendor/gsap.min.js` reference and legacy runtime | Club/member/闭源插件禁用；public release still needs packaged notices inclusion verification | 通过（baseline reference） |
| happy-dom | npm devDependency | MIT | visual-engine DOM-like test environment | MIT 兼容 | 通过 |
| @xenova/transformers + Xenova/depth-anything-small-hf | remote runtime/model source | Runtime Apache-2.0；base model Apache-2.0；Xenova ONNX conversion records base_model=LiheYoung/depth-anything-small-hf | AI depth baseline parity：jsDelivr runtime + HuggingFace model 下载，不写入 npm manifest | 远程 runtime/model 下载已写入 release notes/privacy/CSP 说明；推理在本地 WebView2 执行，不上传封面；不作为通用 CDN 放行；真实 WebView2 下载/推理证据仍由 capability gate 跟踪 | 通过（remote source reviewed；WebView2 runtime evidence pending） |
| jsososo/qq-music-api（npm `qq-music-api`） | npm | GPL-3.0 | QQ provider | 与本项目同 GPL-3.0，组合作品可分发 | 通过 |
| axios ^0.21.2 | npm [transitive via qq-music-api] | MIT | HTTP 客户端 | MIT 兼容 | 通过（transitive） |
| cheerio ^1.0.0-rc.3 | npm [transitive via qq-music-api] | MIT | HTML 解析 | MIT 兼容 | 通过（transitive） |
| express ~4.16.1 | npm [transitive via qq-music-api] | MIT | HTTP 服务框架（jsososo 服务模式入口；sidecar 仅依赖 `qq.api` 程序式调用，不启动 express server） | MIT 兼容 | 通过（transitive） |
| js-base64 ^2.5.1 | npm [transitive via qq-music-api] | BSD-3-Clause | Base64 编解码 | BSD-3-Clause 兼容 | 通过（transitive） |
| moment ^2.24.0 | npm [transitive via qq-music-api] | MIT | 时间格式化 | MIT 兼容；该项目已 EOL 但仅 jsososo 内用 | 通过（transitive） |
| xml2js ^0.4.22 | npm [transitive via qq-music-api] | MIT | XML 解析（jsososo QQ 部分接口用） | MIT 兼容 | 通过（transitive） |
| jade ~1.11.0 | npm [transitive via qq-music-api] | MIT | 模板引擎（jsososo express 服务模式备用） | MIT 兼容；已弃用但仅作为 transitive；sidecar 不调 express server | 通过（transitive，with EOL note） |
| cookie-parser ~1.4.4 | npm [transitive via qq-music-api] | MIT | express cookie 中间件（transitive） | MIT 兼容 | 通过（transitive） |
| hono | npm (hana 依赖) | MIT | HTTP 框架 | MIT 兼容 | 通过 |
| music-metadata | npm (hana 依赖) | MIT | 音频元数据 | MIT 兼容 | 通过 |
| qrcode | npm (hana 依赖) | MIT/BSD-3-Clause | QR 登录 | 兼容 | 通过 |
| transitive npm/Rust dependency closure | npm + Rust | GPL-3.0-compatible allowlist（含 MIT/Apache/BSD/ISC/MPL/0BSD/Unlicense/CC0/MIT-0/BlueOak/CDLA-Permissive/Unicode/Apache LLVM exception/LGPL-or-later 等） | Tauri 迁移目标 workspace 与 Rust crates 的发布前全量 license 静态审计 | `npm run license-transitive:check` 当前通过，覆盖 782 packages；后续新增依赖必须重跑 | 通过（transitive check） |

## 通过标准

- 所有依赖都有明确 license。
- 所有 license 与 GPL-3.0 分发兼容。
- 所有 notices 可随安装包和源码分发。
- QQ provider 没有引入不兼容代码。
- 无 `待审核` 项后才能发布公开安装包。
