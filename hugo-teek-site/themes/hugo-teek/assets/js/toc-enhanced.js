// TOC Enhanced - Rspress 风格优化版本
// 核心特性：
// 1. 发布-订阅模式 (共享 TOC 数据，左右侧栏同步)
// 2. MutationObserver (监听动态内容变化)
// 3. 批量计算 (减少 reflow)
// 4. 高效滚动 (requestAnimationFrame + 缓存)

(function() {
  'use strict';

  // ============================================================
  // 0. CSS变量缓存 (性能优化)
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

  // ============================================================
  // 1. 全局 TOC 状态管理 (发布-订阅模式)
  // ============================================================
  const TOCState = {
    headers: [],  // 当前页面的所有标题
    activeId: null,  // 当前激活的标题 ID
    subscribers: new Set(),  // 订阅者集合

    // 订阅更新
    subscribe(callback) {
      this.subscribers.add(callback);
      // 返回取消订阅函数
      return () => this.subscribers.delete(callback);
    },

    // 通知所有订阅者
    notify(data) {
      this.subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('[TOC] Subscriber error:', e);
        }
      });
    },

    // 更新标题列表
    updateHeaders(headers) {
      this.headers = headers;
      this.notify({ type: 'headers', headers });
    },

    // 更新激活项
    updateActive(id) {
      // 移除条件判断，确保每次调用都会触发更新
      this.activeId = id;
      this.notify({ type: 'active', id });
    }
  };

  // ============================================================
  // 2. TOC 数据提取器 (类似 Rspress 的 parseToc)
  // ============================================================
  class TOCExtractor {
    constructor(container) {
      this.container = container;
      this.observer = null;
    }

    // 提取标题数据
    extract() {
      if (!this.container) {
        return [];
      }

      const headers = [];
      // 查找所有标题元素，包括在 .content 或其他子容器中的标题
      const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headings.forEach((heading, index) => {
        // 跳过隐藏元素
        if (!this.isVisible(heading)) {
          return;
        }

        // 跳过被排除的元素
        if (heading.closest('.rp-toc-exclude, .rspress-toc-exclude')) {
          return;
        }

        // 如果标题没有 id，生成一个唯一 id
        let id = heading.id;
        if (!id) {
          id = `toc-heading-${Date.now()}-${index}`;
          heading.id = id;
        }

        const title = this.extractText(heading);
        const depth = parseInt(heading.tagName[1]);
        

        headers.push({
          id: id,
          text: title,
          depth: depth,
          element: heading
        });
      });

      return headers;
    }

    // 检查元素是否可见
    isVisible(element) {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.opacity !== '0' &&
        style.visibility !== 'hidden'
      );
    }

    // 提取文本内容
    extractText(heading) {
      // 克隆节点以避免修改 DOM
      const clone = heading.cloneNode(true);

      // 移除锚点图标等辅助元素
      clone.querySelectorAll('.header-anchor, .anchor-icon').forEach(el => el.remove());

      return clone.textContent.trim();
    }

    // 启动 MutationObserver (监听动态内容)
    watch(callback) {
      if (!this.container) return;

      this.observer = new MutationObserver(mutations => {
        let needUpdate = false;

        // 智能检测：只关心标题的增删
        for (const mutation of mutations) {
          for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
            if (node.nodeType === 1) {  // Element node
              const tagName = node.tagName;
              if (tagName === 'H2' || tagName === 'H3' || tagName === 'H4') {
                needUpdate = true;
                break;
              }
              // 检查子节点
              if (node.querySelector && node.querySelector('h2, h3, h4')) {
                needUpdate = true;
                break;
              }
            }
          }
          if (needUpdate) break;
        }

        if (needUpdate) {
          console.log('[TOC] 🔄 检测到标题变化，重新提取...');
          callback();
        }
      });

      this.observer.observe(this.container, {
        childList: true,
        subtree: true
      });
    }

    // 停止监听
    disconnect() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }

  // ============================================================
  // 3. 高效滚动高亮管理器
  // ============================================================
  class ScrollHighlightManager {
    constructor() {
      this.ticking = false;
      this.cache = {
        offsets: null,
        timestamp: 0,
        ttl: 200  // 缓存有效期 200ms
      };
    }

    // 批量计算所有标题位置
    calculateOffsets(headers) {
      const now = performance.now();

      // 使用缓存 (200ms 内)
      if (this.cache.offsets && (now - this.cache.timestamp) < this.cache.ttl) {
        return this.cache.offsets;
      }

      // 批量获取位置 (一次 reflow)
      const offsets = headers.map(header => {
        const el = document.getElementById(header.id);
        if (!el) return { id: header.id, top: Infinity };

        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        return {
          id: header.id,
          top: rect.top + scrollTop,
          bottom: rect.bottom + scrollTop
        };
      });

      // 更新缓存
      this.cache.offsets = offsets;
      this.cache.timestamp = now;

      return offsets;
    }

    // 查找当前激活的标题
    // validIds: 可选的有效ID集合，只返回在此集合中存在的ID
    findActiveHeader(headers, validIds = null) {
      if (!headers.length) return null;

      const offsets = this.calculateOffsets(headers);
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportOffset = 120;  // 导航栏高度 + 容差（增加容差值）

      // 查找最接近视口顶部的标题
      let activeId = null;
      let minDistance = Infinity;

      offsets.forEach(offset => {
        // 如果提供了 validIds，只考虑有效的 ID（跳过自动生成的ID）
        if (validIds && !validIds.has(offset.id)) {
          return;
        }

        // 计算标题顶部到滚动位置的距离
        const distance = Math.abs(offset.top - scrollTop);

        // 如果标题在视口内或已滚动过，且距离更近
        if (offset.top < scrollTop + viewportOffset && distance < minDistance) {
          minDistance = distance;
          activeId = offset.id;
        }
      });

      // 如果没有找到，返回第一个有效标题
      if (!activeId && validIds) {
        for (const header of headers) {
          if (validIds.has(header.id)) {
            return header.id;
          }
        }
      }

      return activeId || headers[0].id;
    }

    // 启动滚动监听
    start(onScroll) {
      const handleScroll = () => {
        if (this.ticking) return;
        this.ticking = true;

        requestAnimationFrame(() => {
          onScroll();
          this.ticking = false;
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      // 滚动停止时清理缓存
      window.addEventListener('scrollend', () => {
        this.cache.offsets = null;
      }, { passive: true });

      // 返回清理函数
      return () => {
        window.removeEventListener('scroll', handleScroll);
        this.cache.offsets = null;
      };
    }

    // 清理缓存
    clearCache() {
      this.cache.offsets = null;
      this.cache.timestamp = 0;
    }
  }

  // ============================================================
  // 4. TOC UI 更新器
  // ============================================================
  class TOCUIManager {
    constructor(tocContainer) {
      this.container = tocContainer;
      this.links = new Map();  // id -> link element
      this.marker = null;
      this.activeLink = null;
      this.init();
    }

    init() {
      if (!this.container) {
        return;
      }

      
      // 收集所有 TOC 链接，支持多种选择器
      const linkSelectors = '.outline-link, .VPDocOutlineLink, .toc-link';
      const linkElements = this.container.querySelectorAll(linkSelectors);
      

      linkElements.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const id = decodeURIComponent(href.slice(1));
          this.links.set(id, link);
        }
      });


      // 查找 marker 元素，支持多种选择器
      this.marker = this.container.querySelector('.outline-marker, .VPDocOutlineMarker');
      
      // 绑定 TOC 链接点击事件
      this.bindClickEvents();
    }
    
    // 绑定 TOC 链接点击事件
    bindClickEvents() {
      if (!this.container) return;
      
      // 找到所有 TOC 链接
      const linkSelectors = '.outline-link, .VPDocOutlineLink, .toc-link';
      const links = this.container.querySelectorAll(linkSelectors);
      
      links.forEach((link, index) => {
        // 确保只绑定一次点击事件
        if (link.hasAttribute('data-toc-click-bound')) return;
        link.setAttribute('data-toc-click-bound', 'true');
        
        link.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const href = link.getAttribute('href');
          if (!href || !href.startsWith('#')) return;
          
          const hash = decodeURIComponent(href.slice(1));
          
          const heading = document.getElementById(hash);
          if (heading) {
            // 使用缓存的导航栏高度（性能优化）
            const offset = CSSVariableCache.getOffset();

            const targetPosition = heading.getBoundingClientRect().top + window.pageYOffset - offset;
            
            // 瞬间跳转到目标位置（性能优化）
            window.scrollTo({
              top: targetPosition,
              behavior: 'instant'
            });
            
            // 更新 URL 哈希值
            history.replaceState(null, '', `#${hash}`);
            
            // 立即更新激活状态
            TOCState.updateActive(hash);
          }
        }, { passive: false });
      });
    }

    // 更新激活项
    updateActive(id) {
      
      const newLink = this.links.get(id);

      // 移除所有链接的激活状态
      this.links.forEach(link => link.classList.remove('active'));

      // 添加新的激活状态
      if (newLink) {
        this.activeLink = newLink;
        newLink.classList.add('active');
        this.updateMarker(newLink);
        this.scrollIntoView(newLink);
      } else {
        this.activeLink = null;
        this.updateMarker(null);
        // 尝试重新初始化链接映射
        this.init();
        const retryLink = this.links.get(id);
        if (retryLink) {
          this.activeLink = retryLink;
          retryLink.classList.add('active');
          this.updateMarker(retryLink);
          this.scrollIntoView(retryLink);
        }
      }
    }

    // 更新 marker 位置
    updateMarker(link) {
      if (!this.marker || !link) {
        if (this.marker) {
          this.marker.style.opacity = '0';
          this.marker.classList.remove('visible');
        }
        return;
      }

      requestAnimationFrame(() => {
        // 获取链接的位置信息
        const linkRect = link.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // 计算相对位置，确保 marker 与链接对齐
        const top = linkRect.top - containerRect.top + link.offsetHeight / 2 - 9;  // 9px 是 marker 高度的一半
        
        // 更新 marker 位置
        this.marker.style.top = `${top}px`;
        this.marker.style.opacity = '1';
        this.marker.classList.add('visible');
      });
    }

    // 滚动到可见区域
    scrollIntoView(link) {
      if (!link) return;

      // 查找实际的滚动容器，支持多种选择器
      const scrollContainers = [
        this.container.closest('.aside-container'),
        this.container.closest('.aside'),
        this.container.closest('.VPDocAside'),
        this.container.closest('.VPSidebar'),
        this.container
      ];
      
      let scrollContainer = null;
      for (const container of scrollContainers) {
        if (container) {
          const isScrollable = container.scrollHeight > container.clientHeight + 8;
          if (isScrollable) {
            scrollContainer = container;
            break;
          }
        }
      }

      if (!scrollContainer) {
        return;
      }

      requestAnimationFrame(() => {
        const containerRect = scrollContainer.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();

        const linkRelativeTop = linkRect.top - containerRect.top + scrollContainer.scrollTop;
        const containerHeight = scrollContainer.clientHeight;
        const currentScrollTop = scrollContainer.scrollTop;


        // 检查是否在可见区域 (20%-80%)
        const visibleTop = currentScrollTop;
        const targetTop = visibleTop + containerHeight * 0.2;
        const targetBottom = visibleTop + containerHeight * 0.8;

        const needScroll = linkRelativeTop < targetTop || linkRelativeTop > targetBottom;

        if (needScroll) {
          const targetScrollTop = Math.max(0, linkRelativeTop - containerHeight * 0.3);
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
        } else {
        }
      });
    }
  }

  // ============================================================
  // 5. 主控制器 (整合所有功能)
  // ============================================================
  class TOCController {
    constructor() {
      this.extractor = null;
      this.scrollManager = null;
      this.uiManager = null;
      this.validIds = null;  // 有效的TOC链接ID集合
      this.cleanup = [];
      this.isInitialized = false;
    }

    init() {
      // 防止重复初始化
      if (this.isInitialized) {
        return;
      }
      
      // 查找容器
      const docContainer = document.querySelector('.vp-doc, .rspress-doc, .tk-doc-content, .VPDoc');
      const tocContainer = document.querySelector('.VPDocAsideOutline, .rp-outline__toc');

      if (!docContainer || !tocContainer) {
        console.log('[TOC] 容器未找到，跳过初始化');
        return;
      }

      console.log('[TOC] ✅ 初始化增强版 TOC');

      // 初始化组件
      this.extractor = new TOCExtractor(docContainer);
      this.scrollManager = new ScrollHighlightManager();
      this.uiManager = new TOCUIManager(tocContainer);

      // 🔥 关键修复：提取 TOC 链接中的有效 ID（避免自动生成ID的匹配问题）
      this.validIds = new Set();
      const tocLinks = tocContainer.querySelectorAll('.outline-link, .VPDocOutlineLink, .toc-link');
      tocLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          this.validIds.add(decodeURIComponent(href.slice(1)));
        }
      });
      console.log(`[TOC] 📋 提取到 ${this.validIds.size} 个有效TOC链接ID`);

      // 提取标题
      const headers = this.extractor.extract();
      TOCState.updateHeaders(headers);

      console.log(`[TOC] 📋 提取到 ${headers.length} 个标题`);

      // 监听动态内容
      this.extractor.watch(() => {
        const newHeaders = this.extractor.extract();
        TOCState.updateHeaders(newHeaders);
        this.scrollManager.clearCache();
      });

      // 启动滚动监听（传入有效ID集合）
      let lastActiveId = null;  // 记录上次的activeId，避免重复更新
      const cleanupScroll = this.scrollManager.start(() => {
        const activeId = this.scrollManager.findActiveHeader(TOCState.headers, this.validIds);
        if (activeId && activeId !== lastActiveId) {
          lastActiveId = activeId;
          TOCState.updateActive(activeId);
          // 🔥 滚动时更新URL锚点，方便分享
          history.replaceState(null, '', `#${activeId}`);
        }
      });
      this.cleanup.push(cleanupScroll);

      // 订阅状态更新
      const unsubscribe = TOCState.subscribe(data => {
        if (data.type === 'active' && data.id) {
          this.uiManager.updateActive(data.id);
        }
      });
      this.cleanup.push(unsubscribe);

      // 初始化激活项（传入有效ID集合）
      const initialActive = this.scrollManager.findActiveHeader(headers, this.validIds);
      if (initialActive) {
        TOCState.updateActive(initialActive);
      } else {
        // 如果没有找到激活项，检查 URL 哈希值
        const currentHash = location.hash.replace(/^#/, '');
        if (currentHash) {
          // 查找哈希值对应的标题
          const hashHeader = headers.find(header => header.id === currentHash);
          if (hashHeader) {
            TOCState.updateActive(currentHash);
          } else {
            // 如果哈希值对应的标题不存在，激活第一个标题
            if (headers.length > 0) {
              TOCState.updateActive(headers[0].id);
            }
          }
        } else {
          // 如果没有哈希值，激活第一个标题
          if (headers.length > 0) {
            TOCState.updateActive(headers[0].id);
          }
        }
      }

      // 性能监控
      if (window.performance && window.performance.mark) {
        performance.mark('toc-init-complete');
      }
      
      // 标记为已初始化
      this.isInitialized = true;
      
      // 添加窗口大小变化监听，重新计算位置
      const handleResize = () => {
        this.scrollManager.clearCache();
        const activeId = this.scrollManager.findActiveHeader(TOCState.headers, this.validIds);
        if (activeId) {
          TOCState.updateActive(activeId);
        }
      };
      window.addEventListener('resize', handleResize);
      this.cleanup.push(() => window.removeEventListener('resize', handleResize));
    }

    // 清理资源
    destroy() {
      console.log('[TOC] 🧹 清理资源...');

      if (this.extractor) {
        this.extractor.disconnect();
      }

      if (this.scrollManager) {
        this.scrollManager.clearCache();
      }

      this.cleanup.forEach(fn => fn());
      this.cleanup = [];

      TOCState.headers = [];
      TOCState.activeId = null;
      TOCState.subscribers.clear();
    }
  }

  // ============================================================
  // 6. 全局初始化
  // ============================================================
  let controller = null;

  function initTOCEnhanced() {
    // 清理旧实例
    if (controller) {
      controller.destroy();
    }

    // 创建新实例
    controller = new TOCController();
    controller.init();
  }

  // DOM 加载完成后立即初始化（性能优化：移除延迟）
  function safeInit() {
    // 检查是否已经初始化
    if (window._tocEnhancedInitialized) return;
    window._tocEnhancedInitialized = true;

    // 立即初始化，0延迟
    initTOCEnhanced();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    // 已加载完成，直接执行
    safeInit();
  }

  // Pjax 页面切换后重新初始化
  function registerPjaxHook() {
    if (window.pjax && typeof window.pjax.on === 'function') {
      window.pjax.on('after', () => {
        console.log('[TOC] 🔄 Pjax 页面切换，重新初始化...');
        // 重置初始化标记
        window._tocEnhancedInitialized = false;
        initTOCEnhanced();
      });
      console.log('[TOC] ✅ Pjax 钩子已注册');
    } else {
      // Pjax 还未初始化，延迟100ms重试
      setTimeout(registerPjaxHook, 100);
    }
  }

  // 立即注册Pjax钩子（移除延迟）
  registerPjaxHook();

  // 暴露 API
  window.TOCEnhanced = {
    getState: () => TOCState,
    reinit: initTOCEnhanced,
    destroy: () => controller && controller.destroy()
  };

  // 🔥 覆盖旧的 initTocHighlight 函数，避免冲突
  window.initTocHighlight = function() {
    console.log('[TOC] ⚠️ 使用增强版 TOC，忽略旧版 initTocHighlight 调用');
    // 如果增强版未初始化，则初始化
    if (!controller || !controller.extractor) {
      initTOCEnhanced();
    }
  };

  console.log('[TOC] 📦 增强版 TOC 模块已加载');
})();
