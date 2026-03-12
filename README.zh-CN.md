<div align="center">

<img src="docs/assets/logo.png" alt="Prism Logo" width="128" />

# Prism

**现代化、精美的 Windows 系统清理与优化工具**

采用 [Tauri v2](https://tauri.app/) + [React](https://react.dev/) + [Fluent UI](https://react.fluentui.dev/) 打造

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform: Windows](https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows)
![Built with Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri)

[English](README.md) | [繁體中文](README.zh-TW.md)

<img src="docs/screenshots/01-dashboard.png" alt="Dashboard" width="720" />

</div>

---

## ✨ 功能特色

| 模块 | 说明 |
|------|------|
| 📊 **系统总览** | 实时监控 CPU、内存、磁盘、网络，并提供健康评分 |
| 🧹 **深度清理** | 扫描并清除浏览器缓存、临时文件、日志和应用残留 |
| 📦 **卸载管理** | 智能移除程序，支持按大小排序与批量卸载 |
| ⚡ **系统优化** | 刷新 DNS、重建图标 / 字体 / 缩略图缓存 |
| 💽 **磁盘分析** | 交互式环形图可视化磁盘使用量 |
| 📈 **系统监控** | 实时 CPU / 内存 / 磁盘图表，每 2 秒更新 |
| 🗑️ **构建清理** | 清除 `node_modules`、`.gradle`、`target`、`__pycache__` 等开发产物 |
| 🌐 **多语言** | 支持 English、繁體中文、简体中文，自动检测系统语言 |

## 🖼️ 截图展示

<details>
<summary>点击展开所有截图</summary>

| 功能 | 截图 |
|------|------|
| 深度清理 | <img src="docs/screenshots/02-deep-clean.png" width="600" /> |
| 卸载管理 | <img src="docs/screenshots/03-uninstaller.png" width="600" /> |
| 系统优化 | <img src="docs/screenshots/04-optimizer.png" width="600" /> |
| 磁盘分析 | <img src="docs/screenshots/05-disk-analysis.png" width="600" /> |
| 系统监控 | <img src="docs/screenshots/06-monitoring.png" width="600" /> |
| 构建清理 | <img src="docs/screenshots/07-build-cleanup.png" width="600" /> |
| 设置 | <img src="docs/screenshots/08-settings.png" width="600" /> |

</details>

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install)（稳定版）
- [Tauri CLI 前置安装](https://v2.tauri.app/start/prerequisites/)

### 开发模式

```bash
# 克隆仓库
git clone https://github.com/YourUsername/prism.git
cd prism

# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev
```

### 打包构建

```bash
# 构建正式安装包
npm run tauri build
```

安装包会输出至 `src-tauri/target/release/bundle/`。

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| UI 组件 | Fluent UI React v9 |
| 后端 | Rust + Tauri v2 |
| 核心引擎 | PowerShell 脚本 |
| 国际化 | react-i18next |
| 样式 | 自定义 CSS（毛玻璃风格） |

## 📁 项目结构

```
prism/
├── src/                    # React 前端
│   ├── components/         # 可复用 UI 组件
│   ├── pages/              # 页面组件
│   ├── hooks/              # 自定义 React Hooks
│   ├── i18n/               # 国际化
│   │   ├── i18n.ts         # i18next 配置
│   │   └── locales/        # 翻译文件 (en, zh-TW, zh-CN)
│   ├── App.tsx             # 根组件
│   └── main.tsx            # 入口点
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── commands/       # Tauri 命令处理
│   │   └── lib.rs          # 插件注册
│   ├── Cargo.toml
│   └── tauri.conf.json
├── mole-core/              # PowerShell 核心脚本
└── package.json
```

## 🤝 贡献指南

欢迎提交 Pull Request！

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 发起 Pull Request

## 🙏 致谢

- **[Mole](https://github.com/nicholasgasior/mole)** by [tw93](https://github.com/tw93) — 驱动 Prism 清理与优化功能的开源 PowerShell 核心引擎（MIT 许可）
- **[Tauri](https://tauri.app/)** — 轻量安全的桌面应用框架
- **[Fluent UI](https://react.fluentui.dev/)** — Microsoft 的 React 设计体系
- **[react-i18next](https://react.i18next.com/)** — 国际化框架

完整第三方许可清单请见 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。

## 📄 许可证

本项目采用 MIT 许可证 — 详见 [LICENSE](LICENSE)。
