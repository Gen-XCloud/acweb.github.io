// ========================================
// 文章内容丝滑淡入效果（已移除遮罩层）
// 只在页面加载时触发，轻微而自然
// ========================================

(function () {
  'use strict';

  // 页面加载完成后触发淡入
  function initContentFadeIn() {
    // 查找内容容器
    const contentContainer = document.querySelector('.content-container');

    if (!contentContainer) return;

    // 直接添加 loaded 类，触发淡入动画
    contentContainer.classList.add('loaded');
  }

  // 导出函数供 Swup 使用
  window.initContentFadeIn = initContentFadeIn;

  // DOM加载完成后立即执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContentFadeIn);
  } else {
    initContentFadeIn();
  }
})();
