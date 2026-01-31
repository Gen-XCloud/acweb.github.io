<template>
  <div :class="['skeleton-wrapper', { 'skeleton-animated': animated }]">
    <!-- 卡片骨架屏 -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton skeleton-avatar" :style="{ width: avatarSize, height: avatarSize }"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-paragraph"></div>
        <div class="skeleton skeleton-paragraph short"></div>
      </div>
    </div>

    <!-- 列表骨架屏 -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="i in rows" :key="i" class="skeleton-list-item">
        <div class="skeleton skeleton-avatar-small"></div>
        <div class="skeleton-list-content">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
    </div>

    <!-- 表格骨架屏 -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="col in columns" :key="col" class="skeleton skeleton-header-cell"></div>
      </div>
      <div v-for="i in rows" :key="i" class="skeleton-table-row">
        <div v-for="col in columns" :key="col" class="skeleton skeleton-cell"></div>
      </div>
    </div>

    <!-- 文章骨架屏 -->
    <div v-else-if="type === 'article'" class="skeleton-article">
      <div class="skeleton skeleton-title-large"></div>
      <div class="skeleton skeleton-meta"></div>
      <div class="skeleton skeleton-image"></div>
      <div v-for="i in 4" :key="i" class="skeleton skeleton-paragraph"></div>
    </div>

    <!-- 自定义骨架屏 -->
    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // 骨架屏类型
  type: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'list', 'table', 'article', 'custom'].includes(value)
  },
  // 是否显示动画
  animated: {
    type: Boolean,
    default: true
  },
  // 列表/表格行数
  rows: {
    type: Number,
    default: 3
  },
  // 表格列数
  columns: {
    type: Number,
    default: 4
  },
  // 头像大小
  avatarSize: {
    type: String,
    default: '48px'
  }
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

.skeleton-wrapper {
  width: 100%;
}

// ============================================
// 骨架元素基础样式
// ============================================

.skeleton {
  background: $bg-secondary;
  border-radius: $radius-md;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    @include absolute-cover;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    transform: translateX(-100%);
  }
}

// 动画骨架屏
.skeleton-animated .skeleton::after {
  animation: skeleton-loading 1.5s ease-in-out infinite;

  @include reduced-motion {
    animation: none;
  }
}

@keyframes skeleton-loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// ============================================
// 卡片骨架屏
// ============================================

.skeleton-card {
  @include card-soft;
  padding: $spacing-6;
  @include flex-start;
  gap: $spacing-4;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: $radius-full;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  min-width: 0;
}

.skeleton-title {
  height: 20px;
  width: 60%;
  margin-bottom: $spacing-3;
}

.skeleton-paragraph {
  height: 16px;
  width: 100%;
  margin-bottom: $spacing-2;

  &.short {
    width: 80%;
  }
}

// ============================================
// 列表骨架屏
// ============================================

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
}

.skeleton-list-item {
  @include flex-start;
  gap: $spacing-3;
  padding: $spacing-4;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

.skeleton-avatar-small {
  width: 40px;
  height: 40px;
  border-radius: $radius-full;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
  min-width: 0;
}

.skeleton-text {
  height: 14px;
  width: 100%;
  margin-bottom: $spacing-2;

  &.short {
    width: 60%;
    margin-bottom: 0;
  }
}

// ============================================
// 表格骨架屏
// ============================================

.skeleton-table {
  background: $bg-card;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: $shadow-md;
}

.skeleton-table-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: $spacing-3;
  padding: $spacing-4;
  background: $bg-secondary;
  border-bottom: 1px solid $border-light;
}

.skeleton-header-cell {
  height: 18px;
  width: 80%;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: $spacing-3;
  padding: $spacing-4;
  border-bottom: 1px solid $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.skeleton-cell {
  height: 14px;
  width: 70%;
}

// ============================================
// 文章骨架屏
// ============================================

.skeleton-article {
  @include card-soft;
  padding: $spacing-8;
}

.skeleton-title-large {
  height: 32px;
  width: 70%;
  margin-bottom: $spacing-4;
}

.skeleton-meta {
  height: 16px;
  width: 40%;
  margin-bottom: $spacing-6;
}

.skeleton-image {
  height: 300px;
  width: 100%;
  border-radius: $radius-lg;
  margin-bottom: $spacing-6;
}

// ============================================
// 响应式优化
// ============================================

@media screen and (max-width: 768px) {
  .skeleton-card {
    padding: $spacing-4;
  }

  .skeleton-article {
    padding: $spacing-5;
  }

  .skeleton-image {
    height: 200px;
  }

  .skeleton-table-header,
  .skeleton-table-row {
    padding: $spacing-3;
    gap: $spacing-2;
  }
}
</style>
