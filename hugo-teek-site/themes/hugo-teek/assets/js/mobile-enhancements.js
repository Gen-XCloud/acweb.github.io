// ========================================
// Mobile Enhancements
// 移动端体验增强
// ========================================

(function () {
  'use strict';

  // 仅在移动端执行
  if (window.innerWidth > 960) return;

  document.addEventListener('DOMContentLoaded', function () {
    initMobileEnhancements();
  });

  function initMobileEnhancements() {
    // 添加表格滚动指示器
    addTableScrollIndicators();
    
    // 优化移动端滚动体验
    optimizeMobileScrolling();
    
    // 添加触摸反馈
    addTouchFeedback();
    
    // 优化移动端图片加载
    optimizeMobileImages();
  }

  // 添加表格滚动指示器
  function addTableScrollIndicators() {
    const tables = document.querySelectorAll('.vp-doc table, .tk-doc-content table');
    
    tables.forEach(function(table) {
      // 检查表格是否需要滚动
      function checkScrollable() {
        if (table.scrollWidth > table.clientWidth) {
          table.classList.add('scrollable');
        } else {
          table.classList.remove('scrollable');
        }
      }
      
      // 初始检查
      checkScrollable();
      
      // 窗口大小改变时重新检查
      window.addEventListener('resize', checkScrollable);
      
      // 滚动时隐藏指示器
      table.addEventListener('scroll', function() {
        if (table.scrollLeft > 0) {
          table.classList.remove('scrollable');
        } else {
          checkScrollable();
        }
      });
    });
  }

  // 优化移动端滚动体验
  function optimizeMobileScrolling() {
    // 移除此函数的功能，允许页面自由滚动
    // 原来的逻辑会阻止主页面的触摸滚动
    // 不再添加 touchmove 监听器，让浏览器处理默认滚动行为
  }

  // 添加触摸反馈
  function addTouchFeedback() {
    const touchElements = document.querySelectorAll(
      '.mobile-fab, .mobile-nav-item, .mobile-toc-link, .mobile-search-btn, .mobile-menu-btn'
    );
    
    touchElements.forEach(function(element) {
      element.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
        this.style.transition = 'transform 0.1s ease';
      });
      
      element.addEventListener('touchend', function() {
        this.style.transform = '';
        this.style.transition = 'transform 0.2s ease';
      });
      
      element.addEventListener('touchcancel', function() {
        this.style.transform = '';
        this.style.transition = 'transform 0.2s ease';
      });
    });
  }

  // 优化移动端图片加载
  function optimizeMobileImages() {
    const images = document.querySelectorAll('.vp-doc img, .tk-doc-content img');
    
    images.forEach(function(img) {
      // 添加加载状态
      img.addEventListener('loadstart', function() {
        this.style.opacity = '0.5';
        this.style.transition = 'opacity 0.3s ease';
      });
      
      img.addEventListener('load', function() {
        this.style.opacity = '1';
      });
      
      img.addEventListener('error', function() {
        this.style.opacity = '0.3';
        this.alt = '图片加载失败';
      });
      
      // 添加点击放大功能（如果没有其他点击事件）
      if (!img.closest('a') && !img.hasAttribute('onclick')) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function() {
          // 创建全屏查看器
          const viewer = document.createElement('div');
          viewer.className = 'mobile-image-viewer';
          viewer.innerHTML = `
            <div class="viewer-overlay"></div>
            <div class="viewer-content">
              <img src="${this.src}" alt="${this.alt}">
              <button class="viewer-close" aria-label="关闭">×</button>
            </div>
          `;
          
          // 添加样式
          viewer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
          `;
          
          const content = viewer.querySelector('.viewer-content');
          content.style.cssText = `
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
          `;
          
          const viewerImg = viewer.querySelector('img');
          viewerImg.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          `;
          
          const closeBtn = viewer.querySelector('.viewer-close');
          closeBtn.style.cssText = `
            position: absolute;
            top: -40px;
            right: 0;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          `;
          
          document.body.appendChild(viewer);
          document.body.style.overflow = 'hidden';
          
          // 显示动画
          setTimeout(function() {
            viewer.style.opacity = '1';
          }, 10);
          
          // 关闭功能
          function closeViewer() {
            viewer.style.opacity = '0';
            setTimeout(function() {
              document.body.removeChild(viewer);
              document.body.style.overflow = '';
            }, 300);
          }
          
          closeBtn.addEventListener('click', closeViewer);
          viewer.addEventListener('click', function(e) {
            if (e.target === viewer || e.target.className === 'viewer-overlay') {
              closeViewer();
            }
          });
          
          // ESC键关闭
          document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
              closeViewer();
              document.removeEventListener('keydown', escHandler);
            }
          });
        });
      }
    });
  }

  // 添加移动端手势支持
  function addGestureSupport() {
    let startX, startY, startTime;
    
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      }
    });
    
    document.addEventListener('touchend', function(e) {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const endTime = Date.now();
        
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const deltaTime = endTime - startTime;
        
        // 检测快速滑动手势
        if (deltaTime < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
          // 左滑：打开侧边栏
          if (deltaX > 0 && startX < 50) {
            const menuBtn = document.getElementById('mobile-menu-btn');
            if (menuBtn) {
              menuBtn.click();
            }
          }
          // 右滑：关闭侧边栏
          else if (deltaX < 0 && startX > window.innerWidth - 50) {
            const sidebar = document.querySelector('.VPSidebar');
            if (sidebar && sidebar.classList.contains('open')) {
              const overlay = document.getElementById('mobile-fab-overlay');
              if (overlay) {
                overlay.click();
              }
            }
          }
        }
      }
    });
  }

  // 初始化手势支持
  addGestureSupport();

})();