// Mobile menu toggle
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navBar = document.querySelector('.VPNavBar');

    if (!mobileMenuToggle || !navBar) {
      return;
    }

    const closeMenu = () => {
      navBar.classList.remove('is-mobile-open');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
    };

    mobileMenuToggle.addEventListener('click', function (event) {
      event.stopPropagation();
      const isOpen = navBar.classList.toggle('is-mobile-open');
      mobileMenuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function (event) {
      if (!navBar.contains(event.target)) {
        closeMenu();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    });
  });
})();

// Hero scroll indicator - 向下滚动按钮点击事件
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');

    if (scrollIndicator) {
      scrollIndicator.addEventListener('click', function () {
        // 滚动到文章内容区域（而不是固定的innerHeight）
        const contentSection = document.querySelector('.home-content-section');

        if (contentSection) {
          // 获取导航栏高度（导航栏是固定定位，需要减去其高度）
          const navBar = document.querySelector('.VPNavBar');
          const navHeight = navBar ? navBar.offsetHeight : 64; // 默认64px

          // 获取内容区域的顶部位置，减去导航栏高度，再额外减去一点间距
          const targetPosition = contentSection.offsetTop - navHeight ; // 额外10px间距

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        } else {
          // 如果找不到内容区域，回退到默认行为
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
          });
        }
      });
    }
  });
})();
