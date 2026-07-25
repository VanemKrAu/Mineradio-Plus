# Mineradio+ 完整交接文档

> 基于 Mineradio v2.0.2（XxHuberrr/Mineradio）的个人修改版。
> 代码在 main 分支，原版在 original-v2.0.2 分支。
> GitHub: VanemKrAu/Mineradio-Plus

---

## 一、修改总览（与原版的 diff）

```
24 files changed, 1358 insertions(+), 159 deletions(-)
```

---

## 二、各功能详细说明

### 功能 1：热评卡片壁纸视频导入

**目标**：主页热评卡片新增「壁纸视频」按钮，点击打开 WE 壁纸库，选择壁纸后提取视频/纹理，裁切后设为热评卡片背景。

#### 用户要求
- PKG 壁纸用 RePKG 解包提取，不用 WE 引擎捕获
- 单层纹理 → 提取图片；有视频 → 提取视频；多层纹理 → 提示不支持
- 不用预览图（分辨率低）
- 裁切比例按热评卡片实际宽高比，不硬编码 3:4
- 裁切后保存到热评卡片（不是播放器背景）

#### 实现方式

**① 入口按钮**（`public/index.html` 和 `03a-home-dashboard.js`）
- 热评卡片静态 HTML 和动态渲染都加了「壁纸视频」按钮
- 点击调 `openWeForDailyReviewVideo()`

**② 模式切换**（`03-wallpaper-engine-library.js`）
- `wpWePickerMode` 变量：`'apply'`（播放器壁纸）或 `'daily-review-video'`（热评卡片）
- `openWeForDailyReviewVideo()` → 设 mode → 打开 WE 库

**③ 壁纸选择**（`03-wallpaper-engine-library.js` `activateWallpaperEngineItem`）
- 检测 `wpWePickerMode === 'daily-review-video'`：
  - PKG 壁纸（`enginePlayable`）→ `extractWePkgForDailyReview(item)`
  - 非 PKG 壁纸 → fetch 媒体文件直接裁切
  - **不碰** `wallpaperEngineSelection`、`applyWallpaperEngineBackground`、`saveWallpaperEngineSelection`

**④ PKG 解包**（`03-wallpaper-engine-library.js` `extractWePkgForDailyReview`）
1. `api.getWallpaperEngineProjectDetails(item.id)` → 拿 folderPath
2. `api.extractWallpaperScene(folderPath)` → RePKG 解包
3. 有视频 → `api.readWallpaperFile(videoPath)` → fetch(dataUrl) → blob → File → `openHomeDashboardVideoCrop(file)`
4. 单层纹理 → 同上走图片
5. 多层纹理 → 提示不支持

**⑤ 后端 IPC**（`desktop/main.js`）
- `mineradio-wallpaper-extract-scene` → `wallpaperScanner.extractWallpaperScene(folderPath)`
- `mineradio-wallpaper-read-file` → 小文件返回 base64 dataUrl，大文件（>50MB）返回 HTTP proxy URL
- `mineradio-wallpaper-engine-project-root` → 获取 WE 项目路径

**⑥ 后端文件**（`desktop/wallpaper-scanner.js`）
- 从 v1.1.1-9 复制，含 `extractWallpaperScene`、`extractPkgToCache`、`walkDir`、`parseSceneJson`
- `REPKG_EXE` 指向 `build/tools/RePKG.exe`
- `extractPkgToCache` 在 `folderPath/_repkg_cache/.done` 缓存解包结果

**⑦ RePKG**（`build/tools/`）
- 从 LX 源码 `lx-1.5.5_extracted/resources/app/bin/repkg/RePKG.exe` 复制
- 支持 `extract -s`（flat）和 `extract -o`（organized）两种模式

**⑧ HTTP 文件服务**（`server.js` `/api/wallpaper/serve-extracted`）
- Range 请求支持
- 路径安全检查（必须含 `_repkg_cache`）
- 大文件流式返回

**⑨ 桥接**（`desktop/preload.js`）
- `extractWallpaperScene: (folderPath) => ipcRenderer.invoke(...)`
- `readWallpaperFile: (filePath) => ipcRenderer.invoke(...)`

**⑩ 路径暴露**（`desktop/wallpaper-engine-library.js` `getProjectDetails`）
- 返回值加 `folderPath: record.projectRoot`

**⑪ 裁切对话框**（`03a-home-dashboard.js` `openHomeDashboardVideoCrop`）
- 同时支持图片（`<Image>`）和视频（`<video>`）
- canvas 宽高比按热评卡片实际 `getBoundingClientRect()` 计算
- 拖拽调整位置 + 缩放滑块（1x–3x）
- 保存时计算 `object-position: opx% opy%` + `transform: scale(zoom)`
- blob 存 IndexedDB（`homeDashboardPutVideoBlob`）
- 元数据存 localStorage（`HOME_DASHBOARD_VIDEO_META_KEY`）
- 保存后刷新 `renderHomeDashboardHero()`
- 保存前清 `homeDashboardVideoObjectUrl = ''`（防止旧视频阻挡）

**⑫ 热评卡片显示**（`03a-home-dashboard.js` `homeDashboardAttachVideo`）
- 读取 blob 后检查 `blob.type`，视频创建 `<video>`，图片创建 `<img>`
- 应用 `transform: scale(zoom)` + `objectPosition: opx% opy%`
- `homeDashboardReadVideoMeta` 放宽校验（去掉文件名/类型限制）

**⑬ 清理工作**
- `homeDashboardVideoShouldPlay` 条件检查 `emptyHomeActive` 和 `body.empty-home-active`
- 如果条件不满足，`homeDashboardReleaseVideoSource` 会移除视频元素
- `homeDashboardVideoLoadToken` 递增机制防止竞争条件

---

### 功能 2：年龄分级筛选

**目标**：WE 壁纸库新增年龄分级下拉框，选择后只显示对应分级的壁纸，选择持久化到下次打开。

#### 用户要求
- 下拉框而非按钮组（和老版一致）
- 选项：全部、全年龄、可疑、成人
- 选择后持久化（localStorage）
- 下拉框样式与工具栏其他按钮一致（`.fx-mini-btn ghost`）

#### 实现方式

**① 状态变量**（`03-wallpaper-engine-library.js`）
```js
var wallpaperEngineRatingFilter = 'all';
```

**② 数据源**（`desktop/wallpaper-engine-library.js` `indexProject`）
- 读取 `project.contentrating` 存入 `contentRating` 字段
- 值：`Everyone`、`Questionable`、`Mature`，默认 `Everyone`

**③ 前端归一化**（`03-wallpaper-engine-library.js` `normalizeWallpaperEngineProject`）
```js
contentRating: ['Everyone','Questionable','Mature'].indexOf(item.contentRating) >= 0 ? item.contentRating : 'Everyone'
```

**④ 过滤**（`wallpaperEngineFilteredProjects`）
```js
if (rating !== 'all') {
    if (!item.contentRating || item.contentRating !== rating) return false;
}
```

**⑤ 下拉 UI**（`public/index.html` 工具栏）
```html
<div class="we-rating-dropdown" id="we-rating-dropdown">
  <button class="fx-mini-btn ghost" id="we-rating-dropdown-btn">
    <span id="we-rating-label">全部</span> ▾
  </button>
  <div id="we-rating-menu" style="display:none">
    <button class="we-rating-item" data-we-rating="all">全部</button>
    <button class="we-rating-item" data-we-rating="Everyone">全年龄</button>
    <button class="we-rating-item" data-we-rating="Questionable">可疑</button>
    <button class="we-rating-item" data-we-rating="Mature">成人</button>
  </div>
</div>
```

**⑥ 设置筛选**（`setWeRatingFilter`）
- 更新 `wallpaperEngineRatingFilter`
- `localStorage.setItem('mineradio-we-rating-filter', rating)`
- 更新标签文字和 active 状态
- 关闭下拉菜单
- `renderWallpaperEngineLibrary()`

**⑦ 事件绑定**（模块加载时执行 IIFE）
- 点击按钮切换菜单显示/隐藏
- 点击菜单项调 `setWeRatingFilter`
- 点击页面其他位置关闭菜单

**⑧ 持久化恢复**（`openWallpaperEngineLibrary`）
- 从 localStorage 读取 `mineradio-we-rating-filter`
- 同步标签文字和按钮 active 状态

**⑨ 卡片标签**（`renderWallpaperEngineLibrary` 中的 meta）
```html
<small>项目类型 · 分级</small>
```
分级由 `weRatingLabel(item.contentRating)` 生成。

**⑩ 标签函数**
```js
function weRatingLabel(value) {
  return ({ Everyone: '全年龄', Questionable: '可疑', Mature: '成人' })[value] || '';
}
```

---

### 功能 3：托盘功能增强

**目标**：系统托盘的菜单更丰富，显示当前歌曲、播放控制、音量、开机自启等。

#### 实现方式

**① 状态变量**（`desktop/main.js`）
```js
let trayPlaybackState = { title: '', artist: '', playing: false, volume: 100 };
let startupLaunchEnabled = false;
```

**② 菜单构建**（`createOrUpdateTray`）
- 歌曲信息（只读，截断 80 字符）
- 播放/暂停、上一曲、下一曲
- 音量子菜单（+10%、-10%、静音）
- 分隔线
- 显示窗口、退出桌面模式
- 分隔线
- 关闭到托盘（checkbox）
- 开机自启（checkbox）
- 退出

**③ IPC 处理**
- `mineradio-tray-get-settings` → 返回 `{ closeToTray, startup }`
- `mineradio-tray-set-close-to-tray` → 切换关闭行为，持久化到 `desktop-shell.json`
- `mineradio-tray-update-playback` → 更新 `trayPlaybackState` + 刷新菜单
- `mineradio-tray-set-startup-launch` → `app.setLoginItemSettings({ openAtLogin })`

**④ 前端同步**（`14-player-controls.js`）
- `syncTrayPlaybackState()` — 读取当前播放状态，调 `api.updateTrayPlayback(...)`
- 在 `togglePlay`、`nextTrack`、`prevTrack`、`setVolume` 中调用
- 在 `completeAudioPlayStart` 和 `resumePausedAudioFast` 中 `playing=true` 时调用
- 托盘命令监听 — `onTrayCommand` → 调 `togglePlay`/`prevTrack`/`nextTrack`/`setVolume`/`toggleMute`

**⑤ 桥接**（`desktop/preload.js`）
```js
getTraySettings: () => ipcRenderer.invoke('mineradio-tray-get-settings'),
setCloseToTray: (enabled) => ipcRenderer.invoke('mineradio-tray-set-close-to-tray', !!enabled),
setStartupEnabled: (enabled) => ipcRenderer.invoke('mineradio-tray-set-startup-launch', !!enabled),
updateTrayPlayback: (state) => ipcRenderer.invoke('mineradio-tray-update-playback', state || {}),
onTrayCommand: (callback) => { /* ipcRenderer.on('mineradio-tray-command', ...) */ },
```

---

### 功能 4：壁纸排序修改

**排序规则**（`wallpaperEngineFilteredProjects`）：
1. 收藏置顶（`favoriteWallpaperEngineIds`）
2. 目录创建时间倒序（`updatedAt`，来自 `dirStat.birthtimeMs`）
3. 名称倒序（Z→A）

```js
.sort(function (a, b) {
    var fa = favoriteWallpaperEngineIds.has(a.id) ? 1 : 0;
    var fb = favoriteWallpaperEngineIds.has(b.id) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    var ua = Number(a.updatedAt) || 0, ub = Number(b.updatedAt) || 0;
    if (ua !== ub) return ub - ua;
    var ta = (a.title || '').toLowerCase(), tb = (b.title || '').toLowerCase();
    if (ta > tb) return -1;
    if (ta < tb) return 1;
})
```

---

### 功能 5：其他修改

- 移除壁纸库「隐藏壁纸」按钮（`×` 按钮和「恢复隐藏」按钮）
- 品牌名称改为 Mineradio+（package.json、index.html、README、LICENSE 等）
- 安装包名改为 `Mineradio+-{version}-Setup.exe`
- splash 页面加 `+` 标记

---

## 三、用户明确提出的要求（未完全实现）

1. **热评卡片壁纸需要和播放器 PKG 壁纸同等质量** — 当前单层纹理走 RePKG 解包提取图片，质量取决于原始纹理。播放器壁纸是 WE 引擎实时渲染，画质更好。如果要完全一样需要启动 WE 引擎截帧（被用户否决过）
2. **裁切对话框的 UI** — 用户觉得裁切窗口太大（后改小了），但未具体确认当前 UI 是否满意
3. **热评卡片保存后不显示的问题** — 曾反复出现，涉及 `homeDashboardVideoObjectUrl` 旧值阻挡、`homeDashboardVideoLoadToken` 竞争条件、`video.addEventListener` 在图片分支上未定义等，已修复
4. **热评卡片导入壁纸后的保存流程** — 保存后调 `renderHomeDashboardHero()` → `homeDashboardUpdateVideoPower()` → `homeDashboardAttachVideo()`
5. **年龄分级后端数据** — 从 `project.json` 的 `contentrating` 字段读取，不是从 `safetyMode` 推断

---

## 四、代码分支说明

```
main (当前修改版)
  └── 727c7ad v2.0.2 original upstream → b25950a → d8f88ce → a49642a → 348cdfc → 790988c

original-v2.0.2（原版，只包含 727c7ad）
```

---

## 五、构建和运行

```bash
npm install
npm start           # 开发运行
npm run build:win    # 打包 NSIS 安装包
```

---

## 六、关键文件清单

| 文件 | 说明 | 行数 |
|------|------|------|
| `desktop/main.js` | Electron 主进程，IPC 处理 + 托盘 | ~6200 |
| `desktop/preload.js` | IPC 桥接 | ~125 |
| `desktop/wallpaper-engine-library.js` | WE 库后端（索引/协议） | ~905 |
| `desktop/wallpaper-engine-runtime.js` | WE 运行时（进程/DWM） | ~4050 |
| `desktop/wallpaper-scanner.js` | PKG 解包/纹理提取 | ~695 |
| `server.js` | HTTP 服务器 | ~7295 |
| `public/index.html` | 主页 HTML | ~1850 |
| `public/js/modules/07-fx/03-wallpaper-engine-library.js` | WE 壁纸库前端 | ~2480 |
| `public/js/modules/05-playback/03a-home-dashboard.js` | 主页热评卡片 | ~1430 |
| `public/js/modules/05-playback/14-player-controls.js` | 播放控制 | ~790 |
| `public/js/modules/05-playback/08-audio-graph-controls.js` | 音量控制 | ~746 |
| `public/css/index.css` | 样式 | ~17825 |
| `build/tools/RePKG.exe` | PKG 解包工具 | — |
