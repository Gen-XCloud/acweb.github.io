// ========================================
// 致谢名单交互脚本
// Sponsor List Interactive Script
// ========================================

(function() {
  'use strict';

  // ========================================
  // 1. 获取元素
  // ========================================
  const openModalBtn = document.getElementById('openSponsorModal');
  const closeModalBtn = document.getElementById('closeSponsorModal');
  const modal = document.getElementById('sponsorModal');
  const modalOverlay = modal ? modal.querySelector('.sponsor-modal-overlay') : null;
  const sponsorCards = document.querySelectorAll('.sponsor-card');

  // ========================================
  // 2. 模态框控制
  // ========================================

  // 打开模态框
  function openModal() {
    if (!modal) return;
    modal.classList.add('active');
    document.body.classList.add('sponsor-modal-open');
  }

  // 关闭模态框
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('sponsor-modal-open');
  }

  // 点击"赞赏博主"按钮打开模态框
  if (openModalBtn) {
    openModalBtn.addEventListener('click', openModal);
  }

  // 点击关闭按钮
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // 点击遮罩关闭
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  // ESC 键关闭
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // ========================================
  // 3. 移动端留言切换（点击显示）
  // ========================================

  let activeCard = null;

  // 判断是否为移动设备
  function isMobileDevice() {
    return window.innerWidth <= 768 ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  // 处理卡片点击（移动端）
  function handleCardClick(e) {
    // 只在移动端处理
    if (!isMobileDevice()) return;

    const card = e.currentTarget;
    const hasMessage = card.dataset.hasMessage === 'true';

    if (!hasMessage) return;

    e.preventDefault();
    e.stopPropagation();

    // 如果点击的是当前激活的卡片，关闭它
    if (activeCard === card) {
      card.classList.remove('show-message');
      activeCard = null;
    } else {
      // 关闭之前的卡片
      if (activeCard) {
        activeCard.classList.remove('show-message');
      }
      // 打开新卡片
      card.classList.add('show-message');
      activeCard = card;
    }
  }

  // 为所有卡片添加点击事件
  sponsorCards.forEach(card => {
    card.addEventListener('click', handleCardClick);

    // 触摸设备优化
    card.addEventListener('touchstart', function(e) {
      if (isMobileDevice()) {
        handleCardClick.call(this, e);
      }
    }, { passive: false });
  });

  // 点击页面其他地方关闭留言
  document.addEventListener('click', function(e) {
    if (!isMobileDevice()) return;

    const clickedCard = e.target.closest('.sponsor-card');
    if (!clickedCard && activeCard) {
      activeCard.classList.remove('show-message');
      activeCard = null;
    }
  });

  // ========================================
  // 4. 响应式处理
  // ========================================

  // 窗口大小改变时，如果从移动端切换到桌面端，关闭所有留言
  let previousMobile = isMobileDevice();

  window.addEventListener('resize', function() {
    const currentMobile = isMobileDevice();

    if (previousMobile && !currentMobile) {
      // 从移动端切换到桌面端，关闭所有留言显示
      sponsorCards.forEach(card => {
        card.classList.remove('show-message');
      });
      activeCard = null;
    }

    previousMobile = currentMobile;
  });

  // ========================================
  // 5. 防止双击缩放（移动端）
  // ========================================

  if (isMobileDevice()) {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

})();
