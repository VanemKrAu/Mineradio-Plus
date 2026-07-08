你是 Reasonix，在维护 Mineradio+，一个基于 Electron 的个人修改版音乐播放器。

## 项目路径
E:\WorkSpace\Mineradio+

## 技术栈
- Node.js v24, npm, bash on Windows
- Electron 42.4.1
- gh CLI 已登录，仓库 VanemKrAu/Mineradio-Plus

## ⚠️ 关键约束（违反即事故）

### 文件编辑
- `public/js/app.js`（1.1MB）和 `public/css/app.css`（219KB）是拆分后的独立文件
- 改 CSS → `public/css/app.css`，改 JS → `public/js/app.js`
- 改同一文件两次需先 `read_file` 刷新，否则 `edit_file` 的 old_string 锚点会过期
- `multi_edit` 可以在一次调用中改多处

### Shell
- Windows 路径用正斜杠 `/` 或 `E:/WorkSpace/...`
- bash heredoc 里不要写反引号 `\`` 会因 JS 模板字符串冲突
- 复杂 node 脚本用 `write_file` 写 `.js` 文件再 `node xxx.js`
- Python 不可用，全部用 node.js

### Git
- 提交：`git add -A && git commit -m "..." && git push origin main`
- 标签：`git tag -d v1.1.1-X && git push origin :refs/tags/v1.1.1-X && git tag v1.1.1-X && git push origin v1.1.1-X`
- 不要提交 `.kugou-cookie*` 文件
- 版本号在 `package.json`

## 关键文件

| 文件 | 大小 | 说明 |
|------|------|------|
| `public/index.html` | 60KB | HTML 骨架 + `<link>` + `<script>` |
| `public/css/app.css` | 219KB | 所有 `<style>` 块（从原先的 1.5MB index.html 拆出来的） |
| `public/js/app.js` | 1.1MB | 所有 `<script>` 块 |
| `public/wallpaper.html` | ~8KB | PKG 壁纸 WebGL 渲染（独立 Electron 窗口，仅桌面壁纸模式用） |
| `server.js` | ~170KB | Express 后端 |
| `server-kugou.js` | ~27KB | 酷狗标准版 API 模块 |
| `desktop/main.js` | ~60KB | Electron 主进程 |
| `desktop/wallpaper-scanner.js` | ~15KB | Wallpaper Engine PKG 扫描/解析 |

## 当前版本与状态

### 已推送到 GitHub 的稳定版
版本 `v1.1.1-7`（commit `185d518`），`dist/Mineradio+-1.1.1-7-Setup.exe` 安装包已构建。

### 已实现的功能

**FX 面板穿透防护（7 道防线）：**
1. `public/css/app.css`：`body.fx-panel-open #playlist-panel *` 等 pointer-events:none
2-5. `public/js/app.js` animate() 渲染循环 4 道门控：parallax → 0、shelfManager 跳过、updateCinema 跳过、tickGestureRotation 跳过（均检查 `fx-panel-open || emptyHomeActive`）
6. mousemove 处理器门控：检测 `fx-panel-open || emptyHomeActive` 时 return
7. `toggleFxPanel` + `setPeek` 管理 `fx-panel-open` body 类 + `clearCenteredViewOffsets()`

**其他修复：**
- 星河预设双击回正斜视角（theta=-0.52 → 0.0）
- 管理热评/导入图片弹窗 CSS
- 图片裁切 NaN + 拉伸（lastMX/lastMY + cover 模式）
- KRC 歌词解密
- 主页歌单架静止（emptyHomeActive 门控）
- FX 面板点击空白处关闭 + FAB 切换关闭 + 手动关闭冷却
- 壁纸按创建时间倒序排列
- 壁纸分级过滤级联逻辑

**PKG 壁纸多层渲染（开发中，有 bug）：**
- `public/js/app.js` 末尾有一段 `window.pkgBg` WebGL 渲染代码
- 选择 PKG 壁纸后自动调用 `extractWallpaperScene` → `loadScene`
- 37 层纹理全部加载成功（日志已确认 `[PKG] DONE: 36 textures`）
- `render()` 挂在 animate() 循环中（line 25145）
- **当前问题：纹理加载到 GPU 但不显示**（可能是 z-index 或被 3D 场景遮挡）
- 最新 commit 加了调试日志 `[PKG] render: drew X layers`，render 失败时画布显示绿色
- W/E/Q 快捷键已就绪（`pkgBgToggleEdit` 等函数可用）

## 已知待修

1. **PKG 多层渲染背景不显示** — 36 层纹理加载成功但不可见
2. 歌词 KRC 只返回 base64，时间戳未解析
3. 酷狗搜索结果没专辑封面
4. SMTC 进度条未实现
5. `pkg-bg.js:1 Failed to load resource: the server responded with a status of 404` — 残留的 pkg-bg.js 引用（文件已删除）

## 操作命令

```bash
npm start          # 启动 Electron（先确保全部 electron.exe 进程已杀掉）
npm run build:win  # 打包安装包
```

欢迎页卡死：`taskkill //F //IM electron.exe` 然后重新 `npm start`
