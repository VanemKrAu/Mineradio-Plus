# Electron Baseline Freeze Record

更新时间：2026-06-27

本文记录 Tauri 迁移前的 Electron baseline 冻结证据。大型截图、录屏和临时验证产物放在被 `.gitignore` 忽略的 `verification/` 目录，不直接提交进仓库。

## Baseline 引用

- Baseline tag：`electron-baseline-2026-06-27`
- Baseline commit：`ced5ec61ce5241371da36abd82cbebec2868e92c`
- Baseline commit 时间：`2026-06-26 00:07:19 +0800`
- Baseline commit 标题：`Allow safe 1.1.1 overwrite of Mineradio folders`
- 采集日期：`2026-06-27`
- 当前工作区分支：`main`
- 说明：tag 指向当前提交基线；未提交的迁移文档和资料清理改动没有进入该 tag。

## 环境

- 操作系统：`Microsoft Windows 11 家庭版 中文版 10.0.26200 Build 26200`
- Node.js：`v24.15.0`
- npm：`11.12.1`
- Electron baseline 启动脚本：`npm start`
- Electron baseline Windows 构建脚本：`npm run build:win:dir`、`npm run build:win`

## 验证命令

```powershell
git diff --check
```

结果：`PASS`

```powershell
node --check server.js
```

结果：`PASS`

## Artifact 目录

- 本地目录：`D:\项目\Mineradio\verification\baseline\2026-06-27-ced5ec61`
- Git 忽略规则：`.gitignore:46:verification/`

## 待采集视觉和行为证据

| Evidence | 建议文件名 | 状态 |
| --- | --- | --- |
| 默认视觉存档 | `default-visual-preset.json` | 未采集 |
| 主界面静态截图 | `main-window.png` | 未采集 |
| 启动动画录屏 | `startup-animation.mp4` | 未采集 |
| 播放中控制台截图 | `playing-console.png` | 未采集 |
| 播放中控制台录屏 | `playing-console.mp4` | 未采集 |
| 视觉控制台打开状态截图 | `visual-console-open.png` | 未采集 |
| 3D 歌单架打开/滚动/详情/点击播放录屏 | `playlist-shelf-flow.mp4` | 未采集 |
| 桌面歌词开启/锁定/解锁/拖动录屏 | `desktop-lyrics-flow.mp4` | 未采集 |
| 测试歌曲、封面、歌词和窗口尺寸 | `test-fixture-notes.md` | 未采集 |

## 下一步

1. 安装依赖或确认现有依赖可用。
2. 启动 Electron baseline：`npm start`。
3. 按 `docs/migration/CAPABILITY_PARITY_CHECKLIST.md` 的 Baseline Freeze 项逐个采集证据。
4. 采集完成后更新本文件状态和 capability checklist。
