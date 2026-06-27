# License Gate

更新时间：2026-06-27

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

## License Allowlist

允许：

- GPL-3.0-compatible
- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- ISC
- MPL-2.0

禁止：

- 无 license
- 自定义不可分发 license
- 闭源二进制依赖且无明确再分发授权
- GPL-3.0 incompatible license
- 未确认授权的商业插件或会员插件

## Release Checklist

- [ ] 新项目根 license 为 GPL-3.0。
- [ ] README 明确二开/fork 来源和修改状态。
- [ ] NOTICE 或 THIRD_PARTY_NOTICES 列出所有第三方依赖。
- [ ] Tauri/Rust crates license 已检查。
- [ ] Bun/npm dependencies license 已检查。
- [ ] NeteaseCloudMusicApi license 已记录。
- [ ] Three.js license 已记录。
- [ ] GSAP 使用范围已确认不含会员/闭源插件。
- [ ] QQ provider 参考项目 license 审核完成。
- [ ] 打包产物包含必要 license/notice 文件。
- [ ] Release notes 不暗示本项目是网易云、QQ 音乐或原 Mineradio 官方版本。

## QQ 开源项目审核表

| Project | URL | License | Active | Usage | Copy Code? | Risk | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 待补充 | 待补充 | 待补充 | 待补充 | 协议参考 / 依赖 / 代码移植 | 待补充 | 待补充 | 待补充 |

## Dependency Audit 表

| Dependency | Ecosystem | License | Purpose | Distribution Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Tauri 2 | Rust | 待审核 | 桌面壳 | 待审核 | 待审核 |
| Bun | Runtime | 待审核 | sidecar runtime/workspace | 待审核 | 待审核 |
| Vite | npm | 待审核 | 前端构建 | 待审核 | 待审核 |
| React | npm | 待审核 | UI | 待审核 | 待审核 |
| Zustand | npm | 待审核 | 状态管理 | 待审核 | 待审核 |
| zod | npm | 待审核 | schema validation | 待审核 | 待审核 |
| NeteaseCloudMusicApi | npm | 待审核 | 网易云 provider | 待审核 | 待审核 |
| Three.js | npm/vendor | 待审核 | 3D/WebGL | 待审核 | 待审核 |
| GSAP | npm/vendor | 待审核 | animation | 标准功能可用性待确认 | 待审核 |

## 通过标准

- 所有依赖都有明确 license。
- 所有 license 与 GPL-3.0 分发兼容。
- 所有 notices 可随安装包和源码分发。
- QQ provider 没有引入不兼容代码。
- 无 `待审核` 项后才能发布公开安装包。
