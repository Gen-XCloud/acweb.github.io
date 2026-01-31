/**
 * Custom Block Details 交互
 * 处理 ::: details 类型的折叠/展开功能
 */
(function() {
  'use strict';

  /**
   * 初始化详情块
   */
  function initDetailsBlocks() {
    const detailsBlocks = document.querySelectorAll('.custom-block.details');

    if (!detailsBlocks.length) return;

    detailsBlocks.forEach(block => {
      // 检查是否已初始化
      if (block.dataset.initialized === 'true') return;

      // 标记为已初始化
      block.dataset.initialized = 'true';

      // 初始状态：折叠
      const isCollapsed = block.dataset.collapsed !== 'false';
      if (!isCollapsed) {
        block.classList.add('expanded');
      }

      // 点击标题切换状态
      const title = block.querySelector('.custom-block-title');
      if (title) {
        title.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleDetails(block);
        });
      }

      // 也可以点击整个容器（除了内容区域）
      block.addEventListener('click', (e) => {
        const content = block.querySelector('.custom-block-content');
        if (!content || !content.contains(e.target)) {
          toggleDetails(block);
        }
      });
    });
  }

  /**
   * 切换详情块的展开/折叠状态
   */
  function toggleDetails(block) {
    const isExpanded = block.classList.contains('expanded');

    if (isExpanded) {
      // 折叠
      block.classList.remove('expanded');
      block.dataset.collapsed = 'true';
    } else {
      // 展开
      block.classList.add('expanded');
      block.dataset.collapsed = 'false';
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetailsBlocks);
  } else {
    initDetailsBlocks();
  }

  // 监听动态内容加载（如 AJAX 更新）
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      let shouldInit = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              if (node.classList?.contains('custom-block') ||
                  node.querySelector?.('.custom-block.details')) {
                shouldInit = true;
              }
            }
          });
        }
      });

      if (shouldInit) {
        initDetailsBlocks();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
