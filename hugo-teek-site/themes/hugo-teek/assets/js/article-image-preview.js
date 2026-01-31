(function () {
  const selector = '#VPContent';

  const buildOverlay = urls => {
    const overlay = document.createElement('div');
    overlay.className = 'tk-image-viewer';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tk-image-viewer__close';
    closeBtn.textContent = '×';
    overlay.appendChild(closeBtn);

    const img = document.createElement('img');
    img.className = 'tk-image-viewer__img';
    overlay.appendChild(img);

    const prevBtn = document.createElement('button');
    prevBtn.className = 'tk-image-viewer__nav tk-image-viewer__nav--prev';
    prevBtn.textContent = '<';
    overlay.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'tk-image-viewer__nav tk-image-viewer__nav--next';
    nextBtn.textContent = '>';
    overlay.appendChild(nextBtn);

    document.body.appendChild(overlay);

    let index = 0;

    const render = () => {
      img.src = urls[index];
    };

    const destroy = () => {
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
    };

    const onPrev = () => {
      index = (index - 1 + urls.length) % urls.length;
      render();
    };

    const onNext = () => {
      index = (index + 1) % urls.length;
      render();
    };

    const onKeyDown = evt => {
      if (evt.key === 'Escape') return destroy();
      if (evt.key === 'ArrowLeft') return onPrev();
      if (evt.key === 'ArrowRight') return onNext();
    };

    closeBtn.addEventListener('click', destroy);
    overlay.addEventListener('click', evt => {
      if (evt.target === overlay) destroy();
    });
    prevBtn.addEventListener('click', evt => {
      evt.stopPropagation();
      onPrev();
    });
    nextBtn.addEventListener('click', evt => {
      evt.stopPropagation();
      onNext();
    });
    document.addEventListener('keydown', onKeyDown);

    render();
    return { destroy, render, setIndex: i => { index = i; render(); } };
  };

  const onClick = evt => {
    const target = evt.target;
    if (!target || target.tagName.toLowerCase() !== 'img') return;
    if (target.classList.contains('no-preview')) return;

    const container = target.closest('.content-container') || document;
    const images = Array.from(container.querySelectorAll('img')).filter(img => !img.classList.contains('no-preview'));
    const urls = images.map(img => img.src);
    const idx = images.indexOf(target);
    if (idx === -1) return;

    const viewer = buildOverlay(urls);
    viewer.setIndex(idx);
  };

  const init = () => {
    const root = document.querySelector(selector);
    if (root) root.addEventListener('click', onClick);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
