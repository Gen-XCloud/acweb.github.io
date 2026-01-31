---
categories:
    - 技术
coverImg: https://img.xxdevops.cn/blog/article_cover/photo-1618005198919-d3d4b5a92ead.webp
date: "2025-10-14T18:00:00+08:00"
description: 这是一篇用来测试Hugo Teek主题功能的文章
draft: false
tags:
    - Hugo
    - 主题开发
    - 测试
title: Hugo Teek 主题测试文章
url: /topic/ighpk
---
## 欢迎使用 Hugo Teek 主题

这是一个功能丰富的Hugo主题,从VitePress Teek主题迁移而来。

### 主要特性

- **响应式设计**: 完美适配各种设备
- **暗色模式**: 支持亮色/暗色主题切换
- **Algolia搜索**: 强大的全站搜索功能
- **Twikoo评论**: 集成Twikoo评论系统
- **代码高亮**: 支持多种编程语言的语法高亮
- **图片懒加载**: 优化页面加载速度

### 代码示例

```javascript
// 主题切换示例
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme',
    document.body.classList.contains('dark-mode') ? 'dark' : 'light'
  );
}
```

```go
// Hugo shortcode 示例
package main

import "fmt"

func main() {
    fmt.Println("Hello, Hugo Teek!")
}
```

### 特殊功能

这个主题还包含很多实用功能:

1. **实时时钟**: 页眉显示当前时间
2. **全屏Hero背景**: 首页炫酷的全屏背景轮播
3. **文章卡片**: 精美的文章卡片设计
4. **博主信息卡**: 侧边栏展示博主信息
5. **标签云**: 可视化的标签展示
6. **分类卡片**: 热门分类快速导航

### 图片展示

![](https://img.xxdevops.cn/blog/article_cover/photo-1618005182384-a83a8bd57fbe?w=800)

### 引用示例

> 这是一个引用示例。Hugo是一个快速、现代的静态网站生成器。
>
> -- Hugo文档

### 列表示例

**无序列表:**

- 项目一
- 项目二
  - 子项目 2.1
  - 子项目 2.2
- 项目三

**有序列表:**

1. 第一步: 安装Hugo
2. 第二步: 选择主题
3. 第三步: 创建内容
4. 第四步: 部署上线

### 表格示例

| 功能 | 状态 | 说明 |
|------|------|------|
| 响应式布局 | ✅ | 完美支持 |
| 暗色模式 | ✅ | 已实现 |
| 搜索功能 | ✅ | Algolia |
| 评论系统 | ✅ | Twikoo |
| 数学公式 | 🚧 | 开发中 |

### 结语

感谢使用Hugo Teek主题!如有问题,欢迎反馈。
