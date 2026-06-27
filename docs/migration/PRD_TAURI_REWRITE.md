# Tauri Rewrite PRD

更新时间：2026-06-27

## Problem Statement

当前项目基于 Electron、Node.js 原生 HTTP 服务和单体 `public/index.html` 运行。现有实现已经覆盖搜索、播放、登录、歌词、3D 歌单架、Canvas/WebGL/GSAP 视觉、桌面歌词、壁纸窗口和 GitHub 更新，但代码边界过于集中，前端、服务、桌面系统能力和发布更新逻辑相互缠绕。

本次二开迁移要在不降低原项目完整能力和视觉效果的前提下，迁移到 `Tauri 2 + Rust + WebView2`、`Bun workspace`、`Vite + TypeScript + React + Zustand`、`Bun sidecar runtime`、`shared types + zod` 和 `Tauri updater`。迁移结果是一个新的二开项目，不承诺读取旧安装用户数据，不沿用旧 Electron 更新通道。

## Solution

建立一条新的 Tauri 主线：Rust/Tauri 只负责桌面系统能力、窗口、登录 webview、sidecar 生命周期和 updater；Bun sidecar 负责音乐 provider、NeteaseCloudMusicApi、QQ 音乐 provider、天气电台、音频代理、缓存和诊断；React + Zustand 负责 UI 和状态；Canvas/WebGL/GSAP 被抽成 imperative visual engine；shared 包定义 zod contract 和跨层类型。

迁移过程允许分阶段提交和内部里程碑验收，但最终对外发布必须达到原 Electron 项目完整能力。Electron 代码保留为视觉与行为参考基线，不作为新项目运行时兼容对象。

## User Stories

1. As a listener, I want to search music from supported providers, so that I can quickly find songs I want to hear.
2. As a listener, I want to play, pause, seek, switch tracks, and manage a queue, so that the player works as a complete desktop music app.
3. As a listener, I want Netease and QQ provider support to feel consistent, so that I do not need to learn different UI behavior per source.
4. As a listener, I want lyrics to stay synchronized and visually identical to the original project, so that the music stage keeps its existing feel.
5. As a visual user, I want the Tauri version to match the original visual result exactly, so that the migration does not cheapen or change the experience.
6. As a visual user, I want the startup animation, player glass, particle stage, GSAP timing, and 3D shelf hand feel to match the Electron baseline, so that the app still feels like the same product.
7. As a playlist user, I want the 3D playlist shelf and details view to retain original behavior, so that browsing playlists remains familiar.
8. As a desktop lyrics user, I want desktop lyrics, click-through, dragging, and middle-click lock behavior preserved on Windows, so that background operations are not blocked.
9. As a user with login accounts, I want Netease and QQ login flows to work in Tauri, so that I can access playlists and playable URLs.
10. As a user whose provider playback fails, I want clear failure reasons and source switching handled by the service layer, so that the UI can recover gracefully.
11. As a user, I want updates to use the new Tauri updater, so that the new app has a native update path independent from the old Electron patch system.
12. As a maintainer, I want provider responses validated by zod, so that React, Bun, and Rust do not drift in API assumptions.
13. As a maintainer, I want a provider capability matrix, so that missing or partial provider behavior is visible before release.
14. As a maintainer, I want sidecar logs and diagnostics without cookies, so that playback/provider bugs can be debugged safely.
15. As a maintainer, I want license review as a release gate, so that the fork remains GPL-3.0 compliant.
16. As a release owner, I want all parity gates checked before publishing, so that no partial Tauri version replaces the original experience.

## Implementation Decisions

- The fork remains GPL-3.0 for distribution.
- The public fork should use a new app id, data directory, updater channel, repository, and preferably new name/logo to avoid confusion with the original Mineradio brand.
- The Tauri version does not promise migration of old Electron user data. Users may manually import supported data later if a feature is explicitly built.
- Electron is kept as visual and behavioral baseline until Tauri parity is proven.
- New stack uses Bun workspace with a root `bun.lock`.
- Target modules are:
  - Tauri/Rust desktop app.
  - Vite + React + TypeScript web app.
  - Bun API sidecar.
  - shared types + zod package.
  - visual-engine package.
- First production architecture uses one Bun API sidecar with multiple peer provider adapters. QQ can be researched from compatible open-source projects and later split into an independent provider sidecar only if complexity requires it.
- NeteaseCloudMusicApi remains in Bun sidecar and is not rewritten in Rust.
- Provider Adapter is mandatory. Netease and QQ expose the same core interface: search, songUrl, lyric, playlistList, playlistDetail, loginStatus, logout.
- Provider model uses a unified `Track` shape with provider, id, sourceId, title, artists, album, coverUrl, durationMs, qualityHints, and playableState.
- Cross-source fallback lives in sidecar service logic, not React.
- Cookies are owned by sidecar storage. Rust provides app data paths; React never persists complete cookies in frontend state.
- Login windows are owned by Rust/Tauri webview/window logic; extracted cookies are handed to sidecar.
- Manual cookie import remains as a fallback.
- Sidecar uses random local port allocation. Rust injects or returns the sidecar base URL; frontend must not hardcode port 3000.
- Sidecar has health/version handshake with app version, api version, schema version, and provider status.
- Sidecar process is monitored by Rust and restarted on crash with UI-visible recovery state.
- All sidecar API responses use a unified success/error envelope. Error responses include code, message, provider, retryable, and action where applicable.
- Local HTTP audio proxy remains allowed and recommended for headers, mime, CORS, caching, and failure attribution.
- Tauri updater replaces old GitHub patch JSON system in the new Tauri line.
- Old lightweight patch logic is not migrated into the Tauri mainline.
- Visual parity requires screenshot/recording comparison against a frozen Electron baseline.
- DOM and CSS internals may change, but final pixels, animation timing, interaction hand feel, and visual hierarchy must match the Electron baseline.
- React must not own per-frame visual updates. Canvas/WebGL/GSAP logic lives in imperative visual-engine modules that accept state snapshots and callbacks.
- Old `public/index.html` cannot be wrapped in an iframe/webview as the final migration. It may only be used as a temporary reference during development.
- Phase 1 实施前必须先完成 Electron baseline freeze，至少包含 tag/branch、截图/录屏、测试歌曲、窗口尺寸和视觉存档路径。
- 长流程迁移必须按阶段执行：每个阶段开始前有可执行任务切片、明确修改范围、验证命令和停止条件；阶段完成后再进入下一阶段。
- 不在 `main` / `master` 上直接开始新栈实施，除非用户明确同意；默认使用独立迁移分支或 worktree。

## Testing Decisions

- Testing seams are:
  - shared zod schemas for typed API contracts and persistence normalization.
  - Bun sidecar provider adapter boundaries for Netease and QQ.
  - sidecar service boundary for playback URL resolution and cross-provider fallback.
  - Tauri command/window wrapper boundary for system actions.
  - Zustand store actions for UI state transitions.
  - visual-engine public lifecycle API for Canvas/WebGL/GSAP parity.
  - Playwright browser seam for visual screenshots and UI flow checks.
- Capability parity checklist is a hard release gate.
- Each release gate must include manual verification steps.
- Core contract tests cover shared zod schemas and success/error responses.
- Sidecar provider tests cover provider adapter behavior and fallback/error envelopes.
- Rust command/window wrapper tests cover system command shape where practical.
- React state tests cover Zustand actions and persistence normalization.
- Visual testing uses Playwright screenshots and canvas/nonblank checks, plus manual recording comparison for animation timing and hand feel.
- Audio playback testing must run in real WebView2: play, pause, seek, next, progress update, and ended behavior.
- Updater testing must simulate older version to newer version using Tauri updater manifest.
- Final Windows release testing must install, launch, verify WebView2 behavior, verify updater, and verify no license gate remains open.
- 每个迁移阶段完成时必须更新 capability checklist 中对应 gate 的状态或备注；没有证据的项目不能勾选。
- 每个迁移阶段至少运行该阶段定义的自动验证命令，并记录无法自动验证的手动验证证据。

## Out of Scope

- Migrating old Electron installed user data into this fork.
- Keeping old Electron updater or patch JSON system in the Tauri line.
- Rust rewrite of NeteaseCloudMusicApi.
- Pixel-perfect preservation of internal DOM structure.
- Using GPL-incompatible QQ open-source project code.
- Publicly distributing under the original Mineradio identity without fork/modified-source clarity.

## Further Notes

- Current migration inventory: `docs/migration/MIGRATION_INVENTORY.md`.
- Target architecture notes: `docs/migration/MIGRATION_TAURI_PLAN.md`.
- Capability parity gate: `docs/migration/CAPABILITY_PARITY_CHECKLIST.md`.
- Deferred capability tracking: `docs/migration/DEFERRED_CAPABILITIES.md`.
- License release gate: `docs/migration/LICENSE_GATE.md`.
