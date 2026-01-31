---
author: 余温Gueen
categories:
    - 开发
coverImg: https://img.xxdevops.cn/blog/wallpaper/bg15.webp
date: "2025-10-14T11:00:00+08:00"
description: 学习如何开发自己的 Hugo 主题。
draft: false
tags:
    - Hugo
    - 主题开发
    - 教程
title: Hugo 主题开发指南
url: /topic/jefdd
---
## Hugo 主题结构

Hugo 主题包含以下主要目录：

### layouts/

存放所有的模板文件：

- `_default/` - 默认模板
- `partials/` - 可复用的部分模板
- `shortcodes/` - 短代码

### assets/

存放需要处理的资源文件：

- CSS/SCSS 文件
- JavaScript 文件

### static/

存放静态文件：

- 图片
- 字体
- 第三方库

## 模板语法

Hugo 使用 Go 模板语法：

```go
{{ .Title }}
{{ range .Pages }}
  <h2>{{ .Title }}</h2>
{{ end }}
```

## Front Matter

每个内容文件都可以包含 Front Matter：

```yaml
---
title: "文章标题"
date: 2025-10-14
tags: ["tag1", "tag2"]
---
```

## 总结

Hugo 主题开发灵活且强大，掌握基础后可以创建各种精美的主题。
