# Mineradio+

![Mineradio+ 暗场启动页](./docs/assets/readme/cinema-beat-smoke.png)

Mineradio+ 是基于 Mineradio v2.0.2 的个人修改增强版。沉浸式音乐播放器，融合天气电台、歌词舞台、粒子视觉和 3D 歌单架。

## 立即下载 Windows 安装包

| 下载入口 | 推荐人群 | 链接 |
| --- | --- | --- |
| GitHub Release | 所有用户 | [Mineradio+ 2.0.2-1 Release](https://github.com/VanemKrAu/Mineradio-Plus/releases/tag/v2.0.2-1) |

安装时只需要下载并运行 `Mineradio+-2.0.2-1-Setup.exe`。不要把 `.blockmap`、`latest.yml` 或 `win-unpacked` 当成正式安装包。

## 下载或安装被拦截怎么办

小众 Electron 桌面软件、未签名安装包有时会被浏览器、Windows Defender 或 SmartScreen 提示风险。请先确认安装包来自上面的 GitHub Release 官方入口，文件名是 `Mineradio+-2.0.2-1-Setup.exe`。

1. 浏览器下载栏提示风险时，打开下载列表，点这条下载右侧的 `...` 三个点，选择 `保留` / `仍要保留` / `显示更多` 后继续保留。
2. Windows SmartScreen 弹出蓝色拦截窗口时，点 `更多信息`，再点 `仍要运行`。
3. 如果杀毒软件明确显示木马、高危或已经隔离，不要强行运行；删除该文件后重新从 GitHub Release 下载，仍然异常请带截图反馈给作者。

## 当前版本

当前版本：`2.0.2-1`

状态：Mineradio+ 基于 Mineradio v2.0.2 的修改版。

## 核心特性

- 多平台音乐搜索与播放 — 网易云音乐、QQ 音乐、酷狗音乐、汽水音乐聚合搜索，自动换源
- 扫码登录 — 网易云 / QQ / 酷狗 / 汽水扫码登录，cookie 持久化
- 歌词舞台 — 粒子歌词、3D 空间歌词、桌面歌词、歌词翻译与动画
- 视觉效果 — 粒子系统、节拍分析、GLSL 着色器、自定义背景
- 桌面壁纸模式 — 把播放器嵌入 Windows 桌面（WorkerW/全桌面模式）
- Wallpaper Engine 集成 — 本地索引场景项目，DWM 零拷贝实时渲染，PKG 纹理解包
- 热评卡片壁纸视频导入 — 从 WE 壁纸库选择壁纸，自动 PKG 解包提取视频或纹理，裁切后设为每日热评背景
- 年龄分级筛选 — WE 壁纸库支持按内容分级（全年龄/可疑/成人）筛选，选择持久化
- 3D 歌单架 — 歌单管理、智能推荐、播客
- EQ 均衡器 — 6 频段 + 12 预设
- 托盘增强 — 当前歌曲信息、播放控制、音量调节、开机自启开关

## 使用说明

Windows 用户可以在 GitHub Releases 中下载安装包。

正式分发以 `Mineradio+-2.0.2-1-Setup.exe` 为准，不建议直接使用 `win-unpacked` 目录。安装包会创建桌面快捷方式。

## 开发运行

```bash
npm install
npm start
npm run build:win
```

桌面版入口由 Electron 主进程加载本地服务。`npm run build:win` 会生成 Windows NSIS 安装包，产物位于 `dist/`。

## 更新机制

Mineradio+ 会请求 GitHub Releases latest 检测新版本。远端版本高于本地版本时，应用内更新入口会展示 Release 内容、下载安装包到本机用户数据目录，并通过系统打开安装包。

本地验证更新链路时，可以通过 `MINERADIO_UPDATE_MANIFEST` 指向一个本地 manifest JSON 或 HTTP 地址来模拟线上 Release。

## 第三方音乐平台说明

Mineradio+ 不是网易云音乐、QQ 音乐或腾讯音乐娱乐集团的官方客户端，也不隶属于任何音乐平台。

项目中的第三方平台接入仅用于个人学习、本地客户端体验和用户自有账号的播放辅助。请遵守对应平台的用户协议、版权规则和会员权益规则。项目不会提供绕过付费、绕过会员、破解音质或重新分发音乐内容的能力。

## 用户数据与隐私

登录 Cookie、搜索历史、自定义封面、自定义歌词、节奏分析缓存等数据只应保存在本机用户数据目录或浏览器本地存储中，不应提交到仓库。

更多说明见 [PRIVACY.md](./PRIVACY.md)。

## 致谢

Mineradio+ 基于 [XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio) v2.0.2 修改。感谢 XxHuberrr 的主要设计与打造。

同时感谢小天才e宝、应春日、锋将军、軌跡、林中、骊、风痕、花椰菜🥦在早期体验、测试反馈和发布准备中的帮助。

## 版权与授权

Copyright (C) 2026 VanemKrAu / XxHuberrr.

本项目基于 Mineradio（XxHuberrr）修改，遵循 GPL-3.0 授权。详见 [LICENSE](./LICENSE)。

MR Logo、Mineradio+ 名称、界面视觉设计与原创视觉表达归作者所有；第三方依赖和第三方服务分别遵循其各自授权与服务条款。
