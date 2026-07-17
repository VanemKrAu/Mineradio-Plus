# Mineradio+ 新会话提示词

## 当前状态

项目路径：`E:\WorkSpace\Mineradio+\`
GitHub：`https://github.com/VanemKrAu/Mineradio-Plus.git`（branch: main, commit: db05c8f v1.1.2）
本地有未提交的修改（`public/js/app.js` + `public/css/app.css`），代码已部分改动。

## 必须遵守的规则

1. **不动主页** — 任何改动不能影响主页布局和功能
2. **不动 wallpaper 核心功能** — PKG 多层壁纸渲染不能破坏
3. **只动 FX 面板内的功能**
4. **声境预设回正视角**：`radius=7.5, phi=0.15, theta=0.0`
5. **星河预设回正视角**：`radius=6.6, phi=0.08, theta=0.0`（保持原版）
6. **歌词动画只在播放界面显示**，不能遮挡 FX 面板
7. **壁纸星标按钮在右上角**
8. **不要动壁纸功能的渲染逻辑**
9. **不要动已有功能：只追加，不修改现有逻辑**
10. **用 Node .cjs 脚本注入**，不用 edit_file（app.js 1.1MB 太大）
11. **每次修改后 node -c app.js 验证语法**

## ✅ 已修复的 Bug（2026-07-17 v2）

### Bug 1：预设持久化不生效 ✅ 已修复（加强版 v2）
- **根因**：
  1. `readSavedPlaybackVisualPreset()` 中 schema guard 把 7-10 重置为 5
  2. `activateHomeWallpaperPreview` 不保存 `homeVisualPrevPreset`（永远是 0）
  3. `applyStartupStarfieldPreset` 用 `noSave:true` 不触发持久化
- **修复（5 项）**：
  1. 移除 schema guard（line 723）
  2. `fx.preset` fallback（line 13870）
  3. `activateHomeWallpaperPreview` 保存 `playbackVisualPreset` 到 `homeVisualPrevPreset`（line 13823）
  4. `applyStartupStarfieldPreset` 末尾主动调 `saveLyricLayout()`（line 13885）
  5. `readSavedPlaybackVisualPreset` 增加 NaN/Infinity 防护（line 721）
- **诊断**：`window.__presetDebug` 对象可在 DevTools 中检查 save/load/override 链路

### Bug 2：壁纸选择器回顶按钮 ✅ 已修复（UI 重设计）
- **修复**：
  1. 双重 scroll 监听器（dialog + grid）+ 1200ms 延迟重检查
  2. **UI 重设计**：用 `.wp-scroll-top-btn` CSS class 替代硬编码蓝色
     - 主题色：`--fc-accent` (#00F5D4) 替代 `rgba(91,141,239)`
     - 毛玻璃：`backdrop-filter: blur(16px) saturate(1.12)`
     - 渐变背景 + 14px 圆角 + 内阴影
     - hover/active 过渡动画匹配 app 按钮风格

## LX 版研究参考

- **LX v1.5.5 源码**：`E:\WorkSpace\lx-1.5.5_extracted\resources\app\`
- **LX v1.1.6 APK 解密源码**：`E:\WorkSpace\apk-decrypted\`
- **MENC 解密密钥**：`Sp1eca@Minerad1o#2024$SecureAssetKey!` → SHA-256 → AES-256-CBC

LX 版已发现但未移植的功能（详见 `RESEARCH-FINDINGS.md`）：
- `lx-search.js`（283行）：多源音乐搜索引擎（tx/wy/kw/kg/mg 五音源）— ⭐⭐⭐⭐⭐ 可移植
- `lx-source-host.js`（1085行）：源托管框架（VM 沙箱）— ⭐⭐⭐⭐ 可移植
- `platform-playlist-import.js`（2245行）：9 平台歌单导入 — ⭐⭐⭐⭐⭐ 可移植
- `wallpaper-converter.js`（255行）：FFmpeg 壁纸转换 — ⭐⭐⭐⭐ 可移植
- `lyric-animation.js`（21532行）：8 模式歌词动画 — ⭐⭐⭐⭐ 可移植
- `terrain-audio.js` + `terrain-beat-detector.js`：10 频段音频分析 — ⭐⭐⭐ 可移植
- `terrain-ground-eq.js`：8 频段 EQ + 浮动方块 — ⭐⭐⭐ 可移植
- `terrain-layer.js`：涟漪 + 流星 + 粒子系统 — ⭐⭐⭐ 可移植
- `dj-analyzer.js`（33794行）：BPM 检测 + 节拍图 — ⭐⭐⭐ 可移植
- **32 个 API 端点**（Mineradio+ 缺少：lx-source, platform-lyric, daily-hot, image-proxy, wallpaper-capture 等）

## 当前已完成的功能（确认正常）

- 海啸/龙卷风/行星/声境 4 个新预设（GLSL 着色器 + 相机基线）
- presetMeta 11 项 + presetIcons 11 项 + presetDisplayOrder
- 壁纸星标收藏（★/☆ 按钮 + 置顶排序 + localStorage）
- 歌词翻译（tlyric 解析 + 换行显示）
- 多句歌词（LX 风格 5 行独立 mesh 级联）
- 歌词动画系统（8 模式 + 桥接 + 互斥 + 持久化）
- EQ 均衡器（12 预设 + 信号链连接 initAudio）
- FX 面板控件（沉浸全屏 toggle + 桌面歌词行数/对齐/位置预设）
- 托盘功能（动态菜单 + 播放同步 + 防误触 + 开机启动 IPC）
- isWallpaperCoverFocusMode stub
- RePKG.exe 3.9MB 自包含版
- 开发壁纸透明度滑块解锁
