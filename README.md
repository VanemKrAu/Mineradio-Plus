<h1 align="center">Mineradio+</h1>

> **个人修改版** — 基于 [Mineradio](https://github.com/XxHuberrr/Mineradio) v2.0.2（GPL-3.0）修改。
>
> ⚠️ 本项目为个人修改版，仅根据 **本人使用习惯和审美** 进行调整，与他人无关，非官方发布。
>
> 如需原版请访问：[github.com/XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio)

<p align="center">
  <img src="./build/icon.svg" width="256" height="256" alt="Mineradio+" />
</p>

## ✨ 本版改动（v2.0.2-1）

> 基于原版 v2.0.2 模块化架构重构，前端拆分为 110+ 模块文件。

### 🖼 热评卡片壁纸视频导入

- 从 WE 壁纸库选择壁纸，自动 PKG 解包提取视频或纹理
- 裁切对话框（Canvas 实时预览 + 拖拽定位 + 缩放滑块），宽高比按热评卡片实际尺寸计算
- 视频/图片自动识别分支处理，IndexedDB 存储 blob，localStorage 存元数据
- 非 PKG 壁纸直接读取媒体文件，PKG 壁纸使用 RePKG 解包提取
- 单层纹理 → 提取图片；有视频 → 提取视频；多层纹理 → 提示暂不支持

### 📦 PKG 解包提取

- 集成 RePKG，自动解包 scene.pkg 提取 MP4 视频或单层纹理图片
- 缓存机制：`_repkg_cache/.done` 标记，避免重复解包
- 大文件（>50MB）通过 HTTP Range 请求流式代理，不阻塞主进程
- 路径安全检查，仅允许 `_repkg_cache` 目录内的文件访问

### 🔞 年龄分级筛选

- WE 壁纸库工具栏新增下拉筛选（全部/全年龄/可疑/成人）
- 选择持久化到 localStorage，下次打开自动恢复
- 后端读取 `project.json` 的 `contentrating` 字段，前端卡片显示分级标签

### 🎛 托盘功能增强

- 当前歌曲信息显示（标题 + 歌手，截断 80 字符）
- 播放/暂停、上一曲、下一曲控制
- 音量 +10% / -10% / 静音切换
- 关闭到托盘（checkbox）、开机自启（checkbox）

### 🗂 壁纸排序

- 收藏置顶 → 创建时间倒序

### 其他修改

- 应用名称改为 Mineradio+，版本号 2.0.2-1
- 安装包名改为 `Mineradio+-{version}-Setup.exe`
- GitHub 仓库指向 VanemKrAu/Mineradio-Plus
- 移除壁纸库「隐藏壁纸」按钮及相关功能

## 原版核心特性

Mineradio 是一款 Windows 桌面沉浸式音乐播放器，天气电台、搜索播放、歌词舞台、粒子视觉和 3D 歌单架组合成一个更接近现场感的私人音乐空间。

- 首页包含天气电台、每日推荐、私人电台、继续听、听歌画像和我的歌单入口
- 完整桌面模式保留播放器、主页、歌单和桌面交互
- 支持本地 MP4 与 Wallpaper Engine 视觉内容
- 播放后切换到 Emily / 默认播放态视觉，歌词舞台与粒子舞台同步工作
- 基于节奏的电影镜头视觉系统
- 面向长播客和 DJ 曲目的专属视觉模式
- 歌词舞台、自定义歌词、歌词位置与视觉控制
- 自定义专辑封面上传与裁剪
- 右键唤起 3D 歌单架，支持歌单队列浏览
- 多平台登录：网易云 / QQ 音乐 / 酷狗音乐 / 汽水音乐 / Spotify
- 多平台搜索与播放，自动换源
- GitHub Releases 更新检测与下载入口

## 构建安装包

```bash
npm install
npm start        # 开发运行
npm run build:win  # 打包 NSIS 安装包
```

产物位于 `dist/Mineradio+-*-Setup.exe`。

桌面版入口由 Electron 主进程加载本地服务。

## 已知问题

- 热评卡片单层纹理壁纸已支持，多层纹理暂不可用
- 播放器壁纸首次加载有 1-3 秒延迟（原版行为）
- 酷狗音乐登录依赖 kugou.com Cookie 解析，酷狗网站改版后可能失效。网易云/QQ 同理，均为第三方网站 Cookie 方案

## 版权说明

- 本项目基于 [Mineradio](https://github.com/XxHuberrr/Mineradio)（GPL-3.0）修改
- 修改内容：热评卡片壁纸视频导入、PKG 解包提取、年龄分级筛选、托盘功能增强
- PKG 解包使用 [RePKG](https://github.com/NotScuffed/RePKG)（MIT）提取纹理
- 原版作者：[XxHuberrr](https://github.com/XxHuberrr)
- MR Logo、Mineradio 名称、界面视觉设计与原创视觉表达归原版作者所有
- 本修改版遵循 **GPL-3.0** 协议开源
- 第三方依赖和第三方服务分别遵循其各自授权与服务条款

## 致谢

感谢 [XxHuberrr](https://github.com/XxHuberrr) 创造了 Mineradio 这样一个优秀的开源音乐播放器。

感谢 [NotScuffed/RePKG](https://github.com/NotScuffed/RePKG) 提供了 Wallpaper Engine PKG 文件解包工具。

## 与原版的区别

| 方面 | 原版 | 本修改版 |
|------|------|----------|
| 应用名称 | Mineradio | Mineradio+ |
| 版本 | v2.0.2 | v2.0.2-1 |
| PKG 解包提取 | ❌ 无 | ✅ 集成 RePKG |
| 热评壁纸背景 | ❌ 无 | ✅ 视频/图片导入 + 裁切 |
| 年龄分级筛选 | ❌ 无 | ✅ 下拉筛选 + 持久化 |
| 壁纸排序 | 默认顺序 | 收藏置顶 → 创建时间倒序 |
| 托盘功能 | 基础 | 歌曲信息 + 播放控制 + 音量 + 开机自启 |
| 隐藏壁纸 | ✅ 有 | ❌ 已移除 |
| 应用 ID | com.mineradio.desktop | com.mineradio-plus.desktop |
| 可共存安装 | ❌ | ✅ |
| GitHub | XxHuberrr/Mineradio | VanemKrAu/Mineradio-Plus |
