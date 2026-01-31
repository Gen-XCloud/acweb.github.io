<template>
  <el-container class="main-layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && !isCollapse"
      class="sidebar-mask"
      @click="toggleSidebar"
    ></div>

    <el-aside
      :width="isCollapse ? '64px' : '200px'"
      :class="['sidebar', { 'sidebar-mobile': isMobile, 'sidebar-hidden': isMobile && isCollapse }]"
    >
      <div class="logo" :class="{ collapsed: isCollapse }">
        <template v-if="!isCollapse">
          <h2>Hugo Teek</h2>
          <span>Admin</span>
        </template>
        <el-icon v-else :size="28"><Reading /></el-icon>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        router
        class="el-menu-vertical"
      >
        <!-- 概览 -->
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>概览</template>
        </el-menu-item>

        <!-- 内容管理 -->
        <el-sub-menu index="content">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/content/posts">文章</el-menu-item>
          <el-menu-item index="/content/comments">评论</el-menu-item>
          <el-menu-item index="/content/gallery">图库</el-menu-item>
          <el-menu-item index="/content/friendlinks">友链</el-menu-item>
          <el-menu-item index="/content/sponsors">赞助者</el-menu-item>
        </el-sub-menu>

        <!-- 外观管理 -->
        <el-sub-menu index="appearance">
          <template #title>
            <el-icon><Brush /></el-icon>
            <span>外观管理</span>
          </template>
          <el-menu-item index="/appearance/themes">主题</el-menu-item>
          <el-menu-item index="/appearance/menus">菜单</el-menu-item>
          <el-menu-item index="/appearance/sections">菜单映射</el-menu-item>
        </el-sub-menu>

        <!-- 系统 -->
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统</span>
          </template>
          <el-menu-item index="/system/settings">站点配置</el-menu-item>
          <el-menu-item index="/system/plugins">插件</el-menu-item>
          <el-menu-item index="/system/backup">备份</el-menu-item>
          <el-menu-item index="/system/tools">工具</el-menu-item>
          <el-menu-item index="/system/marketplace">应用市场</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button
            text
            @click="toggleSidebar"
            class="collapse-btn"
          >
            <el-icon :size="20">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title || item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-button text @click="openSite">
            <el-icon><View /></el-icon>
            <span class="btn-text">访问站点</span>
          </el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapse = ref(false)
const isMobile = ref(false)

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  return route.matched.filter(r => r.meta?.title)
})

// 检测屏幕尺寸
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  // 移动端默认收起侧边栏
  if (isMobile.value) {
    isCollapse.value = true
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const openSite = () => {
  window.open('/', '_blank')
}

// 监听窗口大小变化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

// ============================================
// 主布局容器
// ============================================

.main-layout {
  height: 100vh;
  overflow: hidden;
}

// ============================================
// 侧边栏 (现代化白色风格)
// ============================================

.sidebar {
  background-color: $bg-card;
  border-right: 1px solid $border-light;
  box-shadow: $shadow-sm;
  overflow-y: auto;
  transition: width $transition-slow $ease-in-out;
  position: relative;
  z-index: $z-fixed;

  @include scrollbar(6px, $border-default, transparent);
}

/* 移动端侧边栏 (纯白简化) */
.sidebar-mobile {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: calc(#{$z-fixed} + 2);

  background: $bg-card;      // ✅ 纯白替代玻璃态
  box-shadow: $shadow-lg;    // 简化阴影
  // ❌ 移除 @include glass(0.95, 10px)
}

.sidebar-hidden {
  transform: translateX(-100%);
}

/* 移动端遮罩 (背景模糊) */
.sidebar-mask {
  @include absolute-cover;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: calc(#{$z-fixed} + 1);
  animation: fadeIn $transition-slow $ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// Logo 区域 (纯色简化)
.logo {
  height: 72px;
  @include flex-column;
  @include flex-center;
  background: $primary;            // ✅ 纯色替代渐变
  color: white;
  border-radius: 0 0 $radius-2xl $radius-2xl;  // 16px（已在 variables 中减少）
  margin: $spacing-4;
  padding: $spacing-4;
  transition: all 150ms ease-out;  // 统一过渡

  h2 {
    margin: 0;
    font-size: $text-2xl;
    font-weight: $font-bold;
    letter-spacing: -0.5px;
  }

  span {
    font-size: $text-xs;
    font-weight: $font-medium;
    color: rgba(255, 255, 255, 0.85);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: $spacing-1;
  }

  // Collapse 模式
  &.collapsed {
    height: 64px;
    margin: $spacing-3;
    border-radius: $radius-xl;

    .el-icon {
      font-size: $text-3xl;
    }
  }
}

// 菜单容器
.el-menu-vertical {
  border: none;
  background-color: transparent;
  padding: 0 $spacing-2;

  &:not(.el-menu--collapse) {
    width: 200px;
  }
}

// 菜单项和子菜单标题
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  border-radius: $radius-md;       // 6px
  margin: $spacing-2 0;
  height: 48px;
  line-height: 48px;
  color: $text-secondary;
  transition: all 150ms ease-out;  // 统一过渡
  font-weight: $font-medium;

  &:hover {
    background-color: rgba($primary, 0.08) !important;
    color: $primary !important;
    // ❌ 移除 transform: translateX(4px)
  }

  .el-icon {
    font-size: $text-lg;
  }
}

// Active 菜单项 (简化 Accent Bar)
:deep(.el-menu-item.is-active) {
  background-color: rgba($primary, 0.12) !important;
  color: $primary !important;
  font-weight: $font-semibold;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: $accent;
    border-radius: 0 $radius-sm $radius-sm 0;
    // ❌ 移除 box-shadow: 0 0 8px rgba($accent, 0.4);
  }
}

/* 子菜单样式 */
:deep(.el-sub-menu) {
  .el-menu {
    background-color: transparent !important;
  }

  .el-menu-item {
    background-color: transparent !important;
    color: $text-secondary !important;
    padding-left: calc(var(--el-menu-level) * 20px + 40px) !important;

    &:hover {
      background-color: rgba($primary, 0.08) !important;
      color: $primary !important;
    }

    &.is-active {
      background-color: rgba($primary, 0.12) !important;
      color: $primary !important;
    }
  }
}

// Collapse 模式
:deep(.el-menu--collapse) {
  .el-menu-item,
  .el-sub-menu__title {
    margin: $spacing-2 0;
    justify-content: center;
  }
}

// ============================================
// 顶部导航栏 (优化)
// ============================================

.header {
  background: $bg-card;
  border-bottom: 1px solid $border-light;
  box-shadow: $shadow-sm;
  @include flex-between;
  padding: 0 $spacing-8;
  height: $header-height;
}

.header-left {
  flex: 1;
  @include flex-start;
  gap: $spacing-6;
}

.collapse-btn {
  padding: $spacing-2;
  border-radius: $radius-md;
  transition: $transition-colors;

  &:hover {
    background-color: rgba($primary, 0.08);
  }
}

.header-right {
  @include flex-center;
  gap: $spacing-4;
}

// ============================================
// 内容区域
// ============================================

.main-content {
  background: $bg-primary;
  padding: $spacing-8;
  overflow-y: auto;

  @include scrollbar(8px, $border-default, transparent);
}

// ============================================
// 页面过渡动画 (仅 Opacity)
// ============================================

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease-out;  // 仅透明度过渡
  // ❌ 移除 transform 过渡

  @include reduced-motion {
    transition: opacity 150ms ease-out;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  // ❌ 移除 transform: translateX(20px)
}

// ============================================
// 响应式设计 (Mobile-First)
// ============================================

@include md {
  .header {
    padding: 0 $spacing-6;
  }

  .header-left {
    gap: $spacing-4;
  }

  .main-content {
    padding: $spacing-6;
  }
}

// 平板和小屏幕
@media screen and (max-width: 768px) {
  .header {
    padding: 0 $spacing-4;
  }

  .header-left {
    gap: $spacing-3;
  }

  .btn-text {
    display: none;
  }

  .main-content {
    padding: $spacing-4;
  }

  :deep(.el-breadcrumb) {
    font-size: $text-sm;
  }
}

// 手机竖屏
@media screen and (max-width: 480px) {
  .main-content {
    padding: $spacing-3;
  }

  .logo {
    margin: $spacing-3;
  }
}
</style>
