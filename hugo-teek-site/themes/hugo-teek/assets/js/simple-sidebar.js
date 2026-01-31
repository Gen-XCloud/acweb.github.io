// ========================================
// Simple Sidebar - 简单的交互逻辑（支持PC和移动端）
// ========================================

(function() {
  'use strict';

  // ========================================
  // 滚动到激活项（智能判断是否需要滚动）
  // ========================================

  function scrollToActiveItem(sidebar, activeItem) {
    if (!activeItem) return;

    // 滚动容器就是 sidebar 自身（.simple-sidebar 有 overflow: auto）
    // 或者查找最近的可滚动父级
    let scrollContainer = sidebar;

    // 如果 sidebar 自身不可滚动，尝试查找父级
    if (sidebar.scrollHeight <= sidebar.clientHeight) {
      scrollContainer = sidebar.closest('.VPSidebar') ||
                       sidebar.closest('.nav') ||
                       sidebar.closest('.mobile-sidebar-drawer__content');
    }

    if (!scrollContainer) {
      console.log('[SimpleSidebar] 未找到滚动容器，跳过滚动');
      return;
    }

    // 检查激活项是否已在可视区内（10%-90%区间）
    const itemRect = activeItem.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    const relativeTop = itemRect.top - containerRect.top;
    const containerHeight = containerRect.height;
    const isVisible = relativeTop > containerHeight * 0.1 && relativeTop < containerHeight * 0.9;

    // 只有不在可视区内时才滚动
    if (isVisible) {
      console.log('[SimpleSidebar] 激活项已在可视区内，跳过滚动');
      return;
    }

    // 延迟滚动，确保展开动画完成
    setTimeout(() => {
      activeItem.scrollIntoView({
        block: 'center',
        behavior: 'instant'
      });
      console.log('[SimpleSidebar] 已滚动到激活项');
    }, 100);
  }

  // ========================================
  // 核心逻辑（可复用）
  // ========================================

  function initSidebarInstance(sidebar) {
    if (!sidebar) return;

    console.log('[SimpleSidebar] 初始化sidebar实例');

    // 避免重复初始化
    if (sidebar.dataset.simpleSidebarInitialized === 'true') {
      console.log('[SimpleSidebar] 已初始化，跳过');
      return;
    }

    // 1. 初始化：展开包含当前页面的路径
    function initActivePath() {
      // 🔥 直接从URL读取，无需依赖data-current-path
      let currentPath = window.location.pathname;

      // 🔥 标准化路径：移除尾部斜杠（统一格式）
      currentPath = currentPath.replace(/\/$/, '');

      console.log('[SimpleSidebar] 当前路径:', currentPath);

      // 🔥 尝试精确匹配
      let activeItem = sidebar.querySelector(`[data-path="${currentPath}"]`);

      // 🔥 如果没找到，尝试带尾部斜杠的版本
      if (!activeItem) {
        activeItem = sidebar.querySelector(`[data-path="${currentPath}/"]`);
      }

      if (activeItem) {
        console.log('[SimpleSidebar] 找到激活项:', activeItem.dataset.path);
        activeItem.classList.add('is-active');

        // 展开所有父级
        let parent = activeItem.parentElement;
        while (parent && parent !== sidebar) {
          if (parent.classList.contains('simple-sidebar__item')) {
            parent.classList.add('is-expanded');
            // 同时更新aria-expanded属性
            const itemInner = parent.querySelector(':scope > .simple-sidebar__item-inner');
            if (itemInner) {
              itemInner.setAttribute('aria-expanded', 'true');
            }
          }
          parent = parent.parentElement;
        }

        // 滚动到激活项
        scrollToActiveItem(sidebar, activeItem);
      } else {
        console.warn('[SimpleSidebar] 未找到匹配项:', currentPath);
      }
    }

    // 2. 文件夹整行点击折叠/展开
    function bindToggleEvents() {
      sidebar.addEventListener('click', (e) => {
        // 🔥 关键改进：监听整个item-inner，不只是按钮
        const itemInner = e.target.closest('.simple-sidebar__item-inner');
        if (!itemInner) return;

        // 🔥 重要：如果点击的是链接，不处理折叠（让链接导航正常进行）
        if (e.target.closest('.simple-sidebar__link')) {
          return;
        }

        // 只有文件夹才能展开/折叠
        const item = itemInner.closest('.simple-sidebar__item');
        if (!item || !item.classList.contains('has-children')) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        // 切换展开状态
        const isExpanded = item.classList.toggle('is-expanded');
        itemInner.setAttribute('aria-expanded', isExpanded.toString());
        console.log('[SimpleSidebar] 切换展开状态:', item.dataset.path);
      });
    }

    // 3. 点击链接时更新激活状态（可选，用于SPA导航）
    function bindLinkEvents() {
      sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('.simple-sidebar__link');
        if (!link) return;

        // 移除旧的激活状态
        sidebar.querySelectorAll('.is-active').forEach(el => {
          el.classList.remove('is-active');
        });

        // 添加新的激活状态
        const item = link.closest('.simple-sidebar__item');
        if (item) {
          item.classList.add('is-active');
          console.log('[SimpleSidebar] 更新激活状态:', item.dataset.path);
        }
      });
    }

    // 初始化此实例
    initActivePath();
    bindToggleEvents();
    bindLinkEvents();

    // 标记为已初始化
    sidebar.dataset.simpleSidebarInitialized = 'true';

    console.log('[SimpleSidebar] 实例初始化完成');
  }

  // ========================================
  // PC端：立即初始化
  // ========================================

  const desktopSidebar = document.querySelector('.VPSidebar .simple-sidebar');
  if (desktopSidebar) {
    console.log('[SimpleSidebar] 初始化PC端sidebar');
    initSidebarInstance(desktopSidebar);
  }

  // ========================================
  // 移动端：监听drawer打开事件，延迟初始化
  // ========================================

  const mobileDrawer = document.querySelector('.mobile-sidebar-drawer');
  if (mobileDrawer) {
    console.log('[SimpleSidebar] 检测到移动端drawer');

    // 使用MutationObserver监听drawer的class变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isOpen = mobileDrawer.classList.contains('open');
          if (isOpen) {
            // Drawer打开时，查找并初始化sidebar
            const mobileSidebar = mobileDrawer.querySelector('.simple-sidebar');
            if (mobileSidebar && mobileSidebar.dataset.simpleSidebarInitialized !== 'true') {
              console.log('[SimpleSidebar] 初始化移动端sidebar');
              // 使用setTimeout确保DOM完全渲染
              setTimeout(() => {
                initSidebarInstance(mobileSidebar);
              }, 50);
            }
          }
        }
      });
    });

    // 开始观察
    observer.observe(mobileDrawer, {
      attributes: true,
      attributeFilter: ['class']
    });

    // 如果drawer已经是打开状态，立即初始化
    if (mobileDrawer.classList.contains('open')) {
      const mobileSidebar = mobileDrawer.querySelector('.simple-sidebar');
      if (mobileSidebar) {
        console.log('[SimpleSidebar] Drawer已打开，立即初始化移动端sidebar');
        setTimeout(() => {
          initSidebarInstance(mobileSidebar);
        }, 50);
      }
    }
  }

  // ========================================
  // Pjax支持：页面切换后重新初始化
  // ========================================

  function reinitAfterPjax() {
    console.log('[SimpleSidebar] Pjax导航，重新初始化激活状态');

    // 重新初始化所有sidebar实例
    document.querySelectorAll('.simple-sidebar').forEach(sidebar => {
      // 清除旧的激活状态
      sidebar.querySelectorAll('.is-active').forEach(el => {
        el.classList.remove('is-active');
      });

      // 重新初始化激活路径（但不重复绑定事件）
      let currentPath = window.location.pathname.replace(/\/$/, '');
      let activeItem = sidebar.querySelector(`[data-path="${currentPath}"]`) ||
                       sidebar.querySelector(`[data-path="${currentPath}/"]`);

      if (activeItem) {
        activeItem.classList.add('is-active');
        let parent = activeItem.parentElement;
        while (parent && parent !== sidebar) {
          if (parent.classList.contains('simple-sidebar__item')) {
            parent.classList.add('is-expanded');
            const itemInner = parent.querySelector(':scope > .simple-sidebar__item-inner');
            if (itemInner) {
              itemInner.setAttribute('aria-expanded', 'true');
            }
          }
          parent = parent.parentElement;
        }

        // 滚动到激活项
        scrollToActiveItem(sidebar, activeItem);
      }
    });
  }

  // 暴露给Pjax钩子使用
  window.simpleSidebarReinit = reinitAfterPjax;

})();
