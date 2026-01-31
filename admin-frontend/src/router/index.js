import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      // 概览
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '概览' }
      },

      // 内容管理
      {
        path: 'content',
        name: 'Content',
        redirect: '/content/posts',
        meta: { title: '内容管理' },
        children: [
          // 文章
          {
            path: 'posts',
            name: 'ContentPosts',
            component: () => import('@/views/Posts/List.vue'),
            meta: { title: '文章' }
          },
          {
            path: 'posts/create',
            name: 'PostCreate',
            component: () => import('@/views/Posts/Edit.vue'),
            meta: { title: '新建文章' }
          },
          {
            path: 'posts/edit',
            name: 'PostEdit',
            component: () => import('@/views/Posts/Edit.vue'),
            meta: { title: '编辑文章' }
          },
          // 评论
          {
            path: 'comments',
            name: 'ContentComments',
            component: () => import('@/views/Content/Comments.vue'),
            meta: { title: '评论' }
          },
          // 图库
          {
            path: 'gallery',
            name: 'ContentGallery',
            component: () => import('@/views/Content/Gallery.vue'),
            meta: { title: '图库' }
          },
          // 友链
          {
            path: 'friendlinks',
            name: 'ContentFriendLinks',
            component: () => import('@/views/Content/FriendLinks.vue'),
            meta: { title: '友链' }
          },
          // 赞助者
          {
            path: 'sponsors',
            name: 'ContentSponsors',
            component: () => import('@/views/Content/Sponsors.vue'),
            meta: { title: '赞助者' }
          }
        ]
      },

      // 外观管理
      {
        path: 'appearance',
        name: 'Appearance',
        redirect: '/appearance/themes',
        meta: { title: '外观管理' },
        children: [
          // 主题
          {
            path: 'themes',
            name: 'AppearanceThemes',
            component: () => import('@/views/Appearance/ThemeSwitch.vue'),
            meta: { title: '主题' }
          },
          // 主题配置
          {
            path: 'theme-config',
            name: 'AppearanceThemeConfig',
            component: () => import('@/views/Appearance/ThemeConfig.vue'),
            meta: { title: '主题配置' }
          },
          // 菜单
          {
            path: 'menus',
            name: 'AppearanceMenus',
            component: () => import('@/views/Appearance/Menus.vue'),
            meta: { title: '菜单' }
          },
          // Section URL 映射
          {
            path: 'sections',
            name: 'AppearanceSections',
            component: () => import('@/views/Config/SectionMappings.vue'),
            meta: { title: '菜单映射' }
          }
        ]
      },

      // 系统
      {
        path: 'system',
        name: 'System',
        redirect: '/system/settings',
        meta: { title: '系统' },
        children: [

          // 站点配置
          {
            path: 'settings',
            name: 'SystemSettings',
            component: () => import('@/views/Settings/Index.vue'),
            meta: { title: '站点配置' }
          },
          // 预览
          {
            path: 'preview',
            name: 'SystemPreview',
            component: () => import('@/views/System/Preview.vue'),
            meta: { title: '站点预览' }
          },
          // 插件
          {
            path: 'plugins',
            name: 'SystemPlugins',
            component: () => import('@/views/System/Plugins.vue'),
            meta: { title: '插件' }
          },
          // 备份
          {
            path: 'backup',
            name: 'SystemBackup',
            component: () => import('@/views/System/Backup.vue'),
            meta: { title: '备份' }
          },
          // 工具
          {
            path: 'tools',
            name: 'SystemTools',
            component: () => import('@/views/System/Tools.vue'),
            meta: { title: '工具' }
          },
          // 应用市场
          {
            path: 'marketplace',
            name: 'SystemMarketplace',
            component: () => import('@/views/System/Marketplace.vue'),
            meta: { title: '应用市场' }
          }
        ]
      },

      // 兼容旧路由（重定向）
      {
        path: 'posts',
        redirect: '/content/posts'
      },
      {
        path: 'posts/list',
        redirect: '/content/posts'
      },
      {
        path: 'media',
        name: 'Media',
        component: () => import('@/views/Media/index.vue'),
        meta: { title: '媒体库' }
      },
      {
        path: 'settings',
        redirect: '/system/settings'
      },
      {
        path: 'settings/basic',
        redirect: '/system/settings'
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory('/admin/'),
  routes
})

export default router
