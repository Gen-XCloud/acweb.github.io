# Hugo Teek Theme

<div align="center">

**基于 VitePress Teek 主题移植的 Hugo 静态网站主题，专为技术博客和文档站点设计**

*A Hugo static site theme ported from VitePress Teek, designed for technical blogs and documentation sites*

[![Hugo Version](https://img.shields.io/badge/Hugo-%5E0.150.0-ff4088?logo=hugo)](https://gohugo.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[在线预览 Demo](https://wiki.xxdevops.cn) · [快速开始 Quick Start](#-快速开始--quick-start) ·

</div>

---

## 📖 项目简介 | Introduction

**中文**

Hugo Teek Theme 是将流行的 VitePress Teek 主题完整移植到 Hugo 平台的现代化静态网站主题。它保留了 VitePress Teek 的精美设计，同时利用 Hugo 的极速构建能力，为技术博客、文档库、知识管理系统提供完整的解决方案。

主题内置本地搜索、评论系统、数据统计、VitePress 语法支持等功能，开箱即用，无需复杂配置。

**English**

Hugo Teek Theme is a modern static site theme that fully ports the popular VitePress Teek theme to the Hugo platform. It preserves the elegant design of VitePress Teek while leveraging Hugo's blazing-fast build speed, providing a complete solution for technical blogs, documentation sites, and knowledge management systems.

The theme includes built-in local search, comment system, analytics, VitePress syntax support, and more - ready to use out of the box with minimal configuration.

---

## ✨ 核心特性 | Key Features

### 🎨 设计 | Design
- **精美界面** Beautiful UI - VitePress Teek 风格设计
- **响应式布局** Responsive - 完美适配桌面/平板/移动端 Desktop/Tablet/Mobile
- **暗色模式** Dark Mode - 自动切换浅色/暗色主题 Auto light/dark theme switching
- **三栏布局** 3-Column Layout - 侧边栏 + 内容 + 目录 Sidebar + Content + TOC

### ⚡ 性能 | Performance
- **极速构建** Fast Build - 基于 Hugo 引擎 Powered by Hugo
- **本地搜索** Local Search - FlexSearch 离线全文搜索 Offline full-text search
- **懒加载** Lazy Loading - 图片按需加载 On-demand image loading
- **热重载** Hot Reload - 开发时实时预览 Real-time preview in dev mode

### 🛠️ 功能 | Functions
- **评论系统** Comments - Twikoo 评论支持 Twikoo comment system
- **数据统计** Analytics - 百度/Umami/不蒜子 Baidu/Umami/Busuanzi
- **代码高亮** Code Highlight - Monokai 风格 + 复制按钮 Monokai theme + copy button
- **VitePress 语法** VitePress Syntax - 自动转换容器语法 Auto-convert container syntax
- **自动生成** Auto Generate - 永久链接/索引/排序 Permalinks/Index/Ordering

### 🎯 开发体验 | Developer Experience
- **内容监听** Content Watcher - 自动转换 VitePress 语法 Auto VitePress syntax conversion
- **配置中心** Config Center - Web 界面管理配置 Web-based config management
- **构建工具** Build Tools - 9 个 Go 工具辅助开发 9 Go tools for development
- **Makefile** Makefile - 一键启动/构建/部署 One-command start/build/deploy

---

## 🚀 快速开始 | Quick Start

### 环境要求 | Requirements

- **Hugo Extended** v0.150.0+
- **Go** v1.21+
- **Git**

### 安装 | Installation

```bash
# 克隆项目 | Clone repository
git clone https://cnb.cool/yuwen-gueen/hugo-teeker-theme.git
cd hugo-teek

# 安装依赖 | Install dependencies
make install-deps

# 启动开发服务器 | Start dev server
make dev

# 访问 | Visit: http://localhost:8080
```

### 快速预览 | Quick Preview

```bash
# 跳过数据生成，快速启动 | Skip data generation, quick start
make quick
```

### 构建生产版本 | Build for Production

```bash
# 构建 | Build
make build

# 输出目录 | Output directory: hugo-teek-site/public/
```

---

## 📦 技术栈 | Tech Stack

| 技术 Technology | 说明 Description | 版本 Version |
|----------------|------------------|--------------|
| **Hugo** | 静态网站生成器 Static Site Generator | v0.150.0+ (Extended) |
| **Go** | 构建工具 Build Tools | v1.21+ |
| **SCSS** | 样式预处理器 CSS Preprocessor | - |
| **JavaScript** | 前端交互 Frontend Interaction | ES6+ |
| **FlexSearch** | 本地搜索 Local Search | - |
| **Twikoo** | 评论系统 Comment System | v1.6.41 |

---

## 📚 文档 | Documentation

- [Hugo 官方文档 Hugo Official Docs](https://gohugo.io/documentation/)
- [FlexSearch 文档 FlexSearch Docs](https://github.com/nextapps-de/flexsearch)
- [Twikoo 文档 Twikoo Docs](https://twikoo.js.org/)

---

## 🙏 致谢 | Acknowledgments

- [Hugo](https://gohugo.io/) - 强大的静态网站生成器 Powerful static site generator
- [VitePress Teek](https://github.com/xxx/vitepress-theme-teek) - 原始主题设计 Original theme design
- 所有贡献者和使用者 All contributors and users

---

## 📄 许可证 | License

[MIT License](LICENSE)

---

## 📞 联系方式 | Contact

- **博客 Blog**: [https://wiki.xxdevops.cn](https://wiki.xxdevops.cn)
- **GitHub**: [https://cnb.cool/yuwen-gueen/hugo-teeker-theme](https://cnb.cool/yuwen-gueen/hugo-teeker-theme)
- **Issues**: [GitHub Issues](https://cnb.cool/yuwen-gueen/hugo-teeker-theme/-/issues)

---

<div align="center">

⭐ **如果这个项目对你有帮助，请给个 Star！**

**If this project helps you, please give it a star!**

Made with ❤️ by [余温Gueen](https://wiki.xxdevops.cn)

</div>
