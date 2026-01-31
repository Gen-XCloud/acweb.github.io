/**
 * 配置字段映射表
 * 定义所有配置项的结构、类型和路径
 */

const configMaps = {
    // ============================================
    // 站点设置映射
    // ============================================
    siteSettings: {
        basic: [
            { key: 'title', label: '站点标题', type: 'text', path: 'title' },
            { key: 'baseURL', label: 'Base URL', type: 'text', path: 'baseURL', placeholder: 'https://example.com' },
            { key: 'languageCode', label: '语言代码', type: 'text', path: 'languageCode', placeholder: 'zh-CN' },
            { key: 'theme', label: '主题名称', type: 'text', path: 'theme', placeholder: 'hugo-teek' },
            { key: 'contentDir', label: '内容目录', type: 'text', path: 'contentDir', placeholder: 'content' },
            { key: 'publishDir', label: '发布目录', type: 'text', path: 'publishDir', placeholder: 'public' },
            { key: 'enableEmoji', label: '启用 Emoji', type: 'boolean', path: 'enableEmoji' },
            { key: 'enableGitInfo', label: '启用 Git 信息', type: 'boolean', path: 'enableGitInfo' },
            { key: 'description', label: '站点描述', type: 'text', path: 'params.description' },
            { key: 'keywords', label: '关键词', type: 'array', path: 'params.keywords', placeholder: '逗号分隔' },
            { key: 'siteStartDate', label: '站点起始日期', type: 'text', path: 'params.siteStartDate', placeholder: 'YYYY-MM-DD' },
            { key: 'mainSections', label: '主要内容分区', type: 'array', path: 'params.layoutWidths.mainSections', placeholder: '逗号分隔' }
        ],

        blogger: [
            { key: 'name', label: '博主名称', type: 'text', path: 'params.blogger.name' },
            { key: 'slogan', label: '个性签名', type: 'text', path: 'params.blogger.slogan' },
            { key: 'avatar', label: '头像 URL', type: 'url', path: 'params.blogger.avatar', placeholder: 'https://img.example.com/avatar.png' },
            { key: 'shape', label: '头像形状', type: 'select', path: 'params.blogger.shape',
              options: ['square', 'circle', 'circle-rotate'] },
            { key: 'circleBgImg', label: '圆形背景图', type: 'url', path: 'params.blogger.circleBgImg', placeholder: 'https://img.example.com/bg.png' },
            { key: 'circleBgMask', label: '背景遮罩', type: 'boolean', path: 'params.blogger.circleBgMask' },
            { key: 'statusIcon', label: '状态图标', type: 'text', path: 'params.blogger.status.icon', placeholder: '😪' },
            { key: 'statusTitle', label: '状态标题', type: 'text', path: 'params.blogger.status.title', placeholder: '困' },
            { key: 'statusSize', label: '状态尺寸', type: 'number', path: 'params.blogger.status.size', placeholder: '24' }
        ],

        author: [
            { key: 'authorName', label: '作者姓名', type: 'text', path: 'params.author.name' },
            { key: 'authorEmail', label: '邮箱', type: 'email', path: 'params.author.email', placeholder: 'email@example.com' },
            { key: 'authorLink', label: '作者链接', type: 'url', path: 'params.author.link', placeholder: 'https://example.com' }
        ],

        layout: [
            { key: 'layoutMode', label: '布局模式', type: 'select', path: 'params.layoutMode',
              options: ['bothWidthAdjustable', 'fixed'] },
            { key: 'layoutPage', label: '页面宽度 (page)', type: 'text', path: 'params.layoutWidths.page', placeholder: '1280px' },
            { key: 'layoutDoc', label: '文档宽度 (doc)', type: 'text', path: 'params.layoutWidths.doc', placeholder: '960px' },
            { key: 'layoutFull', label: '全宽 (full)', type: 'text', path: 'params.layoutWidths.full', placeholder: '1440px' }
        ],

        copyright: [
            { key: 'copyrightEnabled', label: '启用版权声明', type: 'boolean', path: 'params.docCopyright.enabled' },
            { key: 'copyrightAuthorName', label: '作者名称', type: 'text', path: 'params.docCopyright.authorName' },
            { key: 'copyrightAuthorUrl', label: '作者链接', type: 'url', path: 'params.docCopyright.authorUrl' },
            { key: 'copyrightLicenseName', label: '许可证名称', type: 'text', path: 'params.docCopyright.licenseName', placeholder: 'CC BY-NC-SA 4.0' },
            { key: 'copyrightLicenseUrl', label: '许可证链接', type: 'url', path: 'params.docCopyright.licenseUrl' },
            { key: 'copyrightSiteName', label: '站点名称', type: 'text', path: 'params.docCopyright.siteName' },
            { key: 'copyrightSiteUrl', label: '站点链接', type: 'url', path: 'params.docCopyright.siteUrl' }
        ],

        footer: [
            { key: 'footerYear', label: '版权年份起始', type: 'number', path: 'params.footer.copyright_year_start', placeholder: '2024' },
            { key: 'footerSuffix', label: '版权后缀', type: 'text', path: 'params.footer.copyright_suffix' },
            { key: 'footerMessage', label: '自定义消息', type: 'text', path: 'params.footer.custom_message' },
            { key: 'footerShowServices', label: '显示服务信息', type: 'boolean', path: 'params.footer.show_services' },
            { key: 'footerShowTheme', label: '显示主题信息', type: 'boolean', path: 'params.footer.show_theme_info' },
            { key: 'icpEnabled', label: '备案启用', type: 'boolean', path: 'params.footer.icp.enabled' },
            { key: 'icpNumber', label: '备案号', type: 'text', path: 'params.footer.icp.number' },
            { key: 'icpUrl', label: '备案链接', type: 'url', path: 'params.footer.icp.url', placeholder: 'http://beian.miit.gov.cn/' }
        ]
    },

    // ============================================
    // Hugo 核心配置
    // ============================================
    hugoCore: {
        markup: [
            { key: 'markupUnsafe', label: '允许不安全 HTML', type: 'boolean', path: 'markup.goldmark.renderer.unsafe' },
            { key: 'markupAutoHeadingID', label: '自动生成标题 ID', type: 'boolean', path: 'markup.goldmark.parser.autoHeadingID' },
            { key: 'markupAttributeBlock', label: '启用块级属性', type: 'boolean', path: 'markup.goldmark.parser.attribute.block' },
            { key: 'markupAttributeTitle', label: '启用标题属性', type: 'boolean', path: 'markup.goldmark.parser.attribute.title' },
            { key: 'markupAttributes', label: '启用属性', type: 'boolean', path: 'markup.goldmark.extensions.attributes' },
            { key: 'markupDefinitionList', label: '启用定义列表', type: 'boolean', path: 'markup.goldmark.extensions.definitionList' },
            { key: 'markupFootnote', label: '启用脚注', type: 'boolean', path: 'markup.goldmark.extensions.footnote' },
            { key: 'markupLinkify', label: '自动链接', type: 'boolean', path: 'markup.goldmark.extensions.linkify' },
            { key: 'markupStrikethrough', label: '启用删除线', type: 'boolean', path: 'markup.goldmark.extensions.strikethrough' },
            { key: 'markupTable', label: '启用表格', type: 'boolean', path: 'markup.goldmark.extensions.table' },
            { key: 'markupTaskList', label: '启用任务列表', type: 'boolean', path: 'markup.goldmark.extensions.taskList' },
            { key: 'markupTypographer', label: '启用排版优化', type: 'boolean', path: 'markup.goldmark.extensions.typographer' }
        ],

        highlight: [
            { key: 'highlightCodeFences', label: '代码围栏', type: 'boolean', path: 'markup.highlight.codeFences' },
            { key: 'highlightGuessSyntax', label: '自动检测语法', type: 'boolean', path: 'markup.highlight.guessSyntax' },
            { key: 'highlightLineNos', label: '显示行号', type: 'boolean', path: 'markup.highlight.lineNos' },
            { key: 'highlightLineNumbersInTable', label: '表格形式行号', type: 'boolean', path: 'markup.highlight.lineNumbersInTable' },
            { key: 'highlightNoClasses', label: '内联样式', type: 'boolean', path: 'markup.highlight.noClasses' },
            { key: 'highlightStyle', label: '高亮样式', type: 'text', path: 'markup.highlight.style', placeholder: 'monokai' },
            { key: 'highlightTabWidth', label: 'Tab 宽度', type: 'number', path: 'markup.highlight.tabWidth', placeholder: '2' }
        ],

        toc: [
            { key: 'tocStartLevel', label: '目录起始级别', type: 'number', path: 'markup.tableOfContents.startLevel', placeholder: '2' },
            { key: 'tocEndLevel', label: '目录结束级别', type: 'number', path: 'markup.tableOfContents.endLevel', placeholder: '4' },
            { key: 'tocOrdered', label: '有序目录', type: 'boolean', path: 'markup.tableOfContents.ordered' }
        ],

        pagination: [
            { key: 'pagerSize', label: '每页文章数', type: 'number', path: 'pagination.pagerSize', placeholder: '12' },
            { key: 'paginationPath', label: '分页路径', type: 'text', path: 'pagination.path', placeholder: 'page' },
            { key: 'defaultContentLanguage', label: '默认语言', type: 'text', path: 'pagination.defaultContentLanguage', placeholder: 'zh-cn' }
        ],

        taxonomies: [
            { key: 'taxonomyCategory', label: '分类名称', type: 'text', path: 'taxonomies.category', placeholder: 'categories' },
            { key: 'taxonomyTag', label: '标签名称', type: 'text', path: 'taxonomies.tag', placeholder: 'tags' }
        ],

        permalinks: [
            { key: 'permalinkPosts', label: '文章链接格式', type: 'text', path: 'permalinks.posts', placeholder: '/posts/:slug/' }
        ],

        outputs: [
            { key: 'outputsHome', label: '首页输出格式', type: 'array', path: 'outputs.home', placeholder: 'HTML, RSS, JSON' },
            { key: 'outputsPage', label: '页面输出格式', type: 'array', path: 'outputs.page', placeholder: 'HTML' },
            { key: 'outputsSection', label: '分区输出格式', type: 'array', path: 'outputs.section', placeholder: 'HTML, RSS' }
        ],

        outputFormats: [
            { key: 'rssBaseName', label: 'RSS 文件名', type: 'text', path: 'outputFormats.RSS.baseName', placeholder: 'feed' },
            { key: 'rssMediaType', label: 'RSS 媒体类型', type: 'text', path: 'outputFormats.RSS.mediatype', placeholder: 'application/rss+xml' }
        ]
    },

    // ============================================
    // 菜单管理（使用表格组件）
    // ============================================
    menuManagement: {
        title: '菜单管理',
        dataKey: 'menu',
        configPath: 'menu.main',
        pageSize: 20,
        searchFields: ['name', 'url', 'identifier'],

        columns: [
            {
                label: '名称',
                field: 'name',
                width: '150px',
                render: (value) => `<strong>${value}</strong>`
            },
            {
                label: 'URL',
                field: 'url',
                width: '200px',
                render: (value) => `<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${value}</code>`
            },
            {
                label: '标识符',
                field: 'identifier',
                width: '120px'
            },
            {
                label: '父菜单',
                field: 'parent',
                width: '120px',
                render: (value) => value || '-'
            },
            {
                label: '权重',
                field: 'weight',
                width: '80px'
            }
        ],

        formFields: [
            {
                name: 'name',
                label: '菜单名称',
                type: 'text',
                required: true,
                placeholder: '🏡 首页'
            },
            {
                name: 'url',
                label: 'URL 地址',
                type: 'text',
                required: true,
                placeholder: '/'
            },
            {
                name: 'identifier',
                label: '标识符',
                type: 'text',
                placeholder: 'home (可选)'
            },
            {
                name: 'parent',
                label: '父菜单标识符',
                type: 'text',
                placeholder: '留空为顶级菜单'
            },
            {
                name: 'weight',
                label: '排序权重',
                type: 'number',
                placeholder: '1'
            }
        ]
    },

    // ============================================
    // 外观配置映射
    // ============================================
    appearance: {
        wallpaper: [
            { key: 'wallpaperEnabled', label: '启用壁纸', type: 'boolean', path: 'params.wallpaper.enabled' },
            { key: 'wallpaperAutoPlay', label: '自动播放', type: 'boolean', path: 'params.wallpaper.autoPlay' },
            { key: 'wallpaperInterval', label: '切换间隔(ms)', type: 'number', path: 'params.wallpaper.interval', placeholder: '5000' },
            { key: 'wallpaperHideBanner', label: '隐藏横幅', type: 'boolean', path: 'params.wallpaper.hideBanner' }
        ],

        heroBg: [
            { key: 'heroBgEnabled', label: '启用英雄背景', type: 'boolean', path: 'params.heroBg.enabled' },
            { key: 'heroBgApiUrl', label: 'API地址', type: 'url', path: 'params.heroBg.apiUrl', placeholder: 'https://imgapi.example.com/api/images' },
            { key: 'heroBgAutoPlay', label: '自动播放', type: 'boolean', path: 'params.heroBg.autoPlay' },
            { key: 'heroBgInterval', label: '切换间隔(ms)', type: 'number', path: 'params.heroBg.interval', placeholder: '5000' }
        ],

        heroSubtitle: [
            { key: 'heroSubtitleTypeSpeed', label: '打字速度(ms)', type: 'number', path: 'params.heroSubtitle.typeSpeed', placeholder: '90' },
            { key: 'heroSubtitleDeleteSpeed', label: '删除速度(ms)', type: 'number', path: 'params.heroSubtitle.deleteSpeed', placeholder: '45' },
            { key: 'heroSubtitleHold', label: '停留时间(ms)', type: 'number', path: 'params.heroSubtitle.hold', placeholder: '1800' },
            { key: 'heroSubtitleNextDelay', label: '下条延迟(ms)', type: 'number', path: 'params.heroSubtitle.nextDelay', placeholder: '600' },
            { key: 'heroSubtitleShuffle', label: '随机播放', type: 'boolean', path: 'params.heroSubtitle.shuffle' }
        ],

        titleChange: [
            { key: 'titleChangeEnabled', label: '启用标题切换', type: 'boolean', path: 'params.titleChange.enabled' },
            { key: 'titleChangeHidden', label: '离开文本', type: 'text', path: 'params.titleChange.hidden', placeholder: 'w(ﾟДﾟ)w 不要走！' },
            { key: 'titleChangeReturn', label: '返回文本', type: 'text', path: 'params.titleChange.return', placeholder: '♪(^∇^*)欢迎回来！' },
            { key: 'titleChangeResetDelay', label: '重置延迟(ms)', type: 'number', path: 'params.titleChange.resetDelay', placeholder: '2000' }
        ],

        codeBlock: [
            { key: 'codeBlockCopyButton', label: '显示复制按钮', type: 'boolean', path: 'params.codeBlock.copyButton' },
            { key: 'codeBlockAutoCollapse', label: '自动折叠长代码', type: 'boolean', path: 'params.codeBlock.autoCollapse' },
            { key: 'codeBlockCollapseHeight', label: '折叠高度(px)', type: 'number', path: 'params.codeBlock.collapseHeight', placeholder: '700' }
        ],

        category: [
            { key: 'categoryEnabled', label: '启用分类展示', type: 'boolean', path: 'params.category.enabled' },
            { key: 'categoryAutoPage', label: '自动翻页', type: 'boolean', path: 'params.category.autoPage' },
            { key: 'categoryLimit', label: '显示数量', type: 'number', path: 'params.category.limit', placeholder: '8' },
            { key: 'categoryPageSpeed', label: '翻页速度(ms)', type: 'number', path: 'params.category.pageSpeed', placeholder: '4000' }
        ],

        other: [
            { key: 'scrollProgressEnabled', label: '启用滚动进度条', type: 'boolean', path: 'params.scrollProgress.enabled' },
            { key: 'imageLazyLoading', label: '启用图片懒加载', type: 'boolean', path: 'params.image.lazyLoading' }
        ]
    },

    // ============================================
    // 外部插件映射
    // ============================================
    plugins: {
        comment: [
            { key: 'commentEnabled', label: '启用评论系统', type: 'boolean', path: 'params.comment.enabled' },
            { key: 'commentProvider', label: '提供商', type: 'text', path: 'params.comment.provider', placeholder: 'twikoo' },
            { key: 'commentVersion', label: '版本', type: 'text', path: 'params.comment.version', placeholder: '1.6.41' },
            { key: 'commentEnvId', label: '环境ID/URL', type: 'url', path: 'params.comment.envId', placeholder: 'https://twikoo.example.com/' },
            { key: 'commentHideAdmin', label: '隐藏管理员', type: 'boolean', path: 'params.comment.hideAdmin' }
        ],

        search: [
            { key: 'searchEnabled', label: '启用搜索功能', type: 'boolean', path: 'params.search.enabled' },
            { key: 'searchProvider', label: '提供商', type: 'text', path: 'params.search.provider', placeholder: 'flexsearch' }
        ],

        baidu: [
            { key: 'baiduId', label: '百度统计 ID', type: 'text', path: 'params.analytics.baidu.id', placeholder: 'xxxxxx' }
        ],

        umami: [
            { key: 'umamiEnabled', label: '启用 Umami', type: 'boolean', path: 'params.analytics.umami.enabled' },
            { key: 'umamiUrl', label: '服务地址', type: 'url', path: 'params.analytics.umami.url', placeholder: 'https://umami.example.com' },
            { key: 'umamiWebsiteId', label: '网站 ID', type: 'text', path: 'params.analytics.umami.websiteId', placeholder: 'uuid' }
        ],

        busuanzi: [
            { key: 'busuanziEnabled', label: '启用不蒜子', type: 'boolean', path: 'params.analytics.busuanzi.enabled' },
            { key: 'busuanziUrl', label: 'JS 地址', type: 'url', path: 'params.analytics.busuanzi.url', placeholder: 'https://cdn.example.com/busuanzi.js' },
            { key: 'busuanziPrefix', label: '前缀', type: 'text', path: 'params.analytics.busuanzi.prefix', placeholder: 'busuanzi' },
            { key: 'busuanziStyle', label: '样式', type: 'text', path: 'params.analytics.busuanzi.style', placeholder: 'comma' },
            { key: 'busuanziPjax', label: 'PJAX 支持', type: 'boolean', path: 'params.analytics.busuanzi.pjax' },
            { key: 'busuanziPagePv', label: '显示页面 PV', type: 'boolean', path: 'params.analytics.busuanzi.page_pv' },
            { key: 'busuanziSitePv', label: '显示站点 PV', type: 'boolean', path: 'params.analytics.busuanzi.site_pv' },
            { key: 'busuanziSiteUv', label: '显示站点 UV', type: 'boolean', path: 'params.analytics.busuanzi.site_uv' }
        ],

        la51: [
            { key: 'la51Enabled', label: '启用 51LA 小部件', type: 'boolean', path: 'params.footer.analytics.la_widget_enabled' },
            { key: 'la51WidgetId', label: '小部件 ID', type: 'text', path: 'params.footer.analytics.la_widget_id', placeholder: '3LmZHLhDZIDpMaT0' },
            { key: 'la51Theme', label: '主题配置', type: 'text', path: 'params.footer.analytics.la_widget_theme', placeholder: '#1690FF,#333333,...' }
        ],

        appreciation: [
            { key: 'appreciationEnabled', label: '启用赞赏功能', type: 'boolean', path: 'params.appreciation.enabled' },
            { key: 'appreciationWechat', label: '微信赞赏码 URL', type: 'url', path: 'params.appreciation.wechatQR', placeholder: 'https://img.example.com/wechat.avif' },
            { key: 'appreciationAlipay', label: '支付宝赞赏码 URL', type: 'url', path: 'params.appreciation.alipayQR', placeholder: 'https://img.example.com/alipay.png' }
        ]
    },

    // ============================================
    // 社交链接（使用表格组件）
    // ============================================
    socialLinks: {
        title: '社交链接',
        dataKey: 'socialLinks',
        configPath: 'params.socialLinks',
        pageSize: 10,
        searchFields: ['title', 'link'],

        columns: [
            {
                label: '图标',
                field: 'icon',
                width: '100px',
                render: (value) => `<span style="font-size: 18px;">${value}</span>`
            },
            {
                label: '标题',
                field: 'title',
                width: '150px',
                render: (value) => `<strong>${value}</strong>`
            },
            {
                label: '链接',
                field: 'link',
                render: (value) => `<a href="${value}" target="_blank" style="color: #3b82f6; text-decoration: none;">${value}</a>`
            }
        ],

        formFields: [
            {
                name: 'icon',
                label: '图标',
                type: 'text',
                required: true,
                placeholder: 'github'
            },
            {
                name: 'title',
                label: '标题',
                type: 'text',
                required: true,
                placeholder: 'GitHub'
            },
            {
                name: 'link',
                label: '链接',
                type: 'url',
                required: true,
                placeholder: 'https://github.com/username'
            }
        ]
    }
};
