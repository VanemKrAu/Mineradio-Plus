# Mineradio Tauri 2 迁移前置设计

更新时间：2026-06-27

## 目标技术栈

- 桌面壳：Tauri 2 + Rust + WebView2。
- 包管理：Bun workspace + `bun.lock`。
- 前端：Vite + TypeScript + React + Zustand。
- 本地服务：Bun sidecar runtime。
- 音乐接口：NeteaseCloudMusicApi。
- 视觉：Canvas / WebGL / GSAP Visual Engine。
- 契约：shared types + zod。
- 更新：Tauri updater。

## 本阶段边界

本阶段只做迁移设计、现状盘点、PRD 和 release gates，不创建 workspace，不改启动脚本，不迁移业务代码，不替换 Electron。

允许新增：

- `docs/migration/MIGRATION_INVENTORY.md`
- `docs/migration/MIGRATION_TAURI_PLAN.md`
- `docs/migration/PRD_TAURI_REWRITE.md`
- `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`
- `docs/migration/DEFERRED_CAPABILITIES.md`
- `docs/migration/LICENSE_GATE.md`

不允许新增：

- `apps/`
- `packages/`
- `src-tauri/`
- `bun.lock`
- `vite.config.ts`
- React 或 Rust 代码骨架

## 推荐目标目录

后续进入 B/C 阶段时，建议采用：

```text
Mineradio/
├─ apps/
│  ├─ desktop/          # Tauri 2 Rust app，拥有 src-tauri
│  └─ web/              # Vite + React + TypeScript 前端
├─ packages/
│  ├─ shared/           # shared types + zod schemas
│  └─ visual-engine/    # Canvas/WebGL/GSAP imperative engine
├─ sidecars/
│  └─ api/              # Bun runtime，本地音乐/天气/代理服务
├─ legacy/
│  └─ electron/         # 可选，仅用于保留旧 Electron 参考代码
├─ public/
├─ desktop/
├─ server.js
└─ package.json
```

迁移期不建议马上把现有文件移动到 `legacy/`。先让新栈并行跑起来，再逐步减少旧入口。Electron 是视觉和行为参考基线，不是 Tauri 运行时兼容对象。

## 架构分层

### Tauri Rust 层

负责系统能力：

- 主窗口生命周期。
- 单实例。
- 窗口控制：最小化、最大化、全屏、退出全屏、关闭。
- 全局快捷键。
- 文件导入导出。
- 打开外部链接和本地安装包。
- 桌面歌词窗口和壁纸窗口。
- WebView2/Windows 特定窗口能力。
- 启动、监控、关闭 Bun sidecar。
- Tauri updater。

Rust 层不负责音乐业务规则，不直接调用 NeteaseCloudMusicApi。

### Bun sidecar 层

负责本地服务：

- NeteaseCloudMusicApi 适配。
- QQ 音乐 provider 适配。
- 天气电台和 mood 规则。
- 音频代理。
- beatmap / DJ 分析缓存。
- 本地 API 或 RPC 服务。

Bun sidecar 应只暴露 typed API。所有输入输出都通过 shared zod schema 验证。

### React 前端层

负责用户界面：

- 播放器控制台。
- 搜索、歌单、队列、歌词、登录、更新弹窗。
- 视觉控制台。
- 3D 歌单架 UI 控制。
- 桌面歌词配置 UI。

React 不直接塞满视觉算法。Canvas/WebGL/GSAP 通过 visual engine 封装提供生命周期方法。

### Visual Engine 层

负责 imperative 渲染：

- Canvas/WebGL 初始化、resize、render loop。
- Three.js/自研 shader/GSAP 动画。
- 歌词舞台和粒子舞台。
- 3D 歌单架。
- 启动页视觉。

React 只传入状态快照和事件回调，避免每帧 React setState。

### Shared 层

负责契约：

- API request/response schema。
- Provider 类型。
- Track、Playlist、Lyric、Account、Update、VisualPreset 类型。
- zod persistence schema，用于迁移 localStorage。

原则：shared 层不能依赖 React、Tauri、Bun 或 Node-only API。

## 通信模型

建议采用两条通道：

- UI 到系统能力：React 调 Tauri `invoke`。
- UI 到音乐服务：React 调本地 Bun sidecar HTTP API，或通过 Rust 转发。第一阶段推荐 HTTP API，便于复用现有 `server.js` 语义和单独调试。

Rust 启动 Bun sidecar 后，向前端注入 sidecar base URL 或通过 Tauri command 返回配置。不要在前端硬编码端口。

## Bun sidecar 运行方式

后续实现阶段需要确认两种选择：

1. 打包 sidecar 可执行文件。
   - 优点：用户机器不需要安装 Bun。
   - 缺点：构建链更复杂，需要处理 Windows 路径、签名、版本匹配。
2. 打包 JS/TS + 嵌入 Bun runtime。
   - 优点：开发体验接近当前 Node 服务。
   - 缺点：分发体积和 updater 策略要额外验证。

推荐先做开发期 sidecar，再做生产打包验证。

## Updater 策略

Tauri updater 负责正式更新：

- 不迁移旧轻量 patch JSON 作为主路径。
- 更新 manifest、签名、公钥、下载地址按 Tauri updater 约束设计。
- 旧 GitHub Release 检测代码可以作为 UI 文案和镜像策略参考，但不要照搬补丁应用逻辑。
- 新二开项目使用新的 app id、数据目录、仓库和 updater 通道。

需要单独确认：

- 是否继续使用 GitHub Release 托管 Tauri 更新资产。
- 是否需要国内镜像。
- Windows 安装器格式。
- 新二开项目数据目录策略；不承诺读取旧安装用户数据。

## 状态迁移策略

### Zustand store 分域

- `playbackStore`：播放队列、当前曲、播放状态、进度、音量、音质。
- `providerStore`：网易云/QQ 登录状态、账号资料、歌单、喜欢状态。
- `visualStore`：视觉预设、颜色、歌词参数、性能档位、用户存档。
- `shelfStore`：3D 歌单架模式、选中项、详情页、滚动状态。
- `uiStore`：弹窗、toast、面板显隐、引导状态。
- `updateStore`：版本检测、下载进度、错误状态。

### localStorage

二开项目不做旧用户数据自动迁移。新 Tauri 项目内部的 localStorage/持久化数据必须由 zod 读取和归一化，保证后续版本稳定。

## 实施计划

### 长流程执行规则

当前文档已经足够说明迁移方向，但代码实施前必须再满足执行就绪条件。后续每个阶段都按“小步实施、独立验证、阶段复盘”的方式推进，避免一次性把 Electron、server、前端和视觉系统同时打散。

通用规则：

- 不在 `main` / `master` 上直接开始新栈实施，除非用户明确同意。
- 每个阶段开始前先确认工作区状态，避免覆盖用户未提交修改。
- 每个阶段只创建该阶段允许的目录和配置，不提前创建未来阶段目录。
- 每个任务必须能被单独 review，且有清晰的自动验证命令或手动验证证据。
- 涉及 baseline 行为时，先查 Electron 代码和冻结素材，再实现 Tauri 对应能力。
- 涉及新增依赖时，同步更新 `docs/migration/LICENSE_GATE.md` 的 Dependency Audit 表。
- 涉及延期、隐藏或移除能力时，同步更新 `docs/migration/DEFERRED_CAPABILITIES.md`。
- 涉及发布前必须完成的能力时，同步更新 `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`。

阶段停止条件：

- 发现当前阶段计划与 PRD 冲突。
- 发现需要用户确认的新产品决策、license 决策或发布策略。
- 自动验证命令连续失败且无法通过小范围修复解决。
- 实现需要越过当前阶段边界，例如 Phase 1 骨架任务要求迁移完整视觉系统。
- baseline 证据缺失，导致无法判断视觉或行为是否对齐。

### Baseline Freeze 规程

Phase 1 之前必须先完成 baseline freeze。建议把冻结产物放在仓库外或用户指定目录；如必须放入仓库，应只放轻量索引文档，避免把大型录屏直接提交。

建议记录：

- baseline commit hash、tag/branch 名称和采集日期。
- 操作系统、显示缩放、WebView/Chromium 环境、窗口尺寸。
- 测试歌曲、provider、封面、歌词类型和播放状态。
- 默认视觉存档、主界面截图、启动动画录屏、播放中录屏。
- 视觉控制台、3D 歌单架、桌面歌词、锁定/拖动/穿透操作录屏。
- baseline 最小命令：`git diff --check`、`node --check server.js`。

baseline 未冻结前，只允许做文档、盘点、license 调研和不会改变运行行为的准备工作。

### Subagent 任务切片原则

后续使用 subagent-driven development 时，不直接把整个迁移交给一个 agent。每个 subagent 任务应满足：

- 输入包含本任务完整目标、允许修改文件、禁止触碰文件、验收命令。
- 输出必须包含修改摘要、验证结果、风险和下一步建议。
- 一个任务只跨一个主要边界：Rust shell、sidecar、shared contract、React store、visual-engine 或 release gate。
- 同一时间不并行分派会写同一批文件的实现任务。
- 每个实现任务后先做 spec compliance review，再做 code quality review。

### 可执行阶段计划

#### Phase 0：设计和盘点

当前阶段。

产物：

- 现状盘点文档。
- 目标架构文档。
- 不改代码。

验收：

- 文档能说明每个旧职责迁到哪里。
- 文档不恢复旧硬编码记忆体系。
- PRD、能力对齐、延期能力、license gate 已写入 `docs/migration/`。
- Capability checklist 中 Execution Readiness Gate 已存在。
- 已明确 Phase 1 之前必须完成 baseline freeze。

推荐任务切片：

1. 审查 `docs/migration/` 是否覆盖职责归属、能力闸门、延期能力和 license gate。
2. 补齐执行规则、baseline freeze 规程和 subagent 任务切片原则。
3. 运行 `git diff --check` 和 `node --check server.js`，确认文档修改未破坏 Electron baseline 的最小语法检查。

#### Phase 1：并行骨架

后续阶段。

目标：

- 建立 Bun workspace。
- 建立 Vite React app。
- 建立 Tauri 2 app。
- 建立 shared types + zod 包。
- 建立 Bun sidecar dev server。

验收：

- Electron baseline 仍可用于视觉和行为对照。
- 新 Tauri dev shell 能打开空页面。
- sidecar health check 可用。

进入条件：

- Baseline Freeze 全部完成或用户明确批准带缺口进入。
- 用户批准创建 `apps/`、`packages/`、`sidecars/`、`src-tauri/` 和 `bun.lock`。
- License gate 已新增 Phase 1 依赖审计项。

推荐任务切片：

1. 创建 Bun workspace 根配置，只加入 workspace 结构和基础脚本。
2. 创建 `packages/shared`，定义 health/version/error envelope 的 zod schema 和类型导出。
3. 创建 `sidecars/api`，实现开发期 Bun HTTP server 和 `/health`。
4. 创建 `apps/web`，实现 Vite React 空壳和读取 sidecar base URL 的配置层。
5. 创建 `apps/desktop` Tauri 2 空壳，启动 WebView2 窗口并加载 web app。
6. 增加 Rust 启动 sidecar 的开发期路径和随机端口协商。
7. 增加 Phase 1 验证命令并更新 capability checklist。

#### Phase 2：API 契约先行

目标：

- 从 `server.js` 抽取 API contract。
- 建立 zod schemas。
- Bun sidecar 先实现 health、search、song-url、lyric、login-status 的最小闭环。

验收：

- React demo 能搜索并拿到 typed 结果。
- 契约测试覆盖成功/失败响应。

推荐任务切片：

1. 从 `server.js` 盘点 search、song-url、lyric、login-status 的输入输出。
2. 在 `packages/shared` 定义 provider、track、lyric、account、success/error envelope schema。
3. 在 `sidecars/api` 建立 provider adapter 接口和 Netease adapter 最小实现。
4. 增加统一错误结构和 retryable/action 字段。
5. 增加 contract tests 和 sidecar provider tests。
6. 在 React demo 中只接 typed API，不写 provider 分支逻辑。

#### Phase 3：React UI 骨架

目标：

- 播放器 shell、搜索、队列、播放控制、登录状态。
- Zustand stores 成型。
- 先接 HTML audio，不迁完整视觉。

验收：

- 新前端可完成搜索、播放、暂停、下一首、歌词获取。

推荐任务切片：

1. 建立 Zustand store 分域和 zod persistence normalization。
2. 搭建播放器 shell、搜索结果、队列和播放控制。
3. 接入 HTML audio 的播放、暂停、seek、ended 和进度更新。
4. 接入歌词获取和基础同步，不迁移最终视觉舞台。
5. 接入 provider 登录状态展示和手动 cookie fallback 入口。
6. 增加 store tests、基础 UI flow tests 和真实 WebView2 播放手测记录。

#### Phase 4：视觉引擎隔离迁移

目标：

- 把现有 Canvas/WebGL/GSAP 迁入 `packages/visual-engine`。
- React 只管理容器和参数。
- 逐个迁移启动页、主粒子、歌词舞台、3D 歌单架。

验收：

- 每个视觉模块有独立开关和性能检查。
- 不出现一帧白屏、闪烁、错位、严重掉帧。

推荐任务切片：

1. 为 `packages/visual-engine` 定义 lifecycle API：mount、update、resize、dispose。
2. 先迁启动页视觉，建立非空 canvas 和截图验证。
3. 迁主粒子/封面视觉，保持 React 只传状态快照。
4. 迁歌词舞台动画，按 baseline 比对层级、遮挡和 timing。
5. 迁视觉控制台 SVG 玻璃质感，必须参考 `docs/GLASS_SVG_TEXTURE.md`。
6. 迁 3D 歌单架，保留滚动、hover、详情页和选择音手感。
7. 建立 Playwright 截图、canvas nonblank 检查和人工录屏比对清单。

#### Phase 5：桌面能力迁移

目标：

- 桌面歌词窗口。
- 全局快捷键。
- 文件导入导出。
- 登录弹窗。
- 壁纸窗口。

验收：

- Windows WebView2 下行为与 Electron 版本对齐。

推荐任务切片：

1. 迁主窗口控制、单实例、外链打开和文件导入导出。
2. 迁全局快捷键注册、冲突提示和触发事件。
3. 迁登录 webview/window，cookie 交给 sidecar 持久化。
4. 迁桌面歌词窗口、置顶、拖动、中键锁定和鼠标穿透。
5. 评估壁纸窗口和 WorkerW 风险，必要时更新 deferred capabilities。
6. 增加 Windows 手动验证记录和 Tauri command wrapper tests。

#### Phase 6：Tauri updater 和发布

目标：

- Tauri updater manifest。
- Windows bundle。
- 更新签名和安装验证。
- 新二开项目 app id、数据目录和发布说明。

验收：

- 全量安装包可安装、启动、更新。
- 新 app id 和数据目录不读取旧 Mineradio 用户目录。
- License gate 全部通过。

推荐任务切片：

1. 配置新 app id、产品名、数据目录和 bundle 标识。
2. 配置 Tauri updater manifest、签名、公钥和低版本升级验证。
3. 生成 Windows 安装包并验证安装、启动、卸载。
4. 完成第三方 notices、dependency audit 和 QQ provider license 审核。
5. 撰写二开发布说明，明确 GPL-3.0、fork 来源和非官方身份。
6. 按 capability checklist 全量回归，不允许未决 gate 进入公开发布。

## 主要风险

- WebView2 与 Chromium/Electron 的 WebGL、音频 autoplay、后台节流行为不同。
- Electron preload API 不能直接迁移，必须改成 Tauri invoke wrapper。
- Bun sidecar 的生产打包、签名、启动路径和端口协商需要验证。
- Tauri updater 与旧 GitHub latest/patch 机制不同，不做强行兼容。
- `public/index.html` 太大，直接 React 重写风险高，必须按领域切片。
- 桌面歌词鼠标穿透、WorkerW 壁纸、全局热键都是 Windows 特定高风险点。
- GPL-3.0 二开分发要求必须在依赖、QQ provider 参考项目、品牌和 notices 上提前过 gate。

## 前置决策

- 保留 Electron 作为视觉和行为参考基线。
- 新栈先并行，不替换旧入口。
- Bun sidecar 保留 NeteaseCloudMusicApi，不在第一阶段改音乐源。
- shared zod contract 先于 React 大迁移。
- 视觉引擎先隔离再重构，不在 React 组件里重写每帧逻辑。
- Tauri updater 替代旧 patch 系统，旧 patch 系统不进入 Tauri 主线。
- Tauri 最终对外发布必须达到原项目完整能力，视觉结果必须与 Electron baseline 一模一样。
- 二开项目继续 GPL-3.0，公开分发前必须通过 `docs/migration/LICENSE_GATE.md`。

## 参考资料

- Tauri 2 sidecar 文档：https://v2.tauri.app/develop/sidecar/
- Tauri updater 文档：https://v2.tauri.app/plugin/updater/
- Bun workspaces 文档：https://bun.com/docs/install/workspaces
- Vite React 文档：https://vite.dev/guide/
- Zustand TypeScript 文档：https://zustand.docs.pmnd.rs/guides/typescript
- zod 文档：https://zod.dev/
