<template>
  <div :class="['empty-state', { 'empty-state-compact': compact }]">
    <!-- 插图区域 -->
    <div class="empty-illustration">
      <!-- 使用 Element Plus 图标或自定义插图 -->
      <component v-if="icon" :is="icon" class="empty-icon" />
      <slot name="illustration" v-else>
        <!-- 默认插图 -->
        <svg class="empty-default-svg" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="80" fill="#F1F5F9" />
          <path d="M70 90C70 85.5817 73.5817 82 78 82H122C126.418 82 130 85.5817 130 90V130C130 134.418 126.418 138 122 138H78C73.5817 138 70 134.418 70 130V90Z" fill="#E2E8F0" />
          <circle cx="85" cy="105" r="5" fill="#CBD5E1" />
          <circle cx="115" cy="105" r="5" fill="#CBD5E1" />
          <path d="M90 120C90 120 95 125 100 125C105 125 110 120 110 120" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" />
        </svg>
      </slot>
    </div>

    <!-- 文本区域 -->
    <div class="empty-content">
      <h3 v-if="title" class="empty-title">{{ title }}</h3>
      <p v-if="description" class="empty-description">{{ description }}</p>
      <slot></slot>
    </div>

    <!-- 操作区域 -->
    <div v-if="$slots.action || actionText" class="empty-actions">
      <slot name="action">
        <el-button v-if="actionText" type="primary" @click="$emit('action')">
          <el-icon v-if="actionIcon"><component :is="actionIcon" /></el-icon>
          {{ actionText }}
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // 标题
  title: {
    type: String,
    default: '暂无数据'
  },
  // 描述文本
  description: {
    type: String,
    default: ''
  },
  // 图标组件
  icon: {
    type: [String, Object],
    default: null
  },
  // 操作按钮文本
  actionText: {
    type: String,
    default: ''
  },
  // 操作按钮图标
  actionIcon: {
    type: [String, Object],
    default: null
  },
  // 紧凑模式
  compact: {
    type: Boolean,
    default: false
  }
})

defineEmits(['action'])
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

// ============================================
// 空状态容器
// ============================================

.empty-state {
  @include flex-column;
  @include flex-center;
  padding: $spacing-12;
  text-align: center;
  min-height: 400px;

  &.empty-state-compact {
    padding: $spacing-8;
    min-height: 300px;
  }
}

// ============================================
// 插图区域
// ============================================

.empty-illustration {
  margin-bottom: $spacing-6;
  animation: float 3s ease-in-out infinite;

  @include reduced-motion {
    animation: none;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-icon {
  font-size: 80px;
  color: $text-muted;
  opacity: 0.5;
}

.empty-default-svg {
  width: 120px;
  height: 120px;
  opacity: 0.8;
}

// ============================================
// 文本区域
// ============================================

.empty-content {
  max-width: 400px;
  margin-bottom: $spacing-6;
}

.empty-title {
  margin: 0 0 $spacing-3 0;
  font-size: $text-xl;
  font-weight: $font-semibold;
  color: $text-primary;
}

.empty-description {
  margin: 0;
  font-size: $text-base;
  color: $text-muted;
  line-height: $leading-relaxed;
}

// ============================================
// 操作区域
// ============================================

.empty-actions {
  @include flex-center;
  gap: $spacing-3;
}

// ============================================
// 响应式优化
// ============================================

@media screen and (max-width: 768px) {
  .empty-state {
    padding: $spacing-8;
    min-height: 300px;

    &.empty-state-compact {
      padding: $spacing-6;
      min-height: 250px;
    }
  }

  .empty-icon {
    font-size: 60px;
  }

  .empty-default-svg {
    width: 100px;
    height: 100px;
  }

  .empty-title {
    font-size: $text-lg;
  }

  .empty-description {
    font-size: $text-sm;
  }
}

@media screen and (max-width: 480px) {
  .empty-state {
    padding: $spacing-6;
    min-height: 250px;
  }

  .empty-icon {
    font-size: 50px;
  }

  .empty-default-svg {
    width: 80px;
    height: 80px;
  }
}
</style>
