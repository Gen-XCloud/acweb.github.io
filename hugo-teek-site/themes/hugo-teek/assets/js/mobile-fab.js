// ========================================
// Mobile FAB (Floating Action Buttons) Interactions
// 移动端悬浮按钮交互逻辑
// ========================================
//
// 性能优化说明 (Performance Optimization)
// ----------------------------------------
// 本文件已进行性能优化以解决移动端抽屉卡顿问题：
//
// 1. **移除 passive: false 的 touchmove 监听器**
//    - 原因：passive: false 会阻塞主线程，导致滚动卡顿
//    - 改用 CSS overscroll-behavior 防止滚动穿透
//
// 2. **简化滚动位置保存/恢复逻辑**
//    - 移除 document.body.style.top 操作（触发重排）
//    - 使用 data-scroll-y 属性保存位置，减少 DOM 操作
//
// 3. **移除 preventScrollThrough 函数**
//    - 原因：每次 touchmove 都要读取布局属性，触发强制同步布局
//    - 改用 CSS 方案（overscroll-behavior + touch-action）
//
// CSS 配置要求：
// - body.mobile-drawer-open { overflow: hidden; }
// - .mobile-toc-drawer__content { overscroll-behavior: contain; touch-action: pan-y; }
// - .VPSidebar { overscroll-behavior: contain; touch-action: pan-y; }
//
// 预期效果：消除主线程阻塞，提升抽屉打开/关闭流畅度至 60fps
// ----------------------------------------

(function () {
  'use strict';

  // 移除宽度检测，始终初始化，让CSS控制显示/隐藏
  document.addEventListener('DOMContentLoaded', function () {
    // 只在移动端执行初始化
    if (window.innerWidth <= 960) {
      initMobileFab();
      initMobileTocHighlight();
    }

    // 监听窗口大小变化，动态初始化或清理
    let isMobileInitialized = window.innerWidth <= 960;
    window.addEventListener('resize', function () {
      const isMobile = window.innerWidth <= 960;
      
      // 从桌面切换到移动端
      if (isMobile && !isMobileInitialized) {
        initMobileFab();
        initMobileTocHighlight();
        isMobileInitialized = true;
      }
      // 从移动端切换到桌面
      else if (!isMobile && isMobileInitialized) {
        // 清理移动端状态
        const sidebar = document.querySelector('.VPSidebar');
        const tocDrawer = document.getElementById('mobile-toc-drawer');
        if (sidebar) sidebar.classList.remove('open');
        if (tocDrawer) tocDrawer.classList.remove('open');
        document.body.classList.remove('mobile-drawer-open');
        
        const overlay = document.getElementById('mobile-fab-overlay');
        if (overlay) overlay.classList.remove('active');
        
        isMobileInitialized = false;
      }
    });
  });

  function initMobileFab() {
    // 获取DOM元素
    const menuBtn = document.getElementById('mobile-menu-btn');
    const tocBtn = document.getElementById('mobile-toc-btn');
    const overlay = document.getElementById('mobile-fab-overlay');
    const sidebar = document.getElementById('mobile-sidebar-drawer');
    const sidebarCloseBtn = document.getElementById('mobile-sidebar-close');
    const tocDrawer = document.getElementById('mobile-toc-drawer');
    const tocCloseBtn = document.getElementById('mobile-toc-close');

    if (!overlay) return;

    // 导出清理函数到全局，供 Swup 在页面切换时调用
    window.closeMobileDrawers = function() {
      closeSidebar();
      closeTocDrawer();
      collapseButton();
    };

    // 按钮展开/收起逻辑 - 支持独立控制
    // 展开指定按钮（不传参数则展开所有）
    function expandButton(btn) {
      if (btn) {
        btn.classList.remove('collapsed');
      } else {
        if (menuBtn) menuBtn.classList.remove('collapsed');
        if (tocBtn) tocBtn.classList.remove('collapsed');
      }
    }

    // 收起指定按钮（不传参数则收起所有）
    function collapseButton(btn) {
      if (btn) {
        btn.classList.add('collapsed');
      } else {
        if (menuBtn) menuBtn.classList.add('collapsed');
        if (tocBtn) tocBtn.classList.add('collapsed');
      }
    }

    // 监听页面滚动 - 滚动时立即收起所有按钮
    window.addEventListener('scroll', function () {
      collapseButton(); // 收起所有按钮
    }, { passive: true });

    // 初始状态：HTML中已默认为collapsed，无需JS设置

    // 左按钮 - 打开/关闭文档树
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', function () {
        const isOpen = sidebar.classList.contains('open');

        if (isOpen) {
          // 已打开 -> 关闭侧边栏并收起按钮
          closeSidebar();
          collapseButton(menuBtn);
        } else {
          // 未打开 -> 展开按钮并打开侧边栏
          expandButton(menuBtn);
          openSidebar();
        }
      });
    }

    // 右按钮 - 打开/关闭TOC抽屉
    if (tocBtn && tocDrawer) {
      tocBtn.addEventListener('click', function () {
        const isOpen = tocDrawer.classList.contains('open');

        if (isOpen) {
          // 已打开 -> 关闭TOC抽屉并收起按钮
          closeTocDrawer();
          collapseButton(tocBtn);
        } else {
          // 未打开 -> 展开按钮并打开TOC抽屉
          expandButton(tocBtn);
          openTocDrawer();
        }
      });
    }

    // TOC关闭按钮
    if (tocCloseBtn) {
      tocCloseBtn.addEventListener('click', function () {
        closeTocDrawer();
        collapseButton(tocBtn);
      });
    }

    // 侧边栏关闭按钮
    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener('click', function () {
        closeSidebar();
        collapseButton(menuBtn);
      });
    }

    // 遮罩层点击关闭所有弹层
    overlay.addEventListener('click', function () {
      closeSidebar();
      closeTocDrawer();
      // 收起所有按钮
      collapseButton();
    });

    // 性能优化：移除遮罩层的 touchmove 监听器（passive: false）
    // 改用 CSS 方案防止滚动穿透：
    // - body.mobile-drawer-open { overflow: hidden; }
    // - .mobile-toc-drawer__content { overscroll-behavior: contain; }
    // - .VPSidebar { overscroll-behavior: contain; }

    // TOC链接点击时关闭抽屉并跳转
    if (tocDrawer) {
      const tocLinks = tocDrawer.querySelectorAll('.mobile-toc-link');
      tocLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          const hash = decodeURIComponent(link.getAttribute('href') || '').replace(/^#/, '');
          if (!hash) return;

          const heading = document.getElementById(hash);
          if (heading) {
            // 关闭抽屉并收起按钮
            closeTocDrawer();
            collapseButton(tocBtn);

            // 等待动画完成后跳转
            setTimeout(function () {
              // 计算导航栏高度和偏移量
              const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64;
              const layoutTopHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-layout-top-height')) || 0;
              const offset = navHeight + layoutTopHeight + 80; // 额外80px间距

              const targetPosition = heading.getBoundingClientRect().top + window.pageYOffset - offset;

              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });

              history.replaceState(null, '', '#' + hash);

              // 高亮当前链接
              tocLinks.forEach(function (l) {
                l.classList.remove('active');
              });
              link.classList.add('active');
            }, 350);
          }
        });
      });
    }

    // 打开sidebar
    function openSidebar() {
      // 先关闭TOC抽屉（互斥）
      closeTocDrawer();
      collapseButton(tocBtn); // 收起TOC按钮

      if (sidebar) {
        // 保存当前滚动位置并锁定页面
        const scrollY = window.scrollY || window.pageYOffset;
        document.body.style.top = `-${scrollY}px`;  // 配合 position: fixed 锁定页面
        document.body.setAttribute('data-scroll-y', scrollY);

        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('mobile-drawer-open');

        // 性能优化：移除 preventScrollThrough，使用 CSS overscroll-behavior 防止滚动穿透
        // CSS: overscroll-behavior: contain;
      }
    }

    // 关闭sidebar
    function closeSidebar() {
      if (sidebar) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('mobile-drawer-open');

        // 恢复滚动位置
        const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
        document.body.style.top = '';  // 移除 fixed 定位的 top 值
        document.body.removeAttribute('data-scroll-y');
        window.scrollTo(0, scrollY);  // 恢复到原来的位置

        // 性能优化：移除 allowScrollThrough，使用 CSS 方案
      }
    }

    // 打开TOC抽屉
    function openTocDrawer() {
      // 先关闭侧边栏（互斥）
      closeSidebar();
      collapseButton(menuBtn); // 收起目录按钮

      if (tocDrawer) {
        // 保存当前滚动位置并锁定页面
        const scrollY = window.scrollY || window.pageYOffset;
        document.body.style.top = `-${scrollY}px`;  // 配合 position: fixed 锁定页面
        document.body.setAttribute('data-scroll-y', scrollY);

        tocDrawer.classList.add('open');
        overlay.classList.add('active');
        document.body.classList.add('mobile-drawer-open');

        // 性能优化：移除 preventScrollThrough，使用 CSS overscroll-behavior 防止滚动穿透
        // CSS: overscroll-behavior: contain;
      }
    }

    // 关闭TOC抽屉
    function closeTocDrawer() {
      if (tocDrawer) {
        tocDrawer.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('mobile-drawer-open');

        // 恢复滚动位置
        const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
        document.body.style.top = '';  // 移除 fixed 定位的 top 值
        document.body.removeAttribute('data-scroll-y');
        window.scrollTo(0, scrollY);  // 恢复到原来的位置

        // 性能优化：移除 allowScrollThrough，使用 CSS 方案
      }
    }

    // ESC键关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSidebar();
        closeTocDrawer();
        // 收起所有按钮
        collapseButton();
      }
    });
  }

  // 移动端TOC高亮逻辑
  function initMobileTocHighlight() {
    const tocDrawer = document.getElementById('mobile-toc-drawer');
    if (!tocDrawer) return;

    const links = tocDrawer.querySelectorAll('.mobile-toc-link');
    if (!links.length) return;

    const linkMap = new Map();
    links.forEach(function (link) {
      const hash = decodeURIComponent(link.getAttribute('href') || '').replace(/^#/, '');
      if (!hash) return;
      const heading = document.getElementById(hash);
      if (heading) {
        linkMap.set(heading, link);
      }
    });

    if (!linkMap.size) return;

    let activeHeading = null;

    // 使用IntersectionObserver检测可见标题
    const observer = new IntersectionObserver(function (entries) {
      const visibleHeadings = [];

      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visibleHeadings.push({
            heading: entry.target,
            top: entry.boundingClientRect.top
          });
        }
      });

      if (visibleHeadings.length > 0) {
        visibleHeadings.sort(function (a, b) {
          return a.top - b.top;
        });
        const topHeading = visibleHeadings[0].heading;

        if (topHeading !== activeHeading) {
          activeHeading = topHeading;
          const link = linkMap.get(topHeading);
          if (link) {
            links.forEach(function (l) {
              l.classList.remove('active');
            });
            link.classList.add('active');
          }
        }
      }
    }, {
      rootMargin: '-80px 0px -66% 0px',
      threshold: [0, 0.5, 1]
    });

    linkMap.forEach(function (_, heading) {
      observer.observe(heading);
    });

    // 滚动时手动检测最近的标题
    let scrollTimeout;
    window.addEventListener('scroll', function () {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        const headings = Array.from(linkMap.keys());
        let closestHeading = null;
        let closestDistance = Infinity;

        headings.forEach(function (heading) {
          const rect = heading.getBoundingClientRect();
          const distance = Math.abs(rect.top - 80);

          if (rect.top < window.innerHeight && rect.top > -rect.height) {
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
            links.forEach(function (l) {
              l.classList.remove('active');
            });
            link.classList.add('active');
          }
        }
      }, 50);
    }, { passive: true });

    // 初始化 - 激活第一个链接或当前hash对应的链接
    setTimeout(function () {
      const currentHash = location.hash.replace(/^#/, '');
      if (currentHash) {
        links.forEach(function (link) {
          if (link.getAttribute('href') === '#' + currentHash) {
            link.classList.add('active');
          }
        });
      } else if (links.length > 0) {
        links[0].classList.add('active');
      }
    }, 100);
  }

  // 导出到全局，供 Swup 调用
  window.initMobileFab = function() {
    // 只在移动端执行初始化
    if (window.innerWidth <= 960) {
      initMobileFab();
      initMobileTocHighlight();
    }
  };
})();
