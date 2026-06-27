# Tauri Rewrite Design

更新时间：2026-06-27

## 设计目标

本设计把当前 Electron/Node/单体 HTML 项目迁移为新的 GPL-3.0 二开 Tauri 项目。迁移不是旧安装用户数据兼容项目，而是以当前 Electron 运行效果作为视觉和行为 baseline，重建一条新的 Tauri 主线。

最终发布标准：

- 原项目完整能力全部具备。
- 视觉结果与 Electron baseline 一模一样，包括像素效果、动画节奏和交互手感。
- 公开发布前通过 capability parity、deferred capabilities 和 license gate。

## 系统边界

```text
Tauri/Rust
  owns: windows, commands, login webviews, sidecar lifecycle, updater, app data paths

Bun API Sidecar
  owns: provider adapters, NeteaseCloudMusicApi, QQ provider, weather radio, audio proxy, cache, diagnostics

Vite React App
  owns: UI, Zustand stores, typed API clients, Tauri invoke wrapper, visual-engine host components

Shared Package
  owns: zod schemas, request/response contracts, domain types, persistence schemas

Visual Engine Package
  owns: Canvas/WebGL/GSAP imperative renderers, animation loops, visual parity adapters
```

## 目标目录

```text
Mineradio/
├─ apps/
│  ├─ desktop/
│  │  └─ src-tauri/
│  └─ web/
├─ packages/
│  ├─ shared/
│  └─ visual-engine/
├─ sidecars/
│  └─ api/
├─ docs/
│  └─ migration/
├─ public/              # Electron baseline reference during migration
├─ desktop/             # Electron baseline reference during migration
└─ server.js            # Electron/Node baseline reference during migration
```

旧代码先保留在原位置，直到新主线具备可运行骨架和 baseline freeze 资产。不要提前搬入 `legacy/`，避免破坏对照基线。

## 数据流

### 启动

1. Tauri 启动主窗口。
2. Rust 分配本地随机端口和 app data 路径。
3. Rust 启动 Bun API sidecar，并传入端口、app data、日志目录和 schema version。
4. Rust 等待 sidecar `/health` 返回版本和 provider status。
5. React 通过 Tauri command 获取 runtime config。
6. React 初始化 Zustand stores、typed API client 和 visual-engine host。

### Provider 请求

1. React 调用 typed API client。
2. API client 使用 shared zod schema 校验 request。
3. Bun sidecar gateway 分发给 provider adapter。
4. Provider adapter 调用 NeteaseCloudMusicApi、QQ provider 或其它本地服务。
5. Sidecar service 层处理换源、统一错误、诊断日志。
6. Response 通过 shared zod schema 校验后返回 React。

### 播放

1. React store 维护播放队列和当前 track。
2. React 请求 sidecar 解析 playable URL。
3. Sidecar 可返回直接 URL、本地音频代理 URL、换源候选或统一错误。
4. WebView2 内 HTML audio 承担真实播放。
5. 播放进度、状态和音频事件更新 Zustand。
6. Zustand 状态快照推给 visual-engine。

### 桌面能力

React 不直接访问系统能力。窗口、登录、桌面歌词、壁纸窗口、全局热键、updater 统一通过 Tauri invoke wrapper 调 Rust commands。

## 平台约束

- Bun workspace 使用根 `package.json` 的 `workspaces` 字段和根 `bun.lock`。
- Bun workspace 脚本可用 `--filter` 选择 package，但具体脚本名必须在对应 workspace package 中声明。
- Tauri sidecar 必须作为 external binary 打包，并在 Tauri capabilities 中授予执行/启动权限。
- Tauri updater 支持动态 update server 或静态 JSON。新项目可以先用静态 JSON 做本地验证，再决定正式发布服务形态。

## 模块设计

### `apps/desktop`

职责：

- Tauri app 配置。
- Rust commands。
- Sidecar spawn/monitor/restart。
- Window labels：main、desktop lyrics、wallpaper、login provider windows。
- App data path、log path、runtime config。
- Tauri updater。

不负责：

- 音乐 provider 业务。
- 搜索、歌词、歌单解析。
- 每帧视觉逻辑。

### `apps/web`

职责：

- React UI。
- Zustand stores。
- Typed sidecar client。
- Tauri invoke wrapper。
- Visual engine host components。
- Playwright UI routes and test hooks。

不负责：

- Provider 协议差异。
- Cookie 文件持久化。
- Cross-provider fallback。
- 每帧 Canvas/WebGL 内部状态。

### `sidecars/api`

职责：

- Bun HTTP API。
- Provider gateway。
- Netease adapter。
- QQ adapter。
- Weather radio service。
- Audio proxy。
- Beatmap/DJ cache。
- Rolling logs and safe diagnostics。

API 必须：

- 使用统一 success/error envelope。
- 暴露 `/health`。
- 支持随机端口。
- 不要求前端知道 provider 内部实现。

### `packages/shared`

职责：

- `Track`、`Playlist`、`Lyric`、`ProviderStatus`、`PlaybackError`、`UpdateState` 等类型。
- zod schemas。
- API contract。
- Persistence schemas。
- Capability matrix 类型。

约束：

- 不能依赖 React。
- 不能依赖 Tauri。
- 不能依赖 Bun/Node-only API。

### `packages/visual-engine`

职责：

- 启动动画。
- 主粒子场。
- 歌词舞台。
- 3D 歌单架。
- GSAP timeline 适配。
- Canvas/WebGL lifecycle。

公共接口建议：

- `createVisualEngine(container, options)`
- `engine.update(snapshot)`
- `engine.resize(size)`
- `engine.setPreset(preset)`
- `engine.dispose()`

React 只负责容器和 snapshot；视觉引擎内部管理 renderer、animation frame、GSAP timeline 和 WebGL resources。

## 状态设计

Zustand store 分域：

- `playbackStore`：queue、currentTrack、audio state、progress、quality、mode。
- `providerStore`：provider status、accounts、playlists、likes、capabilities。
- `visualStore`：preset、colors、lyrics layout、performance、archives。
- `shelfStore`：3D shelf mode、selected item、detail state、scroll state。
- `uiStore`：modals、toasts、panels、guides、fullscreen。
- `updateStore`：updater status、download state、errors。

持久化：

- 新二开项目使用新 app id 和新数据目录。
- 不自动读取旧 Electron 用户数据。
- 新 Tauri 项目内部 persistence 必须用 zod normalize，防止后续 schema 漂移。

## Provider 设计

核心接口：

- `search`
- `songUrl`
- `lyric`
- `playlistList`
- `playlistDetail`
- `loginStatus`
- `logout`

统一 `Track` 必须包含：

- `provider`
- `id`
- `sourceId`
- `title`
- `artists`
- `album`
- `coverUrl`
- `durationMs`
- `qualityHints`
- `playableState`

QQ provider 可研究开源项目，但直接集成代码前必须通过 license gate。第一版优先一个 Bun API sidecar 内部多个 provider adapter；只有 QQ 复杂度影响稳定性时才拆独立 sidecar。

## Visual Parity 设计

迁移开始前冻结 Electron baseline：

- baseline tag 或 branch。
- 默认视觉存档。
- 固定窗口尺寸。
- 测试歌曲、封面、歌词。
- 主界面、播放中、视觉控制台、3D 歌单架、桌面歌词截图。
- 启动动画、控制台交互、3D 歌单架、桌面歌词录屏。

验收口径：

- DOM/CSS 内部可不同。
- 最终可见像素、动画节奏、交互手感必须一致。
- 不能用旧 `public/index.html` iframe/webview 套壳作为最终方案。

## 更新与发布设计

- 新 Tauri 主线使用 Tauri updater。
- 不迁移旧 Electron patch JSON 系统。
- 新项目使用新 app id、新数据目录、新 updater 通道、新仓库。
- 首个公开安装包必须先通过 capability parity 和 license gate。

## 参考约束来源

- Bun workspaces: https://bun.com/docs/pm/workspaces
- Bun filter scripts: https://bun.com/docs/pm/filter
- Tauri sidecar: https://v2.tauri.app/develop/sidecar/
- Tauri updater: https://v2.tauri.app/plugin/updater/

## License 设计

- 继续 GPL-3.0。
- 保留原作者、原项目声明、修改说明和 fork 来源。
- 公开分发建议新名称、新 logo、新 app id。
- 新增依赖必须在 allowlist 内。
- QQ 开源项目必须完成审核表。
- GSAP 不引入会员/闭源插件。

## 非目标

- 不做旧 Electron 安装用户数据自动迁移。
- 不保留旧 Electron updater 或 patch JSON。
- 不 Rust 重写 NeteaseCloudMusicApi。
- 不以旧 HTML 套壳作为最终方案。
- 不公开分发 GPL-incompatible 代码。
