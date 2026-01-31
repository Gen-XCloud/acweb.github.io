/**
 * 文章过滤功能 - 首页过滤
 * 在首页根据URL参数过滤文章卡片
 */
(function() {
  'use strict';

  // 获取URL参数
  function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      pageNum: params.get('pageNum') || '1',
      category: params.get('category') || '',
      tag: params.get('tag') || ''
    };
  }

  // 检查是否在首页
  function isHomePage() {
    return document.body.classList.contains('home-page') || window.location.pathname === '/';
  }

  // 过滤文章卡片
  function filterArticles(filterType, filterValue) {
    const articles = document.querySelectorAll('.article-card-compact');
    let visibleCount = 0;

    articles.forEach(article => {
      let shouldShow = false;

      if (filterType === 'category' && filterValue) {
        const categories = article.dataset.categories || '';
        shouldShow = categories.split(',').some(cat => cat.trim() === filterValue);
      } else if (filterType === 'tag' && filterValue) {
        const tags = article.dataset.tags || '';
        shouldShow = tags.split(',').some(tag => tag.trim() === filterValue);
      } else {
        // 显示所有
        shouldShow = true;
      }

      if (shouldShow) {
        article.style.display = '';
        visibleCount++;
      } else {
        article.style.display = 'none';
      }
    });

    // 更新激活状态
    updateActiveState(filterType, filterValue);

    return visibleCount;
  }

  function togglePagination(show) {
    const pagination = document.querySelector('.pagination-wrapper');
    if (!pagination) return;
    pagination.style.display = show ? '' : 'none';
  }

  // 更新激活状态
  function updateActiveState(filterType, filterValue) {
    // 移除所有激活状态
    document.querySelectorAll('.filter-category, .filter-tag').forEach(el => {
      el.classList.remove('active');
    });

    // 设置当前激活
    if (filterValue) {
      // 激活对应的分类或标签
      const selector = filterType === 'category'
        ? `.filter-category[data-category="${filterValue}"]`
        : `.filter-tag[data-tag="${filterValue}"]`;
      document.querySelectorAll(selector).forEach(item => item.classList.add('active'));
    }
  }

  // 更新URL
  function updateURL(params) {
    const url = new URL(window.location.origin + '/');
    url.searchParams.delete('category');
    url.searchParams.delete('tag');

    if (params.category) {
      url.searchParams.set('pageNum', params.pageNum || '1');
      url.searchParams.set('category', params.category);
    }

    if (params.tag) {
      url.searchParams.set('pageNum', params.pageNum || '1');
      url.searchParams.set('tag', params.tag);
    }

    window.history.pushState({}, '', url.toString());
  }

  function applyCategoryFilter(category) {
    if (!category) return;

    updateURL({ category, pageNum: '1' });
    filterArticles('category', category);
    togglePagination(false);
    scrollToArticles();
  }

  function applyTagFilter(tag) {
    if (!tag) return;

    updateURL({ tag, pageNum: '1' });
    filterArticles('tag', tag);
    togglePagination(false);
    scrollToArticles();
  }

  // 处理分类点击
  function handleCategoryClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const category = link.dataset.category;

    applyCategoryFilter(category);
  }

  // 处理标签点击
  function handleTagClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const tag = link.dataset.tag;

    applyTagFilter(tag);
  }

  // 滚动到文章区域
  function scrollToArticles() {
    const postsSection = document.querySelector('.posts-section');
    if (postsSection) {
      const offset = 100;
      const top = postsSection.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // 处理浏览器前进后退
  window.addEventListener('popstate', function() {
    const params = getURLParams();

    if (params.category) {
      filterArticles('category', params.category);
      togglePagination(false);
    } else if (params.tag) {
      filterArticles('tag', params.tag);
      togglePagination(false);
    } else {
      filterArticles('', '');
      togglePagination(true);
    }
  });

  // 处理标题点击（显示全部）
  function handleTitleClick(e) {
    e.preventDefault();

    // 清除URL参数
    window.history.pushState({}, '', '/');

    // 显示所有文章
    filterArticles('', '');

    // 显示分页器
    togglePagination(true);
  }

  function handleDelegatedFilterClick(e) {
    if (!isHomePage()) return;
    if (e.defaultPrevented) return;

    const categoryTarget = e.target.closest('.filter-category');
    if (categoryTarget) {
      e.preventDefault();
      applyCategoryFilter(categoryTarget.dataset.category);
      return;
    }

    const tagTarget = e.target.closest('.filter-tag');
    if (tagTarget) {
      e.preventDefault();
      applyTagFilter(tagTarget.dataset.tag);
    }
  }

  // 初始化
  function init() {
    if (!isHomePage()) return;

    // 绑定分类/标签委托事件，覆盖动态元素
    document.addEventListener('click', handleDelegatedFilterClick);

    // 绑定标题点击事件（显示全部）
    document.querySelectorAll('.tk-widget-title-clickable').forEach(title => {
      title.style.cursor = 'pointer';
      title.addEventListener('click', handleTitleClick);
    });

    // 根据URL参数初始化过滤
    const params = getURLParams();

    if (params.category) {
      filterArticles('category', params.category);
      // 隐藏分页器
      const pagination = document.querySelector('.pagination-wrapper');
      if (pagination) {
        pagination.style.display = 'none';
      }
    } else if (params.tag) {
      filterArticles('tag', params.tag);
      // 隐藏分页器
      const pagination = document.querySelector('.pagination-wrapper');
      if (pagination) {
        pagination.style.display = 'none';
      }
    } else {
      // 显示全部
      filterArticles('', '');
    }
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
