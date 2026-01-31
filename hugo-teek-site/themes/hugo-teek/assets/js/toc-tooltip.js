/**
 * TOC 链接 Tooltip
 * 为被截断的 TOC 链接添加悬浮提示显示完整标题（跟随光标）
 */
(function() {
  'use strict';

  let tooltip = null;
  let currentLink = null;

  // 创建tooltip元素
  function createTooltip() {
    if (tooltip) return tooltip;

    tooltip = document.createElement('div');
    tooltip.className = 'toc-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: var(--vp-c-bg-elv, #ffffff);
      border: 1px solid var(--vp-c-divider);
      border-radius: 8px;
      padding: 0.5rem 0.75rem;
      font-size: 13px;
      line-height: 1.5;
      color: var(--vp-c-text-1);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
      max-width: 300px;
      white-space: normal;
      word-wrap: break-word;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      backdrop-filter: blur(8px);
    `;

    document.body.appendChild(tooltip);
    return tooltip;
  }

  // 显示tooltip
  function showTooltip(link, text, event) {
    const tip = createTooltip();
    tip.textContent = text;
    tip.style.opacity = '1';
    tip.style.visibility = 'visible';
    currentLink = link;

    // 跟随光标位置
    updateTooltipPosition(event);
  }

  // 隐藏tooltip
  function hideTooltip() {
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
    currentLink = null;
  }

  // 更新tooltip位置（跟随光标）
  function updateTooltipPosition(event) {
    if (!tooltip || !currentLink) return;

    const padding = 12;
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = event.clientX + padding;
    let top = event.clientY + padding;

    // 确保tooltip不超出视口右侧
    if (left + tooltipRect.width > window.innerWidth) {
      left = event.clientX - tooltipRect.width - padding;
    }

    // 确保tooltip不超出视口底部
    if (top + tooltipRect.height > window.innerHeight) {
      top = event.clientY - tooltipRect.height - padding;
    }

    // 确保不超出左侧和顶部
    left = Math.max(padding, left);
    top = Math.max(padding, top);

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  // 初始化TOC链接
  function init() {
    const tocLinks = document.querySelectorAll('.outline-link');

    tocLinks.forEach(link => {
      // 避免重复添加事件监听器
      if (link.dataset.tooltipInitialized) {
        return;
      }
      link.dataset.tooltipInitialized = 'true';

      const fullText = link.textContent.trim();

      // 鼠标进入时检测是否被截断
      link.addEventListener('mouseenter', function(e) {
        // 动态检测是否被截断（考虑样式变化）
        const isTruncated = link.scrollWidth > link.clientWidth;

        if (isTruncated) {
          showTooltip(link, fullText, e);
        }
      });

      // 鼠标移动（更新tooltip位置，使用requestAnimationFrame节流）
      let rafId = null;
      link.addEventListener('mousemove', function(e) {
        if (currentLink === link && !rafId) {
          rafId = requestAnimationFrame(() => {
            updateTooltipPosition(e);
            rafId = null;
          });
        }
      });

      // 鼠标离开
      link.addEventListener('mouseleave', function() {
        hideTooltip();
      });
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 监听窗口大小变化
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      hideTooltip();
    }, 200);
  });

  // 适配暗色模式
  const themeObserver = new MutationObserver(function() {
    if (tooltip) {
      // 暗色模式下更新tooltip样式
      if (document.documentElement.classList.contains('dark') ||
          document.documentElement.classList.contains('dark-mode')) {
        tooltip.style.background = 'var(--vp-c-bg-elv, #1e293b)';
        tooltip.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        tooltip.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)';
      } else {
        tooltip.style.background = 'var(--vp-c-bg-elv, #ffffff)';
        tooltip.style.borderColor = 'var(--vp-c-divider)';
        tooltip.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)';
      }
    }
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // 监听DOM变化，处理动态添加的TOC链接
  const tocObserver = new MutationObserver(function(mutations) {
    let needsInit = false;
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // 检查是否添加了新的TOC链接
          if (node.classList && node.classList.contains('outline-link')) {
            needsInit = true;
          } else if (node.querySelectorAll) {
            const newLinks = node.querySelectorAll('.outline-link');
            if (newLinks.length > 0) {
              needsInit = true;
            }
          }
        }
      });
    });
    if (needsInit) {
      init();
    }
  });

  // 监听TOC容器的变化
  const tocContainers = document.querySelectorAll('.VPDocAsideOutline, .tk-aside-outline');
  tocContainers.forEach(function(container) {
    tocObserver.observe(container, {
      childList: true,
      subtree: true
    });
  });
})();
