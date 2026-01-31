/**
 * 文章卡片展开功能 - 悬停/点击展开分类/标签
 * PC端：悬停展开
 * 移动端：点击展开
 */
(function() {
  'use strict';

  // 检查是否在首页
  function isHomePage() {
    return document.body.classList.contains('home-page') || window.location.pathname === '/';
  }

  // 检测是否为移动端
  function isMobile() {
    return window.innerWidth <= 768 || ('ontouchstart' in window);
  }

  // 当前激活的展开面板
  let currentPanel = null;
  let currentTrigger = null;
  let hideTimeout = null;

  // 创建展开面板
  function createExpandPanel(items, type) {
    const panel = document.createElement('div');
    panel.className = 'expand-panel';

    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'expand-item';
      itemEl.textContent = item;
      itemEl.title = item;
      itemEl.setAttribute('aria-label', item);

      // 添加过滤相关的属性
      if (type === 'category') {
        itemEl.classList.add('filter-category');
        itemEl.dataset.category = item;
      } else if (type === 'tag') {
        itemEl.classList.add('filter-tag');
        itemEl.dataset.tag = item;
      }

      panel.appendChild(itemEl);
    });

    return panel;
  }

  // 显示展开面板
  function showPanel(panel, trigger) {
    console.log('[card-expand] showPanel called');

    // 隐藏当前面板
    hideCurrentPanel();

    // 添加到触发元素的父容器
    const container = trigger.closest('.card-meta-item');
    if (!container) {
      console.warn('[card-expand] Container not found');
      return;
    }

    console.log('[card-expand] Appending panel to container');
    container.appendChild(panel);
    currentPanel = panel;
    currentTrigger = trigger;

    // 智能定位（避免超出视口）
    adjustPanelPosition(panel, trigger);

    // 下一帧显示，触发动画
    requestAnimationFrame(() => {
      console.log('[card-expand] Adding "show" class to panel');
      panel.classList.add('show');
    });
  }

  // 调整面板位置（避免超出视口）
  function adjustPanelPosition(panel, trigger) {
    if (!panel) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 16;

    panel.style.left = '0';
    panel.style.right = 'auto';
    panel.style.top = '';
    panel.style.bottom = '';
    panel.classList.remove('position-above', 'position-below');

    const container = trigger ? trigger.closest('.card-meta-item') : panel.parentElement;
    const containerRect = container ? container.getBoundingClientRect() : { top: 0, bottom: 0 };
    const panelRect = panel.getBoundingClientRect();

    const spaceAbove = containerRect.top;
    const spaceBelow = viewportHeight - containerRect.bottom;
    const preferBelow = spaceAbove < panelRect.height + spacing && spaceBelow > spaceAbove;

    if (preferBelow) {
      panel.classList.add('position-below');
      panel.style.top = 'calc(100% + 0.5rem)';
      panel.style.bottom = 'auto';
    } else {
      panel.classList.add('position-above');
      panel.style.bottom = 'calc(100% + 0.5rem)';
      panel.style.top = 'auto';
    }

    let updatedRect = panel.getBoundingClientRect();

    if (updatedRect.right > viewportWidth) {
      panel.style.left = 'auto';
      panel.style.right = '0';
      updatedRect = panel.getBoundingClientRect();
    }

    if (updatedRect.left < 0) {
      panel.style.left = '0';
      panel.style.right = 'auto';
      updatedRect = panel.getBoundingClientRect();
    }

    if (updatedRect.top < 0 && !panel.classList.contains('position-below')) {
      panel.classList.remove('position-above');
      panel.classList.add('position-below');
      panel.style.top = 'calc(100% + 0.5rem)';
      panel.style.bottom = 'auto';
    } else if (updatedRect.bottom > viewportHeight && panel.classList.contains('position-below')) {
      panel.classList.remove('position-below');
      panel.classList.add('position-above');
      panel.style.bottom = 'calc(100% + 0.5rem)';
      panel.style.top = 'auto';
    }
  }

  // 隐藏当前展开面板
  function hideCurrentPanel() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    if (currentPanel) {
      console.log('[card-expand] Hiding current panel');
      currentPanel.classList.remove('show');
      setTimeout(() => {
        if (currentPanel && currentPanel.parentNode) {
          console.log('[card-expand] Removing panel from DOM');
          currentPanel.parentNode.removeChild(currentPanel);
        }
        currentPanel = null;
        currentTrigger = null;
      }, 200); // 等待动画完成
    }
  }

  // 处理分类/标签展开
  function handleExpand(trigger, type) {
    if (!trigger || !trigger.dataset) return;

    const dataStr = type === 'category' ? trigger.dataset.categories : trigger.dataset.tags;
    if (!dataStr) return;

    const items = dataStr.split(',').map(item => item.trim());
    const panel = createExpandPanel(items, type);

    showPanel(panel, trigger);
  }

  // 初始化
  function init() {
    if (!isHomePage()) {
      console.log('[card-expand] Not on homepage, skipping initialization');
      return;
    }

    console.log('[card-expand] Initializing on homepage');

    // 处理 mouseover 事件（PC端悬停）
    document.addEventListener('mouseover', function(e) {
      // 移动端不处理 mouseover
      if (isMobile()) return;

      const target = e.target;
      if (!target || !target.classList) return;

      // 清除隐藏计时器
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }

      // 悬停在 +数字 按钮上
      if (target.classList.contains('category-more')) {
        console.log('[card-expand] Category-more hover (desktop)');
        handleExpand(target, 'category');
      } else if (target.classList.contains('tag-more')) {
        console.log('[card-expand] Tag-more hover (desktop)');
        handleExpand(target, 'tag');
      }
      // 悬停在面板上
      else if (target.classList.contains('expand-panel') || target.closest('.expand-panel')) {
        // 保持面板显示
      }
    });

    // PC端：鼠标离开触发器或面板时关闭
    document.addEventListener('mouseout', function(e) {
      if (isMobile()) return;
      if (!currentPanel || !currentTrigger) return;

      const target = e.target;
      const relatedTarget = e.relatedTarget;

      // 检查是否从触发器离开
      if (target === currentTrigger || target.closest('.category-more, .tag-more') === currentTrigger) {
        // 如果移动到面板上，不关闭
        if (relatedTarget && (relatedTarget === currentPanel || currentPanel.contains(relatedTarget))) {
          return;
        }
      }

      // 检查是否从面板离开
      if (target === currentPanel || currentPanel.contains(target)) {
        // 如果移动到触发器上，不关闭
        if (relatedTarget === currentTrigger) {
          return;
        }
        // 如果移动到面板内其他元素，不关闭
        if (relatedTarget && currentPanel.contains(relatedTarget)) {
          return;
        }
        // 离开面板，关闭
        console.log('[card-expand] Left panel, hiding');
        hideCurrentPanel();
        return;
      }

      // 检查是否离开了当前卡片
      const currentCard = currentTrigger?.closest('.article-card-compact');
      if (currentCard && target === currentCard) {
        // 如果移动到面板上，不关闭
        if (relatedTarget && (relatedTarget === currentPanel || currentPanel.contains(relatedTarget))) {
          return;
        }
        console.log('[card-expand] Left card, hiding');
        hideCurrentPanel();
      }
    });

    // 处理 click 事件（移动端点击展开，PC端点击关闭）
    document.addEventListener('click', function(e) {
      const target = e.target;
      if (!target) return;

      // 点击 +数字 按钮
      if (target.classList && (target.classList.contains('category-more') || target.classList.contains('tag-more'))) {
        // 移动端：切换展开/收起
        if (isMobile()) {
          console.log('[card-expand] +N clicked (mobile)');
          e.preventDefault();
          e.stopPropagation();

          const container = target.closest('.card-meta-item');
          const existingPanel = container?.querySelector('.expand-panel.show');

          if (existingPanel && currentTrigger === target) {
            // 已展开且点击的是同一个按钮，关闭
            hideCurrentPanel();
          } else {
            // 展开新面板
            const type = target.classList.contains('category-more') ? 'category' : 'tag';
            handleExpand(target, type);
          }
        }
        // PC端：点击不做处理（使用悬停）
      }
      // 点击面板内的项目
      else if (target.classList && target.classList.contains('expand-item')) {
        console.log('[card-expand] Panel item clicked');
        // 点击后隐藏面板（让 article-filter.js 处理过滤）
        hideCurrentPanel();
      }
      // 点击外部区域
      else if (!target.closest('.expand-panel') &&
               !target.closest('.category-more') &&
               !target.closest('.tag-more')) {
        if (currentPanel) {
          console.log('[card-expand] Clicked outside, closing panel');
          hideCurrentPanel();
        }
      }
    });

    // 阻止面板内的点击冒泡（避免触发卡片链接）
    document.addEventListener('click', function(e) {
      if (e.target && e.target.closest('.expand-panel')) {
        if (!e.target.classList.contains('expand-item')) {
          e.stopPropagation();
        }
      }
    }, true);

    console.log('[card-expand] Initialization complete');
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
