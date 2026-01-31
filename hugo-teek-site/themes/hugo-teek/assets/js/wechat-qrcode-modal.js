/**
 * WeChat Official Account QR Code Modal
 * Click to show a modal with QR code for scanning
 */
(function () {
  'use strict';

  const buildModal = (qrcodeUrl, officialName) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'wechat-qrcode-modal';

    // Modal content
    const content = document.createElement('div');
    content.className = 'wechat-qrcode-modal__content';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'wechat-qrcode-modal__close';
    closeBtn.innerHTML = '×';
    closeBtn.title = '关闭';
    content.appendChild(closeBtn);

    // Title
    const title = document.createElement('h3');
    title.className = 'wechat-qrcode-modal__title';
    title.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-5.523 3.024-6.736C10.982 8.205 8.691 2.188 8.691 2.188zm-2.488 5.93a.74.74 0 1 1 0-1.48.74.74 0 0 1 0 1.48zm4.976 0a.74.74 0 1 1 0-1.48.74.74 0 0 1 0 1.48zM15.32 9.794c-.276 0-.543.027-.811.05.857 2.578-.157 5.523-3.024 6.736 2.154 1.879 4.445 7.896 4.445 7.896 4.8 0 8.691-3.288 8.691-7.342 0-2.212-1.17-4.203-3.002-5.55a.59.59 0 0 0-.213-.665l.39-1.48c.019-.07.048-.141.048-.213 0-.163-.13-.295-.29-.295a.326.326 0 0 1-.167.054l-1.903 1.114a.864.864 0 0 0-.717.098 10.16 10.16 0 0 1-2.837.403c-.276 0-.543-.027-.81-.05.856 2.578-.158 5.523-3.025 6.736z"/>
      </svg>
      <span>${officialName}</span>
    `;
    content.appendChild(title);

    // QR Code image
    const qrcodeWrapper = document.createElement('div');
    qrcodeWrapper.className = 'wechat-qrcode-modal__qrcode';

    const qrcodeImg = document.createElement('img');
    qrcodeImg.src = qrcodeUrl;
    qrcodeImg.alt = `${officialName}二维码`;
    qrcodeImg.className = 'no-preview'; // Prevent image viewer from handling this
    qrcodeWrapper.appendChild(qrcodeImg);
    content.appendChild(qrcodeWrapper);

    // Tip text
    const tip = document.createElement('p');
    tip.className = 'wechat-qrcode-modal__tip';
    tip.textContent = '使用微信扫一扫关注公众号';
    content.appendChild(tip);

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Add fade-in animation
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    // Event handlers
    const destroy = () => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = '';
      }, 300);
    };

    closeBtn.addEventListener('click', destroy);
    modal.addEventListener('click', (evt) => {
      if (evt.target === modal) destroy();
    });

    document.addEventListener('keydown', function onEscape(evt) {
      if (evt.key === 'Escape') {
        destroy();
        document.removeEventListener('keydown', onEscape);
      }
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  };

  const init = () => {
    // Find all wechat qrcode images
    const qrcodeImages = document.querySelectorAll('.wechat-qrcode-image');

    qrcodeImages.forEach((img) => {
      // Make it look clickable
      img.style.cursor = 'pointer';

      img.addEventListener('click', (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation(); // Stop other listeners immediately

        // Get official account name from card
        const card = img.closest('.wechat-official-card-wrapper');
        let officialName = 'hugo-teek 测试公众号';

        if (card) {
          const nameElement = card.querySelector('.wechat-official-name');
          if (nameElement) {
            officialName = nameElement.textContent.trim();
          }
        }

        buildModal(img.src, officialName);
      }, true); // Use capture phase to run before other listeners
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
