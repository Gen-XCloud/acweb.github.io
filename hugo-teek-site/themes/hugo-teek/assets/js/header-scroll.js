// Header scroll effect for homepage
(function() {
  const header = document.querySelector('.VPNavBar');
  const isHomePage = document.querySelector('.home-page');

  if (!isHomePage || !header) {
    return;
  }

  let lastScrollTop = 0;
  let ticking = false;

  function updateHeader() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // 滚动超过100px时添加scrolled类
    if (scrollTop > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScrollTop = scrollTop;
    ticking = false;
  }

  // 页面加载时立即检查一次（处理浏览器自动恢复滚动位置的情况）
  updateHeader();

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
})();
