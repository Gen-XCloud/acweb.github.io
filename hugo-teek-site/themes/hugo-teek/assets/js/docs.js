(function () {
  // ============================================================
  // CSS变量缓存 (性能优化)
  // ============================================================
  const CSSVariableCache = {
    navHeight: 64,
    layoutTopHeight: 0,

    init() {
      const style = getComputedStyle(document.documentElement);
      this.navHeight = parseInt(style.getPropertyValue('--vp-nav-height')) || 64;
      this.layoutTopHeight = parseInt(style.getPropertyValue('--vp-layout-top-height')) || 0;
    },

    getOffset() {
      return this.navHeight + this.layoutTopHeight + 80;
    }
  };

  // 初始化缓存
  CSSVariableCache.init();

  // 窗口大小变化时更新
  window.addEventListener('resize', () => CSSVariableCache.init());

  // 全局变量存储侧边栏数据
  window.sidebarData = null;

  // 路径索引 Map (O(1) 查找优化)
  let pathIndexMap = null;

  // 数据分片相关变量 (按需加载优化)
  const categoryCache = new Map();
  let sidebarIndex = null;
  let currentCategoryId = null;

  document.addEventListener('DOMContentLoaded', function () {
    // ⚠️ 侧边栏功能已由 sidebar-dynamic.js 接管
    // initSidebarToggle();  // 禁用
    initSidebarGlobalToggle();  // 保留全局切换功能
  });

  // 设置当前页面的侧边栏激活状态（支持自动展开懒加载节点）
  function setActiveSidebarItem() {
    const currentUrl = window.location.pathname;
    // 🎯 标准化当前URL，忽略尾部斜杠
    const normalizedCurrentUrl = currentUrl.replace(/\/$/, '');
    const sidebarItems = document.querySelectorAll('.VPSidebarItem');

    console.log('[Sidebar] 🎯 设置激活项 - 当前URL:', normalizedCurrentUrl);
    console.log('[Sidebar] 📊 侧边栏元素总数:', sidebarItems.length);

    // 移除所有已有的激活状态
    sidebarItems.forEach(item => {
      item.classList.remove('is-active');
      const itemElement = item.querySelector('.item');
      if (itemElement) {
        itemElement.classList.remove('is-active');
      }
    });

    // 查找匹配当前URL的侧边栏项
    let found = false;
    let checkedCount = 0;

    sidebarItems.forEach(item => {
      const dataPath = item.dataset.path;
      if (dataPath && !found) {
        checkedCount++;
        // 🎯 标准化路径，忽略尾部斜杠差异
        const normalizedPath = dataPath.replace(/\/$/, '');

        if (normalizedPath === normalizedCurrentUrl) {
          console.log(`[Sidebar] ✓ 匹配: ${dataPath}`);
          item.classList.add('is-active');
          const itemElement = item.querySelector('.item');
          if (itemElement) {
            itemElement.classList.add('is-active');

            // 确保indicator元素存在
            if (!itemElement.querySelector('.indicator')) {
              const indicator = document.createElement('div');
              indicator.className = 'indicator';
              itemElement.insertBefore(indicator, itemElement.firstChild);
              console.log('[Sidebar] 📍 已添加indicator元素');
            }
          }
          found = true;
          console.log('[Sidebar] ✅ 激活成功:', dataPath);
        }
      }
    });

    if (!found) {
      console.warn('[Sidebar] ⚠️ 未找到匹配项');
      console.log('[Sidebar] 💡 提示: 已检查', checkedCount, '个元素');

      // 🆕 智能展开：尝试查找懒加载节点
      console.log('[Sidebar] 🔍 查找可能包含当前页面的懒加载节点...');
      const lazyItems = document.querySelectorAll('.VPSidebarItem.js-lazy-load');
      console.log('[Sidebar] 📦 找到', lazyItems.length, '个懒加载节点');

      lazyItems.forEach((lazyItem, idx) => {
        const lazyPath = lazyItem.dataset.path;
        if (lazyPath) {
          const normalizedLazyPath = lazyPath.replace(/\/$/, '');

          // 检查当前URL是否在这个懒加载节点的路径下
          if (normalizedCurrentUrl.startsWith(normalizedLazyPath + '/') ||
              normalizedCurrentUrl === normalizedLazyPath) {
            console.log(`[Sidebar] 🎯 找到匹配的懒加载节点 [${idx + 1}]:`, lazyPath);
            console.log('[Sidebar] 🚀 自动展开该节点以查找目标...');

            // 展开懒加载节点
            if (window.loadChildren) {
              window.loadChildren(lazyItem);
              // 标记找到了潜在匹配，等待懒加载完成后重新尝试
              found = 'pending';
            }
          }
        }
      });

      if (found === 'pending') {
        // 等待懒加载完成后重新尝试激活
        setTimeout(() => {
          console.log('[Sidebar] 🔄 懒加载完成，重新尝试激活...');
          setActiveSidebarItem();
        }, 200);
        return found;
      }
    }

    return found;
  }

  // 自动展开到当前激活项的所有父级目录
  function expandToActiveItem() {
    console.log('[Sidebar] 📂 开始展开到激活项...');
    // 首先设置当前页面的激活状态
    const found = setActiveSidebarItem();

    if (!found) {
      console.warn('[Sidebar] ⚠️ 未能激活项，跳过展开');
      return;
    }

    // 等待 DOM 更新后查找激活项
    requestAnimationFrame(() => {
      const activeItem = document.querySelector('.VPSidebarItem.is-active');
      if (!activeItem) {
        console.warn('[Sidebar] ⚠️ 未找到激活项，无法展开');
        return;
      }

      console.log('[Sidebar] ✓ 找到激活项:', activeItem.dataset.path);
      let expandCount = 0;

      // 递归展开所有父级目录
      const expandParent = (element) => {
        const parent = element.parentElement;
        if (!parent || parent.classList.contains('VPSidebar')) return;

        // 检查父级是否是可折叠的侧边栏项
        if (parent.classList.contains('VPSidebarItem') &&
            parent.classList.contains('collapsible') &&
            !parent.classList.contains('expanded')) {

          // 展开父级目录
          const children = parent.querySelector('.items');
          if (children) {
            parent.classList.add('expanded');
            parent.classList.remove('collapsed');
            children.style.maxHeight = '9999px';
            expandCount++;

            console.log(`[Sidebar] 📂 展开父级 [${expandCount}]:`, parent.dataset.path || '(未知路径)');
            // 递归处理更高层级的父级
            expandParent(parent);
          }
        } else {
          // 递归处理更高层级的父级
          expandParent(parent);
        }
      };

      // 从当前激活项开始，递归展开所有父级
      expandParent(activeItem);
      console.log(`[Sidebar] ✅ 展开完成 - 共展开 ${expandCount} 个父级目录`);

      // 展开完成后，滚动到激活项
      setTimeout(() => {
        scrollToActiveItemInDocs();
      }, 100);
    });
  }

  // 滚动到当前激活项（docs.js 专用）
  function scrollToActiveItemInDocs() {
    const activeItem = document.querySelector('.VPSidebarItem.is-active');
    if (!activeItem) {
      console.log('[Sidebar] ⚠️ 未找到激活项，跳过滚动');
      return;
    }

    console.log('[Sidebar] 🎯 开始滚动到激活项...');

    // 查找滚动容器
    let scrollContainer = document.querySelector('.VPSidebar .nav');
    if (!scrollContainer || getComputedStyle(scrollContainer).position !== 'fixed') {
      scrollContainer = document.querySelector('.VPSidebar');
    }

    if (!scrollContainer) {
      console.log('[Sidebar] ⚠️ 未找到滚动容器，跳过滚动');
      return;
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    // 计算激活项在滚动容器中的相对位置
    const itemRelativeTop = itemRect.top - containerRect.top + scrollContainer.scrollTop;
    const containerHeight = scrollContainer.clientHeight;

    // 计算居中位置：让激活项出现在容器的35%位置（视觉上偏上居中更舒适）
    const targetScrollTop = Math.max(0, itemRelativeTop - containerHeight * 0.35);

    // 检查是否需要滚动（如果已经接近居中位置，不滚动）
    const currentScrollTop = scrollContainer.scrollTop;
    const visibleTop = itemRelativeTop - currentScrollTop;
    const isInComfortZone = visibleTop > containerHeight * 0.2 && visibleTop < containerHeight * 0.6;

    console.log('[Sidebar] 📊 滚动计算:', {
      containerHeight,
      itemHeight: itemRect.height,
      itemRelativeTop,
      targetScrollTop,
      currentScrollTop,
      visibleTop,
      isInComfortZone
    });

    if (!isInComfortZone) {
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      console.log('[Sidebar] ✅ 已滚动到激活项');
    } else {
      console.log('[Sidebar] ✅ 激活项已在理想位置，无需滚动');
    }
  }

  window.initSidebarToggle = initSidebarToggle;
  window.initSidebarGlobalToggle = initSidebarGlobalToggle;
  window.initTocHighlight = initTocHighlight;
  window.initLazySidebar = initLazySidebar; // 导出到全局
  window.initSidebarEvents = initSidebarEvents; // 导出到全局（供Swup调用，重构后替代attachLazyLoadHandlers）
  window.expandToActiveItem = expandToActiveItem; // 导出到全局（自动展开到当前激活项）
  window.setActiveSidebarItem = setActiveSidebarItem; // 导出到全局（设置激活状态）

  // ========================================
  // 侧边栏懒加载相关函数
  // ========================================

  // 初始化懒加载
  function initLazySidebar() {
    // 检查是否已经加载过数据
    if (window.sidebarData) {
      console.log('[Sidebar Lazy] Data already loaded, initializing events');
      initSidebarEvents();
      return;
    }

    // 加载完整侧边栏数据，增加重试机制
    const maxRetries = 3;
    let retryCount = 0;

    function loadData() {
      // 并行加载4个拆分文件（性能更优）
      Promise.all([
        fetch('/data/sidebar/weights.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: weights.json`);
          return r.json();
        }),
        fetch('/data/sidebar/prevnext.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: prevnext.json`);
          return r.json();
        }),
        fetch('/data/sidebar/breadcrumbs.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: breadcrumbs.json`);
          return r.json();
        }),
        fetch('/data/sidebar/tree.json').then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}: tree.json`);
          return r.json();
        })
      ])
        .then(([weights, prevnext, breadcrumbs, tree]) => {
          // 合并数据结构（与原格式保持一致）
          window.sidebarData = {
            weights: weights.weights,
            weightsMap: weights.weightsMap,
            prevNextMap: prevnext,
            breadcrumbsMap: breadcrumbs,
            tree: tree
          };
          console.log('[Sidebar] ✅ 数据加载完成 - 树节点数:', tree?.tree?.length || 0);

          // 构建路径索引 (O(1) 查找优化) - 传入 tree.tree 而不是整个对象
          pathIndexMap = buildPathIndex(tree.tree);

          // 初始化侧边栏事件委托
          initSidebarEvents();

          // ✅ 新增：JSON加载完成后设置激活状态并展开
          console.log('[Sidebar] 🚀 准备激活当前页面...');
          requestAnimationFrame(() => {
            const found = setActiveSidebarItem();
            if (found) {
              console.log('[Sidebar] 📂 展开父级目录...');
              expandToActiveItem();
            } else {
              console.warn('[Sidebar] ⚠️ 未能激活项，跳过展开');
            }
          });
        })
        .catch(err => {
          console.error('[Sidebar Lazy] Failed to load sidebar data:', err);

          // 重试逻辑
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`[Sidebar Lazy] Retrying (${retryCount}/${maxRetries})...`);
            setTimeout(loadData, 1000 * retryCount); // 递增延迟
          } else {
            console.error('[Sidebar Lazy] Max retries reached, giving up');
          }
        });
    }

    loadData();
  }

  // 初始化侧边栏事件委托 (单一监听器处理所有交互)
  function initSidebarEvents() {
    // ⚠️ 已由 sidebar-dynamic.js 接管，此函数禁用
    console.log('[Docs] 侧边栏事件由 sidebar-dynamic.js 管理，跳过初始化');
    return;

    // 保留原有代码以便后续参考
    const sidebar = document.querySelector('.docs-sidebar, .VPSidebar');
    if (!sidebar) {
      console.warn('[Sidebar Events] 侧边栏元素未找到');
      return;
    }

    // 防止重复初始化
    if (sidebar.dataset.eventsInitialized) {
      return;
    }
    sidebar.dataset.eventsInitialized = 'true';

    // 单一监听器代理所有点击事件
    sidebar.addEventListener('click', (e) => {
      // 🎯 优先处理懒加载节点（未加载状态）
      const lazyTrigger = e.target.closest('.js-lazy-load:not(.js-loaded) .item, .js-lazy-load:not(.js-loaded)');
      if (lazyTrigger) {
        e.preventDefault();
        e.stopPropagation();

        const lazyItem = lazyTrigger.closest('.js-lazy-load');
        if (lazyItem && !lazyItem.classList.contains('js-loaded')) {
          // 首次点击，加载子节点
          loadChildren(lazyItem);
        }
        return;
      }

      // 🎯 处理所有可折叠节点（包括初始渲染和已加载的懒加载节点）
      const collapsibleTrigger = e.target.closest('.VPSidebarItem.collapsible > .item');
      if (collapsibleTrigger) {
        // 排除懒加载未加载的节点（已在上面处理）
        const treeItem = collapsibleTrigger.closest('.VPSidebarItem');
        if (treeItem && !treeItem.classList.contains('js-lazy-load:not(.js-loaded)')) {
          toggleSection(treeItem);
          e.preventDefault();
        }
      }
    });

    // 🎯 添加 mousedown 事件，提前准备状态
    sidebar.addEventListener('mousedown', (e) => {
      const trigger = e.target.closest('.VPSidebarItem.collapsible .item');
      if (trigger) {
        const treeItem = trigger.closest('.VPSidebarItem');
        if (treeItem) {
          treeItem.classList.add('shiroki-click-prepared'); // ◀️ 添加准备状态类
        }
      }
    });

    // 🎯 清理准备状态类
    sidebar.addEventListener('mouseup', (e) => {
      const trigger = e.target.closest('.VPSidebarItem.collapsible .item');
      if (trigger) {
        const treeItem = trigger.closest('.VPSidebarItem');
        if (treeItem) {
          setTimeout(() => {
            treeItem.classList.remove('shiroki-click-prepared');
          }, 100);
        }
      }
    });

    console.log('[Sidebar Events] 事件委托已初始化');
  }

  /**
   * 安全展开侧边栏节点,避免空白显示
   * @param {HTMLElement} itemsContainer - 子节点容器
   * @param {HTMLElement} itemElement - 父节点元素
   */
  function expandNodeSafely(itemsContainer, itemElement) {
    if (itemsContainer.dataset.expanding === 'true') return;
    itemsContainer.dataset.expanding = 'true';

    // 第一个 RAF: 确保 DOM 插入完成
    requestAnimationFrame(() => {
      // 临时设置为 auto 以计算实际高度
      const originalMaxHeight = itemsContainer.style.maxHeight;
      itemsContainer.style.maxHeight = 'none';
      itemsContainer.style.visibility = 'hidden';
      itemsContainer.style.position = 'absolute';

      // 强制 reflow,获取实际内容高度
      const actualHeight = itemsContainer.scrollHeight;

      // 恢复原始状态
      itemsContainer.style.maxHeight = originalMaxHeight;
      itemsContainer.style.visibility = '';
      itemsContainer.style.position = '';

      // 第二个 RAF: 在下一帧开始过渡
      requestAnimationFrame(() => {
        // 启用硬件加速 (添加 .expanding 类)
        itemElement.classList.add('expanding');

        itemsContainer.style.maxHeight = actualHeight + 'px';
        itemsContainer.classList.add('expanded');
        itemElement.classList.add('expanded');
        itemElement.classList.remove('collapsed');

        // 过渡结束后移除固定高度和 expanding 类
        const handleTransitionEnd = () => {
          itemsContainer.style.maxHeight = 'none';
          itemsContainer.dataset.expanding = 'false';
          itemElement.classList.remove('expanding');  // 禁用硬件加速,节省内存
          itemsContainer.removeEventListener('transitionend', handleTransitionEnd);
        };
        itemsContainer.addEventListener('transitionend', handleTransitionEnd);

        // 兜底: 400ms后强制清理
        setTimeout(() => {
          if (itemsContainer.dataset.expanding === 'true') {
            handleTransitionEnd();
          }
        }, 400);
      });
    });
  }

  // 加载子节点
  function loadChildren(itemElement) {
    if (!window.sidebarData) {
      console.warn('[Sidebar Lazy] Sidebar data not loaded yet');
      return;
    }

    const nodePath = itemElement.dataset.nodePath;
    if (!nodePath) return;

    // 添加加载状态
    itemElement.classList.add('js-loading');
    console.log('[Sidebar Lazy] Loading children for:', nodePath);

    // 使用 O(1) Map 索引查找节点
    const node = findNodeByPath(nodePath);

    if (node && node.children && node.children.length > 0) {
      // 创建items容器
      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'items';
      itemsContainer.style.maxHeight = '0';
      itemsContainer.style.overflow = 'hidden';

      // 渲染所有子节点 (使用 DocumentFragment 批量插入,减少 reflow)
      const level = parseInt(itemElement.className.match(/level-(\d+)/)?.[1] || '0') + 1;
      const fragment = document.createDocumentFragment();
      node.children.forEach(child => {
        const childElement = renderSidebarNode(child, level);
        fragment.appendChild(childElement);
      });
      itemsContainer.appendChild(fragment);  // 一次性插入,单次 reflow

      // 插入DOM
      itemElement.appendChild(itemsContainer);

      // 移除加载状态，标记已加载
      itemElement.classList.remove('js-lazy-load', 'js-loading');
      itemElement.classList.add('js-loaded');

      // 为新创建的collapsible items绑定toggle事件
      // 移除已经存在的初始化标记，确保新节点能被绑定
      const newCollapsibleItems = itemsContainer.querySelectorAll('.VPSidebarItem.collapsible > .item');
      newCollapsibleItems.forEach((item) => {
        delete item.dataset.sidebarToggleInitialized;
      });
      initSidebarToggle();

      // 安全展开节点,避免空白显示
      expandNodeSafely(itemsContainer, itemElement);

      console.log('[Sidebar Lazy] Loaded', node.children.length, 'children for:', nodePath);
    } else {
      // 没有子节点，移除加载状态
      itemElement.classList.remove('js-loading');
      console.warn('[Sidebar Lazy] No children found for:', nodePath);
    }
  }

  /**
   * 构建路径索引 Map (O(1) 查找优化)
   * @param {Array} tree - 侧边栏树数据
   * @returns {Map} 路径 → 节点信息映射
   */
  function buildPathIndex(tree) {
    const map = new Map();

    function traverse(nodes, ancestors = []) {
      // 安全检查：确保 nodes 是数组
      if (!Array.isArray(nodes)) {
        console.warn('[buildPathIndex] nodes is not an array:', nodes);
        return;
      }

      nodes.forEach(node => {
        // 安全检查：确保 node 是对象且有 path 属性
        if (!node || typeof node !== 'object' || !node.path) {
          console.warn('[buildPathIndex] Invalid node:', node);
          return;
        }

        // 标准化路径
        const nodePath = node.path.replace(/\/_index\.md$/, '');

        // 存储节点 + 祖先链
        map.set(nodePath, {
          node: node,
          ancestors: [...ancestors],
          level: ancestors.length
        });

        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children, [...ancestors, node]);
        }
      });
    }

    // 安全检查：确保 tree 是数组
    if (!Array.isArray(tree)) {
      console.error('[buildPathIndex] tree is not an array:', tree);
      return map;
    }

    traverse(tree);
    console.log(`✅ 路径索引构建完成，共 ${map.size} 个节点`);
    return map;
  }

  /**
   * O(1) 查找节点
   * @param {string} path - 文档路径
   * @returns {Object|null} 节点对象
   */
  function findNodeByPath(path) {
    if (!pathIndexMap) {
      console.warn('⚠️ 路径索引尚未构建');
      return null;
    }

    const normalizedPath = path.replace(/\/_index\.md$/, '');
    const result = pathIndexMap.get(normalizedPath);
    return result ? result.node : null;
  }

  // 渲染侧边栏节点（从JSON生成HTML）
  function renderSidebarNode(node, level) {
    const hasChildren = node.children && node.children.length > 0;
    const section = document.createElement('section');

    const classes = ['VPSidebarItem', `level-${level}`];
    if (hasChildren) {
      classes.push('collapsible', 'collapsed', 'js-lazy-load');
    } else {
      classes.push('is-link');
    }
    section.className = classes.join(' ');
    section.dataset.path = node.relPermalink;
    section.dataset.nodePath = node.path.replace(/\/_index\.md$/, '');
    if (hasChildren) {
      section.dataset.childrenCount = node.children.length;
    }
    section.setAttribute('aria-label', `${hasChildren ? '文件夹' : '文档'}: ${node.title}`);

    // 创建item容器
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    if (hasChildren) {
      itemDiv.setAttribute('role', 'button');
      itemDiv.setAttribute('tabindex', '0');
      itemDiv.setAttribute('aria-expanded', 'false');
      itemDiv.setAttribute('aria-label', `展开/折叠 ${node.title}`);
    }

    // 指示器
    const indicator = document.createElement('div');
    indicator.className = 'indicator';
    itemDiv.appendChild(indicator);

    // 图标和文字
    if (hasChildren) {
      // 文件夹
      const textSpan = document.createElement('span');
      textSpan.className = 'text';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'sidebar-icon sidebar-icon--folder';
      iconSpan.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>';
      textSpan.appendChild(iconSpan);
      textSpan.appendChild(document.createTextNode(node.title));
      itemDiv.appendChild(textSpan);

      const caret = document.createElement('div');
      caret.className = 'caret';
      caret.setAttribute('role', 'presentation');
      caret.innerHTML = '<span class="vpi-chevron-right caret-icon"></span>';
      itemDiv.appendChild(caret);
    } else {
      // 文档链接
      const link = document.createElement('a');
      link.className = 'VPLink link';
      link.href = node.relPermalink;
      link.dataset.path = node.relPermalink;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'sidebar-icon sidebar-icon--doc';
      iconSpan.innerHTML = '<svg viewBox="0 0 1024 1024" aria-hidden="true"><path fill="currentColor" d="M623.104 76.8v159.232c0 30.72 25.088 55.808 55.808 55.808h169.472l-225.28-215.04z"/><path fill="currentColor" d="M848.384 317.44h-189.952c-34.304 0-62.464-28.16-62.464-62.464V76.8h-358.4c-34.304 0-62.464 28.16-62.464 62.464v745.472c0 34.304 28.16 62.464 62.464 62.464h548.864c34.304 0 62.464-28.16 62.464-62.464L848.384 317.44z m-578.56 101.376h271.872c18.432 0 33.792 15.36 33.792 33.792s-15.36 33.792-33.792 33.792H269.824c-18.432 0-33.792-15.36-33.792-33.792s15.36-33.792 33.792-33.792z m422.4 382.464H269.824c-18.432 0-33.792-15.36-33.792-33.792 0-18.432 15.36-33.792 33.792-33.792h422.4c18.432 0 33.792 15.36 33.792 33.792 0 18.944-14.848 33.792-33.792 33.792z m16.384-157.184H269.824c-18.432 0-33.792-15.36-33.792-33.792s15.36-33.792 33.792-33.792h438.784c18.432 0 33.792 15.36 33.792 33.792s-14.848 33.792-33.792 33.792z"/></svg>';
      link.appendChild(iconSpan);

      const textSpan = document.createElement('span');
      textSpan.className = 'text';
      textSpan.textContent = node.title;
      link.appendChild(textSpan);

      itemDiv.appendChild(link);
    }

    section.appendChild(itemDiv);
    return section;
  }

  // 🎯 切换展开/折叠 - 优化响应性
  function toggleSection(section) {
    const items = section.querySelector('.items');
    if (!items) return;

    // 🎯 立即添加视觉反馈
    section.classList.add('shiroki-toggling');

    // 展开/折叠状态由 CSS 类控制，无需手动设置 maxHeight
    if (section.classList.contains('expanded')) {
      section.classList.remove('expanded');
      // items.style.maxHeight = '0';  // 由 CSS 类 .collapsed 控制
    } else {
      section.classList.add('expanded');
      // items.style.maxHeight = '9999px';  // 由 CSS 类 .expanded 控制
    }

    // 🎯 清理切换状态
    setTimeout(() => {
      section.classList.remove('shiroki-toggling');
    }, 300);
  }

  // ========================================
  // 原有的侧边栏折叠/展开功能
  // ========================================

  function initSidebarToggle() {
    // 排除懒加载占位符，只处理已完整渲染的collapsible items
    const allItems = document.querySelectorAll('.VPSidebarItem.collapsible > .item');
    const items = Array.from(allItems).filter(item => {
      const parent = item.parentElement;
      return !parent.classList.contains('js-lazy-load');
    });
    if (!items.length) return;

    // 防抖函数
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // 递归计算实际高度（使用 scrollHeight 获取真实高度）
    const calculateActualHeight = (element) => {
      // 使用 scrollHeight 直接获取，避免临时修改样式
      return element.scrollHeight;
    };

    // 更新元素的最大高度
    const updateMaxHeight = (parent, children) => {
      if (parent.classList.contains('expanded')) {
        // 使用一个足够大的值来避免计算
        children.style.maxHeight = '9999px';
      } else {
        children.style.maxHeight = '0';
      }
    };

    // 向上级联更新所有父级的高度（由 CSS 类 .expanded 控制，无需手动设置）
    const updateParentMaxHeight = (element) => {
      let current = element.parentElement;
      while (current) {
        if (current.classList.contains('VPSidebarItem') && current.classList.contains('expanded')) {
          const itemsContainer = current.querySelector('.items');
          if (itemsContainer) {
            // maxHeight 由 CSS 类 .expanded 控制，无需手动设置
            // itemsContainer.style.maxHeight = '9999px';
          }
        }
        current = current.parentElement;
      }
    };

    // 自动展开到当前激活项的所有父级目录
    // 注意：此处使用全局的 expandToActiveItem 函数，已在第82-119行定义

    items.forEach((item) => {
      // 防止重复初始化（Swup替换侧边栏后会重新调用此函数）
      if (item.dataset.sidebarToggleInitialized) {
        return;
      }
      item.dataset.sidebarToggleInitialized = 'true';

      const parent = item.parentElement;
      const children = parent.querySelector('.items');
      if (!children) return;

      // 初始化高度和 aria 属性
      const isExpanded = parent.classList.contains('expanded');
      updateMaxHeight(parent, children);
      item.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

      // 确保初始状态正确
      if (!isExpanded && !parent.classList.contains('collapsed')) {
        parent.classList.add('collapsed');
      }

      const toggle = () => {
        const wasExpanded = parent.classList.contains('expanded');
        const expanded = parent.classList.toggle('expanded');
        parent.classList.toggle('collapsed', !expanded);
        item.setAttribute('aria-expanded', expanded ? 'true' : 'false');

        // 使用requestAnimationFrame确保平滑动画
        requestAnimationFrame(() => {
          updateMaxHeight(parent, children);
          // 级联更新所有父级的高度
          updateParentMaxHeight(parent);
        });

        // 保存展开状态到localStorage
        const sectionTitle = item.querySelector('.text')?.textContent?.trim();
        if (sectionTitle) {
          try {
            const expandedSections = JSON.parse(localStorage.getItem('sidebar-expanded') || '{}');
            expandedSections[sectionTitle] = expanded;
            localStorage.setItem('sidebar-expanded', JSON.stringify(expandedSections));
          } catch (e) {
            console.warn('无法保存侧边栏状态:', e);
          }
        }
      };

      // 恢复保存的展开状态
      const sectionTitle = item.querySelector('.text')?.textContent?.trim();
      if (sectionTitle) {
        try {
          const expandedSections = JSON.parse(localStorage.getItem('sidebar-expanded') || '{}');
          // 优化：只有在 localStorage 中明确标记为 true 的项才展开
          // 不自动展开到当前激活项的父级，除非用户之前手动展开过
          if (expandedSections[sectionTitle] === true) {
            parent.classList.add('expanded');
            parent.classList.remove('collapsed');
            updateMaxHeight(parent, children);
            // 恢复状态时也要级联更新父级
            updateParentMaxHeight(parent);
          }
        } catch (e) {
          console.warn('无法恢复侧边栏状态:', e);
        }
      }

      item.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
          return;
        }
        toggle();
      });

      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    });

    // 窗口大小改变时重新计算高度（包括级联更新）
    window.addEventListener('resize', debounce(() => {
      items.forEach((item) => {
        const parent = item.parentElement;
        const children = parent.querySelector('.items');
        if (children && parent.classList.contains('expanded')) {
          updateMaxHeight(parent, children);
          updateParentMaxHeight(parent);
        }
      });
    }, 150));

    // 页面加载后，对所有展开项进行一次高度更新（从下往上）
    setTimeout(() => {
      // 检查是否有 localStorage 记忆的展开状态
      const hasSavedExpandedState = () => {
        try {
          const expandedSections = JSON.parse(localStorage.getItem('sidebar-expanded') || '{}');
          return Object.values(expandedSections).some(v => v === true);
        } catch (e) {
          return false;
        }
      };

      // 先收集所有展开的项目
      const expandedItems = Array.from(document.querySelectorAll('.VPSidebarItem.collapsible.expanded'));

      // 按层级从深到浅排序（深层的先更新）
      expandedItems.sort((a, b) => {
        const getDepth = (element) => {
          let depth = 0;
          let current = element;
          while (current) {
            if (current.classList && current.classList.contains('VPSidebarItem')) {
              depth++;
            }
            current = current.parentElement;
          }
          return depth;
        };
        return getDepth(b) - getDepth(a);
      });

      // 更新所有展开项的高度
      expandedItems.forEach((parent) => {
        const children = parent.querySelector('.items');
        if (children) {
          updateMaxHeight(parent, children);
        }
      });

      // 优化：自动展开到当前激活项并滚动
      if (window.expandToActiveItem) {
        console.log('[Sidebar] 🚀 自动展开到当前激活项...');
        window.expandToActiveItem();
      }
    }, 150);
  }

  function initSidebarGlobalToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (!toggleBtn) return;

    const body = document.body;

    // 不再从 localStorage 恢复折叠状态，默认始终展开
    // 确保移除可能存在的折叠类
    body.classList.remove('sidebar-collapsed');

    // 点击折叠/展开（临时效果，刷新后恢复展开）
    toggleBtn.addEventListener('click', () => {
      // 只切换类，不保存到 localStorage
      body.classList.toggle('sidebar-collapsed');

      // 添加动画提示
      toggleBtn.classList.add('active');
      setTimeout(() => toggleBtn.classList.remove('active'), 300);
    });

    // 键盘快捷键：Ctrl+B 或 Cmd+B 切换侧边栏
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleBtn.click();
      }
    });

    console.log('[Sidebar] Global toggle initialized (always expanded on refresh)');
  }

  let tocObserver = null; // 全局变量存储观察者实例
  let tocCleanup = null;  // 全局变量存储清理函数

  function initTocHighlight() {
    //1. 清理旧的副作用（观察者、事件监听器等）
    if (tocCleanup) {
      tocCleanup();
      tocCleanup = null;
    }

    if (tocObserver) {
      tocObserver.disconnect();
      tocObserver = null;
    }

    //2. 获取 DOM 元素
    const toc = document.querySelector('.VPDocAsideOutline');
    if (!toc) return;

    const links = toc.querySelectorAll('.outline-link');
    if (!links.length) return;

    // 为被截断的 TOC 链接添加 data-title 属性（用于悬停显示完整文本）
    links.forEach(link => {
      // 检查文本是否被截断（scrollWidth > clientWidth）
      if (link.scrollWidth > link.clientWidth) {
        const text = link.textContent.trim();
        if (text && !link.hasAttribute('data-title')) {
          link.setAttribute('data-title', text);
        }
      } else {
        // 移除不需要的 data-title 属性
        if (link.hasAttribute('data-title')) {
          link.removeAttribute('data-title');
        }
      }
    });

    const scrollContainer = toc.querySelector('[data-outline-scroll]');
    const marker = toc.querySelector('.outline-marker');

    // 3. 构建链接映射
    const linkMap = new Map();
    links.forEach((link) => {
      const hash = decodeURIComponent(link.getAttribute('href') || '').replace(/^#/, '');
      if (!hash) return;
      const heading = document.getElementById(hash);
      if (heading) {
        linkMap.set(heading, link);
      }
    });

    if (!linkMap.size) return;

    // 4. 定义内部状态和辅助函数
    const scrollTarget = scrollContainer || toc;
    let activeLink = null;

    const updateMarker = (link) => {
      if (!marker) return;

      if (!link) {
        marker.classList.remove('visible');
        marker.style.top = '32px';
        marker.style.opacity = '0';
        return;
      }

      // 计算相对位置，确保 marker 定位准确
      // 使用 offsetTop 加上固定的头部偏移
      marker.style.top = link.offsetTop + 39 + 'px';
      marker.style.opacity = '1';
      marker.classList.add('visible');
    };

    const setActive = (link, options = {}) => {
      const shouldScroll = options.scrollIntoView !== false;

      if (activeLink === link) {
        updateMarker(link);
        return;
      }

      links.forEach((node) => node.classList.remove('active'));
      if (link) {
        activeLink = link;
        link.classList.add('active');

        // 改进的自动滚动逻辑
        if (shouldScroll) {
          // 查找实际的滚动容器 - .aside-container 才是真正滚动的容器
          const scrollContainer = document.querySelector('.aside .aside-container');

          if (scrollContainer) {
            const isScrollable = scrollContainer.scrollHeight > scrollContainer.clientHeight + 8;

            if (isScrollable) {
              // 计算链接在滚动容器中的位置
              const containerRect = scrollContainer.getBoundingClientRect();
              const linkRect = link.getBoundingClientRect();

              // 链接在视口中的绝对位置 - 容器在视口中的绝对位置 + 当前滚动偏移
              const linkRelativeTop = linkRect.top - containerRect.top + scrollContainer.scrollTop;
              const containerHeight = scrollContainer.clientHeight;
              const currentScrollTop = scrollContainer.scrollTop;

              // 检查链接是否在可见区域的中间部分（25%-75%）
              const visibleTop = currentScrollTop;
              // const visibleBottom = currentScrollTop + containerHeight;
              const targetTop = visibleTop + containerHeight * 0.25;
              const targetBottom = visibleTop + containerHeight * 0.75;

              const needScroll = linkRelativeTop < targetTop || linkRelativeTop > targetBottom;

              if (needScroll) {
                // 计算目标滚动位置：让链接出现在容器的 35% 位置
                const targetScrollTop = Math.max(0, linkRelativeTop - containerHeight * 0.35);

                scrollContainer.scrollTo({
                  top: targetScrollTop,
                  behavior: 'smooth'
                });

                // 使用单层 requestAnimationFrame 更新 marker（性能优化）
                requestAnimationFrame(() => updateMarker(link));
                return;
              }
            }
          }
        }

        updateMarker(link);
      } else {
        activeLink = null;
        updateMarker(null);
      }
    };

    let activeHeading = null;

    // 5. 初始化 IntersectionObserver
    // 优化：减少 threshold 数量，降低回调频率
    tocObserver = new IntersectionObserver((entries) => {
      // 收集所有可见的标题
      const visibleHeadings = [];

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleHeadings.push({
            heading: entry.target,
            top: entry.boundingClientRect.top
          });
        }
      });

      // 如果有可见标题，选择最靠近顶部的那个
      if (visibleHeadings.length > 0) {
        visibleHeadings.sort((a, b) => a.top - b.top);
        const topHeading = visibleHeadings[0].heading;

        if (topHeading !== activeHeading) {
          activeHeading = topHeading;
          const link = linkMap.get(topHeading);
          if (link) {
            setActive(link);
          }
        }
      }
    }, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0.5  // 优化：只使用单一阈值，减少回调频率
    });

    linkMap.forEach((_, heading) => tocObserver.observe(heading));

    // 6. 绑定滚动同步事件
    // 优化：使用 requestAnimationFrame 和节流减少 DOM 计算
    let scrollTimeout;
    let ticking = false;
    let cachedHeadingRects = null;
    let lastCacheTime = 0;

    const updateActiveOnScroll = () => {
      // 优化：使用 requestAnimationFrame 防抖
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const now = performance.now();
        
        // 缓存优化：每 200ms 更新一次 getBoundingClientRect 缓存
        if (!cachedHeadingRects || now - lastCacheTime > 200) {
          const headings = Array.from(linkMap.keys());
          cachedHeadingRects = headings.map(heading => ({
            heading,
            rect: heading.getBoundingClientRect()
          }));
          lastCacheTime = now;
        }

        let closestHeading = null;
        let closestDistance = Infinity;

        cachedHeadingRects.forEach(({ heading, rect }) => {
          // 计算标题到导航栏下方的距离（80px 是导航栏高度 + 偏移）
          const distance = Math.abs(rect.top - 80);

          if (rect.top < window.innerHeight && rect.top > -rect.height) {
            // 标题在视口内
            if (distance < closestDistance) {
              closestDistance = distance;
              closestHeading = heading;
            }
          }
        });

        if (closestHeading && closestHeading !== activeHeading) {
          activeHeading = closestHeading;
          const link = linkMap.get(closestHeading);
          if (link) {
            setActive(link);
          }
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    
    // 优化：滚动停止时清理缓存，节省内存
    window.addEventListener('scrollend', () => {
      cachedHeadingRects = null;
    }, { passive: true });

    const syncMarker = () => {
      if (activeLink) {
        updateMarker(activeLink);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', syncMarker, { passive: true });
    }

    window.addEventListener('resize', syncMarker, { passive: true });

    // 7. 绑定点击事件
    const clickHandlers = new Map(); // 存储点击处理函数以便清理

    links.forEach((link) => {
      // 防止重复绑定：检查是否已经绑定过
      if (link.hasAttribute('data-toc-initialized')) {
        return;
      }
      link.setAttribute('data-toc-initialized', 'true');

      const clickHandler = (event) => {
        event.preventDefault();
        event.stopPropagation(); // 阻止事件冒泡

        const hash = decodeURIComponent(link.getAttribute('href') || '').replace(/^#/, '');
        if (!hash) return;
        const heading = document.getElementById(hash);
        if (heading) {
          // 使用缓存的导航栏高度（性能优化）+ 40px额外偏移
          const offset = CSSVariableCache.getOffset() + 40;

          const targetPosition = heading.getBoundingClientRect().top + window.pageYOffset - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: 'instant'
          });

          history.replaceState(null, '', `#${hash}`);
          setActive(link);
        }
      };
      
      link.addEventListener('click', clickHandler, { passive: false });
      clickHandlers.set(link, clickHandler);
    });

    // 8. 注册清理函数
    tocCleanup = () => {
        window.removeEventListener('scroll', updateActiveOnScroll);
        window.removeEventListener('resize', syncMarker);
        if (scrollContainer) {
            scrollContainer.removeEventListener('scroll', syncMarker);
        }
        // 清理点击事件（虽然元素可能被移除了，但为了保险）
        clickHandlers.forEach((handler, link) => {
            link.removeEventListener('click', handler);
        });
        clearTimeout(scrollTimeout);
    };

    // 9. 初始激活
    // Initialize on page load - check current hash or first visible heading
    setTimeout(() => {
      // 再次检查是否已被清理，防止异步回调在清理后执行
      if (!tocObserver && tocCleanup === null) return;
      
      const currentHash = location.hash.replace(/^#/, '');
      if (currentHash) {
        const currentLink = toc.querySelector(`a[href="#${currentHash}"]`);
        if (currentLink) {
          setActive(currentLink, { scrollIntoView: false });
          return;
        }
      }
      // If no hash, activate first link
      if (links.length > 0) {
        setActive(links[0], { scrollIntoView: false });
      }
    }, 100);
  }

  function initSidebarMarker() {
    const sidebar = document.querySelector('.VPSidebar');
    if (!sidebar) return;

    const marker = sidebar.querySelector('.sidebar-marker');
    if (!marker) return;

    const updateMarker = (activeLink) => {
      if (!activeLink) {
        marker.classList.remove('visible');
        marker.style.top = '32px';
        marker.style.opacity = '0';
        return;
      }

      marker.style.top = activeLink.offsetTop + 'px';
      marker.style.opacity = '1';
      marker.classList.add('visible');
    };

    // 初始化：查找当前激活的链接
    const activeLink = sidebar.querySelector('.VPSidebarItem.is-active a.link');
    if (activeLink) {
      setTimeout(() => updateMarker(activeLink), 100);
    }

    // 监听折叠/展开事件，重新计算 marker 位置
    const observer = new MutationObserver((mutations) => {
      // 忽略 marker 自身的变化，避免无限循环
      const shouldUpdate = mutations.some(mutation =>
        mutation.target !== marker && !marker.contains(mutation.target)
      );

      if (shouldUpdate) {
        const currentActive = sidebar.querySelector('.VPSidebarItem.is-active a.link');
        if (currentActive) {
          updateMarker(currentActive);
        }
      }
    });

    observer.observe(sidebar, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'style']
    });

    // 窗口大小改变时重新计算
    window.addEventListener('resize', () => {
      const currentActive = sidebar.querySelector('.VPSidebarItem.is-active a.link');
      if (currentActive) {
        updateMarker(currentActive);
      }
    }, { passive: true });
  }

  // ========================================
  // Swup 页面过渡状态管理
  // ========================================

  // 保存侧边栏状态到 sessionStorage（用于 Swup 页面切换）
  function saveSidebarState() {
    try {
      const expandedItems = [];
      const scrollTop = document.querySelector('.VPSidebar')?.scrollTop || 0;

      document.querySelectorAll('.VPSidebarItem.expanded').forEach(item => {
        const link = item.querySelector('.item .text');
        if (link) {
          expandedItems.push(link.textContent.trim());
        }
      });

      const state = {
        expanded: expandedItems,
        scrollTop: scrollTop,
        timestamp: Date.now()
      };

      sessionStorage.setItem('sidebarSwupState', JSON.stringify(state));
      console.log('[Sidebar] 状态已保存 (Swup):', state);
    } catch (e) {
      console.warn('[Sidebar] 无法保存状态:', e);
    }
  }

  // 恢复侧边栏状态（用于 Swup 页面切换后）
  function restoreSidebarState() {
    try {
      const stateStr = sessionStorage.getItem('sidebarSwupState');
      if (!stateStr) return;

      const state = JSON.parse(stateStr);
      const now = Date.now();

      // 状态有效期 5 分钟
      if (now - state.timestamp > 300000) {
        sessionStorage.removeItem('sidebarSwupState');
        return;
      }

      console.log('[Sidebar] 恢复状态 (Swup):', state);

      // 恢复展开状态
      if (state.expanded && state.expanded.length > 0) {
        state.expanded.forEach(title => {
          const item = Array.from(document.querySelectorAll('.VPSidebarItem.collapsible > .item'))
            .find(el => el.querySelector('.text')?.textContent.trim() === title);

          if (item) {
            const parent = item.parentElement;
            const children = parent.querySelector('.items');

            if (children && !parent.classList.contains('expanded')) {
              parent.classList.add('expanded');
              parent.classList.remove('collapsed');

              // 计算并设置高度
              const height = children.scrollHeight;
              children.style.maxHeight = `${height + 50}px`;
            }
          }
        });
      }

      // 设置当前页面的激活状态
      setActiveSidebarItem();
      
      // 自动展开到当前激活项
      expandToActiveItem();
      
      // 滚动到当前激活项（使用 initSidebarToggle 中的内部函数）
      // 由于 scrollToActiveItem 是 initSidebarToggle 的内部函数，需要在这里重新定义
      const doScrollToActiveItem = () => {
        // 修复：正确的选择器应该是 .is-link 下的 .is-active
        const activeLink = document.querySelector('.VPSidebarItem.is-link .item.is-active');
        if (!activeLink) return;

        // 查找实际的滚动容器
        // 桌面端：.VPSidebar .nav (position: fixed 的滚动容器)
        // 移动端：.VPSidebar
        let scrollContainer = document.querySelector('.VPSidebar .nav');
        if (!scrollContainer || getComputedStyle(scrollContainer).position !== 'fixed') {
          // 如果.nav不是fixed定位（移动端），使用.VPSidebar
          scrollContainer = document.querySelector('.VPSidebar');
        }

        if (!scrollContainer) return;

        // 获取激活项相对于滚动容器的位置
        const activeItem = activeLink.closest('.VPSidebarItem');
        const containerRect = scrollContainer.getBoundingClientRect();
        const itemRect = activeItem.getBoundingClientRect();

        // 计算激活项在滚动容器中的相对位置
        const itemRelativeTop = itemRect.top - containerRect.top + scrollContainer.scrollTop;
        const containerHeight = scrollContainer.clientHeight;

        // 计算居中位置：让激活项出现在容器的35%位置（视觉上偏上居中更舒适）
        const targetScrollTop = Math.max(0, itemRelativeTop - containerHeight * 0.35);

        // 检查是否需要滚动（如果已经接近居中位置，不滚动）
        const currentScrollTop = scrollContainer.scrollTop;
        const visibleTop = itemRelativeTop - currentScrollTop;
        const isInComfortZone = visibleTop > containerHeight * 0.2 && visibleTop < containerHeight * 0.6;

        if (!isInComfortZone) {
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        }
      };
      
      doScrollToActiveItem();
      
      // 恢复滚动位置
      if (state.scrollTop) {
        const sidebar = document.querySelector('.VPSidebar');
        if (sidebar) {
          // 延迟恢复滚动位置，确保 DOM 已更新
          setTimeout(() => {
            sidebar.scrollTop = state.scrollTop;
          }, 100);
        }
      }
    } catch (e) {
      console.warn('[Sidebar] 无法恢复状态:', e);
    }
  }

  // 在点击折叠/展开时保存状态
  document.addEventListener('click', (e) => {
    if (e.target.closest('.VPSidebarItem.collapsible > .item')) {
      // 延迟保存，确保状态已更新
      setTimeout(saveSidebarState, 100);
    }
  });

  // 页面加载时恢复状态
  document.addEventListener('DOMContentLoaded', () => {
    // 给现有的初始化一些时间完成
    setTimeout(restoreSidebarState, 200);
  });

  // Pjax 页面切换后恢复状态
  function registerPjaxHooks() {
    if (window.pjax && typeof window.pjax.on === 'function') {
      // 避免重复注册
      if (window.pjax._docsHooksRegistered) return;
      window.pjax._docsHooksRegistered = true;

      window.pjax.on('after', () => {
        console.log('[Docs] Pjax 页面切换');
        // ⚠️ 侧边栏状态恢复已由 sidebar-dynamic.js 接管
        // requestAnimationFrame(restoreSidebarState);  // 禁用

        // 如果有其他非侧边栏相关的状态恢复,保留
      });
      console.log('[Docs] Pjax hooks registered');
    }
  }

  // 尝试注册 hooks
  if (window.pjax) {
    registerPjaxHooks();
  }

  // 如果 Pjax 还未初始化，监听 load 事件再次尝试
  window.addEventListener('load', () => {
    registerPjaxHooks();
    // 双重保险：如果 pjax-init.js 在 load 之后才执行
    if (!window.pjax) {
      let checkCount = 0;
      const checkPjax = setInterval(() => {
        checkCount++;
        if (window.pjax) {
          registerPjaxHooks();
          clearInterval(checkPjax);
        } else if (checkCount > 50) { // 5秒后放弃
          clearInterval(checkPjax);
        }
      }, 100);
    }
  });

  // 导出函数供 swup-init.js 使用
  window.initTocHighlight = initTocHighlight;
  window.initSidebarToggle = initSidebarToggle;
  window.saveSidebarState = saveSidebarState;
  window.restoreSidebarState = restoreSidebarState;

  /**
   * 预先激活侧边栏（在页面切换前就激活，实现完全同步）
   * @param {string} targetUrl - 目标URL
   */
  window.pjaxPreActivateSidebar = function(targetUrl) {
    console.log('[Sidebar] 🎯 预先激活侧边栏:', targetUrl);

    // 标准化目标URL
    const normalizedTargetUrl = new URL(targetUrl, window.location.origin).pathname.replace(/\/$/, '');

    // 先移除所有已有的激活状态
    const sidebarItems = document.querySelectorAll('.VPSidebarItem');
    sidebarItems.forEach(item => {
      item.classList.remove('is-active');
      const itemElement = item.querySelector('.item');
      if (itemElement) {
        itemElement.classList.remove('is-active');
      }
    });

    // 查找匹配目标URL的侧边栏项并立即激活
    sidebarItems.forEach(item => {
      const dataPath = item.dataset.path;
      if (dataPath) {
        const normalizedPath = dataPath.replace(/\/$/, '');

        if (normalizedPath === normalizedTargetUrl) {
          console.log(`[Sidebar] ✅ 预先激活: ${dataPath}`);
          item.classList.add('is-active');
          const itemElement = item.querySelector('.item');
          if (itemElement) {
            itemElement.classList.add('is-active');

            // 确保indicator元素存在
            if (!itemElement.querySelector('.indicator')) {
              const indicator = document.createElement('div');
              indicator.className = 'indicator';
              itemElement.insertBefore(indicator, itemElement.firstChild);
            }
          }
          return; // 找到匹配项后退出
        }
      }
    });

    // 检查是否需要展开懒加载节点
    const lazyItems = document.querySelectorAll('.VPSidebarItem.js-lazy-load');
    lazyItems.forEach((lazyItem) => {
      const lazyPath = lazyItem.dataset.path;
      if (lazyPath) {
        const normalizedLazyPath = lazyPath.replace(/\/$/, '');

        // 检查目标URL是否在这个懒加载节点的路径下
        if (normalizedTargetUrl.startsWith(normalizedLazyPath + '/') ||
            normalizedTargetUrl === normalizedLazyPath) {
          console.log(`[Sidebar] 📂 预先展开懒加载节点: ${lazyPath}`);
          // 预先展开懒加载节点
          if (window.loadChildren) {
            window.loadChildren(lazyItem);
          }
        }
      }
    });

    console.log('[Sidebar] 🎯 预先激活完成');
  };

  /**
   * 自动展开侧边栏到指定层级
   * 用于在减少服务端渲染后，客户端补充完整树
   */
  let expandedCount = 0;

  function autoExpandToLevel(targetLevel) {
    // 等待 tree.json 加载完成
    if (!window.sidebarData || !window.sidebarData.tree) {
      setTimeout(() => autoExpandToLevel(targetLevel), 50);
      return;
    }

    const startTime = performance.now();
    const topLevelItems = document.querySelectorAll('.VPSidebarItem.level-0, .VPSidebarItem.level-1');

    expandedCount = 0;
    topLevelItems.forEach(item => {
      expandToLevel(item, targetLevel, 0);
    });

    const duration = performance.now() - startTime;
    console.log(`[Sidebar] Auto-expanded to level ${targetLevel} in ${duration.toFixed(2)}ms, expanded ${expandedCount} nodes`);
  }

  /**
   * 递归展开单个节点到指定层级
   */
  function expandToLevel(item, targetLevel, currentLevel) {
    if (currentLevel >= targetLevel) return;

    // 如果是懒加载节点，触发加载
    if (item.classList.contains('js-lazy-load')) {
      loadChildren(item);
      expandedCount++;

      // 等待子节点加载完成后继续展开
      setTimeout(() => {
        const children = item.querySelectorAll(':scope > .items > .VPSidebarItem');
        children.forEach(child => {
          expandToLevel(child, targetLevel, currentLevel + 1);
        });
      }, 20);
    }
    // 如果是已渲染但折叠的节点，展开它
    else if (item.classList.contains('collapsed')) {
      const itemDiv = item.querySelector('.item');
      if (itemDiv) {
        toggleSection(item); // 使用已有的展开函数

        // 递归展开子节点
        const children = item.querySelectorAll(':scope > .items > .VPSidebarItem');
        children.forEach(child => {
          expandToLevel(child, targetLevel, currentLevel + 1);
        });
      }
    }
  }

  /**
   * 初始化自动展开功能
   */
  function initAutoExpand() {
    // 等待 DOMContentLoaded 和 tree.json 加载完成
    const targetLevel = 5; // 展开到第 5 层
    const delay = 100; // 延迟 100ms，确保页面稳定

    setTimeout(() => {
      autoExpandToLevel(targetLevel);
    }, delay);
  }

  // 优化：默认禁用自动展开所有层级
  // 只有 localStorage 中有保存的展开状态时才恢复
  // 注释掉自动展开，避免 TOC 默认全部展开
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', initAutoExpand);
  // } else {
  //   initAutoExpand();
  // }

  // 导出自动展开函数供外部使用（可选手动调用）
  window.autoExpandToLevel = autoExpandToLevel;

  // ========================================
  // 调试辅助工具
  // ========================================

  /**
   * 侧边栏调试函数 - 在浏览器控制台输入 debugSidebar() 使用
   */
  window.debugSidebar = function() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 侧边栏调试信息');
    console.log('='.repeat(60));

    // 基础信息
    console.log('\n📍 当前页面:');
    console.log('  URL:', window.location.pathname);
    console.log('  Hash:', window.location.hash);

    // DOM元素统计
    console.log('\n📊 DOM元素:');
    const sidebarItems = document.querySelectorAll('.VPSidebarItem');
    console.log('  侧边栏总元素:', sidebarItems.length);
    console.log('  - 文件夹 (collapsible):', document.querySelectorAll('.VPSidebarItem.collapsible').length);
    console.log('  - 文档链接 (is-link):', document.querySelectorAll('.VPSidebarItem.is-link').length);
    console.log('  - 懒加载占位符:', document.querySelectorAll('.VPSidebarItem.js-lazy-load').length);
    console.log('  - 已加载节点:', document.querySelectorAll('.VPSidebarItem.js-loaded').length);

    // 激活状态
    console.log('\n✅ 激活状态:');
    const activeItems = document.querySelectorAll('.VPSidebarItem.is-active');
    const activeItemElements = document.querySelectorAll('.VPSidebarItem .item.is-active');
    console.log('  激活的VPSidebarItem:', activeItems.length);
    console.log('  激活的.item元素:', activeItemElements.length);

    if (activeItems.length > 0) {
      activeItems.forEach((item, idx) => {
        console.log(`  [${idx + 1}] data-path:`, item.dataset.path);
        const indicator = item.querySelector('.indicator');
        console.log(`      indicator存在:`, !!indicator);
        if (indicator) {
          const styles = getComputedStyle(indicator);
          console.log(`      indicator背景:`, styles.background);
        }
      });
    } else {
      console.warn('  ⚠️ 未找到激活的侧边栏项');
    }

    // 数据加载状态
    console.log('\n💾 数据状态:');
    console.log('  sidebarData:', window.sidebarData ? '✓ 已加载' : '✗ 未加载');
    if (window.sidebarData) {
      console.log('  - 树节点数:', window.sidebarData.tree?.length || 0);
      console.log('  - 权重数据:', window.sidebarData.weights ? '✓' : '✗');
      console.log('  - 面包屑数据:', window.sidebarData.breadcrumbsMap ? '✓' : '✗');
    }

    // 路径匹配分析
    console.log('\n🔍 路径匹配分析:');
    const currentUrl = window.location.pathname;
    const normalizedCurrent = currentUrl.replace(/\/$/, '');

    let exactMatches = [];
    let potentialMatches = [];

    sidebarItems.forEach(item => {
      const path = item.dataset.path;
      if (path) {
        const normalizedPath = path.replace(/\/$/, '');
        if (normalizedPath === normalizedCurrent) {
          exactMatches.push({ element: item, path: path });
        } else if (normalizedPath.includes(normalizedCurrent) || normalizedCurrent.includes(normalizedPath)) {
          potentialMatches.push({ element: item, path: path });
        }
      }
    });

    console.log('  精确匹配:', exactMatches.length);
    exactMatches.forEach((match, idx) => {
      console.log(`    [${idx + 1}]`, match.path);
    });

    if (potentialMatches.length > 0) {
      console.log('  可能匹配:', potentialMatches.length);
      potentialMatches.slice(0, 5).forEach((match, idx) => {
        console.log(`    [${idx + 1}]`, match.path);
      });
    }

    // 展开状态
    console.log('\n📂 展开状态:');
    const expanded = document.querySelectorAll('.VPSidebarItem.expanded');
    const collapsed = document.querySelectorAll('.VPSidebarItem.collapsed');
    console.log('  已展开:', expanded.length);
    console.log('  已折叠:', collapsed.length);

    console.log('\n' + '='.repeat(60) + '\n');
  };

  // 启动时提示
  console.log('[Sidebar] 💡 调试工具已加载 - 在控制台输入 debugSidebar() 查看详细信息');
})();
