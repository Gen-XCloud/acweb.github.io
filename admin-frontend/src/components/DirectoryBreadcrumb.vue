<template>
  <div class="directory-breadcrumb">
    <el-breadcrumb :separator="separator" class="breadcrumb">
      <!-- 首页 -->
      <el-breadcrumb-item v-if="showHome" @click="handleClick('')">
        <el-icon class="home-icon"><HomeFilled /></el-icon>
        <span v-if="!isMobile">全部文档</span>
      </el-breadcrumb-item>

      <!-- 面包屑项 -->
      <el-breadcrumb-item
        v-for="(item, index) in breadcrumbItems"
        :key="index"
        :class="{ 'is-last': index === breadcrumbItems.length - 1 }"
        @click="handleClick(item.path)"
      >
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 移动端简化显示（当层级超过2时） -->
    <div v-if="isMobile && breadcrumbItems.length > 2" class="mobile-compact">
      <el-icon @click="handleClick('')"><HomeFilled /></el-icon>
      <span class="separator">{{ separator }}</span>
      <span class="ellipsis">...</span>
      <span class="separator">{{ separator }}</span>
      <span
        v-if="breadcrumbItems.length > 1"
        class="parent-item"
        @click="handleClick(breadcrumbItems[breadcrumbItems.length - 2].path)"
      >
        {{ breadcrumbItems[breadcrumbItems.length - 2].title }}
      </span>
      <span class="separator">{{ separator }}</span>
      <span class="current-item">
        {{ breadcrumbItems[breadcrumbItems.length - 1].title }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { HomeFilled } from '@element-plus/icons-vue'

interface BreadcrumbItem {
  title: string
  path: string
}

interface Props {
  path: string
  separator?: string
  showHome?: boolean
  mobileBreakpoint?: number
}

const props = withDefaults(defineProps<Props>(), {
  separator: '/',
  showHome: true,
  mobileBreakpoint: 768
})

const emit = defineEmits<{
  navigate: [path: string]
}>()

// 窗口宽度（替代 @vueuse/core）
const windowWidth = ref(window.innerWidth)

// 是否为移动端
const isMobile = computed(() => windowWidth.value < props.mobileBreakpoint)

// 监听窗口尺寸变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 解析路径为面包屑数组
const breadcrumbItems = computed((): BreadcrumbItem[] => {
  if (!props.path) return []

  const parts = props.path.split('/').filter(p => p.trim() !== '')
  const items: BreadcrumbItem[] = []
  let currentPath = ''

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part

    // 保留完整名称（包括数字前缀）
    items.push({
      title: part,
      path: currentPath
    })
  }

  return items
})

// 点击面包屑项
function handleClick(path: string) {
  emit('navigate', path)
}
</script>

<style scoped lang="scss">
.directory-breadcrumb {
  .breadcrumb {
    font-size: 14px;

    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: rgba(0, 0, 0, 0.65);
        font-weight: normal;
        cursor: pointer;
        transition: color 0.2s;

        &:hover {
          color: #1890ff;
        }

        .home-icon {
          font-size: 16px;
        }
      }

      &.is-last {
        .el-breadcrumb__inner {
          color: rgba(0, 0, 0, 0.85);
          font-weight: 500;
          cursor: default;

          &:hover {
            color: rgba(0, 0, 0, 0.85);
          }
        }
      }
    }

    :deep(.el-breadcrumb__separator) {
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .mobile-compact {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    overflow-x: auto;
    white-space: nowrap;
    padding: 4px 0;

    // 隐藏滚动条但保持可滚动
    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;

    .el-icon {
      font-size: 16px;
      color: #1890ff;
      cursor: pointer;
      flex-shrink: 0;
    }

    .separator {
      color: rgba(0, 0, 0, 0.45);
      flex-shrink: 0;
    }

    .ellipsis {
      color: rgba(0, 0, 0, 0.45);
      flex-shrink: 0;
    }

    .parent-item {
      color: rgba(0, 0, 0, 0.65);
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #1890ff;
      }
    }

    .current-item {
      color: rgba(0, 0, 0, 0.85);
      font-weight: 500;
      flex-shrink: 0;
    }
  }

  // 暗色主题
  &.dark {
    .breadcrumb {
      :deep(.el-breadcrumb__item) {
        .el-breadcrumb__inner {
          color: rgba(255, 255, 255, 0.65);

          &:hover {
            color: #1890ff;
          }
        }

        &.is-last {
          .el-breadcrumb__inner {
            color: rgba(255, 255, 255, 0.85);

            &:hover {
              color: rgba(255, 255, 255, 0.85);
            }
          }
        }
      }

      :deep(.el-breadcrumb__separator) {
        color: rgba(255, 255, 255, 0.45);
      }
    }

    .mobile-compact {
      .separator,
      .ellipsis {
        color: rgba(255, 255, 255, 0.45);
      }

      .parent-item {
        color: rgba(255, 255, 255, 0.65);

        &:hover {
          color: #1890ff;
        }
      }

      .current-item {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}

// 移动端隐藏完整面包屑，显示简化版本
@media (max-width: 768px) {
  .directory-breadcrumb {
    .breadcrumb {
      display: none;
    }

    .mobile-compact {
      display: flex;
    }
  }
}

// 桌面端隐藏简化版本
@media (min-width: 769px) {
  .directory-breadcrumb {
    .mobile-compact {
      display: none;
    }
  }
}
</style>
