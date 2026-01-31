(function () {
  const selectors = '.tk-demo';

  const renderDemo = demo => {
    const preview = demo.querySelector('.tk-demo__preview');
    const code = demo.querySelector('pre code');
    if (!preview || !code) return;

    const effect = preview.dataset.effect;
    const source = code.textContent || '';

    if (effect) {
      preview.innerHTML = `<iframe class="tk-demo__frame" src="${effect}" loading="lazy"></iframe>`;
      return;
    }

    // Render static HTML by default
    const container = document.createElement('div');
    container.className = 'tk-demo__rendered';
    container.innerHTML = source;
    preview.innerHTML = '';
    preview.appendChild(container);
  };

  const init = () => {
    document.querySelectorAll(selectors).forEach(renderDemo);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
