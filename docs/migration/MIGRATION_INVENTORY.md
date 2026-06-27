# Mineradio 技术栈迁移现状盘点

更新时间：2026-06-27

本文只记录迁移前置盘点，不作为长期记忆文档。目标是给后续迁移到 `Tauri 2 + Rust + WebView2`、`Bun workspace`、`Vite + TypeScript + React + Zustand` 提供清晰边界。迁移总控 PRD 见 `docs/migration/PRD_TAURI_REWRITE.md`。

## 当前技术栈

- 桌面壳：Electron，入口 `desktop/main.js`，preload 为 `desktop/preload.js` 和 `desktop/overlay-preload.js`。
- 本地服务：Node.js 原生 `http.createServer`，入口 `server.js`。
- 音乐接口：`NeteaseCloudMusicApi` 直接由 `server.js` 调用；QQ 音乐接口为项目内手写请求逻辑。
- 前端：`public/index.html` 单文件承载主要 HTML、CSS、状态、交互、Canvas/WebGL、Three.js、GSAP、播放器逻辑。
- 视觉资源：`public/vendor/three.r128.min.js`、`public/vendor/gsap.min.js`、`public/vendor/music-tempo.min.js`、`public/assets/skull-decimation-points.bin`。
- 打包发布：`electron-builder` + NSIS，自定义脚本在 `build/installer.nsh`。
- 更新：`server.js` 内部实现 GitHub Release 检测、安装包下载、轻量补丁下载/应用；Electron main 负责打开下载好的安装包。

## 文件体量和迁移风险

- `public/index.html` 约 1.35 MB，是最高风险文件。它混合了 UI、样式、状态、播放器、歌词、3D 歌单架、视觉引擎、引导、登录弹窗等多种职责。
- `server.js` 约 168 KB，是第二高风险文件。它混合了静态资源服务、音乐 API、登录 cookie、QQ 接口、天气电台、更新系统、补丁系统、音频代理和 beatmap 缓存。
- `desktop/main.js` 约 50 KB，负责窗口、登录弹窗、全局热键、桌面歌词、壁纸窗口、更新安装包打开、单实例、性能开关。
- `public/desktop-lyrics.html` 约 55 KB，是独立覆盖层 UI，未来应迁移为 Tauri 独立窗口或 webview label。

## Electron main 当前职责

建议迁移目标：

- Rust/Tauri 主进程：
  - 主窗口创建、窗口状态、最小化、最大化、全屏。
  - 单实例。
  - 系统打开文件或 URL。
  - 安装包/更新器交互。
  - 全局快捷键。
  - 桌面歌词和壁纸窗口的创建、置顶、穿透、位置管理。
  - Windows 特定能力：WebView2、窗口层级、WorkerW 壁纸挂载、鼠标穿透。
- Bun sidecar：
  - 不应承担窗口生命周期。
  - 只保留音乐 API、本地 HTTP/RPC、NeteaseCloudMusicApi、QQ 请求、天气、音频代理、beatmap 缓存等服务能力。

当前 IPC 能力包括：

- `desktop-window-*`：窗口控制。
- `netease-music-*`、`qq-music-*`：网页登录窗口和清理登录态。
- `mineradio-hotkeys-configure-global`：全局热键。
- `mineradio-export-json-file`、`mineradio-import-json-file`：用户存档导入导出。
- `mineradio-open-update-installer`、`mineradio-restart-app`：更新安装与重启。
- `mineradio-desktop-lyrics-*`：桌面歌词窗口、拖拽、穿透、锁定。
- `mineradio-wallpaper-*`：壁纸窗口。

这些 IPC 需要在 Tauri 中变成 `command`、插件能力或窗口事件。

## server.js 当前职责

### 静态资源

- 服务 `public/` 下 HTML、JS、CSS、图片和本地资源。
- Tauri 迁移后，生产环境静态资源应由 WebView 加载 Vite build 产物，不再由 sidecar 托管。
- 开发环境可由 Vite dev server 提供前端。

### 网易云能力

- 搜索、云搜索、歌曲详情、歌曲 URL、歌词、新歌词。
- 二维码登录、登录状态、退出、用户账号。
- 用户歌单、每日推荐、私人推荐、喜欢/取消喜欢、喜欢检查、歌单创建、添加歌曲到歌单。
- 播客/DJ：详情、节目、热门、电台订阅、用户音频等。

迁移建议：保留在 Bun sidecar，先封装为 provider service，再用 shared zod schemas 固定输入输出。

### QQ 音乐能力

- QQ cookie 持久化和规范化。
- QQ 登录状态、资料兜底、头像兜底、播放票据判断。
- QQ 搜索、歌曲 URL、歌词、歌单、歌单详情、歌手、评论等。

迁移建议：保留在 Bun sidecar，但与网易云使用同一 Provider 契约。

### 天气电台

- Open-Meteo 天气、地理编码、IP 定位。
- 根据天气 mood 组织推荐歌曲和播放队列。

迁移建议：保留在 Bun sidecar。前端只消费 typed API，不直接拼接天气/音乐规则。

### 更新系统

- GitHub Release latest 检测。
- 镜像下载、进度任务、校验、安装包复用。
- 轻量 patch JSON 下载和应用。

迁移建议：

- Tauri updater 负责正式应用更新。
- 旧补丁系统不进入 Tauri 主线。
- 如仍需要国内镜像下载，可后续作为 updater server 或自定义下载层设计，不应直接照搬旧 patch 逻辑。

### 文件和缓存

- `.cookie`、`.qq-cookie` 保存登录状态。
- `updates/` 保存下载任务和补丁备份。
- `D:\MineradioCache\beatmaps` 保存 beatmap。

迁移建议：

- cookie、缓存、下载目录统一迁到新二开项目的 Tauri app data 目录。
- sidecar 从 Rust 启动参数或环境变量接收数据目录，不再硬编码绝对路径。
- 本项目是二开项目，不承诺自动读取旧 Electron 安装用户数据。

## 前端当前职责

`public/index.html` 当前包含：

- 主页面、播放器控制台、搜索、歌单、队列、登录、更新弹窗。
- 大量 CSS 和视觉变量。
- Zustand 目标迁移前需要先识别状态域：
  - playback：当前歌曲、队列、播放状态、进度、音质。
  - providers：网易云/QQ 登录状态、用户资料、歌单、喜欢状态。
  - visualFx：预设、颜色、歌词参数、性能参数、用户存档。
  - shelf3d：3D 歌单架状态、布局、详情页、滚动和选中。
  - uiShell：面板显隐、全屏、引导、toast、modal。
  - update：更新检测、下载、进度和错误。
- Canvas/WebGL/GSAP/Three.js 视觉引擎：
  - 启动页 WebGL。
  - 主视觉粒子/封面/歌词/3D 歌单架。
  - 登录引导和 idle canvas。
  - GSAP 动画。
- 浏览器存储：
  - localStorage 保存视觉布局、用户存档、引导状态等。

迁移建议：

- 先不重写视觉引擎，先抽出 `visual-engine` 包装层，把旧函数搬进隔离模块。
- React 负责 UI 壳和状态绑定，Canvas/WebGL 仍使用 imperative engine。
- Zustand store 只保存状态和动作，不直接持有大量 DOM。

## 目标栈映射

| 现有职责 | 目标位置 |
| --- | --- |
| Electron main 窗口/IPC | Tauri 2 Rust commands + window APIs |
| Electron preload API | Tauri `invoke` 封装层 |
| Node `server.js` 音乐 API | Bun sidecar runtime |
| NeteaseCloudMusicApi | Bun sidecar |
| QQ 音乐手写请求 | Bun sidecar provider |
| 静态资源服务 | Vite build / Tauri assets |
| `public/index.html` UI | React + TypeScript |
| localStorage 散落状态 | Zustand store + zod persistence schema |
| Canvas/WebGL/GSAP | 独立 visual engine 模块 |
| 旧 GitHub 更新/补丁 | Tauri updater |
| NSIS installer | Tauri bundle / Windows installer 策略另定 |

## 必须保留的行为

- 现有 Electron 版本作为视觉和行为参考基线保留。
- 登录、搜索、播放、歌词、歌单、视觉预设、3D 歌单架、更新入口不能在未验证的新栈里一次性替换。
- Tauri 最终对外发布前必须达到原项目完整能力。
- 视觉迁移最终效果必须与 Electron baseline 一模一样，包括像素结果、动画节奏和交互手感。
- 旧文档清洗结果保持：不恢复 AI handoff、长篇 project memory、硬编码路径入口。

## 第一批不迁移内容

- 不迁移轻量 patch JSON 应用逻辑。
- 不迁移旧 Electron 用户数据到新二开项目。
- 不优先迁移 Wallpaper Engine 深联动或实验壁纸能力。
- 不立刻重写 3D 歌单架算法。
- 不立刻替换 NeteaseCloudMusicApi。
- 不引入服务端数据库。
