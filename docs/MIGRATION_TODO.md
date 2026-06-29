# Mineradio Module Migration Todo

更新时间：2026-06-30

本文是 Mineradio Electron baseline 到 Tauri 2 主线的模块级迁移 Todo。它只用于后续拆 issue、排期、审查和验收；本文档编写阶段的当前执行者不执行源码迁移。后续 agent 如果收到用户明确的“开始执行迁移”授权，应以新的执行任务约束为准。

## Execution Status / Phase Ledger

当前用户授权已覆盖本文原始“文档编写者不执行迁移”的一次性范围限制，但源码迁移仍必须以 `docs/migration/EXECUTION_PROTOCOL.md` 和 `docs/migration/plans/11-final-baseline-parity.md` 为准。

当前 Phase 0 reconciliation 写入范围包括本 ledger 以及 `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`、`docs/migration/IMPLEMENTATION_PLAN_TAURI_REWRITE.md`、`docs/migration/plans/08-visual-engine-parity.md`、`docs/migration/plans/10-updater-release-license.md`、`docs/migration/plans/11-final-baseline-parity.md`、`docs/migration/baseline/BASELINE_CAPTURE.md`。这不代表 Phase 1+ 源码迁移已开始。

| Phase | Status | Date | Scope | Notes |
| --- | --- | --- | --- | --- |
| Phase 0: Reconcile Plans And Evidence | Completed | 2026-06-30 | Docs-only; no source migration | 对齐 checklist、master plan、08/10 historical plans、baseline capture 和本 ledger；未从 code-only evidence 勾选 capability gate。 |
| Phase 1: Startup Shell And Empty Home Parity | Completed | 2026-06-30 | Code-side/current execution complete; this status update is docs-only | 当前实现已覆盖 Step 1-7，`bun test apps/web`、`bun run --filter ./apps/web build`、`git diff --check` 通过；截图/录屏不作为当前阶段推进阻塞，但仍保留为 release/parity evidence。 |
| Phase 2: Search, Queue, Playback, Lyrics, And Provider Runtime Parity | Completed | 2026-06-30 | Code-side/current execution complete; tests + docs | 现有实现与本轮回归测试覆盖 Step 1-7；`bun test packages/shared`、shared typecheck、`bun test sidecars/api`、sidecar typecheck、`bun test apps/web`、web build、`git diff --check` 通过；真实账号态、截图/录屏等外部 evidence 不作为当前阶段推进阻塞，仍由 release/parity gate 跟踪。 |
| Phase 3: Visual Engine Full Parity | Completed | 2026-06-30 | Code-side/current execution complete; tests + docs | 现有实现与本轮 HomeVisual cover URL 修复覆盖 Step 1-8；`data:image/*` 与 `blob:` 封面不再被清空，`file://` 等不支持 scheme 仍拒绝并清空。`bun test packages/visual-engine`、visual-engine typecheck、`bun test apps/web`、web build、`git diff --check` 通过；WebView2/Electron 视觉录屏和截图仍作为最终 release/parity evidence 跟踪。 |
| Phase 4: Tauri Runtime, Sidecar Lifecycle, Login, Desktop Lyrics, And Windows Parity | Completed | 2026-06-30 | Code-side/current execution complete; tests + docs | 现有实现与本轮 closeout 覆盖 Step 1-7：登录 popup provider 域过滤/外部打开/拒绝策略、diagnostics `logPointers.sidecarRuntimeLog` 与 token-like 脱敏、sidecar child lifecycle/restart/shutdown 测试均已补齐；`bun test sidecars/api`、`bun test apps/web`、`DYLD_LIBRARY_PATH=/tmp/mineradio-cargo-libs cargo test`、`git diff --check` 通过。Windows/WebView2 运行、真实登录/登出/session injection、桌面歌词和 sidecar runtime evidence 仍作为最终 release/parity evidence 跟踪。 |
| Phase 5: Updater, Installer, License, Notices, And Release Identity | Next | 待执行 | Plan 11 Phase 5 | 继续执行 updater、installer、license、notices 和 release identity 收口；真实 release manifest/upload、install/uninstall、packaged notices evidence 仍作为最终 release/parity evidence 跟踪。 |

Large screenshots/recordings must stay outside git. Commit only small documentation or metadata that records artifact paths and evidence status.

## 1. Scope

以下是创建 `docs/MIGRATION_TODO.md` 这个审计文档时保留的原始范围快照。它只解释本文档最初为何没有改源码；不限制 2026-06-30 Phase 0 reconciliation 对其它迁移文档做对齐更新。

原始文档编写阶段的执行者约束：

- 下面的允许/禁止列表只约束创建或更新本审计文档的当前 Codex 执行者。
- 这不是项目长期全局规则，也不限制后续获得明确迁移授权的 agent。

原始文档编写允许的唯一文件变更：

- `docs/MIGRATION_TODO.md`

原始文档编写禁止当前执行者：

- 修改、移动、删除或重构 `public/`、`desktop/`、`server.js`、`dj-analyzer.js`、`apps/`、`packages/`、`sidecars/`、`build/`、`package.json`、锁文件、资源文件或构建脚本。
- 直接迁移代码。
- 删除旧 Electron baseline。
- 用占位 UI 替代 WebGL、Canvas、Three.js、shader、粒子、歌词、3D 歌单架、DIY 视觉控制台或桌面歌词。

初始 `git status --short`：

```text
?? TEAM_KICKOFF.md
```

原始文档写入并验证后的 `git status --short`：

```text
?? TEAM_KICKOFF.md
?? docs/MIGRATION_TODO.md
```

说明：

- `TEAM_KICKOFF.md` 是本次文档编写开始前已存在的未跟踪文件，必须保持不动。
- 本文档把 `public/`、`desktop/`、`server.js`、`dj-analyzer.js` 视为 legacy Electron baseline，把 `apps/`、`packages/`、`sidecars/`、`apps/desktop/src-tauri` 视为已部分落地的 Tauri rewrite 模块。
- 视觉零退化高于迁移速度、代码整洁和技术栈纯度。这里的 baseline 指只通过阅读旧代码确认的实现基线；高风险视觉模块没有代码 baseline、fallback、截图/录屏/性能等视觉一致性证据时，不允许进入迁移执行。

已扫描的主要证据：

- 项目规则和记忆：`AGENTS.md`、`AI_HANDOFF.md`、`docs/PROJECT_MEMORY.md`。
- 迁移文档：`docs/migration/MIGRATION_INVENTORY.md`、`docs/migration/IMPLEMENTATION_PLAN_TAURI_REWRITE.md`、`docs/migration/DESIGN_TAURI_REWRITE.md`、`docs/migration/DECISIONS.md`、`docs/migration/BASELINE_FREEZE_RECORD.md`、`docs/migration/LICENSE_GATE.md`、`docs/migration/plans/11-final-baseline-parity.md`。
- Legacy baseline：`public/index.html`、`server.js`、`desktop/main.js`、`desktop/preload.js`、`desktop/overlay-preload.js`、`dj-analyzer.js`、`build/installer.nsh`、`build/after-pack.js`。
- 已部分实现的新栈：`package.json`、`apps/desktop/src-tauri/`、`apps/web/src/`、`sidecars/api/src/`、`packages/shared/src/`、`packages/visual-engine/src/`。

## 2. Current Architecture Summary

当前仓库不是空白 Electron 老项目，而是双轨状态：

- Legacy Electron baseline 仍完整保留，用作视觉和行为规格来源。核心文件包括 `public/index.html`、`server.js`、`desktop/main.js`、`desktop/preload.js`、`desktop/overlay-preload.js`、`dj-analyzer.js`、`build/installer.nsh`。
- Tauri rewrite 已经部分落地。根 `package.json:1-35` 定义 Bun workspace、`tauri:dev`、`tauri:build`、sidecar 和 policy checks；`apps/desktop/src-tauri/tauri.conf.json:3-10` 定义 Tauri product、app id、Web build 命令；`apps/web/src/` 已有 React/Zustand hosts；`sidecars/api/src/` 已有 Bun API sidecar；`packages/shared/src/index.ts:1-15` 已导出 schema/type；`packages/visual-engine/src/index.ts:20-456` 已导出 splash、control glass、audio、runtime、home visual、particles、stage lyrics 和 shelf 模块。

当前主要入口和运行方式：

- Legacy Electron 入口：`desktop/main.js:1-57` 负责 Electron imports、主窗口状态、单实例和 Chromium GPU/perf switches；`server.js:3243` 创建 Node local server；`public/index.html:1846-26621` 承载主要 UI、状态、Canvas/WebGL、播放器和视觉系统。
- Tauri 入口：`apps/desktop/src-tauri/src/lib.rs:237-373` 创建 Tauri app、注册 plugins、启动 sidecar、注册 commands、关闭时清理 sidecar 和桌面歌词 poller。
- Tauri 配置：`apps/desktop/src-tauri/tauri.conf.json:31-79` 配置 NSIS、sidecar external binary、bundle resources 和 updater endpoint/pubkey。
- Bun sidecar：`sidecars/api/src/server.ts:94-627` 暴露 `/health`、provider capabilities、proxy、weather、discover、podcast、search、song-url 和 provider routes。
- React app：`apps/web/src/app/App.tsx`、`apps/web/src/components/*`、`apps/web/src/stores/*`、`apps/web/src/visual/*` 已承担部分 UI/state/visual host。

当前包管理器和构建方式：

- 新主线：Bun workspace，根脚本见 `package.json:8-35`。
- Legacy 发布：历史 Electron/electron-builder/NSIS 流程仍可从 baseline 证据追溯，`build/installer.nsh:40-84` 维护安装根标记和自定义页面，`build/after-pack.js:43-66` 做 rcedit 图标和版本资源注入。
- 新发布方向：Tauri updater 替代旧 Electron `latest.yml`/blockmap/patch 主线；`docs/migration/DECISIONS.md:15-24` 锁定新 app id、GitHub Release updater、NSIS 策略和“不迁旧 patch JSON”。

当前明显历史包袱：

- `public/index.html` 是巨大单体，混合 DOM、CSS、全局状态、localStorage、Three.js/WebGL、GSAP、播放、搜索、歌词、3D 歌单架、DIY 控制台、更新弹窗、登录、toast/modal。
- `server.js` 混合静态资源、Netease、QQ、天气、podcast、更新下载、patch、缓存、代理、cookie。
- `desktop/main.js` 混合窗口、IPC、登录窗口、cookie/session、桌面歌词、壁纸、全局热键、安装包打开、重启。
- 当前 Tauri rewrite 已有大量模块，但仍需按 `docs/migration/plans/11-final-baseline-parity.md:11-20` 做最终 WebView2、视觉、账号、安装器、release evidence 收口。

## 3. Confirmed Module Inventory

### Module: Legacy App Shell / Desktop Window UI
- Current location:
  - `public/index.html`
  - `#desktop-window-shell`, `#desktop-titlebar`, `.desktop-window-btn`, `#fullscreen-diy-zone`
- Evidence:
  - `public/index.html:1846-1880`, `public/index.html:26407`
- Current responsibility:
  - 自定义标题栏、窗口按钮、DIY 入口、桌面 shell class、WebView/Electron renderer UI 壳。
- Current runtime:
  - Electron renderer / Browser
- Public interface:
  - DOM selectors, `data-window-action`, `window.desktopWindow.*`, body/html class。
- Internal dependencies:
  - `updateDesktopRuntimeState`, `initDesktopWindowShell`, DOM event listeners, global UI state。
- External dependencies:
  - Electron preload `window.desktopWindow`, DOM/Web APIs。
- Side effects:
  - File system: No
  - Network: No
  - Cookie/session: No
  - LocalStorage: Low
  - Native window: Yes
  - Global state mutation: Yes
- Visual criticality:
  - Medium
- Migration decision:
  - Extract / Wrap first, then React host parity.
- Target location:
  - `apps/web/src/app/App.tsx`, `apps/web/src/components/shell/*`, `apps/web/src/tauri/runtime.ts`
- Target layer:
  - UI / State / Tauri Rust
- Target runtime:
  - WebView + Rust commands
- Difficulty:
  - Medium
- Priority:
  - P0
- Blocking dependencies:
  - Runtime config, window command schemas, visual shell z-index parity。
- Notes:
  - 不能恢复旧侧边栏闪烁和控制台按钮失效；窗口控制必须经统一 Tauri client，不让 React 直接散落 `invoke`。

### Module: Legacy Home / Weather / Discover UI
- Current location:
  - `public/index.html`
  - `#empty-home`, `.home-card`, `renderHomeTiles`, `loadHomeDiscover`, `buildHomeWeatherRadioUrl`
- Evidence:
  - `public/index.html:1931-1987`, `public/index.html:15489-15679`, `public/index.html:15648`, `public/index.html:15679-15845`
- Current responsibility:
  - 空场 Home、推荐卡片、天气电台入口、继续听、听歌画像、Home rail。
- Current runtime:
  - Electron renderer / Browser
- Public interface:
  - DOM selectors, `/api/discover/home`, `/api/weather/radio`, `/api/weather/ip-location`, `HOME_LISTEN_STATS_KEY`, `HOME_WEATHER_CITY_KEY`。
- Internal dependencies:
  - `homeDiscoverState`, `homeWeatherRadioState`, playback queue, account state。
- External dependencies:
  - Local API, localStorage, DOM, GSAP/CSS animations。
- Side effects:
  - File system: No
  - Network: Yes
  - Cookie/session: Indirect
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - Medium
- Migration decision:
  - Extract state and UI; keep baseline DOM/layout until screenshots prove parity.
- Target location:
  - `apps/web/src/home/EmptyHomeHost.tsx`, `apps/web/src/stores/ui-store.ts`, `apps/web/src/api/sidecar-client.ts`
- Target layer:
  - UI / State / Bun Sidecar
- Target runtime:
  - WebView + Bun
- Difficulty:
  - Medium
- Priority:
  - P1
- Blocking dependencies:
  - Discover/weather sidecar parity, playback queue store。
- Notes:
  - Home 不能只做静态占位，必须保留搜索、歌单、推荐和播放器控制台联动。

### Module: Legacy Search / Results / Provider Search UI
- Current location:
  - `public/index.html`
  - `#search-area`, `#search-input`, `#search-mode-tabs`, `renderSongSearchResults`, `performSearch`
- Evidence:
  - `public/index.html:1903-1916`, `public/index.html:17219-17666`, `public/index.html:17650-17659`
- Current responsibility:
  - 搜索输入、历史、网易云/QQ/Podcast tabs、结果渲染、加入队列/收藏/喜欢入口。
- Current runtime:
  - Electron renderer / Browser
- Public interface:
  - DOM events, `/api/search`, `/api/qq/search`, `/api/podcast/search`, `SEARCH_HISTORY_STORE_KEY`。
- Internal dependencies:
  - login state, queue state, provider detection, search result normalization。
- External dependencies:
  - Local API, localStorage, DOM。
- Side effects:
  - File system: No
  - Network: Yes
  - Cookie/session: Indirect
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - Medium
- Migration decision:
  - Extract to React SearchShell with typed sidecar client.
- Target location:
  - `apps/web/src/components/shell/SearchShell.tsx`, `apps/web/src/components/search/*`, `apps/web/src/stores/search-store.ts`
- Target layer:
  - UI / State / Shared Types
- Target runtime:
  - WebView
- Difficulty:
  - Medium
- Priority:
  - P1
- Blocking dependencies:
  - Provider adapter contract, cross-source ranking, playback handoff。
- Notes:
  - 保留“优先原唱/官方版本”排序策略；不可只迁输入框。

### Module: Legacy Player / Queue / Playlist Panel
- Current location:
  - `public/index.html`
  - `#bottom-bar`, `#progress-bar`, `#controls`, `#playlist-panel`, `#queue-list`, `playTrack`, `renderQueuePanel`, `loadPlaylistIntoQueueById`
- Evidence:
  - `public/index.html:2265-2302`, `public/index.html:2399-2415`, `public/index.html:17728`, `public/index.html:18472-18510`, `public/index.html:19357-19849`
- Current responsibility:
  - HTML audio、播放/暂停/上一首/下一首、进度、音量、队列、歌单、播客、歌单导入队列。
- Current runtime:
  - Electron renderer / Browser
- Public interface:
  - DOM events, audio element events, `/api/song/url`, `/api/qq/song/url`, `/api/audio`, `/api/playlist/*`, `/api/qq/playlist/tracks`, `/api/podcast/*`。
- Internal dependencies:
  - current song, queue, provider login, lyrics, beatmap prefetch, visual preset sync。
- External dependencies:
  - HTMLMediaElement, Local API, Web Audio, localStorage。
- Side effects:
  - File system: No
  - Network: Yes
  - Cookie/session: Indirect
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - Medium
- Migration decision:
  - Extract playback state and controller; React UI must preserve bottom console glass and interaction.
- Target location:
  - `apps/web/src/audio/player-controller.ts`, `apps/web/src/stores/playback-store.ts`, `apps/web/src/components/shell/BottomControlsHost.tsx`, `apps/web/src/components/shell/PlaylistPanelHost.tsx`
- Target layer:
  - UI / State / Core
- Target runtime:
  - WebView
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - sidecar `/song-url` and `/audio-proxy`, typed Track schema, visual timing input。
- Notes:
  - 播放控制曾多次失效，迁移必须实机验证播放/暂停、切歌、天气电台、队列同步。

### Module: Legacy Stage Lyrics / Custom Lyrics
- Current location:
  - `public/index.html`
  - `#stage-lyrics`, `updateStageLyrics3D`, `renderLyrics`, custom lyric stores
- Evidence:
  - `public/index.html:2319`, `public/index.html:7235-7249`, `public/index.html:8980`, `public/index.html:16678-16704`, `public/index.html:19025-19132`
- Current responsibility:
  - 3D 舞台歌词、逐词/逐行 timing、自定义歌词、歌词颜色/字体/布局、歌词与封面粒子/摄像机绑定。
- Current runtime:
  - Electron renderer / Browser / Three.js
- Public interface:
  - `CUSTOM_LYRIC_STORE_KEY`, `CUSTOM_LYRIC_PREF_STORE_KEY`, `/api/lyric`, `/api/qq/lyric`, visual engine state snapshot。
- Internal dependencies:
  - playback time, lyric payload, fx state, Three.js scene/camera/particles, shelf detail state。
- External dependencies:
  - Three.js, CanvasTexture, ShaderMaterial, localStorage。
- Side effects:
  - File system: No
  - Network: Yes
  - Cookie/session: Indirect
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - High
- Migration decision:
  - Extract / Wrap / Incremental Port only.
- Target location:
  - `packages/visual-engine/src/stage-lyrics/*`, `apps/web/src/components/lyrics/*`, `apps/web/src/stores/lyrics-store.ts`
- Target layer:
  - Visual Engine / UI / State / Shared Types
- Target runtime:
  - Browser-compatible WebView
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - lyric schema, playback progress, visual-engine host, visual parity recordings。
- Notes:
  - 不允许歌词透明度、层级、发光、粒子绑定、timing 同步退化。

### Module: Legacy WebGL / Particles / Movie Camera Visual Stage
- Current location:
  - `public/index.html`
  - `#canvas-container`, Three scene, renderer, shader materials, particle fields, camera/cinema loops
- Evidence:
  - `public/index.html:1880`, `public/index.html:3719-3782`, `public/index.html:6359-6395`, `public/index.html:6535-7141`, `public/index.html:26621`
- Current responsibility:
  - 主视觉舞台、封面粒子、Bloom、shader、骷髅预设、电影镜头、free camera、渲染循环、性能档位。
- Current runtime:
  - Electron renderer / Browser / WebGL
- Public interface:
  - `setPreset`, `syncFxUniforms`, render loop state, fx state, DOM canvas host。
- Internal dependencies:
  - Three.js, GSAP, audio analysis, cover texture, localStorage, pointer/resize/fullscreen。
- External dependencies:
  - `public/vendor/three.r128.min.js`, WebGL, GPU, Canvas, requestAnimationFrame。
- Side effects:
  - File system: No
  - Network: Yes for AI depth/model/cover assets
  - Cookie/session: No
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - High
- Migration decision:
  - Keep legacy behavior through visual-engine adapter; no rewrite until parity proof.
- Target location:
  - `packages/visual-engine/src/home-visual/*`, `packages/visual-engine/src/runtime/*`, `apps/web/src/visual/useVisualEngine.ts`
- Target layer:
  - Visual Engine / UI host
- Target runtime:
  - Browser-compatible WebView2
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - screenshot/recording/perf baseline, WebView2 GPU validation, audio/beat inputs。
- Notes:
  - 不能把 WebGL/shader/粒子改成普通 CSS 动画；WebView2 性能异常时保留旧 shader pipeline。

### Module: Legacy 3D Playlist Shelf
- Current location:
  - `public/index.html`
  - shelf controls, raycast, card sprites, detail panel, content list
- Evidence:
  - `public/index.html:2184-2219`, `public/index.html:13674-14802`, `public/index.html:14418-14421`, `packages/visual-engine/src/index.ts:320-456`
- Current responsibility:
  - 3D 歌单架侧栏/舞台/常驻、滚动、详情页、点击播放、播客/歌单数据合并、射线命中、选择音。
- Current runtime:
  - Electron renderer / Browser / Three.js
- Public interface:
  - `fx.shelf*` state, shelf DOM controls, queue/provider playlist data, pointer/wheel events。
- Internal dependencies:
  - Three.js scene/camera, playback queue, provider playlists, podcast collections, localStorage。
- External dependencies:
  - Three.js, CanvasTexture, WebGL, Web Audio select sound。
- Side effects:
  - File system: No
  - Network: Yes through playlist/podcast data
  - Cookie/session: Indirect
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - High
- Migration decision:
  - Extract/Wrap; only port internals after shelf interaction parity.
- Target location:
  - `packages/visual-engine/src/shelf/*`, `apps/web/src/stores/shelf-store.ts`, `apps/web/src/visual/shelf-*`
- Target layer:
  - Visual Engine / State / UI host
- Target runtime:
  - Browser-compatible WebView2
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - provider playlist data, pointer hit testing, visual parity recordings。
- Notes:
  - 不允许恢复强制切回星河、详情页遮挡、全量渲染、滚动卡手或手感退化。

### Module: Legacy DIY Visual Console / Presets / Cover Customization
- Current location:
  - `public/index.html`
  - `#fx-panel`, preset grid, user archive grid, color pickers, cover crop, `setPreset`
- Evidence:
  - `public/index.html:2006-2262`, `public/index.html:12670`, `public/index.html:20231-20258`, `public/index.html:21262-21312`
- Current responsibility:
  - 用户视觉参数、预设切换、自定义颜色/背景/封面、用户存档、性能档位、歌词/桌面歌词/歌单架设置。
- Current runtime:
  - Electron renderer / Browser
- Public interface:
  - `USER_FX_ARCHIVE_STORE_KEY`, `LYRIC_LAYOUT_STORE_KEY`, `CUSTOM_COVER_STORE_KEY`, `setPreset`, many `fx-*` DOM inputs。
- Internal dependencies:
  - visual uniforms, localStorage, cover canvas, user archive normalize/save, CSS glass filters。
- External dependencies:
  - DOM, Canvas, localStorage, GSAP。
- Side effects:
  - File system: No
  - Network: No
  - Cookie/session: No
  - LocalStorage: Yes
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - High
- Migration decision:
  - Extract persistence schema and React controls; preserve exact visual engine inputs.
- Target location:
  - `apps/web/src/visual/VisualControlPanelHost.tsx`, `apps/web/src/stores/visual-store.ts`, `packages/shared/src/persistence.ts`, `packages/visual-engine/src/control/*`
- Target layer:
  - UI / State / Schemas / Visual Engine
- Target runtime:
  - WebView / Browser-compatible
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - visual store schema, visual-engine interface, baseline golden defaults。
- Notes:
  - 用户认可的玻璃 SVG 质感是黄金版本；不能改成普通毛玻璃。

### Module: Legacy Renderer State / localStorage Persistence
- Current location:
  - `public/index.html`
  - global vars and store keys
- Evidence:
  - `public/index.html:2700-2779`, `public/index.html:3370`, `public/index.html:15154-15160`, `public/index.html:21817-21827`, `public/index.html:24523-24526`
- Current responsibility:
  - playback、queue、search、account、lyrics、visual、shelf、weather、preset、update、hotkey、layout 状态。
- Current runtime:
  - Electron renderer / Browser
- Public interface:
  - localStorage keys, global vars, DOM classes, event handlers。
- Internal dependencies:
  - almost all renderer modules。
- External dependencies:
  - localStorage, DOM, Web Audio, Electron preload。
- Side effects:
  - File system: No
  - Network: No
  - Cookie/session: Indirect
  - LocalStorage: Yes
  - Native window: Indirect
  - Global state mutation: Yes
- Visual criticality:
  - High for visual state, Medium for UI state
- Migration decision:
  - Extract to Zustand + zod persistence schemas.
- Target location:
  - `apps/web/src/stores/*`, `packages/shared/src/persistence.ts`
- Target layer:
  - State / Schemas / Shared Types
- Target runtime:
  - WebView
- Difficulty:
  - High
- Priority:
  - P0
- Blocking dependencies:
  - schema-first persistence, visual fallback, no duplicate DTO。
- Notes:
  - 新 Tauri 项目不自动读取旧 Electron 用户数据，除非用户另行拍板。

### Module: Legacy Local API Server
- Current location:
  - `server.js`
  - `http.createServer`, `/api/*` routes
- Evidence:
  - `server.js:47-65`, `server.js:3243-4163`
- Current responsibility:
  - 本地 HTTP API、静态资源、音乐源、登录、天气、podcast、更新、缓存、audio/cover proxy。
- Current runtime:
  - Node local server
- Public interface:
  - `/api/app/version`, `/api/update/*`, `/api/search`, `/api/qq/*`, `/api/song/url`, `/api/login/*`, `/api/playlist/*`, `/api/lyric`, `/api/cover`, `/api/audio`, `/api/weather/*`, `/api/podcast/*`。
- Internal dependencies:
  - NeteaseCloudMusicApi, QQ request helpers, update jobs, cookies, dj analyzer。
- External dependencies:
  - Node http/https/fs/path/crypto/tls, NeteaseCloudMusicApi, GitHub Releases, third-party music platforms。
- Side effects:
  - File system: Yes
  - Network: Yes
  - Cookie/session: Yes
  - LocalStorage: No
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - Low direct, High indirect for playback/visual timing data
- Migration decision:
  - Split into Bun sidecar services and Rust commands; old update patch removed from Tauri mainline.
- Target location:
  - `sidecars/api/src/server.ts`, `sidecars/api/src/services/*`, `sidecars/api/src/providers/*`, `packages/shared/src/*`
- Target layer:
  - Bun Sidecar / Schemas / Shared Types / Core
- Target runtime:
  - Bun
- Difficulty:
  - High
- Priority:
  - P0/P1
- Blocking dependencies:
  - provider adapter contract, sidecar lifecycle, app data paths, logging。
- Notes:
  - Tauri mainline 不迁旧 Electron patch JSON 系统。

### Module: Legacy Music Provider Adapters
- Current location:
  - `server.js`
  - Netease imports, QQ helpers, search/song-url/lyric/playlist/login routes
- Evidence:
  - `server.js:9-46`, `server.js:1421-1533`, `server.js:1639-1735`, `server.js:2244-2885`, `server.js:3416-3523`, `server.js:3671-4135`
- Current responsibility:
  - Netease/QQ search, song URL, lyric, playlist, login/cookie, playback restriction classification。
- Current runtime:
  - Node local server
- Public interface:
  - `/api/search`, `/api/song/url`, `/api/login/*`, `/api/user/playlists`, `/api/qq/*`, `/api/lyric`, `/api/playlist/*`。
- Internal dependencies:
  - userCookie, qqCookie, NeteaseCloudMusicApi, QQ musicu endpoints, request normalization。
- External dependencies:
  - Third-party platform endpoints, cookies, NeteaseCloudMusicApi。
- Side effects:
  - File system: Yes for cookies
  - Network: Yes
  - Cookie/session: Yes
  - LocalStorage: No
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - Low direct, Medium indirect for covers/lyrics/playability
- Migration decision:
  - Adapter seam with shared Track/Playlist/Lyric/SongUrl schemas.
- Target location:
  - `sidecars/api/src/providers/provider-adapter.ts`, `sidecars/api/src/providers/netease/*`, `sidecars/api/src/providers/qq/*`
- Target layer:
  - Bun Sidecar / Shared Types
- Target runtime:
  - Bun
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - license gate, account validation B1, provider capability matrix。
- Notes:
  - `docs/migration/DECISIONS.md:30-35` 锁定 QQ 使用 GPL-3.0 `qq-music-api`，Netease 主用 `hana-music-api`、保留 NeteaseCloudMusicApi 回退。

### Module: Current Bun Sidecar Gateway
- Current location:
  - `sidecars/api/src/server.ts`, `sidecars/api/src/providers/*`, `sidecars/api/src/services/*`
- Evidence:
  - `sidecars/api/src/server.ts:94-627`, `sidecars/api/src/providers/provider-adapter.ts:32-44`, `sidecars/api/src/providers/registry.ts:11-54`, `sidecars/api/src/services/sidecar-log.ts:25-56`
- Current responsibility:
  - Tauri rewrite API gateway, providers, proxy, weather, discover, podcast, diagnostics, runtime logging。
- Current runtime:
  - Bun sidecar
- Public interface:
  - `/health`, `/providers/capabilities`, `/search`, `/song-url`, `/providers/:id/*`, `/audio-proxy`, `/image-proxy`, `/weather/radio`, `/discover/home`, `/podcast/*`。
- Internal dependencies:
  - shared schemas, provider adapters, logger, env config。
- External dependencies:
  - Bun.serve, Node fs promises, third-party provider libs/endpoints。
- Side effects:
  - File system: Yes for `.log`
  - Network: Yes
  - Cookie/session: Yes
  - LocalStorage: No
  - Native window: No
  - Global state mutation: Yes
- Visual criticality:
  - Medium indirect
- Migration decision:
  - Keep and complete; verify parity against `server.js`.
- Target location:
  - Same, plus future `packages/music-providers` if split becomes useful.
- Target layer:
  - Bun Sidecar / Schemas
- Target runtime:
  - Bun
- Difficulty:
  - Medium
- Priority:
  - P0/P1
- Blocking dependencies:
  - sidecar launch, app data dirs, SQLite later, runtime logs。
- Notes:
  - 日志保持运行时自动 `.log`，开发者/人工查看，不设计成用户诊断 UI。

### Module: Legacy Electron Native Shell / IPC Bridge
- Current location:
  - `desktop/main.js`, `desktop/preload.js`
- Evidence:
  - `desktop/main.js:1-57`, `desktop/main.js:1100-1311`, `desktop/preload.js:3-47`
- Current responsibility:
  - 主窗口、全屏/最小化/关闭、全局热键、导入导出、登录窗口、更新安装包、重启、桌面歌词、壁纸。
- Current runtime:
  - Electron main + preload
- Public interface:
  - `window.desktopWindow.*`, `ipcMain.handle('desktop-window-*')`, `mineradio-hotkeys-configure-global`, `mineradio-export-json-file`, `mineradio-import-json-file`, `netease-music-*`, `qq-music-*`, `mineradio-desktop-lyrics-*`, `mineradio-wallpaper-*`。
- Internal dependencies:
  - Electron BrowserWindow/session/globalShortcut/dialog/shell, app paths, cookies。
- External dependencies:
  - Electron APIs, OS windows, file dialogs。
- Side effects:
  - File system: Yes
  - Network: Yes through login windows
  - Cookie/session: Yes
  - LocalStorage: No
  - Native window: Yes
  - Global state mutation: Yes
- Visual criticality:
  - Medium direct, High for desktop lyrics
- Migration decision:
  - Replace with Tauri commands and typed invoke client.
- Target location:
  - `apps/desktop/src-tauri/src/commands.rs`, `apps/web/src/tauri/runtime.ts`, `packages/shared/src/desktop.ts`
- Target layer:
  - Tauri Rust / UI client / Shared Types
- Target runtime:
  - Rust + WebView
- Difficulty:
  - High
- Priority:
  - P0/P1
- Blocking dependencies:
  - command schema, unified error format, WebView2 validation。
- Notes:
  - React 组件不能直接调用底层 `invoke`，必须经统一 client。

### Module: Legacy Desktop Lyrics Overlay / Wallpaper Overlay
- Current location:
  - `desktop/main.js`, `desktop/overlay-preload.js`, `public/desktop-lyrics.html`, `public/wallpaper.html`
- Evidence:
  - `desktop/main.js:702-975`, `desktop/main.js:1032-1092`, `desktop/overlay-preload.js:10-18`, `desktop/preload.js:26-40`
- Current responsibility:
  - 桌面歌词独立窗口、置顶、穿透、锁定/解锁、拖动、hot bounds、中键切换、壁纸实验窗口。
- Current runtime:
  - Electron main + overlay renderer
- Public interface:
  - `window.desktopOverlay.*`, `mineradio-desktop-lyrics-state`, `mineradio-desktop-lyrics-lock-state`, `mineradio-wallpaper-state`。
- Internal dependencies:
  - overlay preload, BrowserWindow, screen, mouse poller, playback/lyrics/visual payload。
- External dependencies:
  - Electron, OS window APIs, DOM/CSS。
- Side effects:
  - File system: No
  - Network: No
  - Cookie/session: No
  - LocalStorage: Indirect
  - Native window: Yes
  - Global state mutation: Yes
- Visual criticality:
  - High
- Migration decision:
  - Keep desktop lyrics; wallpaper deep mode hidden/removed by decision until separately approved.
- Target location:
  - `apps/web/src/desktop-lyrics/*`, `apps/desktop/src-tauri/src/commands.rs`, future `src-tauri/src/windows/*`
- Target layer:
  - UI / Tauri Rust / Shared Types
- Target runtime:
  - WebView + Rust
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - Tauri overlay window, click-through, middle-click poller, code baseline and visual parity evidence。
- Notes:
  - 桌面歌词是高风险视觉/交互模块，必须白底/黑底/拖动/锁定/高亮 baseline。

### Module: Legacy DJ Analyzer / Beatmap Timing
- Current location:
  - `dj-analyzer.js`, `server.js`
- Evidence:
  - `dj-analyzer.js:4-66`, `dj-analyzer.js:66-382`, `dj-analyzer.js:384-858`, `dj-analyzer.js:860-864`, `server.js:3725`
- Current responsibility:
  - podcast/DJ 音频流解码、低频能量、beatmap、camera/pulse beats、长音频 range sampling。
- Current runtime:
  - Node local server
- Public interface:
  - `analyzePodcastDjStream`, `analyzePodcastDjIntro`, `buildBeatMapFromLowEnergy`, `/api/podcast/dj-beatmap`。
- Internal dependencies:
  - `mpg123-decoder`, fetch stream, range requests, biquad filters。
- External dependencies:
  - Node/Bun compatible stream/fetch, decoder dependency, network audio URL。
- Side effects:
  - File system: No
  - Network: Yes
  - Cookie/session: No
  - LocalStorage: No
  - Native window: No
  - Global state mutation: No
- Visual criticality:
  - High indirect for visual timing
- Migration decision:
  - Keep in Bun sidecar unless Rust rewrite proves timing parity.
- Target location:
  - `sidecars/api/src/services/podcast.ts`, future `packages/core/audio` for pure helpers, `packages/visual-engine/src/audio/*` for timing consumers
- Target layer:
  - Bun Sidecar / Core / Visual Engine
- Target runtime:
  - Bun first; Rust only after parity proof
- Difficulty:
  - High
- Priority:
  - P1
- Blocking dependencies:
  - decoder support under Bun, visual beat baseline, podcast route parity。
- Notes:
  - 影响电影镜头和粒子节奏，不允许迁移后节拍、冲击感、镜头同步改变。

### Module: Current Tauri Runtime Layer
- Current location:
  - `apps/desktop/src-tauri/src/lib.rs`, `commands.rs`, `sidecar.rs`, `paths.rs`, `updater.rs`
- Evidence:
  - `apps/desktop/src-tauri/src/lib.rs:237-373`, `apps/desktop/src-tauri/src/commands.rs:143-276`, `apps/desktop/src-tauri/src/commands.rs:326-775`, `apps/desktop/src-tauri/src/sidecar.rs:5-39`, `apps/desktop/src-tauri/src/sidecar.rs:136-163`, `apps/desktop/src-tauri/src/paths.rs:1-34`
- Current responsibility:
  - runtime config、sidecar 启动/监督、窗口命令、全局热键、updater、登录 WebView、桌面歌词 window、app data/log paths。
- Current runtime:
  - Rust / Tauri
- Public interface:
  - Tauri commands: `get_runtime_config`, `get_sidecar_status`, `configure_global_hotkeys`, `check_for_update`, `install_update`, `window_*`, `desktop_lyrics_*`, `login_*`。
- Internal dependencies:
  - Tauri plugins, sidecar child process, app state, paths。
- External dependencies:
  - Tauri 2, dialog/global-shortcut/updater/single-instance plugins, OS APIs。
- Side effects:
  - File system: Yes
  - Network: Indirect updater/login
  - Cookie/session: Yes
  - LocalStorage: No
  - Native window: Yes
  - Global state mutation: Yes
- Visual criticality:
  - Medium direct, High for desktop lyrics
- Migration decision:
  - Keep/complete; split deeper modules later only if it improves locality.
- Target location:
  - Same now; future `src/windows`, `src/auth`, `src/updater`, `src/fs`, `src/hotkeys` if module depth improves.
- Target layer:
  - Tauri Rust
- Target runtime:
  - Rust
- Difficulty:
  - Medium/High
- Priority:
  - P0/P1
- Blocking dependencies:
  - schema alignment, Windows validation, release assets。
- Notes:
  - Current Rust structs are command-local; still need request/response schema parity with `packages/shared`.

### Module: Current React / Zustand Web App
- Current location:
  - `apps/web/src/app`, `components`, `stores`, `visual`, `desktop-lyrics`, `api`
- Evidence:
  - `apps/web/src/app/App.tsx`, `apps/web/src/stores/*`, `apps/web/src/api/sidecar-client.ts`, `apps/web/src/visual/useVisualEngine.ts`
- Current responsibility:
  - React shell、Zustand stores、sidecar client、Tauri client、visual host、desktop lyrics overlay、search/playback/home/queue hosts。
- Current runtime:
  - WebView / Browser-compatible tests
- Public interface:
  - React props, stores, typed sidecar client, visual host props。
- Internal dependencies:
  - `@mineradio/shared`, `@mineradio/visual-engine`, Tauri API wrappers。
- External dependencies:
  - React, Zustand, Vite, Web APIs。
- Side effects:
  - File system: No direct
  - Network: Via sidecar client
  - Cookie/session: Via commands/sidecar
  - LocalStorage: Yes through stores
  - Native window: Via Tauri client
  - Global state mutation: Store state
- Visual criticality:
  - High where hosting visual engine
- Migration decision:
  - Keep and complete parity; do not let UI reach into Node/Rust directly.
- Target location:
  - Same
- Target layer:
  - UI / State / Test
- Target runtime:
  - WebView
- Difficulty:
  - Medium/High
- Priority:
  - P0/P2
- Blocking dependencies:
  - final parity plan, code baselines, visual parity evidence, command contracts。
- Notes:
  - Existing tests help, but visual parity still requires WebView2 screenshots/recordings.

### Module: Build / Release / Installer / Updater
- Current location:
  - Legacy `build/`, root `package.json`, Tauri `tauri.conf.json`, scripts
- Evidence:
  - `package.json:8-35`, `build/installer.nsh:40-84`, `build/installer.nsh:220-280`, `build/after-pack.js:43-66`, `apps/desktop/src-tauri/tauri.conf.json:31-79`
- Current responsibility:
  - Legacy electron-builder/NSIS/update assets and new Tauri build/updater/package policy。
- Current runtime:
  - Build-time / Release-time
- Public interface:
  - `bun run tauri:build`, Tauri updater `latest.json`, NSIS installer assets, release scripts/checks。
- Internal dependencies:
  - package versions, icons, notices, updater pubkey, policy scripts。
- External dependencies:
  - Bun, Tauri CLI, Rust cargo, GitHub Releases, NSIS。
- Side effects:
  - File system: Yes
  - Network: Yes during release/upload/update
  - Cookie/session: No
  - LocalStorage: No
  - Native window: No
  - Global state mutation: Build outputs
- Visual criticality:
  - Low for app runtime, Medium for installer UX
- Migration decision:
  - Replace Electron builder with Tauri bundler; remove legacy patch mainline.
- Target location:
  - `apps/desktop/src-tauri/tauri.conf.json`, `.github/workflows`, `docs/RELEASE.md`, release scripts
- Target layer:
  - Build / Release
- Target runtime:
  - Build-time
- Difficulty:
  - Medium/High
- Priority:
  - P2/P3
- Blocking dependencies:
  - signed updater artifacts, release assets, install/uninstall proof, notices。
- Notes:
  - 旧 `latest.yml`/blockmap/patch 只作为 Electron baseline/历史，不进 Tauri 主线。

## 4. Visual Non-Regression Plan

视觉迁移总策略：

1. Code baseline first：每个高风险视觉模块先通过阅读旧代码记录实现入口、DOM、CSS、canvas/WebGL 初始化、状态来源、交互路径和动画参数；截图、录屏和性能记录属于 visual parity evidence，不属于代码 baseline 本身。
2. Wrap existing implementation：先把旧实现包到 adapter 或 visual-engine module，不改视觉内部。
3. Stabilize interface：用 React props、Zustand snapshot、typed sidecar events 和 audio timing 输入固定 interface。
4. Incremental port：只迁移经过代码 baseline 和视觉一致性证据双重对比的内部片段。
5. Fallback keep-old：无法证明视觉一致时，保留旧 DOM/CSS/canvas/WebGL 实现。

| Visual Module | Source | Risk Level | Code Baseline / Visual Evidence Required | Migration Strategy | Fallback |
|---|---|---|---|---|---|
| Splash WebGL / Canvas | `public/index.html:1884-1898`, `public/index.html:25547-25805`, `packages/visual-engine/src/splash/*` | High | 代码入口、canvas/WebGL 初始化、启动截图、启动录屏、ready/click 交互、帧率 | 已有 visual-engine 包装，继续对照 Electron 录屏 | 保留旧 splash canvas/WebGL shader |
| Main WebGL / Particle / Shader Stage | `public/index.html:3719-3782`, `6359-6395`, `6535-7141` | High | 代码入口、状态输入、idle/playing/paused/fullscreen/resize 视觉证据、FPS/GPU 证据、截图/录屏证据 | visual-engine host + imperative adapter | 保留旧 Three.js scene/shader pipeline |
| Movie Camera / Free Camera | `public/index.html:3784-3815`, `packages/visual-engine/src/runtime/*` | High | 拖拽、双击回正、电影镜头、beat camera 录屏 | port camera math with tests, then visual compare | 只迁 state input，保留旧 camera loop |
| Stage Lyrics | `public/index.html:2319`, `7235-7249`, `8980` | High | 代码入口、歌词时序、粒子绑定、发光、详情页避让截图/录屏证据 | visual-engine lifecycle adapter | 回滚视觉层，只保留 lyrics data/store |
| 3D Playlist Shelf | `public/index.html:2184-2219`, `13674-14802`, `packages/visual-engine/src/shelf/*` | High | 侧栏/舞台/常驻/滚动/详情/点击播放录屏 | wrap shelf manager and migrate data seam | 保留旧 shelf render/interaction |
| DIY Visual Console / Presets | `public/index.html:2006-2262`, `21262-21312` | High | 代码入口、面板展开、滑块、预设切换、存档、玻璃质感截图/录屏证据 | React controls feed existing visual store | 保留旧 DOM/CSS controls wrapper |
| Desktop Lyrics Overlay | `desktop/main.js:713-975`, `desktop/overlay-preload.js:10-18` | High | 白/黑背景、锁定/解锁/拖动/高亮/FPS 录屏 | Tauri window + React overlay | 保留旧 overlay behavior until parity |
| Custom Cover Crop / Preview | `public/index.html:12670`, `13195-13259`, `15243-15269` | High | 代码入口、上传、裁剪、预览、封面粒子刷新截图/录屏证据 | Extract cover state + canvas helper | 保留旧 cover crop implementation |
| Player Control Bar | `public/index.html:2399-2415`, `18902-18933` | Medium | 静态截图、hover、进度拖拽、播放暂停 | React host + visual glass package | 保留旧 control glass DOM/SVG filter |
| Search Results | `public/index.html:1903-1916`, `17666` | Medium | 搜索/历史/空态/结果 hover 截图 | React list + typed provider client | 回滚到旧 SearchShell adapter |
| Home / Discover | `public/index.html:1931-1987`, `15489-15648` | Medium | 空场、推荐、天气、矮屏截图 | React host baseline layout | 保留旧 Home DOM shape |
| Update Modal | `public/index.html:22668-23010` | Medium | 弹窗、下载进度、错误态截图 | Replace old patch UI with Tauri updater UI | 保留只检测/打开 Release 的安全路径 |

高风险视觉模块通用代码 baseline 与视觉一致性证据 checklist：

- [ ] 记录旧实现入口、DOM 结构、关键 CSS selector、canvas / WebGL 初始化点
- [ ] 记录关键视觉状态，例如 idle / playing / paused / loading / error / fullscreen
- [ ] 记录关键交互路径，例如 hover / click / drag / resize / fullscreen / preset switch
- [ ] 记录关键动画参数，例如 duration / easing / delay / opacity / transform / blur / scale / z-index
- [ ] 记录 requestAnimationFrame / timer / audio timing / shader uniform / particle 参数
- [ ] 保存迁移前截图作为视觉一致性证据
- [ ] 保存迁移前关键交互录屏或 GIF 作为视觉一致性证据
- [ ] 保存迁移前性能记录作为视觉一致性证据，包括 FPS、CPU、内存、GPU 占用或至少主观流畅度记录
- [ ] 标记不可退化的视觉特征
- [ ] 标记允许变化的非核心细节

高风险视觉模块通用 acceptance criteria：

- [ ] 迁移后截图与迁移前视觉一致性证据无明显视觉差异
- [ ] 迁移后关键交互路径与旧版本一致
- [ ] 迁移后动画节奏与旧版本一致
- [ ] 迁移后布局层级、遮罩、模糊、阴影、渐变、透明度没有退化
- [ ] 迁移后歌词、粒子、shader、3D、封面等视觉效果没有被简化
- [ ] 迁移后播放状态与视觉状态同步正常
- [ ] 迁移后 fullscreen / resize / WebView2 环境下表现正常
- [ ] 迁移后没有明显掉帧、闪烁、撕裂、错位、层级穿透
- [ ] 迁移后用户可见行为保持兼容
- [ ] 如果任一项不满足，必须回滚该视觉模块迁移，保留旧实现

## 5. Target Architecture

目标结构和职责：

```text
apps/
  desktop/
    src-tauri/
      src/
        commands.rs      # 当前已有 Tauri command 聚合，后续可按 module 深度拆分
        sidecar.rs       # sidecar 启动、健康检查、监督和日志路径
        paths.rs         # app data/log dir
        updater.rs       # Tauri updater 状态和安装
  web/
    src/
      app/               # app shell composition only
      components/        # UI hosts; no direct Node/fs/native access
      stores/            # Zustand state modules
      api/               # typed sidecar client
      tauri/             # unified invoke client and runtime/updater wrapper
      visual/            # visual-engine host, no business provider logic
      desktop-lyrics/    # desktop lyrics WebView UI
packages/
  shared/                # zod schemas, DTOs, envelopes, provider/session/desktop contracts
  visual-engine/         # Canvas/WebGL/Three/GSAP imperative visual modules
  core/                  # future pure algorithms only, no WebView/Node/Rust side effects
  music-providers/       # optional future provider adapter package if sidecar grows too large
  test-utils/            # future baseline fixtures and visual harness
sidecars/
  api/                   # Bun runtime, providers, proxy, weather, podcast, diagnostics, .log
docs/
  migration/             # plans, gates, baseline records
```

目录边界：

- `apps/web` 不放 Node-only API、文件系统、provider 协议细节或每帧视觉内部实现。
- `apps/desktop/src-tauri` 不放音乐平台业务、搜索排序、歌词解析或 WebGL 渲染。
- `sidecars/api` 不拥有窗口生命周期、WebView DOM、桌面歌词窗口创建或 Tauri updater 安装动作。
- `packages/shared` 不依赖 React、Tauri、Bun/Node-only API 或 WebGL。
- `packages/visual-engine` 不直接访问 provider、cookie、文件系统或 Tauri commands；只吃 snapshot、timing、assets 和 DOM/canvas host。
- `packages/core` 只放纯算法，例如排序、节拍纯 helper、schema normalize，不放运行时 side effects。

目标 interface/seam：

- WebView 到 Native：`apps/web/src/tauri/*` 统一 client，背后是 Tauri commands。
- WebView 到 Sidecar：`apps/web/src/api/sidecar-client.ts` 统一 typed client，背后是 Bun routes。
- Provider seam：`ProviderAdapter`，当前证据 `sidecars/api/src/providers/provider-adapter.ts:32-44`。
- Visual seam：React 只传 visual snapshot/refs，visual-engine 内部管理 renderer、RAF、shader、GSAP、Three resources。
- Persistence seam：Zod schema-first，禁止 localStorage DTO 在多个模块重复定义。

## 6. Module Migration Mapping

| Legacy Module | Source | Target Package | Target Path | Runtime | Decision | Priority | Difficulty | Visual Risk |
|---|---|---|---|---|---|---|---|---|
| App shell / titlebar | `public/index.html:1846-1880`, `desktop/preload.js:3-10` | `apps/web`, `src-tauri` | `components/shell/*`, `commands.rs` | WebView/Rust | Extract/Replace | P0 | Medium | Medium |
| Home / discover | `public/index.html:1931-1987`, `15489-15648` | `apps/web`, `sidecars/api` | `home/EmptyHomeHost.tsx`, `services/discover-home.ts` | WebView/Bun | Extract | P1 | Medium | Medium |
| Weather radio | `public/index.html:15679-15845`, `server.js:3384-3405` | `sidecars/api`, `apps/web` | `services/weather-radio.ts`, `stores/ui-store.ts` | Bun/WebView | Keep/Complete | P1 | Medium | Medium |
| Search UI | `public/index.html:1903-1916`, `17650-17666` | `apps/web` | `components/shell/SearchShell.tsx` | WebView | Extract | P1 | Medium | Medium |
| Player / playback | `public/index.html:17728`, `18472-18510` | `apps/web`, `sidecars/api` | `audio/player-controller.ts`, `stores/playback-store.ts` | WebView/Bun | Extract | P1 | High | Medium |
| Queue / playlist panel | `public/index.html:2265-2302`, `19357-19849` | `apps/web` | `components/shell/PlaylistPanelHost.tsx` | WebView | Extract | P1 | Medium | Medium |
| Lyrics data/UI | `public/index.html:19025-19132`, `16678-16704` | `packages/shared`, `apps/web` | `lyric.ts`, `lyrics-store.ts`, `components/lyrics/*` | WebView | Extract | P1 | High | High |
| Stage lyrics visual | `public/index.html:2319`, `8980` | `packages/visual-engine` | `stage-lyrics/*` | WebView2/WebGL | Wrap/Port | P1 | High | High |
| Main particles/shader | `public/index.html:3719-3782`, `6359-6395` | `packages/visual-engine` | `home-visual/*`, `runtime/*` | WebView2/WebGL | Wrap/Port | P1 | High | High |
| Movie/free camera | `public/index.html:3784-3815` | `packages/visual-engine` | `runtime/cinema-camera.ts`, `runtime/free-camera.ts` | WebView2/WebGL | Port with tests | P1 | High | High |
| 3D playlist shelf | `public/index.html:2184-2219`, `13674-14802` | `packages/visual-engine`, `apps/web` | `shelf/*`, `stores/shelf-store.ts` | WebView2/WebGL | Wrap/Port | P1 | High | High |
| DIY visual console | `public/index.html:2006-2262` | `apps/web`, `packages/shared` | `VisualControlPanelHost.tsx`, `visual-store.ts` | WebView | Extract | P1 | High | High |
| Presets/user archives | `public/index.html:20231-20258`, `21262-21312` | `packages/shared`, `apps/web` | `persistence.ts`, `visual-store.ts` | WebView | Extract | P1 | High | High |
| Custom cover crop | `public/index.html:12670`, `15243-15269` | `apps/web`, `packages/visual-engine` | `cover/custom-cover.ts`, `home-visual/cover-texture.ts` | WebView | Extract/Wrap | P2 | High | High |
| Local state/localStorage | `public/index.html:2714-2730`, `21817-21827` | `apps/web`, `packages/shared` | `stores/*`, `persistence.ts` | WebView | Refactor | P0 | High | High |
| Legacy local API | `server.js:3243-4163` | `sidecars/api` | `server.ts`, `services/*` | Bun | Split/Replace | P0 | High | Low |
| Netease provider | `server.js:9-46`, `3043-3232` | `sidecars/api` | `providers/netease/*` | Bun | Adapter | P1 | High | Low |
| QQ provider | `server.js:1421-1533`, `2244-2885` | `sidecars/api` | `providers/qq/*` | Bun | Adapter | P1 | High | Low |
| Podcast/DJ beatmap | `dj-analyzer.js:66-382`, `740-864` | `sidecars/api`, `packages/core`, `visual-engine` | `services/podcast.ts`, future `core/audio` | Bun | Keep/Extract pure helpers | P1 | High | High |
| Audio/image proxy | `server.js:4135-4163`, `sidecars/api/src/server.ts:122-134` | `sidecars/api` | `services/audio-proxy.ts`, `image-proxy.ts` | Bun | Keep/Complete | P1 | Medium | Medium |
| Update UI | `public/index.html:22668-23010` | `apps/web`, `src-tauri` | `UpdateHost.tsx`, `updater.rs` | WebView/Rust | Replace old patch | P1 | Medium | Medium |
| Old patch system | `server.js:3264-3309`, `1199-1332` | None in Tauri mainline | N/A | N/A | Remove/Do not port | P2 | Medium | Low |
| Electron IPC/preload | `desktop/preload.js:3-47` | `apps/web`, `src-tauri` | `tauri/runtime.ts`, `commands.rs` | WebView/Rust | Replace | P0 | High | Medium |
| Desktop lyrics overlay | `desktop/main.js:713-975`, `overlay-preload.js:10-18` | `apps/web`, `src-tauri` | `desktop-lyrics/*`, `commands.rs` | WebView/Rust | Keep/Port | P1 | High | High |
| Wallpaper experimental | `desktop/main.js:1032-1092` | Deferred | Deferred | Rust/WebView | Hidden/Needs Review | P3 | High | High |
| Installer/release | `build/installer.nsh:40-84`, `tauri.conf.json:31-79` | `src-tauri`, release docs | `tauri.conf.json`, workflows | Build-time | Replace/Verify | P2 | High | Medium |
| SQLite local storage | Missing in current code | future `src-tauri` + `packages/shared` | `src-tauri/src/storage/*`, schemas | Rust/WebView | Add as one broad issue | P1 | High | Low |
| Runtime `.log` logging | `sidecars/api/src/services/sidecar-log.ts:25-56`, `sidecar.rs:5` | `sidecars/api`, `src-tauri` | same | Bun/Rust | Keep/Complete | P1 | Medium | Low |

## 7. Module-by-Module Todo

### Todo: Migrate Workspace, Shared Contracts, and Runtime Boundaries
#### Goal
让 Bun workspace、shared/zod contracts、WebView/Bun/Rust seam 成为后续所有模块迁移的统一 interface。
#### Source
- Current path:
  - `package.json`, `public/index.html`, `server.js`, `desktop/preload.js`
- Current symbols / selectors / channels / routes:
  - localStorage keys at `public/index.html:2714-2730`; `/api/*`; `window.desktopWindow.*`
#### Target
- Target path:
  - `packages/shared/src/*`, `apps/web/src/tauri/*`, `apps/web/src/api/sidecar-client.ts`
- Target package:
  - `packages/shared | apps/web | src-tauri | sidecars/api`
- Target runtime:
  - WebView / Bun / Rust / Browser-compatible
#### Checklist
- [ ] 用 `rg` 定位当前模块所有入口、调用方和副作用
- [ ] 记录当前模块的 public interface
- [ ] 记录当前模块的 internal dependencies
- [ ] 记录当前模块的 external dependencies
- [ ] 记录当前模块的 state source，例如 global variable / localStorage / DOM / IPC / API
- [ ] 记录当前模块的 side effects
- [ ] 设计目标模块接口
- [ ] 设计 request / response schema
- [ ] 设计 shared types
- [ ] 创建目标目录和模块骨架
- [ ] 迁移纯逻辑
- [ ] 迁移 UI / store / service / native command 中对应部分
- [ ] 替换旧调用方 import / invoke / fetch 路径
- [ ] 增加单元测试
- [ ] 增加集成测试或最小交互验证
- [ ] 验证开发运行
- [ ] 验证生产构建
- [ ] 标记旧模块 deprecated
- [ ] 确认无调用方后再删除旧代码
#### Acceptance Criteria
- [ ] 新模块可以独立类型检查
- [ ] 新模块可以独立测试
- [ ] 所有调用方已经迁移
- [ ] 旧行为保持兼容，除非明确记录 breaking change
- [ ] 不引入 UI 到系统能力的直接耦合
- [ ] 不引入 WebView 到 Node-only API 的直接依赖
- [ ] 生产构建通过
#### Risks
- shared schema 与 Rust struct 漂移。
- 重复 DTO 让 provider、UI、command 行为分叉。
#### Fallback
- 保留旧 fetch/IPC 调用方，只在新 schema 覆盖后逐步替换。
#### Depends On
- 无。
#### Should Be Migrated Before
- Provider、playback、desktop commands、visual state。

### Todo: Migrate Electron IPC Bridge to Tauri Commands
#### Goal
用小而稳定的 Tauri command interface 替代 Electron preload 和 `ipcMain.handle`。
#### Source
- Current path:
  - `desktop/preload.js`, `desktop/overlay-preload.js`, `desktop/main.js`
- Current symbols / selectors / channels / routes:
  - `window.desktopWindow.*`, `window.desktopOverlay.*`, `desktop-window-*`, `mineradio-hotkeys-configure-global`, `mineradio-export-json-file`, `netease-music-*`, `qq-music-*`, `mineradio-desktop-lyrics-*`
#### Target
- Target path:
  - `apps/web/src/tauri/runtime.ts`, `apps/desktop/src-tauri/src/commands.rs`, `packages/shared/src/desktop.ts`, `packages/shared/src/session.ts`
- Target package:
  - `apps/desktop | apps/web | packages/shared | src-tauri`
- Target runtime:
  - WebView / Rust
#### Checklist
- [ ] 盘点 `desktop/preload.js:3-47` 暴露的全部 API
- [ ] 盘点 `desktop/overlay-preload.js:10-18` 暴露的 overlay API
- [ ] 盘点 `desktop/main.js:1100-1311` 所有 IPC channel
- [ ] 为每个 channel 设计 Tauri command 名称
- [ ] 为每个 command 定义 request schema
- [ ] 为每个 command 定义 response schema
- [ ] 统一错误格式
- [ ] 统一前端 invoke client
- [ ] 禁止 React component 直接调用底层 invoke
- [ ] 增加 command 单元测试和 WebView 集成 smoke
#### Acceptance Criteria
- [ ] Electron preload API 均有 Tauri command 映射或明确删除/延期决策
- [ ] 所有 command 有 typed request/response
- [ ] WebView 只通过 `apps/web/src/tauri/*` 访问 native ability
- [ ] Windows WebView2 下窗口控制、热键、导入导出、登录、桌面歌词可验证
#### Risks
- Electron IPC payload 与 Tauri command payload 不兼容。
- 窗口状态事件时序改变导致 UI class 错乱。
#### Fallback
- 保留 legacy IPC map 文档和 adapter，逐个 command 切换。
#### Depends On
- Shared schemas。
#### Should Be Migrated Before
- Desktop lyrics、update UI、login windows、hotkeys。

### Todo: Migrate Local API Server to Bun Sidecar Services
#### Goal
用 Bun sidecar 承担 provider、proxy、weather、podcast、diagnostics、runtime logging，替代 legacy `server.js` 主业务。
#### Source
- Current path:
  - `server.js`
- Current symbols / selectors / channels / routes:
  - `/api/search`, `/api/qq/*`, `/api/song/url`, `/api/audio`, `/api/cover`, `/api/weather/*`, `/api/podcast/*`, `/api/playlist/*`, `/api/login/*`
#### Target
- Target path:
  - `sidecars/api/src/server.ts`, `sidecars/api/src/services/*`, `sidecars/api/src/providers/*`
- Target package:
  - `sidecars/api | packages/shared`
- Target runtime:
  - Bun
#### Checklist
- [ ] 对照 `server.js:3243-4163` 建完整 route parity 表
- [ ] 标记每条旧 `/api/update/*` 为 Tauri mainline 删除或 Release UI 替代
- [ ] 保留 `/audio-proxy`、`/image-proxy` 的安全 URL 校验
- [ ] 用 shared zod schema 校验 request/response
- [ ] 对 provider errors 做统一 envelope
- [ ] 保持 runtime `.log` 自动生成和敏感字段 redaction
- [ ] 增加 sidecar route tests
- [ ] Windows packaged sidecar health and restart evidence
#### Acceptance Criteria
- [ ] sidecar `/health` 和 provider capabilities 稳定
- [ ] Search/song-url/lyric/playlist/weather/podcast/audio proxy 对旧 UI 行为兼容
- [ ] `.log` 文件路径可通过 runtime status 查到
- [ ] 不要求用户打开日志 UI；日志为开发者/人工检查
#### Risks
- `server.js` 中第三方平台逻辑与本地 API 耦合深，拆分容易丢行为。
- Bun 与 Node stream/decoder/HTTP 行为差异。
#### Fallback
- 对高风险 route 保留 legacy 行为 fixture，先在 sidecar adapter 中逐条对比。
#### Depends On
- Shared schemas、sidecar lifecycle。
#### Should Be Migrated Before
- Search/playback/lyrics/Home/weather。

### Todo: Migrate Music Provider Boundary
#### Goal
让 Netease、QQ 和未来 provider 通过 `ProviderAdapter` seam 提供统一 search/songUrl/lyric/playlist/login interface。
#### Source
- Current path:
  - `server.js`
- Current symbols / selectors / channels / routes:
  - Netease imports `server.js:9-46`; QQ helper `server.js:1421-1533`; QQ requests `server.js:2244-2885`; route groups `server.js:3416-3523`, `3671-4135`
#### Target
- Target path:
  - `sidecars/api/src/providers/provider-adapter.ts`, `sidecars/api/src/providers/netease/*`, `sidecars/api/src/providers/qq/*`
- Target package:
  - `sidecars/api | packages/shared`
- Target runtime:
  - Bun
#### Checklist
- [ ] 抽象 provider interface
- [ ] 拆分 Netease adapter
- [ ] 拆分 QQ adapter
- [ ] 统一搜索结果模型
- [ ] 统一歌曲 / 专辑 / 歌单 / 歌词 DTO
- [ ] 保留“优先原唱 / 官方版本”的排序策略
- [ ] 标记第三方平台条款风险
- [ ] 给 Netease/QQ loginStatus/logout/session-cookie 做 B1 账号验证计划
- [ ] 保留 NeteaseCloudMusicApi fallback
#### Acceptance Criteria
- [ ] `ProviderAdapter` 覆盖 search/songUrl/lyric/playlistList/playlistDetail/loginStatus/logout
- [ ] QQ-only 登录不依赖 Netease 登录态
- [ ] provider error 能区分 login_required/trial_only/vip/paid/copyright
- [ ] Search ranking 可被单元测试验证
#### Risks
- QQ 播放授权 cookie 缺失导致“已登录但仅试听”。
- 第三方平台接口变化或 license gate 未通过。
#### Fallback
- Netease 回退到 NeteaseCloudMusicApi；QQ 保留已审核 GPL provider，不接入不兼容项目。
#### Depends On
- Sidecar services、shared schemas、license gate。
#### Should Be Migrated Before
- Search UI、playback、playlist shelf data。

### Todo: Migrate Playback, Queue, and Player Controls
#### Goal
React/Zustand playback module 保持旧播放器行为，同时通过 sidecar 获取可播放 URL 和代理音频。
#### Source
- Current path:
  - `public/index.html`
- Current symbols / selectors / channels / routes:
  - `#bottom-bar`, `#progress-bar`, `#controls`, `initAudio`, `playTrack`, `/api/song/url`, `/api/qq/song/url`, `/api/audio`
#### Target
- Target path:
  - `apps/web/src/audio/player-controller.ts`, `apps/web/src/stores/playback-store.ts`, `apps/web/src/components/shell/BottomControlsHost.tsx`, `sidecars/api/src/services/audio-proxy.ts`
- Target package:
  - `apps/web | sidecars/api | packages/shared`
- Target runtime:
  - WebView / Bun
#### Checklist
- [ ] 记录旧播放状态机、queue、volume、quality、fade、error handling
- [ ] 设计 playback store interface
- [ ] 设计 songUrl request/response schema
- [ ] 设计 proxy audio URL policy
- [ ] 迁移播放/暂停/上一首/下一首/进度/音量/quality
- [ ] 迁移 trial banner 和 restriction UI
- [ ] 迁移 queue add/clear/shuffle/play mode
- [ ] 增加 controller tests 和 WebView audio smoke
#### Acceptance Criteria
- [ ] 播放/暂停按钮状态不漂移
- [ ] 切歌后歌词、视觉 preset、桌面歌词 payload 同步
- [ ] 网易云/QQ/podcast/local fallback 路径都有验证
- [ ] 音频代理不把 Node-only API 泄漏到 WebView
#### Risks
- 播放状态与视觉状态耦合，容易造成 visual preset 或歌词不同步。
- HTML audio autoplay/WebView2 策略差异。
#### Fallback
- 保留旧 playback state machine 行为说明和 route fallback，先封装再替换调用方。
#### Depends On
- Provider adapter、sidecar audio proxy、shared Track/SongUrl schemas。
#### Should Be Migrated Before
- Stage lyrics、desktop lyrics、visual beat scheduling。

### Todo: Migrate Main WebGL / Particle / Movie Visual Stage
#### Goal
让 `packages/visual-engine` 接管主 WebGL/Three/shader/粒子/电影镜头实现，同时保持 Electron baseline 视觉不退化。
#### Source
- Current path:
  - `public/index.html`
- Current symbols / selectors / channels / routes:
  - `#canvas-container`, `scene`, `camera`, `renderer`, `ShaderMaterial`, `particles`, `bloomParticles`, `animate`, `setPreset`, `syncFxUniforms`
#### Target
- Target path:
  - `packages/visual-engine/src/home-visual/*`, `packages/visual-engine/src/runtime/*`, `apps/web/src/visual/useVisualEngine.ts`
- Target package:
  - `packages/visual-engine | apps/web`
- Target runtime:
  - Browser-compatible / WebView2
#### Checklist
- [ ] 用 `rg` 定位当前模块所有入口、调用方和副作用
- [ ] 记录当前模块的 public interface
- [ ] 记录当前模块的 internal dependencies
- [ ] 记录当前模块的 external dependencies
- [ ] 记录当前模块的 state source，例如 global variable / localStorage / DOM / IPC / API
- [ ] 记录当前模块的 side effects
- [ ] 设计目标模块接口
- [ ] 设计 request / response schema where visual snapshot crosses package seam
- [ ] 设计 shared types
- [ ] 创建目标目录和模块骨架
- [ ] 迁移纯逻辑
- [ ] 迁移 UI / store / service / native command 中对应部分
- [ ] 替换旧调用方 import / invoke / fetch 路径
- [ ] 增加单元测试
- [ ] 增加集成测试或最小交互验证
- [ ] 验证开发运行
- [ ] 验证生产构建
- [ ] 标记旧模块 deprecated
- [ ] 确认无调用方后再删除旧代码
#### Non-Regression Requirement
This module is visual-critical. Migration is not accepted unless visual parity with the legacy implementation is preserved.
#### Visual Invariants
- WebGL shader、粒子密度、Bloom、封面粒子、骷髅预设质感不降低。
- 电影镜头、free camera、拖拽/滚轮/双击回正手感保持。
- 播放状态、beatmap、preset 切换要继续驱动画面。
- 可见状态保持高帧率，后台策略不牺牲用户认可的质感。
#### Code Baseline And Visual Evidence Checklist
- [ ] 记录旧实现入口、DOM 结构、关键 CSS selector、canvas / WebGL 初始化点
- [ ] 记录关键视觉状态，例如 idle / playing / paused / loading / error / fullscreen
- [ ] 记录关键交互路径，例如 hover / click / drag / resize / fullscreen / preset switch
- [ ] 记录关键动画参数，例如 duration / easing / delay / opacity / transform / blur / scale / z-index
- [ ] 记录 requestAnimationFrame / timer / audio timing / shader uniform / particle 参数
- [ ] 保存迁移前截图作为视觉一致性证据
- [ ] 保存迁移前关键交互录屏或 GIF 作为视觉一致性证据
- [ ] 保存迁移前性能记录作为视觉一致性证据，包括 FPS、CPU、内存、GPU 占用或至少主观流畅度记录
- [ ] 标记不可退化的视觉特征
- [ ] 标记允许变化的非核心细节
#### Visual Acceptance Criteria
- [ ] 迁移后截图与迁移前视觉一致性证据无明显视觉差异
- [ ] 迁移后关键交互路径与旧版本一致
- [ ] 迁移后动画节奏与旧版本一致
- [ ] 迁移后布局层级、遮罩、模糊、阴影、渐变、透明度没有退化
- [ ] 迁移后歌词、粒子、shader、3D、封面等视觉效果没有被简化
- [ ] 迁移后播放状态与视觉状态同步正常
- [ ] 迁移后 fullscreen / resize / WebView2 环境下表现正常
- [ ] 迁移后没有明显掉帧、闪烁、撕裂、错位、层级穿透
- [ ] 迁移后用户可见行为保持兼容
- [ ] 如果任一项不满足，必须回滚该视觉模块迁移，保留旧实现
#### Visual Fallback Strategy
- 如果 React 重构导致视觉退化，保留旧 DOM / CSS / canvas / WebGL 实现，并通过 wrapper 接入新架构。
- 如果 WebGL / shader 在 WebView2 中表现异常，优先保留旧 shader pipeline，不得降级为静态效果。
- 如果 3D 歌单架交互无法等价迁移，保留旧实现并只抽离状态输入和事件输出。
- 如果歌词舞台时序不同步，回滚视觉层迁移，只迁移数据和状态层。
#### Acceptance Criteria
- [ ] visual-engine 可独立测试和 build
- [ ] 主 canvas 非空、无闪烁、无层级穿透
- [ ] WebView2 resize/fullscreen/DPR 表现与代码 baseline 和视觉一致性证据一致
#### Risks
- WebView2 GPU 或 shader 行为与 Electron Chromium 差异。
- React 生命周期重复创建 renderer 造成内存泄漏。
#### Fallback
- 保留旧 renderer loop 作为 adapter。
#### Depends On
- Code baseline、visual parity evidence、playback snapshot、visual store。
#### Should Be Migrated Before
- Stage lyrics、3D shelf 深层替换。

### Todo: Migrate Stage Lyrics Visual and Custom Lyrics
#### Goal
迁移歌词数据、用户自定义歌词和 3D stage lyrics lifecycle，并保持歌词 timing、透明度、发光、粒子绑定不退化。
#### Source
- Current path:
  - `public/index.html`
- Current symbols / selectors / channels / routes:
  - `#stage-lyrics`, `updateStageLyrics3D`, `renderLyrics`, `CUSTOM_LYRIC_STORE_KEY`, `/api/lyric`, `/api/qq/lyric`
#### Target
- Target path:
  - `packages/visual-engine/src/stage-lyrics/*`, `apps/web/src/stores/lyrics-store.ts`, `apps/web/src/lyrics/*`, `apps/web/src/components/lyrics/*`
- Target package:
  - `packages/visual-engine | apps/web | packages/shared`
- Target runtime:
  - WebView / Browser-compatible
#### Checklist
- [ ] 记录 old lyric line/word model and fallback rules
- [ ] 迁移 custom lyric localStorage schema
- [ ] 迁移 lyric source mode 和 custom/original 切换
- [ ] 迁移 current index selection and playback progress sync
- [ ] 迁移 stage lyrics material/mask/glow/readability/sun/sparks
- [ ] 验证 detail page 避让和封面粒子轴绑定
- [ ] 增加 unit tests + visual parity evidence comparison
#### Non-Regression Requirement
This module is visual-critical. Migration is not accepted unless visual parity with the legacy implementation is preserved.
#### Visual Invariants
- 歌词与封面粒子世界轴绑定，不偏轴、不滑走。
- 歌单详情页打开时歌词不遮挡中心高亮行，也不能变成几乎不可见。
- 高亮、溢光、readability、sun/sparks 层级保持。
- 播放进度、逐词 timing、桌面歌词 payload 同步。
#### Code Baseline And Visual Evidence Checklist
- [ ] 记录旧实现入口、DOM 结构、关键 CSS selector、canvas / WebGL 初始化点
- [ ] 记录关键视觉状态，例如 idle / playing / paused / loading / error / fullscreen
- [ ] 记录关键交互路径，例如 hover / click / drag / resize / fullscreen / preset switch
- [ ] 记录关键动画参数，例如 duration / easing / delay / opacity / transform / blur / scale / z-index
- [ ] 记录 requestAnimationFrame / timer / audio timing / shader uniform / particle 参数
- [ ] 保存迁移前截图作为视觉一致性证据
- [ ] 保存迁移前关键交互录屏或 GIF 作为视觉一致性证据
- [ ] 保存迁移前性能记录作为视觉一致性证据，包括 FPS、CPU、内存、GPU 占用或至少主观流畅度记录
- [ ] 标记不可退化的视觉特征
- [ ] 标记允许变化的非核心细节
#### Visual Acceptance Criteria
- [ ] 迁移后截图与迁移前视觉一致性证据无明显视觉差异
- [ ] 迁移后关键交互路径与旧版本一致
- [ ] 迁移后动画节奏与旧版本一致
- [ ] 迁移后布局层级、遮罩、模糊、阴影、渐变、透明度没有退化
- [ ] 迁移后歌词、粒子、shader、3D、封面等视觉效果没有被简化
- [ ] 迁移后播放状态与视觉状态同步正常
- [ ] 迁移后 fullscreen / resize / WebView2 环境下表现正常
- [ ] 迁移后没有明显掉帧、闪烁、撕裂、错位、层级穿透
- [ ] 迁移后用户可见行为保持兼容
- [ ] 如果任一项不满足，必须回滚该视觉模块迁移，保留旧实现
#### Visual Fallback Strategy
- 如果 React 重构导致视觉退化，保留旧 DOM / CSS / canvas / WebGL 实现，并通过 wrapper 接入新架构。
- 如果 WebGL / shader 在 WebView2 中表现异常，优先保留旧 shader pipeline，不得降级为静态效果。
- 如果 3D 歌单架交互无法等价迁移，保留旧实现并只抽离状态输入和事件输出。
- 如果歌词舞台时序不同步，回滚视觉层迁移，只迁移数据和状态层。
#### Acceptance Criteria
- [ ] 新模块可以独立类型检查和测试
- [ ] 原词/自定义歌词/空歌词 fallback 均兼容
- [ ] 旧行为保持兼容
#### Risks
- timing 偏移会让歌词和音乐/视觉脱节。
- 详情页层级和透明度很容易回归。
#### Fallback
- 只迁 lyric payload/store，保留旧 stage lyrics render implementation。
#### Depends On
- Playback progress、visual engine host、lyrics schemas。
#### Should Be Migrated Before
- Desktop lyrics final parity。

### Todo: Migrate 3D Playlist Shelf
#### Goal
把 3D 歌单架作为 visual-engine 深模块迁移，React/Zustand 只提供数据和事件，保持手感、层级和性能。
#### Source
- Current path:
  - `public/index.html`
- Current symbols / selectors / channels / routes:
  - `#shelf-seg`, `#shelf-camera-seg`, `#shelf-presence-seg`, `shelfManager`, raycast helpers, playlist/podcast routes
#### Target
- Target path:
  - `packages/visual-engine/src/shelf/*`, `apps/web/src/stores/shelf-store.ts`, `apps/web/src/visual/shelf-*`
- Target package:
  - `packages/visual-engine | apps/web`
- Target runtime:
  - Browser-compatible / WebView2
#### Checklist
- [ ] 记录 side/stage/off/always/auto/dynamic/static 状态
- [ ] 记录 card/detail/content list rendering windows
- [ ] 记录 raycast focus and pointer/wheel/click behavior
- [ ] 迁移 provider playlists, podcast collections, queue fallback input
- [ ] 迁移 select sound and detail open/close behavior
- [ ] 保持分批/窗口化渲染，不做全量一次性渲染
- [ ] 增加 shelf unit tests and visual recording gate
#### Non-Regression Requirement
This module is visual-critical. Migration is not accepted unless visual parity with the legacy implementation is preserved.
#### Visual Invariants
- 3D 卡片质感、大小、透明度、侧向角度和详情页位置保持。
- 动态镜头和静态绑定逻辑不混淆。
- 常驻歌单架未命中时不能压住歌词。
- 滚动、hover、点击播放、详情页选择手感保持。
#### Code Baseline And Visual Evidence Checklist
- [ ] 记录旧实现入口、DOM 结构、关键 CSS selector、canvas / WebGL 初始化点
- [ ] 记录关键视觉状态，例如 idle / playing / paused / loading / error / fullscreen
- [ ] 记录关键交互路径，例如 hover / click / drag / resize / fullscreen / preset switch
- [ ] 记录关键动画参数，例如 duration / easing / delay / opacity / transform / blur / scale / z-index
- [ ] 记录 requestAnimationFrame / timer / audio timing / shader uniform / particle 参数
- [ ] 保存迁移前截图作为视觉一致性证据
- [ ] 保存迁移前关键交互录屏或 GIF 作为视觉一致性证据
- [ ] 保存迁移前性能记录作为视觉一致性证据，包括 FPS、CPU、内存、GPU 占用或至少主观流畅度记录
- [ ] 标记不可退化的视觉特征
- [ ] 标记允许变化的非核心细节
#### Visual Acceptance Criteria
- [ ] 迁移后截图与迁移前视觉一致性证据无明显视觉差异
- [ ] 迁移后关键交互路径与旧版本一致
- [ ] 迁移后动画节奏与旧版本一致
- [ ] 迁移后布局层级、遮罩、模糊、阴影、渐变、透明度没有退化
- [ ] 迁移后歌词、粒子、shader、3D、封面等视觉效果没有被简化
- [ ] 迁移后播放状态与视觉状态同步正常
- [ ] 迁移后 fullscreen / resize / WebView2 环境下表现正常
- [ ] 迁移后没有明显掉帧、闪烁、撕裂、错位、层级穿透
- [ ] 迁移后用户可见行为保持兼容
- [ ] 如果任一项不满足，必须回滚该视觉模块迁移，保留旧实现
#### Visual Fallback Strategy
- 如果 React 重构导致视觉退化，保留旧 DOM / CSS / canvas / WebGL 实现，并通过 wrapper 接入新架构。
- 如果 WebGL / shader 在 WebView2 中表现异常，优先保留旧 shader pipeline，不得降级为静态效果。
- 如果 3D 歌单架交互无法等价迁移，保留旧实现并只抽离状态输入和事件输出。
- 如果歌词舞台时序不同步，回滚视觉层迁移，只迁移数据和状态层。
#### Acceptance Criteria
- [ ] side/stage/always/auto 模式全部可验收
- [ ] 播客和 provider 歌单数据进入 shelf
- [ ] 未出现详情页遮挡和强制回星河
#### Risks
- raycast 命中区改变导致滚轮/点击误触。
- 性能优化误做成全量渲染。
#### Fallback
- 保留旧 shelf manager，仅替换 data adapter。
#### Depends On
- Provider playlists/podcast data、visual engine host、visual parity recordings。
#### Should Be Migrated Before
- 删除 legacy shelf code。

### Todo: Migrate DIY Visual Console, Presets, and Cover Customization
#### Goal
把 DIY 视觉控制台拆成 React controls + visual store + visual-engine interface，同时保留玻璃质感和视觉参数语义。
#### Source
- Current path:
  - `public/index.html`
- Current symbols / selectors / channels / routes:
  - `#fx-panel`, `#preset-grid`, `#user-archive-grid`, `setPreset`, `syncFxUniforms`, `CUSTOM_COVER_STORE_KEY`, `USER_FX_ARCHIVE_STORE_KEY`
#### Target
- Target path:
  - `apps/web/src/visual/VisualControlPanelHost.tsx`, `apps/web/src/stores/visual-store.ts`, `packages/shared/src/persistence.ts`, `packages/visual-engine/src/control/*`
- Target package:
  - `apps/web | packages/shared | packages/visual-engine`
- Target runtime:
  - WebView / Browser-compatible
#### Checklist
- [ ] 记录所有 fx fields、range、toggle、segmented controls
- [ ] 建 zod persistence schema and normalization
- [ ] 迁移 user archive read/save/apply/import/export
- [ ] 保留 `commitPlaybackPreset` 语义
- [ ] 迁移 cover color picker and crop preview
- [ ] 迁移 glass SVG filters and displacement parameters
- [ ] 加 tests for persistence, controls and visual store
#### Non-Regression Requirement
This module is visual-critical. Migration is not accepted unless visual parity with the legacy implementation is preserved.
#### Visual Invariants
- 播放器控制台 SVG 玻璃质感是黄金版本。
- 预设切换粒子 transition、相机基线和 playback preset commit 保持。
- 滑块、色轮、封面取色、用户存档不丢字段。
- 性能设置保存后重启保留，不能只存在 UI。
#### Code Baseline And Visual Evidence Checklist
- [ ] 记录旧实现入口、DOM 结构、关键 CSS selector、canvas / WebGL 初始化点
- [ ] 记录关键视觉状态，例如 idle / playing / paused / loading / error / fullscreen
- [ ] 记录关键交互路径，例如 hover / click / drag / resize / fullscreen / preset switch
- [ ] 记录关键动画参数，例如 duration / easing / delay / opacity / transform / blur / scale / z-index
- [ ] 记录 requestAnimationFrame / timer / audio timing / shader uniform / particle 参数
- [ ] 保存迁移前截图作为视觉一致性证据
- [ ] 保存迁移前关键交互录屏或 GIF 作为视觉一致性证据
- [ ] 保存迁移前性能记录作为视觉一致性证据，包括 FPS、CPU、内存、GPU 占用或至少主观流畅度记录
- [ ] 标记不可退化的视觉特征
- [ ] 标记允许变化的非核心细节
#### Visual Acceptance Criteria
- [ ] 迁移后截图与迁移前视觉一致性证据无明显视觉差异
- [ ] 迁移后关键交互路径与旧版本一致
- [ ] 迁移后动画节奏与旧版本一致
- [ ] 迁移后布局层级、遮罩、模糊、阴影、渐变、透明度没有退化
- [ ] 迁移后歌词、粒子、shader、3D、封面等视觉效果没有被简化
- [ ] 迁移后播放状态与视觉状态同步正常
- [ ] 迁移后 fullscreen / resize / WebView2 环境下表现正常
- [ ] 迁移后没有明显掉帧、闪烁、撕裂、错位、层级穿透
- [ ] 迁移后用户可见行为保持兼容
- [ ] 如果任一项不满足，必须回滚该视觉模块迁移，保留旧实现
#### Visual Fallback Strategy
- 如果 React 重构导致视觉退化，保留旧 DOM / CSS / canvas / WebGL 实现，并通过 wrapper 接入新架构。
- 如果 WebGL / shader 在 WebView2 中表现异常，优先保留旧 shader pipeline，不得降级为静态效果。
- 如果 3D 歌单架交互无法等价迁移，保留旧实现并只抽离状态输入和事件输出。
- 如果歌词舞台时序不同步，回滚视觉层迁移，只迁移数据和状态层。
#### Acceptance Criteria
- [ ] 用户视觉存档字段不丢失
- [ ] 所有 visual controls 写入 visual store and visual engine snapshot
- [ ] SVG glass 和搜索栏玻璃无明显差异
#### Risks
- React 化 controls 改坏玻璃 SVG 或预设保存语义。
- localStorage schema 漂移导致旧用户存档无法 normalize。
#### Fallback
- 保留旧 `#fx-panel` DOM/CSS，以 wrapper 驱动 visual store。
#### Depends On
- Visual store schema、visual engine interface、glass texture doc。
#### Should Be Migrated Before
- 删除 legacy visual controls。

### Todo: Migrate Desktop Lyrics Overlay
#### Goal
用 Tauri window + React overlay 替代 Electron desktop lyrics，同时保持置顶、穿透、锁定/解锁、拖动、歌词高亮和视觉质感。
#### Source
- Current path:
  - `desktop/main.js`, `desktop/preload.js`, `desktop/overlay-preload.js`, `public/desktop-lyrics.html`
- Current symbols / selectors / channels / routes:
  - `mineradio-desktop-lyrics-*`, `window.desktopOverlay`, `desktopLyricsWindow`, lock/hot bounds/move payload
#### Target
- Target path:
  - `apps/web/src/desktop-lyrics/*`, `apps/desktop/src-tauri/src/commands.rs`, future `src-tauri/src/windows/desktop_lyrics.rs`
- Target package:
  - `apps/web | src-tauri | packages/shared`
- Target runtime:
  - WebView / Rust
#### Checklist
- [ ] 记录旧 overlay DOM/CSS and payload shape
- [ ] 记录 lock/click-through/hot bounds/middle-click behavior
- [ ] 迁移 Tauri window create/show/close/move
- [ ] 迁移 overlay payload replay and live update
- [ ] 迁移 FPS cap and highlight/cinema options
- [ ] Windows WebView2 白底/黑底/拖动/锁定录屏
#### Non-Regression Requirement
This module is visual-critical. Migration is not accepted unless visual parity with the legacy implementation is preserved.
#### Visual Invariants
- 桌面歌词窗口置顶、透明、字体、阴影、颜色、highlight 进度保持。
- 锁定后防误触，中键锁定/解锁保持。
- 拖动和 hot bounds 不漂移。
- 播放/暂停/切歌/歌词为空时状态同步。
#### Code Baseline And Visual Evidence Checklist
- [ ] 记录旧实现入口、DOM 结构、关键 CSS selector、canvas / WebGL 初始化点
- [ ] 记录关键视觉状态，例如 idle / playing / paused / loading / error / fullscreen
- [ ] 记录关键交互路径，例如 hover / click / drag / resize / fullscreen / preset switch
- [ ] 记录关键动画参数，例如 duration / easing / delay / opacity / transform / blur / scale / z-index
- [ ] 记录 requestAnimationFrame / timer / audio timing / shader uniform / particle 参数
- [ ] 保存迁移前截图作为视觉一致性证据
- [ ] 保存迁移前关键交互录屏或 GIF 作为视觉一致性证据
- [ ] 保存迁移前性能记录作为视觉一致性证据，包括 FPS、CPU、内存、GPU 占用或至少主观流畅度记录
- [ ] 标记不可退化的视觉特征
- [ ] 标记允许变化的非核心细节
#### Visual Acceptance Criteria
- [ ] 迁移后截图与迁移前视觉一致性证据无明显视觉差异
- [ ] 迁移后关键交互路径与旧版本一致
- [ ] 迁移后动画节奏与旧版本一致
- [ ] 迁移后布局层级、遮罩、模糊、阴影、渐变、透明度没有退化
- [ ] 迁移后歌词、粒子、shader、3D、封面等视觉效果没有被简化
- [ ] 迁移后播放状态与视觉状态同步正常
- [ ] 迁移后 fullscreen / resize / WebView2 环境下表现正常
- [ ] 迁移后没有明显掉帧、闪烁、撕裂、错位、层级穿透
- [ ] 迁移后用户可见行为保持兼容
- [ ] 如果任一项不满足，必须回滚该视觉模块迁移，保留旧实现
#### Visual Fallback Strategy
- 如果 React 重构导致视觉退化，保留旧 DOM / CSS / canvas / WebGL 实现，并通过 wrapper 接入新架构。
- 如果 WebGL / shader 在 WebView2 中表现异常，优先保留旧 shader pipeline，不得降级为静态效果。
- 如果 3D 歌单架交互无法等价迁移，保留旧实现并只抽离状态输入和事件输出。
- 如果歌词舞台时序不同步，回滚视觉层迁移，只迁移数据和状态层。
#### Acceptance Criteria
- [ ] Tauri overlay window 可开启、关闭、移动、锁定
- [ ] click-through and middle-click behavior Windows verified
- [ ] Desktop lyrics payload follows playback/lyrics/visual state
#### Risks
- Tauri/WebView2 透明窗口和 click-through 与 Electron 行为不同。
- Native middle-click poller 误判或残留进程。
#### Fallback
- 保留桌面歌词功能 gate，不在 public release 打开未达 parity 的 overlay。
#### Depends On
- Tauri commands, playback/lyrics store, visual motion snapshot。
#### Should Be Migrated Before
- Release parity sign-off。

### Todo: Migrate DJ Analyzer and Beatmap Timing
#### Goal
把 `dj-analyzer.js` 能力迁到 Bun sidecar/纯算法模块，保持 podcast/DJ 视觉 timing 不变。
#### Source
- Current path:
  - `dj-analyzer.js`, `server.js`
- Current symbols / selectors / channels / routes:
  - `buildBeatMapFromLowEnergy`, `analyzePodcastDjStream`, `analyzePodcastDjIntro`, `/api/podcast/dj-beatmap`
#### Target
- Target path:
  - `sidecars/api/src/services/podcast.ts`, future `packages/core/audio/*`, `packages/visual-engine/src/audio/*`
- Target package:
  - `sidecars/api | packages/core | packages/visual-engine`
- Target runtime:
  - Bun first; Browser-compatible consumers
#### Checklist
- [ ] 标出当前 decoder / stream / buffer / network 能力
- [ ] 将 pure helpers 和 decoder/network side effects 分开
- [ ] 评估 `mpg123-decoder` 在 Bun 下的行为
- [ ] 用 fixture 对比 beat/pulse/camera events
- [ ] 若考虑 Rust rewrite，先建立 timing parity suite
- [ ] 确认 visual timing 不因采样/精度改变而漂移
#### Acceptance Criteria
- [ ] beatmap output 与 legacy fixture 误差在可接受范围
- [ ] 长 podcast range sampling 和 full stream fallback 保持
- [ ] visual beat count and camera beats drive visual engine normally
#### Risks
- 解码器在 Bun 下不稳定。
- 节拍时间微小偏移导致电影镜头/粒子冲击感变化。
#### Fallback
- 保留 Bun sidecar JS 实现，不急于 Rust 重写。
#### Depends On
- Sidecar route parity、audio proxy、visual beat scheduler。
#### Should Be Migrated Before
- 高风险视觉 release sign-off。

### Todo: Migrate Update, Installer, and Release Flow
#### Goal
用 Tauri updater 和 Tauri NSIS 主线替代 Electron update/patch/build 流程，保留必要的发布资产和安全 gate。
#### Source
- Current path:
  - `server.js`, `public/index.html`, `desktop/main.js`, `build/installer.nsh`, `build/after-pack.js`
- Current symbols / selectors / channels / routes:
  - `/api/update/latest`, `/api/update/download`, `/api/update/patch`, `mineradio-open-update-installer`, NSIS installer marker
#### Target
- Target path:
  - `apps/desktop/src-tauri/tauri.conf.json`, `apps/desktop/src-tauri/src/updater.rs`, `apps/web/src/components/shell/UpdateHost.tsx`, `.github/workflows`, `docs/RELEASE.md`
- Target package:
  - `src-tauri | apps/web | Build | Release`
- Target runtime:
  - Rust / WebView / Build-time
#### Checklist
- [ ] electron-builder -> Tauri build
- [ ] NSIS installer -> Tauri bundler / Windows installer
- [ ] GitHub Release update -> Tauri updater
- [ ] latest.yml / blockmap / patch 机制 -> 判断保留、替换或废弃
- [ ] 版本号来源必须统一
- [ ] 发布资产清单必须明确
- [ ] updater manifest、`.sig`、public key、asset upload 做真实验证
- [ ] Windows install/uninstall and packaged notices verification
#### Acceptance Criteria
- [ ] Tauri updater check/install path 工作或明确 detection-only gate
- [ ] 旧 Electron patch JSON 不进 Tauri 主线
- [ ] GitHub Release 资产清单明确
- [ ] 安装包包含 license/notices/privacy/security resources
#### Risks
- 旧客户端更新通道与新 Tauri updater 混淆。
- 未签名/manifest 不匹配导致更新失败或安全提示。
#### Fallback
- 公开发布前只允许 detection-only or manual Release download，不自动安装。
#### Depends On
- Release decisions, updater key, build artifacts, license gate。
#### Should Be Migrated Before
- Public release。

### Todo: Add SQLite Local Storage Foundation
#### Goal
为 Tauri 版建立一个大而清晰的 SQLite 本地存储模块，服务用户数据、缓存索引和未来 schema migration。
#### Source
- Current path:
  - Missing / Needs Review in current runtime code
- Current symbols / selectors / channels / routes:
  - Future app-data storage; old Electron user dirs are not automatically reused
#### Target
- Target path:
  - `apps/desktop/src-tauri/src/storage/*`, `packages/shared/src/persistence.ts`, future `apps/web/src/stores/*` persistence adapters
- Target package:
  - `src-tauri | packages/shared | apps/web`
- Target runtime:
  - Rust / WebView
#### Checklist
- [ ] 设计 app-data-backed SQLite path
- [ ] 设计 schema version and migrations
- [ ] 设计 read/write command interface
- [ ] 为 persisted entities 建 zod schemas
- [ ] 不自动读取旧 Electron 用户数据
- [ ] 作为一个 broad issue 推进，不拆成过细内部实现 issue
#### Acceptance Criteria
- [ ] SQLite schema/migration/storage path 可测试
- [ ] UI 不直接访问 SQLite
- [ ] 数据损坏/迁移失败有错误 envelope
#### Risks
- 过早拆分导致 issue 边界碎片化。
- 旧用户数据兼容误承诺。
#### Fallback
- 继续使用 localStorage/zod persistence，SQLite gate 保持未完成。
#### Depends On
- App data path, shared persistence schemas。
#### Should Be Migrated Before
- 大规模用户数据和缓存迁移。

## 8. Cross-Cutting Todo

### Workspace
- [ ] 验证并补齐 Bun workspace 结构
- [ ] 定义 package 命名规范
- [ ] 配置 TypeScript project references
- [ ] 配置统一 tsconfig
- [ ] 配置 lint / format
- [ ] 配置统一 dev / build / check scripts

### Type System
- [ ] 验证并补齐 `packages/shared`
- [ ] 建立或补齐 `packages/schemas`
- [ ] 定义 schema-first 约定
- [ ] 禁止重复 DTO
- [ ] 为 IPC / API / 配置 / 本地文件数据建立 Zod schema

### Runtime Boundary
- [ ] 明确 WebView / Bun / Rust / Build-time 边界
- [ ] 禁止 WebView 直接访问 Node-only API
- [ ] 禁止 UI 直接访问文件系统
- [ ] 禁止 React 组件直接调用 Tauri invoke
- [ ] 建立统一 service / client / store 分层

### IPC / Command
- [ ] 盘点所有 Electron IPC channel
- [ ] 设计 Tauri command 命名
- [ ] 为每个 command 定义 request schema
- [ ] 为每个 command 定义 response schema
- [ ] 统一错误格式
- [ ] 统一前端 invoke client

### Visual Regression
- [ ] 为 Home 建立代码 baseline 和截图证据
- [ ] 为 Player 建立代码 baseline 和截图证据
- [ ] 为 Lyrics stage 建立代码 baseline 和截图证据
- [ ] 为 Particle visual 建立代码 baseline 和截图证据
- [ ] 为 WebGL shader 建立代码 baseline 和截图证据
- [ ] 为 3D playlist shelf 建立代码 baseline 和截图证据
- [ ] 为 DIY visual console 建立代码 baseline 和截图证据
- [ ] 为 Desktop lyrics overlay 建立代码 baseline、截图证据和交互证据
- [ ] 记录关键动画参数和禁止破坏的视觉边界
- [ ] 建立视觉回归验收流程
- [ ] 明确视觉退化时的回滚策略

### Music Provider Boundary
- [ ] 抽象 provider interface
- [ ] 拆分 Netease adapter
- [ ] 拆分 QQ adapter
- [ ] 统一搜索结果模型
- [ ] 统一歌曲 / 专辑 / 歌单 / 歌词 DTO
- [ ] 保留“优先原唱 / 官方版本”的排序策略
- [ ] 标记第三方平台条款风险

### Build & Release
- [ ] 设计并验证 Tauri build 配置
- [ ] 设计并验证 Windows installer 迁移方案
- [ ] 设计并验证 updater 迁移方案
- [ ] 判断旧 latest.yml / blockmap / patch 是否保留
- [ ] 明确 GitHub Release 资产清单
- [ ] 明确版本号来源
- [ ] 明确签名、公钥、更新 endpoint

### Testing
- [ ] 为 `packages/core` 规划单元测试
- [ ] 为 `packages/schemas` 规划 schema 测试
- [ ] 为 music providers 规划 adapter 测试
- [ ] 为 Tauri commands 规划集成测试
- [ ] 为视觉高风险模块规划截图证据、录屏证据和手动验收测试

### Logging
- [ ] 保持 sidecar/runtime 自动 `.log` 文件生成
- [ ] 日志面向开发者和人工排查，不新增面向用户的诊断 UI，除非用户另行要求
- [ ] 保持 cookie/token/auth 字段 redaction
- [ ] 验证 packaged app 中 log dir 和 runtime status 指向一致

### SQLite
- [ ] 将 SQLite 作为一个 broad foundational local-storage module 规划
- [ ] 不把 schema、迁移、命令、UI 适配过早拆成多个 issue
- [ ] 不承诺自动读取旧 Electron user data
- [ ] 先建立 app-data path、schema version、migration policy 和 error envelope

## 9. Recommended Migration Order

| Order | Priority | Module | Action | Source | Target | Depends On | Risk | Visual Gate |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | Workspace + contracts | Verify/complete | `package.json`, `packages/shared` | `packages/shared`, future schemas | None | Medium | None |
| 2 | P0 | Runtime boundary | Lock WebView/Bun/Rust seams | `desktop/preload.js`, `server.js` | `tauri/runtime.ts`, sidecar client | 1 | High | None |
| 3 | P0 | IPC/commands | Map Electron IPC to Tauri commands | `desktop/main.js:1100-1311` | `commands.rs`, shared desktop schemas | 1-2 | High | Medium |
| 4 | P0 | Code baseline + visual evidence system | Read old visual code boundaries and capture screenshots/recordings/perf evidence | `public/index.html`, Electron baseline | `docs/migration/baseline/*`, `docs/migration/visual-evidence/*` | None | High | Required |
| 5 | P1 | Sidecar lifecycle/logging | Verify/complete sidecar launch, status, `.log` | `server.js`, `sidecar.rs` | `sidecars/api`, `src-tauri` | 1-2 | Medium | None |
| 6 | P1 | Provider adapters | Complete Netease/QQ parity | `server.js` provider logic | `sidecars/api/src/providers/*` | 1,5 | High | None |
| 7 | P1 | Search/playback/queue | Wire typed client and stores | `public/index.html` search/player | `apps/web/src/components`, stores | 2,5,6 | High | Medium |
| 8 | P1 | Lyrics data + timing | Complete lyrics store and visual input | `public/index.html` lyrics | `lyrics-store`, `stage-lyrics` | 7 | High | Required |
| 9 | P1 | Main visual stage | Wrap/verify WebGL/particles/camera | `public/index.html` Three.js | `packages/visual-engine` | 4,7 | High | Required |
| 10 | P1 | 3D playlist shelf | Data seam then visual parity | `public/index.html` shelf | `visual-engine/shelf`, shelf-store | 4,6,7 | High | Required |
| 11 | P1 | DIY visual console | React controls + exact visual inputs | `#fx-panel`, `setPreset` | `VisualControlPanelHost`, visual-store | 4,9 | High | Required |
| 12 | P1 | Desktop lyrics | Tauri overlay + React UI | `desktop/main.js`, overlay preload | `desktop-lyrics`, `commands.rs` | 3,7,8 | High | Required |
| 13 | P1 | DJ analyzer | Keep Bun sidecar, extract pure helpers | `dj-analyzer.js` | `sidecars/api`, `core/audio` | 5,7,9 | High | Required |
| 14 | P1 | SQLite | Add broad local storage foundation | Missing | `src-tauri/storage`, schemas | 1,2 | Medium | None |
| 15 | P2 | Update/release | Replace old patch with Tauri updater | `server.js:/api/update/*` | `updater.rs`, `UpdateHost` | 3 | High | Medium |
| 16 | P2 | Installer/package | Verify Tauri NSIS and resources | `build/installer.nsh`, `tauri.conf.json` | Tauri bundle | 15 | High | Installer visual/manual |
| 17 | P3 | Legacy deprecation | Mark old modules deprecated | `public/`, `desktop/`, `server.js` | docs/issues | Full parity | High | All gates passed |
| 18 | P3 | Old code deletion | Delete only after zero callers and parity sign-off | Legacy dirs | N/A | 17 | Very High | All gates passed |

## 10. Risk Register

| Risk | Affected Modules | Severity | Probability | Mitigation | Fallback |
|---|---|---|---|---|---|
| `public/index.html` 单体过大，迁移时视觉退化 | App shell, visual, lyrics, player, shelf | Critical | High | 按 module seam 拆，先 wrapper，再 port | 保留旧 DOM/CSS/canvas/WebGL |
| 视觉系统和播放状态耦合 | Playback, visual store, stage lyrics | Critical | High | 定义 playback snapshot and visual snapshot interface | 只迁数据层，回滚视觉层 |
| WebGL / shader 迁移后性能下降 | Particles, shader, splash | Critical | Medium | WebView2 GPU/FPS baseline and pixel checks | 保留旧 shader pipeline |
| 粒子视觉效果迁移后密度、节奏、流畅度下降 | Main visual, cover particles | Critical | Medium | 记录 uniforms、DPR、particle counts、RAF cadence | 保留 legacy renderer adapter |
| 电影镜头视觉系统被简化 | Movie camera, free camera, beat camera | High | Medium | camera math tests + recordings | 保留旧 camera loop |
| 3D 歌单架交互被破坏 | Shelf, playlist data, pointer | Critical | High | raycast/scroll/detail baseline, windowed rendering | 保留旧 shelf manager |
| DIY 视觉控制台功能或交互退化 | FX panel, visual store, presets | High | High | schema normalize and control-by-control parity | 保留旧 panel wrapper |
| 歌词舞台 timing 不同步 | Lyrics, playback, visual engine | Critical | Medium | current index tests + playback recordings | 回滚 stage visual, keep data migration |
| 桌面歌词 overlay 迁移风险 | Desktop lyrics, Tauri windows | Critical | Medium | Windows white/black/drag/lock recordings | 隐藏 feature gate or keep old behavior until parity |
| Electron IPC 到 Tauri command 的接口不兼容 | Window, login, hotkeys, desktop lyrics | High | High | command mapping table + shared schemas | Adapter layer and staged rollout |
| Node-only API 泄漏到 WebView | API, file import/export, update | High | Medium | lint/check policy and client-only seam | Move side effects to Rust/Bun |
| `server.js` 中第三方音乐平台逻辑和本地 API 耦合 | Sidecar providers | High | High | ProviderAdapter seam, route parity table | Keep old route fixture and compare |
| 网易云 / QQ 音乐登录态 cookie 迁移风险 | Login, provider adapters | High | Medium | WebView login cookie extraction tests and B1 validation | Manual cookie/session injection path |
| 更新机制从 GitHub Release / latest.yml / patch 切到 Tauri updater 的兼容风险 | Updater, release | High | Medium | signed updater manifest evidence and release checklist | Detection-only/manual download |
| 全局热键迁移风险 | Hotkeys, Tauri plugin | Medium | Medium | Windows registration/conflict tests | Local-only hotkeys until verified |
| 文件路径和用户数据目录迁移风险 | App data, logs, SQLite, imports | High | Medium | Tauri app-data path schema and no old dir auto-read | localStorage fallback / manual import |
| Bun 与 Node 兼容性风险 | sidecar, dj analyzer, providers | High | Medium | Bun tests and packaged sidecar smoke | Keep JS in sidecar, avoid Rust rewrite until needed |
| Rust / TypeScript 类型不一致 | commands, shared schemas | High | Medium | schema-first contracts and generated/paired tests | Fail command validation, do not ship |
| 没有现成测试导致回归难发现 | All modules | High | High | unit/integration/manual visual gates | Keep old baseline and block release |
| GPL / 第三方平台合规风险 | QQ, GSAP, AI depth, release | Critical | Medium | `LICENSE_GATE.md`, transitive checks, notices | Remove/block dependency before public release |
| SQLite scope over-split | Storage | Medium | Medium | Keep as one broad foundational issue | Defer SQLite and use existing persistence |
| Runtime `.log` mistaken as user diagnostics UI | Logging | Low | Medium | Document developer-facing `.log` only | No UI; manual log inspection |

## 11. Acceptance Criteria

- [ ] 所有已确认模块都有迁移决策
- [ ] 所有 P0 / P1 模块都有具体 Todo
- [ ] 所有模块都有 source path 和 target path
- [ ] 所有 IPC / API 边界都有 schema 规划
- [ ] 所有 WebView / Bun / Rust 边界都已标注
- [ ] 所有视觉高风险模块都有 baseline 策略
- [ ] 所有视觉高风险模块都有 fallback 策略
- [ ] 所有视觉模块都有明确的 non-regression requirement
- [ ] 所有视觉模块都禁止在无 baseline 情况下迁移
- [ ] 所有第三方音乐平台 adapter 都有独立迁移计划
- [ ] 所有本地文件 / 用户数据 / 更新相关逻辑都有迁移计划
- [ ] 文档中的 Todo 可以直接拆成 GitHub Issues
- [ ] 本次文档编写/更新的执行者没有修改源码
- [ ] `git status --short` 显示除 `docs/MIGRATION_TODO.md` 外没有其他由本次文档编写/更新引入的变更

### Visual Global Acceptance Criteria

- [ ] 迁移后整体视觉观感不低于旧版
- [ ] 迁移后核心页面截图与旧版无明显视觉差异
- [ ] 迁移后核心动画节奏与旧版一致
- [ ] 迁移后 WebGL / canvas / shader / particle / 3D 效果没有被简化
- [ ] 迁移后播放状态、歌词状态、视觉状态同步正常
- [ ] 迁移后 WebView2 下没有明显闪烁、错位、层级穿透、掉帧
- [ ] 迁移后视觉模块的 fallback 仍可启用
- [ ] 任一视觉模块无法达到 parity 时，不允许删除旧实现

### Documentation Completion Criteria

- [ ] 初始 `git status --short` 已记录
- [ ] 最终 `git status --short` 已记录
- [ ] 只创建/更新 `docs/MIGRATION_TODO.md`
- [ ] `git diff --check` 通过
- [ ] 本次文档编写/更新未运行源码迁移、构建修改或发布动作

## 12. Open Questions

- 哪些视觉效果是绝对不可改动的？当前已知：SVG 玻璃质感、WebGL/shader、歌词舞台、3D 歌单架、DIY 控制台、桌面歌词均按不可退化处理。
- 是否需要继续保留旧 Electron 版本作为长期视觉 baseline？当前答案应为是，直到 Tauri parity 公开发布完成。
- 是否需要引入 Playwright 截图回归？建议需要，但高风险模块仍必须补人工录屏和 WebView2 实机检查。
- 是否允许暂时通过 wrapper 保留旧 HTML / CSS / canvas 实现？建议允许，而且高风险视觉模块必须优先采用该策略。
- 哪些音乐平台能力必须优先迁移？建议 Netease、QQ search/songUrl/lyric/playlist/loginStatus/logout 先于新增平台。
- 是否需要兼容旧用户数据目录？现有决策是不自动读取旧 Electron 用户数据；如要兼容需用户重新拍板。
- 是否需要兼容旧更新通道和历史安装包？Tauri 主线不迁旧 Electron patch JSON；旧 release 只作为历史/隔离信息。
- 是否需要保留快速补丁机制？Tauri 主线不保留旧快速补丁机制，除非未来单独设计 updater server。
- 是否计划继续只支持 Windows？当前 Tauri/NSIS/WebView2 证据以 Windows 为主；macOS/Linux 需单独 issue 和手测。
- 是否需要考虑 macOS / Linux？可以作为延期平台能力，但不能阻塞 Windows visual parity。
- SQLite 是否拆多个 issue？当前按用户偏好保持一个 broad foundational issue。
- Runtime `.log` 是否做 UI？当前不做；日志是运行时自动生成，开发者/人工查看。
