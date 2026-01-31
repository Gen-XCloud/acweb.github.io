// ========================================
// 移动端导航交互逻辑
// Mobile Navigation Interaction Logic
// ========================================

(function () {
  'use strict';

  // DOM 元素
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileSearchBtn = document.getElementById('mobile-search-btn');
  const mobileThemeToggle = document.getElementById('mobile-theme-toggle');

  // ========================================
  // 打开/关闭导航抽屉
  // ========================================
  function openNavDrawer() {
    mobileNavDrawer.classList.add('open');
    mobileNavOverlay.classList.add('active');
    document.body.classList.add('mobile-nav-open');
    mobileNavToggle.setAttribute('aria-expanded', 'true');
  }

  function closeNavDrawer() {
    mobileNavDrawer.classList.remove('open');
    mobileNavOverlay.classList.remove('active');
    document.body.classList.remove('mobile-nav-open');
    mobileNavToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleNavDrawer() {
    if (mobileNavDrawer.classList.contains('open')) {
      closeNavDrawer();
    } else {
      openNavDrawer();
    }
  }

  // ========================================
  // 菜单按钮点击事件
  // ========================================
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleNavDrawer();
    });
  }

  // ========================================
  // 遮罩层点击关闭
  // ========================================
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', function () {
      closeNavDrawer();
    });
  }

  // ========================================
  // 子菜单展开/收起
  // ========================================
  const navGroupToggles = document.querySelectorAll('.mobile-nav-item-toggle');

  navGroupToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const submenu = this.nextElementSibling;
      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // 切换状态
      this.setAttribute('aria-expanded', !isExpanded);
      submenu.classList.toggle('open');
    });
  });

  // ========================================
  // 搜索按钮点击事件
  // ========================================
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', function () {
      // 触发桌面端的搜索按钮
      const desktopSearchBtn = document.getElementById('header-search-input');
      if (desktopSearchBtn) {
        desktopSearchBtn.click();
      }
    });
  }

  // ========================================
  // 主题切换
  // ========================================
  if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', function () {
      // 触发桌面端的主题切换按钮
      const desktopThemeToggle = document.getElementById('theme-toggle');
      if (desktopThemeToggle) {
        desktopThemeToggle.click();
      }
    });
  }

  // ========================================
  // 移动端时钟更新
  // ========================================
  const mobileClock = document.getElementById('mobile-clock');

  if (mobileClock) {
    function updateMobileClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const hourEl = mobileClock.querySelector('.hour');
      const minuteEl = mobileClock.querySelector('.minute');
      const secondEl = mobileClock.querySelector('.second');

      if (hourEl) hourEl.textContent = hours;
      if (minuteEl) minuteEl.textContent = minutes;
      if (secondEl) secondEl.textContent = seconds;
    }

    // 初始化时钟
    updateMobileClock();

    // 每秒更新
    setInterval(updateMobileClock, 1000);
  }

  // ========================================
  // 窗口大小改变时关闭抽屉
  // ========================================
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth > 768) {
        closeNavDrawer();
      }
    }, 250);
  });

  // ========================================
  // ESC 键关闭抽屉
  // ========================================
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNavDrawer.classList.contains('open')) {
      closeNavDrawer();
    }
  });

  // ========================================
  // 点击导航项后关闭抽屉
  // ========================================
  const navItems = document.querySelectorAll('.mobile-nav-item, .mobile-nav-subitem');
  navItems.forEach(function (item) {
    // 只对链接生效，不对按钮生效
    if (item.tagName === 'A') {
      item.addEventListener('click', function () {
        // 延迟关闭，让用户看到点击效果
        setTimeout(function () {
          closeNavDrawer();
        }, 200);
      });
    }
  });

  // ========================================
  // 防止抽屉内容点击冒泡到遮罩层
  // ========================================
  if (mobileNavDrawer) {
    mobileNavDrawer.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  }
})();
