/**
 * PjaxLite - 轻量级 Pjax 实现
 * 替代 Swup，提供 SPA 式页面导航，解决侧边栏闪烁问题
 *
 * 核心功能：
 * - 链接拦截和路由
 * - HTML Fetch 和 LRU 缓存
 * - DOM 部分替换（仅 #swup 容器）
 * - 淡入淡出动画
 * - 浏览器历史记录管理
 * - 鼠标悬停预加载
 * - 简单回调系统（before/after/error）
 */

class PjaxLite {
  constructor(options = {}) {
    this.container = options.container || '#swup';
    this.linkSelector = options.linkSelector || 'a[href^="/"]:not([data-no-pjax]):not([href^="#"]):not([target])';
    this.animationDuration = options.animationDuration || 150;
    this.cache = new Map();
    this.cacheSize = options.cacheSize || 20;
    this.preloadDelay = options.preloadDelay || 200;
    this.callbacks = {
      before: [],
      after: [],
      error: []
    };

    this.init();
  }

  /**
   * 初始化
   */
  init() {
    this.bindLinks();
    this.bindPopState();
    this.bindPreload();
    console.log('[PjaxLite] ✅ 初始化完成');
  }

  /**
   * 绑定链接点击事件（事件委托）
   */
  bindLinks() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest(this.linkSelector);
      if (!link) return;

      const href = link.getAttribute('href');
      if (!this.shouldHandle(href)) return;

      e.preventDefault();
      this.navigate(href, true);
    });
  }

  /**
   * 判断是否应该处理该链接
   */
  shouldHandle(href) {
    if (!href || href.startsWith('#')) return false;

    // 外部链接
    if (href.includes('://') && !href.includes(location.hostname)) return false;

    // 文件下载链接
    if (href.match(/\.(pdf|zip|rar|7z|tar|gz)$/i)) return false;

    // 特殊路径
    if (href.includes('admin-center')) return false;

    // 🆕 检测跨分类导航：强制完整刷新
    const currentCategory = this.extractCategory(location.pathname);
    const targetCategory = this.extractCategory(href);

    if (currentCategory && targetCategory && currentCategory !== targetCategory) {
      console.log('[PjaxLite] 跨分类导航，使用完整刷新:', currentCategory, '→', targetCategory);
      return false;
    }

    return true;
  }

  /**
   * 🆕 提取URL的第一级分类
   * 例如: /docs/linux/... → "docs"
   *       /topic/blog/... → "topic"
   */
  extractCategory(path) {
    // 移除query和hash
    const cleanPath = path.split('?')[0].split('#')[0];
    // 提取第一级路径
    const match = cleanPath.match(/^\/([^\/]+)/);
    return match ? match[1] : '';
  }

  /**
   * 核心导航函数
   */
  async navigate(url, pushState = true) {
    try {
      this.trigger('before', { url });

      // Fetch 页面
      const html = await this.fetchPage(url);

      // 淡出动画
      await this.fadeOut();

      // 替换内容
      this.replaceContent(html);

      // 更新历史记录
      if (pushState) {
        history.pushState({ pjax: true, url }, '', url);
      }

      // 处理滚动
      this.handleScroll();

      // 淡入动画
      await this.fadeIn();

      // 触发 after 回调
      this.trigger('after', { url });

    } catch (error) {
      console.error('[PjaxLite] 导航失败:', error);
      this.trigger('error', { url, error });

      // 降级：完整刷新
      window.location.href = url;
    }
  }

  /**
   * Fetch 页面（带缓存）
   */
  async fetchPage(url) {
    // 检查缓存
    if (this.cache.has(url)) {
      console.log('[PjaxLite] 📦 从缓存加载:', url);
      return this.cache.get(url);
    }

    console.log('[PjaxLite] 🌐 Fetch:', url);

    const response = await fetch(url, {
      headers: { 'X-Pjax': 'true' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // LRU 缓存：限制大小
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(url, html);

    return html;
  }

  /**
   * 替换容器内容
   */
  replaceContent(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const newContent = doc.querySelector(this.container);
    if (!newContent) {
      throw new Error(`Container ${this.container} not found in new page`);
    }

    const oldContent = document.querySelector(this.container);
    if (!oldContent) {
      throw new Error(`Container ${this.container} not found in current page`);
    }

    // 替换内容
    oldContent.innerHTML = newContent.innerHTML;

    // 更新 title
    document.title = doc.title;

    // 可选：更新 meta 标签（SEO）
    this.updateMetaTags(doc);
  }

  /**
   * 更新 meta 标签
   */
  updateMetaTags(doc) {
    // 更新 description
    const newDescription = doc.querySelector('meta[name="description"]');
    const oldDescription = document.querySelector('meta[name="description"]');
    if (newDescription && oldDescription) {
      oldDescription.setAttribute('content', newDescription.getAttribute('content'));
    }

    // 更新 og:title
    const newOgTitle = doc.querySelector('meta[property="og:title"]');
    const oldOgTitle = document.querySelector('meta[property="og:title"]');
    if (newOgTitle && oldOgTitle) {
      oldOgTitle.setAttribute('content', newOgTitle.getAttribute('content'));
    }
  }

  /**
   * 淡出动画
   */
  fadeOut() {
    const el = document.querySelector(this.container);
    if (!el) return Promise.resolve();

    el.style.opacity = '0';
    return new Promise(resolve => setTimeout(resolve, this.animationDuration));
  }

  /**
   * 淡入动画
   */
  fadeIn() {
    const el = document.querySelector(this.container);
    if (!el) return Promise.resolve();

    el.style.opacity = '1';
    return new Promise(resolve => setTimeout(resolve, this.animationDuration));
  }

  /**
   * 处理滚动位置
   */
  handleScroll() {
    // 锚点跳转
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        return;
      }
    }

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /**
   * 绑定浏览器前进/后退
   */
  bindPopState() {
    // 初始化当前页面状态
    history.replaceState({ pjax: true, url: location.href }, '', location.href);

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.pjax) {
        this.navigate(location.pathname + location.search + location.hash, false);
      }
    });
  }

  /**
   * 鼠标悬停预加载
   */
  bindPreload() {
    let preloadTimer;

    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest(this.linkSelector);
      if (!link) return;

      const href = link.getAttribute('href');
      if (!this.shouldHandle(href)) return;

      // 延迟预加载
      preloadTimer = setTimeout(() => {
        this.preloadPage(href);
      }, this.preloadDelay);
    });

    document.addEventListener('mouseout', () => {
      clearTimeout(preloadTimer);
    });
  }

  /**
   * 预加载页面
   */
  async preloadPage(url) {
    if (this.cache.has(url)) {
      return; // 已缓存，跳过
    }

    try {
      await this.fetchPage(url);
      console.log('[PjaxLite] ⚡ 预加载完成:', url);
    } catch (error) {
      console.warn('[PjaxLite] 预加载失败:', url, error);
    }
  }

  /**
   * 注册回调
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * 触发回调
   */
  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error(`[PjaxLite] 回调错误 (${event}):`, error);
        }
      });
    }
  }
}

// 导出到全局
window.PjaxLite = PjaxLite;
