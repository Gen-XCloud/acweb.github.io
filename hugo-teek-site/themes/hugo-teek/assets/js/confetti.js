(function () {
  if (typeof document === 'undefined') {
    return;
  }

  var triggers = document.querySelectorAll('[data-confetti]');
  if (!triggers.length) {
    return;
  }

  var scriptLoaded = null;

  function loadConfetti() {
    if (!scriptLoaded) {
      scriptLoaded = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return scriptLoaded;
  }

  function parseNumber(value, fallback) {
    var num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  }

  function launchConfetti(el) {
    if (typeof window.confetti !== 'function') {
      return;
    }

    var duration = parseNumber(el.getAttribute('data-confetti-duration'), 15000);
    var initialCount = parseInt(el.getAttribute('data-confetti-initial'), 10);
    if (isNaN(initialCount) || initialCount <= 0) {
      initialCount = 100;
    }

    var colorsAttr = el.getAttribute('data-confetti-colors');
    var colors = colorsAttr ? colorsAttr.split(',').map(function (color) {
      return color.trim();
    }).filter(Boolean) : ['#ffffff'];

    var animationEnd = Date.now() + duration;
    var skew = 1;

    (function frame() {
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return;
      }

      var ticks = Math.max(200, 500 * (timeLeft / duration));
      skew = Math.max(0.8, skew - 0.001);

      window.confetti({
        particleCount: 1,
        startVelocity: 0,
        ticks: ticks,
        origin: {
          x: Math.random(),
          y: Math.random() * skew - 0.2
        },
        colors: colors,
        shapes: ['circle'],
        gravity: parseNumber(el.getAttribute('data-confetti-gravity'), Math.random() * 0.2 + 0.4),
        scalar: Math.random() * 0.6 + 0.4,
        drift: Math.random() * 0.8 - 0.4
      });

      requestAnimationFrame(frame);
    })();

    window.confetti({
      particleCount: initialCount,
      spread: 170,
      colors: colors,
      origin: { y: 0.6 }
    });
  }

  loadConfetti().then(function () {
    triggers.forEach(function (el) {
      if (el.getAttribute('data-confetti-fired') === 'true') {
        return;
      }

      el.setAttribute('data-confetti-fired', 'true');
      launchConfetti(el);
    });
  }).catch(function (err) {
    console.error('[Teek Confetti] Failed to load canvas-confetti:', err);
  });
})();
