/**
 * Sidebar静态渲染 + 客户端激活状态管理
 *
 * 功能：
 * 1. 初始化时设置当前页面的激活状态和展开父级路径
 * 2. 处理文件夹折叠/展开点击事件
 * 3. Pjax页面切换时更新激活状态
 *
 * 特点：
 * - 无DOM渲染（由Hugo完成）
 * - 无JSON加载（数据已在页面）
 * - 客户端计算激活状态（~10ms）
 * - 代码精简：~150行（vs原807行）
 */

(function() {
  'use strict';

  // ========== 1. 初始化激活状态 ==========

  /**
   * 初始化激活状态（在页面加载或Pjax切换后调用）
   */
  function initializeActiveState() {
    const currentPath = window.location.pathname;
    const sidebar = document.getElementById('VPSidebarNav');
    if (!sidebar) return;

    // 1. 移除所有旧的激活状态
    sidebar.querySelectorAll('.is-active').forEach(function(el) {
      el.classList.remove('is-active');
    });

    // 2. 查找匹配当前路径的链接
    const normalizedPath = currentPath.replace(/\/$/, '');
    const activeLink = sidebar.querySelector('a[href="' + currentPath + '"]') ||
                       sidebar.querySelector('a[href="' + normalizedPath + '"]') ||
                       sidebar.querySelector('a[href="' + normalizedPath + '/"]');

    if (!activeLink) {
      console.log('[Sidebar] Active link not found for path:', currentPath);
      return;
    }

    // 3. 设置激活状态
    activeLink.classList.add('is-active');

    // 4. 展开父级路径
    expandParentPath(activeLink);

    // 5. 滚动到可见区域
    scrollIntoViewIfNeeded(activeLink);

    console.log('[Sidebar] Active state initialized for:', currentPath);
  }

  // ========== 2. 折叠/展开控制 ==========

  /**
   * 初始化折叠/展开事件监听
   */
  function initToggle() {
    // 使用事件委托，监听文件夹项（箭头或标题）的点击
    document.addEventListener('click', function(e) {
      // 检查是否点击了文件夹项（整个.item区域）
      const item = e.target.closest('.VPSidebarItem.collapsible > .item');
      if (!item) return;

      // 排除点击链接的情况（文档链接不应触发折叠）
      if (e.target.closest('a')) return;

      const section = item.closest('.VPSidebarItem.collapsible');
      if (!section) return;

      // 切换折叠/展开状态
      const isCollapsed = section.classList.contains('collapsed');
      section.classList.toggle('collapsed', !isCollapsed);
      section.classList.toggle('expanded', isCollapsed);

      // 更新ARIA属性（无障碍访问）
      const button = item.querySelector('.caret');
      if (button) {
        button.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
      }

      // 阻止事件冒泡（避免触发父级折叠）
      e.stopPropagation();
    });
  }

  // ========== 3. Pjax页面切换处理 ==========

  /**
   * 初始化Pjax事件监听（页面切换时重新初始化激活状态）
   */
  function initPjaxHandler() {
    if (!window.pjax) {
      console.log('[Sidebar] Pjax not found, skip handler');
      return;
    }

    window.pjax.on('after', function() {
      console.log('[Sidebar] Pjax transition complete, reinitializing active state');
      initializeActiveState();
    });
  }

  /**
   * 展开父级路径（递归向上展开所有父节点）
   */
  function expandParentPath(element) {
    let parent = element.closest('.VPSidebarItem');

    while (parent) {
      parent = parent.parentElement ? parent.parentElement.closest('.VPSidebarItem.collapsible') : null;

      if (parent) {
        parent.classList.remove('collapsed');
        parent.classList.add('expanded');

        const button = parent.querySelector(':scope > .item > .caret');
        if (button) {
          button.setAttribute('aria-expanded', 'true');
        }
      }
    }
  }

  /**
   * 滚动到可见区域（如果激活项不在视口内）
   */
  function scrollIntoViewIfNeeded(link) {
    const container = link.closest('.aside-container') || link.closest('nav');
    if (!container) return;

    const linkRect = link.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 检查链接是否在容器的可视区域内（20%-80%区间）
    const relativeTop = linkRect.top - containerRect.top;
    const containerHeight = containerRect.height;
    const targetMin = containerHeight * 0.2;
    const targetMax = containerHeight * 0.8;

    // 如果不在可视区域内，滚动到30%位置
    if (relativeTop < targetMin || relativeTop > targetMax) {
      const targetScrollTop = link.offsetTop - container.offsetTop - containerHeight * 0.3;

      // 使用instant滚动，消除动画延迟，提升响应速度
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'instant'
      });
    }
  }

  // ========== 4. 初始化 ==========

  /**
   * DOM加载完成后初始化
   */
  function init() {
    // 检查是否已初始化
    if (window._sidebarToggleInitialized) {
      console.log('[Sidebar] Already initialized');
      return;
    }

    const sidebar = document.getElementById('VPSidebarNav');
    if (!sidebar) {
      console.log('[Sidebar] Sidebar not found');
      return;
    }

    // 初始化激活状态（展开父级路径并设置is-active）
    initializeActiveState();

    // 初始化折叠/展开事件
    initToggle();

    // 初始化Pjax事件（如果存在）
    initPjaxHandler();

    // 标记已初始化
    window._sidebarToggleInitialized = true;

    console.log('[Sidebar] Static render + client-side activation initialized');
  }

  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
