// ========================================
// Mobile Toolbar Interactions
// 移动端工具栏交互逻辑
// ========================================

(function () {
  'use strict';

  // 仅在移动端执行
  document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth <= 960) {
      initMobileToolbar();
      initMobileTocHighlight();
    }

    // 监听窗口大小变化
    let isMobileInitialized = window.innerWidth <= 960;
    window.addEventListener('resize', function () {
      const isMobile = window.innerWidth <= 960;

      if (isMobile && !isMobileInitialized) {
        initMobileToolbar();
        initMobileTocHighlight();
        isMobileInitialized = true;
      } else if (!isMobile && isMobileInitialized) {
        // 清理移动端状态
        const sidebar = document.getElementById('mobile-sidebar-drawer');
        const tocDrawer = document.getElementById('mobile-toc-drawer');
        if (sidebar) sidebar.classList.remove('open');
        if (tocDrawer) tocDrawer.classList.remove('open');
        document.body.classList.remove('mobile-drawer-open');

        const overlay = document.getElementById('mobile-toolbar-overlay');
        if (overlay) {
          overlay.classList.remove('active');
          // 清除初始化标记，允许重新初始化
          delete overlay.dataset.mobileToolbarInitialized;
        }

        isMobileInitialized = false;
      }
    });
  });

  function initMobileToolbar() {
    console.log('[MobileToolbar] 开始初始化...');

    // 获取DOM元素
    const menuBtn = document.getElementById('mobile-toolbar-menu-btn');
    const tocBtn = document.getElementById('mobile-toolbar-toc-btn');
    const overlay = document.getElementById('mobile-toolbar-overlay');
    const sidebar = document.getElementById('mobile-sidebar-drawer');
    const sidebarCloseBtn = document.getElementById('mobile-sidebar-close');
    const tocDrawer = document.getElementById('mobile-toc-drawer');
    const tocCloseBtn = document.getElementById('mobile-toc-close');

    console.log('[MobileToolbar] DOM元素:', {
      menuBtn: !!menuBtn,
      tocBtn: !!tocBtn,
      overlay: !!overlay,
      sidebar: !!sidebar,
      tocDrawer: !!tocDrawer
    });

    if (!overlay) {
      console.warn('[MobileToolbar] overlay不存在，初始化中止');
      return;
    }

    // 防止重复初始化
    if (overlay.dataset.mobileToolbarInitialized === 'true') {
      console.log('[MobileToolbar] 已初始化，跳过重复绑定');
      return;
    }
    overlay.dataset.mobileToolbarInitialized = 'true';
    console.log('[MobileToolbar] 初始化完成，事件已绑定');

    // 导出清理函数到全局，供 Swup 在页面切换时调用
    window.closeMobileDrawers = function() {
      closeSidebar();
      closeTocDrawer();
      deactivateButton();
    };

    // 按钮激活/取消激活逻辑
    function activateButton(btn) {
      if (btn) {
        btn.classList.add('active');
      }
    }

    function deactivateButton(btn) {
      if (btn) {
        btn.classList.remove('active');
      } else {
        // 取消激活所有按钮
        if (menuBtn) menuBtn.classList.remove('active');
        if (tocBtn) tocBtn.classList.remove('active');
      }
    }

    // 左按钮 - 打开/关闭文档树（只绑定一次，内部动态获取DOM）
    if (menuBtn && !menuBtn.dataset.eventBound) {
      menuBtn.dataset.eventBound = 'true';
      menuBtn.addEventListener('click', function () {
        // 动态获取最新的 sidebar 元素
        const currentSidebar = document.getElementById('mobile-sidebar-drawer');
        if (!currentSidebar) return;

        const isOpen = currentSidebar.classList.contains('open');

        if (isOpen) {
          closeSidebar();
          deactivateButton(menuBtn);
        } else {
          openSidebar();
          activateButton(menuBtn);
        }
      });
    }

    // 右按钮 - 打开/关闭TOC抽屉（只绑定一次，内部动态获取DOM）
    if (tocBtn && !tocBtn.dataset.eventBound) {
      tocBtn.dataset.eventBound = 'true';
      tocBtn.addEventListener('click', function () {
        // 动态获取最新的 tocDrawer 元素
        const currentTocDrawer = document.getElementById('mobile-toc-drawer');
        if (!currentTocDrawer) return;

        const isOpen = currentTocDrawer.classList.contains('open');

        if (isOpen) {
          closeTocDrawer();
          deactivateButton(tocBtn);
        } else {
          openTocDrawer();
          activateButton(tocBtn);
        }
      });
    }

    // TOC关闭按钮
    if (tocCloseBtn) {
      tocCloseBtn.addEventListener('click', function () {
        closeTocDrawer();
        deactivateButton(tocBtn);
      });
    }

    // 侧边栏关闭按钮
    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener('click', function () {
        closeSidebar();
        deactivateButton(menuBtn);
      });
    }

    // 遮罩层点击关闭所有弹层
    overlay.addEventListener('click', function () {
      closeSidebar();
      closeTocDrawer();
      deactivateButton();
    });

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
            // 关闭抽屉
            closeTocDrawer();
            deactivateButton(tocBtn);

            // 缩短等待时间，使用requestAnimationFrame优化
            requestAnimationFrame(() => {
              setTimeout(function () {
                const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64;
                const layoutTopHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-layout-top-height')) || 0;
                const toolbarHeight = 48; // 工具栏高度
                const offset = navHeight + layoutTopHeight + toolbarHeight + 20; // 额外20px间距

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
              }, 200); // 缩短延迟
            });
          }
        });
      });
    }

    // 打开sidebar（动态获取DOM元素）
    function openSidebar() {
      const currentTocDrawer = document.getElementById('mobile-toc-drawer');
      const currentSidebar = document.getElementById('mobile-sidebar-drawer');
      const currentOverlay = document.getElementById('mobile-toolbar-overlay');

      // 先关闭TOC抽屉（互斥）
      if (currentTocDrawer && currentTocDrawer.classList.contains('open')) {
        currentTocDrawer.classList.remove('open');
      }
      deactivateButton(tocBtn);

      if (currentSidebar) {
        // 保存当前滚动位置并锁定页面
        const scrollY = window.scrollY || window.pageYOffset;
        document.body.style.top = `-${scrollY}px`;
        document.body.setAttribute('data-scroll-y', scrollY);

        // 批量DOM操作
        currentSidebar.classList.add('open');
        if (currentOverlay) currentOverlay.classList.add('active');
        document.body.classList.add('mobile-drawer-open');
      }
    }

    // 关闭sidebar（动态获取DOM元素）
    function closeSidebar() {
      const currentSidebar = document.getElementById('mobile-sidebar-drawer');
      const currentOverlay = document.getElementById('mobile-toolbar-overlay');

      if (currentSidebar && currentSidebar.classList.contains('open')) {
        // 批量DOM操作
        currentSidebar.classList.remove('open');
        if (currentOverlay) currentOverlay.classList.remove('active');
        document.body.classList.remove('mobile-drawer-open');

        // 恢复滚动位置
        const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
        document.body.style.top = '';
        document.body.removeAttribute('data-scroll-y');
        if (scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      }
    }

    // 打开TOC抽屉（动态获取DOM元素）
    function openTocDrawer() {
      const currentTocDrawer = document.getElementById('mobile-toc-drawer');
      const currentSidebar = document.getElementById('mobile-sidebar-drawer');
      const currentOverlay = document.getElementById('mobile-toolbar-overlay');

      // 先关闭侧边栏（互斥）
      if (currentSidebar && currentSidebar.classList.contains('open')) {
        currentSidebar.classList.remove('open');
      }
      deactivateButton(menuBtn);

      if (currentTocDrawer) {
        // 保存当前滚动位置并锁定页面
        const scrollY = window.scrollY || window.pageYOffset;
        document.body.style.top = `-${scrollY}px`;
        document.body.setAttribute('data-scroll-y', scrollY);

        // 批量DOM操作
        currentTocDrawer.classList.add('open');
        if (currentOverlay) currentOverlay.classList.add('active');
        document.body.classList.add('mobile-drawer-open');
      }
    }

    // 关闭TOC抽屉（动态获取DOM元素）
    function closeTocDrawer() {
      const currentTocDrawer = document.getElementById('mobile-toc-drawer');
      const currentOverlay = document.getElementById('mobile-toolbar-overlay');

      if (currentTocDrawer && currentTocDrawer.classList.contains('open')) {
        // 批量DOM操作
        currentTocDrawer.classList.remove('open');
        if (currentOverlay) currentOverlay.classList.remove('active');
        document.body.classList.remove('mobile-drawer-open');

        // 恢复滚动位置
        const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
        document.body.style.top = '';
        document.body.removeAttribute('data-scroll-y');
        if (scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      }
    }

    // ESC键关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeSidebar();
        closeTocDrawer();
        deactivateButton();
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
      rootMargin: '-100px 0px -66% 0px',
      threshold: [0, 0.5, 1]
    });

    linkMap.forEach(function (_, heading) {
      observer.observe(heading);
    });

    // 滚动时手动检测最近的标题（防抖优化）
    let scrollTimeout;
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(function () {
            const headings = Array.from(linkMap.keys());
            let closestHeading = null;
            let closestDistance = Infinity;

            headings.forEach(function (heading) {
              const rect = heading.getBoundingClientRect();
              const distance = Math.abs(rect.top - 100);

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
          }, 100); // 增加防抖延迟
          ticking = false;
        });
        ticking = true;
      }
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

  // 导出到全局，供 Swup/Pjax 调用
  window.initMobileToolbar = function() {
    if (window.innerWidth <= 960) {
      // 清除初始化标记，允许重新绑定事件到新的 DOM 元素
      // 这是因为 mobile-toc-drawer 在 pjax 替换区域内，会被替换为新元素
      const overlay = document.getElementById('mobile-toolbar-overlay');
      if (overlay) {
        delete overlay.dataset.mobileToolbarInitialized;
      }
      initMobileToolbar();
      initMobileTocHighlight();
    }
  };
})();
