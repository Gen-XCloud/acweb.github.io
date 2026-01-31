(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initShareButtons();
  });

  function initShareButtons() {
    const shareButtons = document.querySelectorAll('.tk-share-button');
    if (!shareButtons.length) return;

    shareButtons.forEach(shareButton => {
      // 避免重复初始化
      if (shareButton.dataset.initialized) return;
      shareButton.dataset.initialized = 'true';

      const url = shareButton.getAttribute('data-url');
      if (!url) return;

      const iconEl = shareButton.querySelector('.share-icon');
      const textEl = shareButton.querySelector('.share-text');

      if (!iconEl || !textEl) return;

      // 保存原始内容
      const originalIcon = iconEl.textContent;
      const originalText = textEl.textContent;

      // 点击按钮直接复制链接
      shareButton.addEventListener('click', async function () {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
          } else {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
          }

          // 第一步：淡出当前内容
          shareButton.classList.add('fading-out');

          // 等待淡出动画完成后切换内容
          setTimeout(() => {
            // 切换内容
            iconEl.textContent = '👍';
            textEl.textContent = '链接已复制';
            shareButton.classList.add('copied');

            // 移除淡出，添加淡入
            shareButton.classList.remove('fading-out');
            shareButton.classList.add('fading-in');

            // 清除淡入动画类
            setTimeout(() => {
              shareButton.classList.remove('fading-in');
            }, 500);
          }, 200);

          // 2秒后恢复原始状态
          setTimeout(() => {
            // 再次淡出
            shareButton.classList.add('fading-out');

            setTimeout(() => {
              // 恢复原始内容
              iconEl.textContent = originalIcon;
              textEl.textContent = originalText;
              shareButton.classList.remove('copied');

              // 淡入
              shareButton.classList.remove('fading-out');
              shareButton.classList.add('fading-in');

              setTimeout(() => {
                shareButton.classList.remove('fading-in');
              }, 500);
            }, 200);
          }, 2000);

          showToast('链接已复制到剪贴板', 'success');
        } catch (err) {
          console.error('复制失败:', err);
          showToast('复制失败，请手动复制', 'error');
        }
      });
    });

    console.log(`[Share] Initialized ${shareButtons.length} share buttons`);
  }

  // Toast提示
  function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.share-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `share-toast share-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('share-toast--show');
    });

    setTimeout(() => {
      toast.classList.remove('share-toast--show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
})();
