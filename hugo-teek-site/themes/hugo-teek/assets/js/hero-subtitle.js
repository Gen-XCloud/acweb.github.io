(() => {
  const initTypedSubtitle = () => {
    const subtitleEl = document.querySelector('[data-hero-subtitle]');
    if (!subtitleEl) return;

    let items = [];
    try {
      const raw = subtitleEl.dataset.items || '[]';
      items = JSON.parse(raw);
    } catch (err) {
      console.warn('[Teek Hero]', 'Failed to parse hero subtitle items.', err);
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const caret = document.querySelector('[data-hero-caret]');
    const toNumber = (value, fallback) => {
      const parsed = parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const typeSpeed = toNumber(subtitleEl.dataset.typeSpeed, 90);
    const deleteSpeed = toNumber(subtitleEl.dataset.deleteSpeed, 45);
    const hold = toNumber(subtitleEl.dataset.hold, 1800);
    const nextDelay = toNumber(subtitleEl.dataset.nextDelay, 600);
    const shuffle = subtitleEl.dataset.shuffle === 'true';

    let queue = items.slice();
    if (shuffle) {
      queue = queue
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
    }

    let currentIndex = 0;
    let isDeleting = false;
    subtitleEl.textContent = '';

    if (caret) {
      caret.style.display = 'inline-block';
    }

    const getCurrent = () => queue[currentIndex % queue.length];

    const tick = () => {
      const current = getCurrent();
      const displayed = subtitleEl.textContent || '';

      if (!isDeleting && displayed.length < current.length) {
        subtitleEl.textContent = current.slice(0, displayed.length + 1);
        setTimeout(tick, typeSpeed);
        return;
      }

      if (isDeleting && displayed.length > 0) {
        subtitleEl.textContent = current.slice(0, displayed.length - 1);
        setTimeout(tick, deleteSpeed);
        return;
      }

      if (!isDeleting) {
        isDeleting = true;
        setTimeout(tick, hold);
        return;
      }

      isDeleting = false;
      currentIndex = (currentIndex + 1) % queue.length;
      setTimeout(tick, nextDelay);
    };

    setTimeout(tick, 400);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTypedSubtitle, { once: true });
  } else {
    initTypedSubtitle();
  }
})();
