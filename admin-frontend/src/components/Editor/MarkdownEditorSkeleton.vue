<template>
  <div class="markdown-editor-skeleton">
    <!-- 工具栏骨架 -->
    <div class="skeleton-toolbar">
      <div class="skeleton-btn" v-for="i in 15" :key="i"></div>
    </div>

    <!-- 编辑区域骨架 -->
    <div class="skeleton-editor">
      <div class="skeleton-line" v-for="i in 8" :key="i" :style="{ width: getLineWidth(i) }"></div>
    </div>

    <!-- 加载提示 -->
    <div class="skeleton-hint">
      <div class="loading-spinner"></div>
      <span>编辑器加载中...</span>
    </div>
  </div>
</template>

<script setup>
const getLineWidth = (index) => {
  const widths = ['90%', '85%', '95%', '80%', '92%', '88%', '84%', '90%']
  return widths[index - 1] || '90%'
}
</script>

<style scoped>
.markdown-editor-skeleton {
  border: 1px solid #e3e2e0;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
}

/* 工具栏骨架 */
.skeleton-toolbar {
  height: 48px;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e3e2e0;
  display: flex;
  gap: 4px;
  align-items: center;
}

.skeleton-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    #f7f6f5 25%,
    #e3e2e0 50%,
    #f7f6f5 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* 编辑区域骨架 */
.skeleton-editor {
  padding: 24px 32px;
  min-height: 400px;
  background: #ffffff;
}

.skeleton-line {
  height: 20px;
  margin: 16px 0;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    #f7f6f5 25%,
    #e3e2e0 50%,
    #f7f6f5 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-line:nth-child(odd) {
  animation-delay: 0.1s;
}

/* 加载提示 */
.skeleton-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e3e2e0;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  color: #787774;
  font-weight: 500;
  z-index: 10;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e3e2e0;
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 动画 */
@keyframes shimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 100% 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .skeleton-toolbar {
    height: 44px;
    padding: 6px 12px;
  }

  .skeleton-btn {
    width: 36px;
    height: 36px;
  }

  .skeleton-editor {
    padding: 16px;
    min-height: 300px;
  }

  .skeleton-line {
    height: 18px;
    margin: 12px 0;
  }

  .skeleton-hint {
    font-size: 13px;
    padding: 10px 20px;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
  }
}
</style>
