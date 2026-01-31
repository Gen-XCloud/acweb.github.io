/**
 * Enhanced Image Viewer
 * Features: zoom, rotate, touch swipe, keyboard navigation
 */
(function () {
  'use strict';

  const buildOverlay = (urls, initialIndex = 0) => {
    // Viewer state
    let currentIndex = initialIndex;
    let scale = 1;
    let rotation = 0;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let translateX = 0;
    let translateY = 0;
    let lastTouchDistance = 0;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tk-image-viewer';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tk-image-viewer__close';
    closeBtn.innerHTML = '×';
    closeBtn.title = '关闭 (ESC)';
    overlay.appendChild(closeBtn);

    // Image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'tk-image-viewer__container';

    const img = document.createElement('img');
    img.className = 'tk-image-viewer__img';
    imgContainer.appendChild(img);
    overlay.appendChild(imgContainer);

    // Loading indicator
    const loader = document.createElement('div');
    loader.className = 'tk-image-viewer__loader';
    loader.innerHTML = '<div class="tk-image-viewer__spinner"></div>';
    overlay.appendChild(loader);

    // Navigation buttons (only show if multiple images)
    let prevBtn, nextBtn;
    if (urls.length > 1) {
      prevBtn = document.createElement('button');
      prevBtn.className = 'tk-image-viewer__nav tk-image-viewer__nav--prev';
      prevBtn.innerHTML = '‹';
      prevBtn.title = '上一张 (←)';
      overlay.appendChild(prevBtn);

      nextBtn = document.createElement('button');
      nextBtn.className = 'tk-image-viewer__nav tk-image-viewer__nav--next';
      nextBtn.innerHTML = '›';
      nextBtn.title = '下一张 (→)';
      overlay.appendChild(nextBtn);
    }

    // Image counter (only show if multiple images)
    let counter;
    if (urls.length > 1) {
      counter = document.createElement('div');
      counter.className = 'tk-image-viewer__counter';
      overlay.appendChild(counter);
    }

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'tk-image-viewer__toolbar';

    const createToolbarBtn = (icon, title) => {
      const btn = document.createElement('button');
      btn.className = 'tk-image-viewer__toolbar-btn';
      btn.innerHTML = icon;
      btn.title = title;
      return btn;
    };

    const zoomInBtn = createToolbarBtn('➕', '放大');
    const zoomOutBtn = createToolbarBtn('➖', '缩小');
    const rotateLeftBtn = createToolbarBtn('↺', '逆时针旋转');
    const rotateRightBtn = createToolbarBtn('↻', '顺时针旋转');
    const resetBtn = createToolbarBtn('⊙', '重置');

    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(zoomInBtn);
    toolbar.appendChild(rotateLeftBtn);
    toolbar.appendChild(rotateRightBtn);
    toolbar.appendChild(resetBtn);
    overlay.appendChild(toolbar);

    document.body.appendChild(overlay);

    // Helper functions
    const updateTransform = () => {
      img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotation}deg)`;
    };

    const resetTransform = () => {
      scale = 1;
      rotation = 0;
      translateX = 0;
      translateY = 0;
      updateTransform();
    };

    const loadImage = (index) => {
      loader.style.display = 'flex';
      img.style.opacity = '0';

      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = urls[index];
        img.style.opacity = '1';
        loader.style.display = 'none';
        resetTransform();
      };
      tempImg.onerror = () => {
        loader.style.display = 'none';
        img.style.opacity = '1';
      };
      tempImg.src = urls[index];

      if (counter) {
        counter.textContent = `${index + 1} / ${urls.length}`;
      }
    };

    const destroy = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };

    const onPrev = () => {
      currentIndex = (currentIndex - 1 + urls.length) % urls.length;
      loadImage(currentIndex);
    };

    const onNext = () => {
      currentIndex = (currentIndex + 1) % urls.length;
      loadImage(currentIndex);
    };

    const zoom = (delta) => {
      scale = Math.min(Math.max(0.5, scale + delta), 5);

      // If zooming out to 1 or below, reset position
      if (scale <= 1) {
        translateX = 0;
        translateY = 0;
      }

      updateTransform();
    };

    const rotate = (degrees) => {
      rotation = (rotation + degrees) % 360;
      updateTransform();
    };

    // Event handlers
    const onKeyDown = (evt) => {
      if (evt.key === 'Escape') return destroy();
      if (evt.key === 'ArrowLeft' && urls.length > 1) return onPrev();
      if (evt.key === 'ArrowRight' && urls.length > 1) return onNext();
    };

    const onWheel = (evt) => {
      evt.preventDefault();
      const delta = evt.deltaY > 0 ? -0.1 : 0.1;
      zoom(delta);
    };

    const onDoubleClick = (evt) => {
      if (evt.target === img) {
        if (scale === 1) {
          zoom(1); // Zoom to 2x
        } else {
          resetTransform();
        }
      }
    };

    // Mouse drag
    const onMouseDown = (evt) => {
      if (evt.target === img && scale > 1) {
        isDragging = true;
        startX = evt.clientX - translateX;
        startY = evt.clientY - translateY;
        img.style.cursor = 'grabbing';
      }
    };

    const onMouseMove = (evt) => {
      if (isDragging) {
        translateX = evt.clientX - startX;
        translateY = evt.clientY - startY;
        updateTransform();
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      img.style.cursor = scale > 1 ? 'grab' : 'default';
    };

    // Touch events
    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    let touchStartX = 0;
    let touchStartTime = 0;

    const onTouchStart = (evt) => {
      if (evt.touches.length === 2) {
        // Pinch zoom
        lastTouchDistance = getTouchDistance(evt.touches);
      } else if (evt.touches.length === 1) {
        touchStartX = evt.touches[0].clientX;
        touchStartTime = Date.now();

        if (scale > 1) {
          // Drag when zoomed
          isDragging = true;
          startX = evt.touches[0].clientX - translateX;
          startY = evt.touches[0].clientY - translateY;
        }
      }
    };

    const onTouchMove = (evt) => {
      if (evt.touches.length === 2) {
        // Pinch zoom
        evt.preventDefault();
        const distance = getTouchDistance(evt.touches);
        const delta = (distance - lastTouchDistance) * 0.01;
        zoom(delta);
        lastTouchDistance = distance;
      } else if (evt.touches.length === 1 && isDragging) {
        // Drag when zoomed
        evt.preventDefault();
        translateX = evt.touches[0].clientX - startX;
        translateY = evt.touches[0].clientY - startY;
        updateTransform();
      }
    };

    const onTouchEnd = (evt) => {
      if (evt.touches.length === 0) {
        if (isDragging) {
          isDragging = false;
        } else if (urls.length > 1) {
          // Swipe to navigate
          const touchEndX = evt.changedTouches[0].clientX;
          const touchEndTime = Date.now();
          const deltaX = touchEndX - touchStartX;
          const deltaTime = touchEndTime - touchStartTime;

          // Swipe detection (at least 50px movement in less than 300ms)
          if (Math.abs(deltaX) > 50 && deltaTime < 300) {
            if (deltaX > 0) {
              onPrev();
            } else {
              onNext();
            }
          }
        }
      }
    };

    // Bind events
    closeBtn.addEventListener('click', destroy);
    overlay.addEventListener('click', (evt) => {
      // Close when clicking overlay background or image container background
      if (evt.target === overlay || evt.target === imgContainer) destroy();
    });
    
    // Prevent image clicks from closing viewer but allow clicks outside image to close
    img.addEventListener('click', (evt) => {
      evt.stopPropagation();
    });

    if (prevBtn && nextBtn) {
      prevBtn.addEventListener('click', (evt) => {
        evt.stopPropagation();
        onPrev();
      });
      nextBtn.addEventListener('click', (evt) => {
        evt.stopPropagation();
        onNext();
      });
    }

    zoomInBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      zoom(0.5);
    });
    zoomOutBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      zoom(-0.5);
    });
    rotateLeftBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      rotate(-90);
    });
    rotateRightBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      rotate(90);
    });
    resetBtn.addEventListener('click', (evt) => {
      evt.stopPropagation();
      resetTransform();
    });

    imgContainer.addEventListener('wheel', onWheel, { passive: false });
    imgContainer.addEventListener('dblclick', onDoubleClick);
    imgContainer.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    imgContainer.addEventListener('touchstart', onTouchStart, { passive: false });
    imgContainer.addEventListener('touchmove', onTouchMove, { passive: false });
    imgContainer.addEventListener('touchend', onTouchEnd);

    document.addEventListener('keydown', onKeyDown);

    // Prevent body scroll when viewer is open
    document.body.style.overflow = 'hidden';

    // Load initial image
    loadImage(currentIndex);

    return { destroy };
  };

  // Check if image should be excluded from preview
  const shouldExcludeImage = (img) => {
    // Manual exclusion via class
    if (img.classList.contains('no-preview')) return true;

    // Exclude avatars and profile images
    if (img.classList.contains('blogger-avatar')) return true;
    if (img.classList.contains('avatar')) return true;
    if (img.classList.contains('mobile-avatar')) return true;

    // Exclude article card covers (homepage card thumbnails)
    if (img.closest('.article-card-compact')) return true;
    if (img.closest('.article-card')) return true;
    if (img.closest('.card-cover')) return true;
    if (img.closest('.card-cover-compact')) return true;

    // Exclude QR codes (appreciation and wechat official)
    if (img.closest('.appreciation-section')) return true;
    if (img.closest('.wechat-official-card-wrapper')) return true;
    if (img.closest('.wechat-qrcode-modal')) return true; // Exclude modal popup images
    if (img.classList.contains('wechat-qrcode-image')) return true;

    // Exclude widget card images (friend links, sponsors, etc.)
    if (img.closest('.tk-friend-avatar')) return true;

    // Exclude images in navigation/header
    if (img.closest('.VPNav')) return true;
    if (img.closest('.VPNavBar')) return true;
    if (img.closest('.mobile-nav-drawer')) return true;

    // Exclude images in sidebar cards (blogger card, etc.)
    if (img.closest('.blogger-card')) return true;

    // Exclude footer images (animals decoration, service badges)
    if (img.closest('.site-footer')) return true;
    if (img.classList.contains('animals-image')) return true;
    if (img.closest('.service-badge')) return true;
    if (img.closest('.footer-services')) return true;

    // Exclude SVG and very small images (likely icons)
    if (img.tagName.toLowerCase() === 'svg') return true;
    if (img.naturalWidth < 100 && img.naturalHeight < 100) return true;

    return false;
  };

  const onClick = (evt) => {
    let target = evt.target;

    // Check if clicked inside an existing image viewer
    if (target.closest('.tk-image-viewer')) return;

    // Check if clicked element is an image
    if (!target || target.tagName.toLowerCase() !== 'img') return;

    // Check exclusion rules
    if (shouldExcludeImage(target)) return;

    // Find all previewable images in the page
    // Priority: 1. Content container 2. Main content 3. Entire document
    let container = target.closest('.content-container')
                 || target.closest('#VPContent')
                 || target.closest('main')
                 || document;

    const images = Array.from(container.querySelectorAll('img'))
      .filter(img => !shouldExcludeImage(img));

    const urls = images.map(img => img.src || img.dataset.src);
    const idx = images.indexOf(target);

    if (idx === -1 || urls.length === 0) return;

    buildOverlay(urls, idx);
  };

  const init = () => {
    // Listen to clicks on the entire document
    document.addEventListener('click', onClick);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
