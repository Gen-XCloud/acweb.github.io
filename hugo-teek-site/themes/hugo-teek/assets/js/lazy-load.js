// Lazy Loading - 按行自动加载（首页）/ IntersectionObserver（其他页）
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    // 检测是否为首页文章卡片图片
    const isHomePage = document.querySelector('.post-grid') !== null;

    if (!isHomePage) {
      // 非首页使用 IntersectionObserver
      initDefaultLazyLoad();
      return;
    }

    // 首页：按行自动加载所有图片
    const articleCards = document.querySelectorAll('.article-card-compact');

    // 根据屏幕宽度计算列数
    const isMobile = window.innerWidth < 768;
    const columnsPerRow = isMobile ? 1 : 3;  // 移动端1列，PC端3列

    // 收集所有卡片图片
    const cardImages = [];
    articleCards.forEach(function(card, index) {
      const img = card.querySelector('img[loading="lazy"]');
      if (img) {
        img.classList.add('lazy-image');
        img.dataset.cardIndex = index;

        // 计算卡片所在行号（从0开始）
        const rowIndex = Math.floor(index / columnsPerRow);
        img.dataset.rowIndex = rowIndex;

        cardImages.push(img);
      }
    });

    // 按行分组加载
    cardImages.forEach(function(img) {
      const rowIndex = parseInt(img.dataset.rowIndex);

      if (rowIndex < 2) {
        // 前2行：立即加载，无动画
        img.classList.add('instant-load');
        loadImage(img);
      } else {
        // 后续行：按行延迟加载，同行同时飘上来
        const delay = (rowIndex - 2) * 100;  // 每行间隔100ms

        setTimeout(function() {
          loadImage(img, true);  // 第二个参数表示需要动画
        }, delay);
      }
    });
  });

  /**
   * 加载图片
   * @param {HTMLImageElement} img - 图片元素
   * @param {boolean} withAnimation - 是否显示动画
   */
  function loadImage(img, withAnimation) {
    // 如果图片已经有 src 属性，跳过（使用浏览器原生懒加载）
    if (!img.dataset.src) {
      // 如果有 src 但没有 data-src，直接标记为已加载
      if (img.src) {
        if (withAnimation) {
          requestAnimationFrame(function() {
            img.classList.add('lazy-loaded');
          });
        }
      }
      return;
    }

    img.src = img.dataset.src;
    img.removeAttribute('data-src');

    img.addEventListener('load', function() {
      if (withAnimation) {
        requestAnimationFrame(function() {
          img.classList.add('lazy-loaded');
        });
      }
    });

    img.addEventListener('error', function() {
      console.warn('Failed to load image:', img.src);
      img.style.opacity = '0.5';
    });
  }

  /**
   * 非首页默认懒加载逻辑（IntersectionObserver）
   */
  function initDefaultLazyLoad() {
    // 清理旧的 observer（如果存在）
    if (window._lazyLoadObserver) {
      window._lazyLoadObserver.disconnect();
      console.log('[LazyLoad] 🧹 清理旧的 IntersectionObserver');
    }

    // 降级处理：不支持 IntersectionObserver 的浏览器
    if (!('IntersectionObserver' in window)) {
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(function(img) {
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
      });
      return;
    }

    const imageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          // 只处理有 data-src 的图片，已经有 src 的使用浏览器原生懒加载
          if (img.dataset.src) {
            loadImage(img, true);
          }
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px',  // 🆕 提前 200px 加载 (更激进的策略)
      threshold: 0.01
    });

    // 保存 observer 引用以便后续清理
    window._lazyLoadObserver = imageObserver;

    // 🆕 优先加载关键图片 (首屏、高优先级)
    const criticalImages = document.querySelectorAll('img[data-priority="high"], img[loading="eager"]');
    criticalImages.forEach(function(img) {
      if (img.dataset.src) {
        loadImage(img, false);  // 立即加载，无动画
      }
    });

    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(function(img) {
      // 只观察需要手动懒加载的图片（有 data-src 的）
      if (img.dataset.src) {
        img.classList.add('lazy-image');
        imageObserver.observe(img);
      }
    });
  }

  // 🆕 智能链接预加载 - 鼠标悬停时预取 HTML
  function initLinkPrefetch() {
    let prefetchTimeout;
    const prefetchedLinks = new Set();

    document.addEventListener('mouseover', function(e) {
      const link = e.target.closest('a[href^="/"]');

      // 排除条件：没有链接、已预取、Swup 管理的链接
      if (!link || prefetchedLinks.has(link.href) || link.dataset.noSwup) {
        return;
      }

      clearTimeout(prefetchTimeout);
      prefetchTimeout = setTimeout(() => {
        // 使用 <link rel="prefetch"> 预取页面
        const prefetch = document.createElement('link');
        prefetch.rel = 'prefetch';
        prefetch.href = link.href;
        prefetch.as = 'document';
        document.head.appendChild(prefetch);

        prefetchedLinks.add(link.href);
        console.log('[Prefetch] 🔗', link.href);
      }, 200);  // 悬停 200ms 后触发
    }, { passive: true });
  }

  // 初始化链接预加载 (仅在非 Swup 页面或作为后备方案)
  if (!window.swup) {
    initLinkPrefetch();
  }

  // 导出全局函数供 Pjax 重新初始化使用
  window.initLazyLoad = initDefaultLazyLoad;
})();
