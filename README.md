# Mineradio+

![Mineradio 暗场启动页](./docs/assets/readme/cinema-beat-smoke.png)

Mineradio+ 是基于 Mineradio v2.0.2 的个人修改增强版。沉浸式音乐播放器，融合天气电台、歌词舞台、粒子视觉和 3D 歌单架。

## 立即下载 Windows 安装包

| 下载入口 | 推荐人群 | 链接 |
| --- | --- | --- |
| GitHub Release | 所有用户 | [Mineradio+ 2.0.2-1 Release](https://github.com/VanemKrAu/Mineradio-Plus/releases/tag/v2.0.2-1) |

安装时只需要下载并运行 `Mineradio+-2.0.2-1-Setup.exe`。

## 与原版的区别

Mineradio+ 在原版基础上新增/修改了以下功能：

### 新增功能
- **热评卡片壁纸视频导入** — 从 WE 壁纸库选择壁纸，自动 PKG 解包提取视频或纹理，裁切后设为每日热评背景
- **年龄分级筛选** — WE 壁纸库支持按内容分级（全年龄/可疑/成人）筛选，选择持久化
- **托盘功能增强** — 当前歌曲信息、播放控制、音量调节、开机自启开关

### 修改
- 壁纸排序改为：收藏置顶 → 创建时间倒序 → 名称倒序
- 移除壁纸库「隐藏壁纸」按钮及相关功能
- 品牌名称改为 Mineradio+

### 功能概览
- **多平台音乐搜索与播放** — 网易云音乐、QQ 音乐、酷狗音乐、汽水音乐、Spotify、酷我音乐聚合搜索，自动换源
- **扫码登录** — 网易云 / QQ / 酷狗 / 汽水 / Spotify 扫码登录，cookie 持久化
- **歌词舞台** — 粒子歌词、3D 空间歌词、桌面歌词、歌词翻译与动画
- **视觉效果** — 粒子系统、节拍分析、GLSL 着色器、自定义背景
- **桌面壁纸模式** — 把播放器嵌入 Windows 桌面（WorkerW/全桌面模式）
- **Wallpaper Engine 集成** — 本地索引场景项目，DWM 零拷贝实时渲染，PKG 纹理解包
- **歌单架** — 3D 歌单管理、智能推荐、播客
- **EQ 均衡器** — 6 频段 + 12 预设

## 技术栈

- Electron + Chrome 渲染引擎
- Three.js 3D 场景
- NeteaseCloudMusicApi / QQ Music API / 酷狗 API / 汽水 API / Spotify API
- Wallpaper Engine 原生进程 + DWM 缩略图
- RePKG 纹理解包

## 已知问题

- 热评卡片单层纹理壁纸已支持，多层纹理暂不可用
- 播放器壁纸首次加载有 1-3 秒延迟（原版行为）

## 隐私说明

Mineradio+ 是纯本地应用。项目不应把用户登录状态、Cookie、搜索历史上传到项目方服务器。请阅读 [PRIVACY.md](./PRIVACY.md) 了解更多。

## 版权与授权

本项目基于 Mineradio（XxHuberrr）修改，遵循 GPL-3.0 授权。详见 [LICENSE](./LICENSE)。
