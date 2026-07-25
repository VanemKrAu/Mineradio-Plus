# Mineradio+ 项目提示词

## 项目概览

Mineradio+ 是基于 Mineradio v2.0.2（XxHuberrr/Mineradio）的个人修改增强版。沉浸式音乐播放器，融合天气电台、歌词舞台、粒子视觉和 3D 歌单架。

- **项目路径**: `E:\WorkSpace\Mineradio+\`
- **原版路径**: `E:\WorkSpace\Mineradio\`（XxHuberrr 原版，对比参考用）
- **GitHub**: `VanemKrAu/Mineradio-Plus`
- **版本**: v2.0.2-1
- **Node**: v24.18.0 / npm 11.16.0

## 分支结构

| 分支 | 内容 |
|------|------|
| `main` | Mineradio+ 修改版 |
| `original-v2.0.2` | XxHuberrr/Mineradio 原版代码（未修改） |

## 核心架构（原版 v2.0.2 模块化）

```
server.js                    — 主服务器（路由分发）
desktop/main.js              — Electron 主进程（窗口/托盘/壁纸/登录）
desktop/preload.js           — IPC 桥接
public/js/modules/           — 模块化前端（110+ 文件）
  ├── 00-state/              — 核心状态
  ├── 01-scene/              — 3D 场景/相机
  ├── 02-visual/             — 视觉效果/歌词
  ├── 03-beat/               — 节拍分析
  ├── 04-shelf/              — 3D 歌单架
  ├── 05-playback/           — 播放控制/搜索/队列
  │   ├── 03a-home-dashboard.js  ← 主页热评卡片
  │   └── 14-player-controls.js  ← 播放控制（tray 同步）
  ├── 06-lyrics/             — 歌词/面板
  ├── 07-fx/                 — FX 面板/壁纸库
  │   └── 03-wallpaper-engine-library.js  ← WE 壁纸库前端
  ├── 08-account/            — 登录/更新
  ├── 09-idle-toast/         — Toast 通知
  ├── 10-shell/              — 手势/面板/启动
  └── 11-main-loop.js        — 主循环
public/css/index.css          — 样式（18K 行）
public/index.html             — 主页面
```

## 四平台登录体系

| 平台 | 登录方式 | Cookie 文件 |
|------|---------|------------|
| 网易云 | QR扫码 | `.cookie` |
| QQ 音乐 | WebView 扫码 | `.qq-cookie` |
| 酷狗音乐 | WebView 扫码 | `.kugou-cookie` |
| 汽水音乐 | sessionid 粘贴 / 本地发现 | `.qishui-cookie` |

## 已完成的 Mineradio+ 修改

### 1. 热评卡片壁纸视频导入
- `03-wallpaper-engine-library.js`:
  - `openWeForDailyReviewVideo()` — 设置 mode 后打开 WE 库
  - `extractWePkgForDailyReview()` — PKG 解包全流程
  - `dataUrlToFile()` — dataUrl 转 File
  - `activateWallpaperEngineItem` 新增 `daily-review-video` 分支
- `03a-home-dashboard.js`:
  - `openHomeDashboardVideoCrop()` — 裁切对话框（同时支持图片和视频）
  - `homeDashboardAttachVideo` — 添加 zoom/objectPosition 支持、图片/视频分支
  - `homeDashboardReadVideoMeta` — 放宽校验
- `desktop/main.js`: 新增 `mineradio-wallpaper-extract-scene`、`mineradio-wallpaper-read-file` IPC
- `desktop/preload.js`: 新增桥接方法
- `desktop/wallpaper-scanner.js`: 从 v1.1.1-9 复制
- `build/tools/RePKG.exe` + DLLs: 从 LX 源码复制
- `desktop/wallpaper-engine-library.js`: `getProjectDetails` 加 `folderPath`
- `server.js`: 新增 `/api/wallpaper/serve-extracted` 路由

### 2. 年龄分级筛选
- `wallpaperEngineRatingFilter` 状态变量
- `setWeRatingFilter()` + 下拉框 UI（持久化到 localStorage）
- `wallpaperEngineFilteredProjects` 按 `contentRating` 过滤
- 卡片显示分级标签
- 后端 `indexProject` 读取 `project.contentrating`

### 3. 托盘功能增强
- 当前歌曲信息、播放控制、音量调节、开机自启
- `createOrUpdateTray()` 重写
- `mineradio-tray-update-playback` IPC
- `14-player-controls.js` 添加 `syncTrayPlaybackState()`

### 4. 其他修改
- 移除壁纸库「隐藏壁纸」按钮及相关功能
- 品牌名称改为 Mineradio+，版本 2.0.2-1

## 未完成/已知问题

1. 热评卡片单层纹理壁纸已支持，多层纹理暂不可用
2. 播放器壁纸首次加载有 1-3 秒延迟（原版行为）
3. 热评卡片壁纸视频裁切保存后热评卡片显示问题（可能需要进一步调试）

## 开发规范

- **语法检查**: `node -c <file>` 验证每个修改过的 JS 文件
- **版本号**: 基于 2.0.2-1 递增
- **原版参考**: `E:\WorkSpace\Mineradio\`（XxHuberrr 原版）
- **旧版参考**: `E:\WorkSpace\Mineradio+_v1.1.1-9\`（旧版 Mineradio+）
- **Git 提交**: `git add <files> && git commit --no-verify -m "msg" && git push`
- **预提交钩子**: 有 gitleaks 检查，可能需 `--no-verify`

## 关键文件索引

| 功能 | 文件 | 行数 |
|------|------|------|
| WE 壁纸库前端 | `public/js/modules/07-fx/03-wallpaper-engine-library.js` | ~2460 |
| 主页热评卡片 | `public/js/modules/05-playback/03a-home-dashboard.js` | ~1425 |
| 播放控制 | `public/js/modules/05-playback/14-player-controls.js` | ~790 |
| 音频控制 | `public/js/modules/05-playback/08-audio-graph-controls.js` | ~746 |
| 主进程 | `desktop/main.js` | ~6200 |
| 预加载桥 | `desktop/preload.js` | ~125 |
| WE 库后端 | `desktop/wallpaper-engine-library.js` | ~905 |
| WE 运行时 | `desktop/wallpaper-engine-runtime.js` | ~4050 |
| 壁纸扫描器 | `desktop/wallpaper-scanner.js` | ~695 |
| 服务器 | `server.js` | ~7295 |
| 样式 | `public/css/index.css` | ~17825 |
| 主页 HTML | `public/index.html` | ~1850 |
