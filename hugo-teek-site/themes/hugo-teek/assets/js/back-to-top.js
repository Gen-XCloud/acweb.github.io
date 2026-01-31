// Back to Top Button with Reading Progress - VP火箭样式
(function() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  const progressBar = backToTopBtn.querySelector('.progress-circle-bar');
  const radius = 30; // VP使用r=30
  const circumference = 2 * Math.PI * radius; // 188.5

  let ticking = false;
  let isLaunching = false;

  // Update progress ring based on scroll position
  function updateProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = scrollHeight <= 0 ? 0 : Math.min(Math.max(scrollTop / scrollHeight, 0), 1);

    // Update progress ring (VP样式：从188.5减少到0)
    const offset = circumference * (1 - scrollPercent);
    progressBar.style.strokeDashoffset = offset;

    // Show/hide button based on scroll position
    if (scrollTop > 100) { // VP使用100px阈值
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }

    ticking = false;
  }

  // Smooth scroll to top with launch animation
  function scrollToTop() {
    if (isLaunching) return;

    // 设置发射状态
    isLaunching = true;
    backToTopBtn.classList.add('launching');

    // 立即开始滚动
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // 监听滚动结束，重置发射状态
    const checkScrollEnd = () => {
      if (window.scrollY <= 0) {
        setTimeout(() => {
          isLaunching = false;
          backToTopBtn.classList.remove('launching');
        }, 300);
        window.removeEventListener('scroll', checkScrollEnd);
      }
    };

    window.addEventListener('scroll', checkScrollEnd);
  }

  // Event listeners with requestAnimationFrame optimization
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', scrollToTop);

  // Initial call
  updateProgress();
})();

// Scroll to Comment Button
(function() {
  const commentBtn = document.getElementById('scroll-to-comment');
  if (!commentBtn) {
    console.log('[评论按钮] 未找到 #scroll-to-comment 元素');
    return;
  }

  // 查找评论区容器（多种方式尝试）
  function findCommentSection() {
    // 优先查找包裹容器
    let section = document.querySelector('.tk-doc-comment');
    if (section) return section;

    // 查找Twikoo渲染后的容器
    section = document.getElementById('twikoo');
    if (section) return section;

    // 查找初始容器
    section = document.getElementById('tcomment');
    if (section) return section;

    return null;
  }

  let commentSection = findCommentSection();

  // 如果一开始找不到，等待一段时间后重试（Twikoo可能还在加载）
  if (!commentSection) {
    console.log('[评论按钮] 评论区还未加载，等待重试...');
    setTimeout(() => {
      commentSection = findCommentSection();
      if (commentSection) {
        console.log('[评论按钮] 评论区加载完成，初始化成功');
        initCommentButton();
      } else {
        console.log('[评论按钮] 未找到评论区容器，按钮将保持隐藏');
      }
    }, 1000);
    return;
  }

  console.log('[评论按钮] 初始化成功', {
    按钮: commentBtn,
    评论区: commentSection
  });

  initCommentButton();

  function initCommentButton() {
    if (!commentSection) {
      commentSection = findCommentSection();
      if (!commentSection) return;
    }

    let ticking = false;

    // Show/hide button based on scroll position
    function updateCommentBtnVisibility() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const commentPosition = commentSection.getBoundingClientRect().top + scrollTop;
      const windowHeight = window.innerHeight;

      const shouldShow = scrollTop > 300 && scrollTop + windowHeight < commentPosition;

      // 显示按钮：滚动超过300px 且 还没到达评论区
      if (shouldShow) {
        commentBtn.classList.add('visible');
      } else {
        commentBtn.classList.remove('visible');
      }

      ticking = false;
    }

    // Smooth scroll to comment section
    function scrollToComment() {
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64;
      const offset = navHeight + 20; // 额外20px间距

      const commentPosition = commentSection.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: commentPosition,
        behavior: 'smooth'
      });
    }

    // Event listeners with requestAnimationFrame optimization
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateCommentBtnVisibility);
        ticking = true;
      }
    }, { passive: true });

    commentBtn.addEventListener('click', scrollToComment);

    // Initial call
    updateCommentBtnVisibility();
  }
})();
