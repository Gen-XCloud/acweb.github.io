/**
 * 响应式虚拟分页
 * 移动端：初始显示可配置数量，支持"加载更多"
 * PC端：显示全部文章
 */
(function() {
  'use strict';

  // 默认配置项（如果 data 属性不存在则使用）
  const DEFAULT_CONFIG = {
    mobileBreakpoint: 768,        // 移动端断点
    mobileInitialShow: 10,        // 移动端初始显示数量（默认）
    mobileLoadMoreStep: 10,       // 移动端每次加载数量（默认）
    animationDuration: 300        // 动画持续时间(ms)
  };

  let CONFIG = { ...DEFAULT_CONFIG }; // 实际使用的配置
  let currentVisibleCount = 0;   // 当前可见文章数
  let totalArticles = 0;         // 总文章数

  /**
   * 获取未被筛选隐藏的文章（排除 display:none 的文章）
   * 性能优化：避免使用 getComputedStyle，使用内联样式检查
   */
  function getVisibleArticles() {
    const postGrid = document.querySelector('.post-grid');
    if (!postGrid) return [];

    const allArticles = Array.from(postGrid.querySelectorAll('.article-card-compact'));

    // 性能优化：使用内联样式检查，避免强制重排
    // 筛选系统通过 style.display 设置，无需 getComputedStyle
    return allArticles.filter(article => {
      // 检查内联样式（如果被筛选隐藏，会有 style.display = 'none'）
      return article.style.display !== 'none';
    });
  }

  /**
   * 初始化
   */
  function init() {
    // 检查是否在首页
    const postGrid = document.querySelector('.post-grid');
    if (!postGrid) return;

    // 从 data 属性读取配置
    const mobileInitialShow = parseInt(postGrid.dataset.mobileInitialShow);
    const mobileLoadMoreStep = parseInt(postGrid.dataset.mobileLoadMoreStep);

    if (!isNaN(mobileInitialShow)) {
      CONFIG.mobileInitialShow = mobileInitialShow;
    }
    if (!isNaN(mobileLoadMoreStep)) {
      CONFIG.mobileLoadMoreStep = mobileLoadMoreStep;
    }

    // 获取所有文章卡片
    const articles = Array.from(postGrid.querySelectorAll('.article-card-compact'));
    totalArticles = articles.length;

    if (totalArticles === 0) return;

    // 为每个文章添加索引
    articles.forEach((article, index) => {
      article.setAttribute('data-index', index + 1);
    });

    // 创建"加载更多"按钮
    createLoadMoreButton();

    // 初始化显示
    updateDisplay();

    // 监听窗口大小变化
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateDisplay, 150);
    });

    // 监听文章筛选事件（当筛选发生时重置分页状态）
    // 使用 MutationObserver 监听文章的 style 变化
    let filterTimer;
    const observer = new MutationObserver(() => {
      // 防抖：避免频繁触发
      clearTimeout(filterTimer);
      filterTimer = setTimeout(() => {
        // 重置当前可见计数，让 updateDisplay 重新计算
        currentVisibleCount = 0;
        updateDisplay();
      }, 100);
    });

    // 监听所有文章的 style 属性变化
    const allArticles = postGrid.querySelectorAll('.article-card-compact');
    allArticles.forEach(article => {
      observer.observe(article, {
        attributes: true,
        attributeFilter: ['style']
      });
    });
  }

  /**
   * 创建"加载更多"按钮
   */
  function createLoadMoreButton() {
    const postGrid = document.querySelector('.post-grid');
    if (!postGrid) return;

    // 检查是否已存在
    let wrapper = document.querySelector('.load-more-wrapper');
    if (wrapper) return;

    // 创建按钮容器
    wrapper = document.createElement('div');
    wrapper.className = 'load-more-wrapper';
    wrapper.innerHTML = `
      <button class="load-more-btn" type="button">
        <span class="load-more-text">加载更多</span>
        <span class="load-more-count"></span>
      </button>
      <div class="load-more-tip">已显示全部文章</div>
    `;

    // 插入到文章网格后面
    postGrid.parentNode.insertBefore(wrapper, postGrid.nextSibling);

    // 绑定点击事件
    const btn = wrapper.querySelector('.load-more-btn');
    btn.addEventListener('click', loadMoreArticles);
  }

  /**
   * 更新显示状态（根据屏幕尺寸）
   */
  function updateDisplay() {
    const isMobile = window.innerWidth < CONFIG.mobileBreakpoint;
    const wrapper = document.querySelector('.load-more-wrapper');

    // 获取未被筛选隐藏的文章
    const visibleArticles = getVisibleArticles();
    const visibleCount = visibleArticles.length;

    if (isMobile) {
      // 移动端模式
      if (currentVisibleCount === 0) {
        currentVisibleCount = Math.min(CONFIG.mobileInitialShow, visibleCount);
      }

      // 更新文章显示状态（只处理未被筛选隐藏的文章）
      visibleArticles.forEach((article, index) => {
        if (index < currentVisibleCount) {
          article.classList.remove('hidden-by-pagination');
        } else {
          article.classList.add('hidden-by-pagination');
        }
      });

      // 更新总文章数（用于按钮状态计算）
      totalArticles = visibleCount;

      // 更新按钮状态
      updateLoadMoreButton();

      // 显示加载更多区域
      if (wrapper) {
        wrapper.style.display = 'block';
      }
    } else {
      // PC端模式：显示全部（只处理未被筛选隐藏的文章）
      visibleArticles.forEach(article => {
        article.classList.remove('hidden-by-pagination');
      });

      // 隐藏加载更多区域
      if (wrapper) {
        wrapper.style.display = 'none';
      }

      // 重置计数器
      currentVisibleCount = 0;
    }
  }

  /**
   * 加载更多文章
   */
  function loadMoreArticles() {
    // 获取未被筛选隐藏的文章
    const visibleArticles = getVisibleArticles();
    const newVisibleCount = Math.min(
      currentVisibleCount + CONFIG.mobileLoadMoreStep,
      visibleArticles.length
    );

    // 展开新文章（带动画）
    for (let i = currentVisibleCount; i < newVisibleCount; i++) {
      const article = visibleArticles[i];
      if (article) {
        article.classList.remove('hidden-by-pagination');
        article.classList.add('fade-in-article');

        // 移除动画类（动画完成后）
        setTimeout(() => {
          article.classList.remove('fade-in-article');
        }, CONFIG.animationDuration);
      }
    }

    currentVisibleCount = newVisibleCount;

    // 更新按钮状态
    updateLoadMoreButton();
  }

  /**
   * 更新"加载更多"按钮状态
   */
  function updateLoadMoreButton() {
    const wrapper = document.querySelector('.load-more-wrapper');
    if (!wrapper) return;

    const btn = wrapper.querySelector('.load-more-btn');
    const tip = wrapper.querySelector('.load-more-tip');
    const countSpan = wrapper.querySelector('.load-more-count');

    const remainingCount = totalArticles - currentVisibleCount;

    if (remainingCount > 0) {
      // 还有文章未显示
      btn.style.display = 'inline-flex';
      tip.style.display = 'none';

      // 更新数量显示
      const nextBatchCount = Math.min(CONFIG.mobileLoadMoreStep, remainingCount);
      countSpan.textContent = `(${nextBatchCount})`;
    } else {
      // 已显示全部
      btn.style.display = 'none';
      tip.style.display = 'block';
    }
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
