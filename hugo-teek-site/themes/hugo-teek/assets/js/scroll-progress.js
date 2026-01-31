(function () {
  if (typeof document === 'undefined') {
    return;
  }

  var bar = document.querySelector('[data-scroll-progress]');
  if (!bar) {
    return;
  }

  var inner = bar.querySelector('.scroll-progress-bar__inner');
  if (!inner) {
    return;
  }

  var ticking = false;
  var cachedScrollHeight = 0;
  var cachedClientHeight = 0;
  var cacheValid = false;
  var lastCacheUpdate = 0;
  var CACHE_DURATION = 1000; // 1秒内不重新计算高度（减少频繁更新）

  function clamp(value) {
    if (value < 0) {
      return 0;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  // 缓存文档高度，避免频繁读取（性能优化）
  function updateCache(force) {
    var now = Date.now();

    // 除非强制更新，否则 1 秒内不重新计算
    if (!force && cacheValid && (now - lastCacheUpdate) < CACHE_DURATION) {
      return;
    }

    var doc = document.documentElement;
    var body = document.body;
    cachedScrollHeight = Math.max(doc.scrollHeight, body.scrollHeight);
    cachedClientHeight = window.innerHeight || doc.clientHeight;
    cacheValid = true;
    lastCacheUpdate = now;
  }

  function computeProgress() {
    // 只读取滚动位置（开销最小）
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;

    // 使用缓存的高度值
    updateCache(false);

    var diff = cachedScrollHeight - cachedClientHeight;

    if (diff <= 0) {
      return 0;
    }

    return clamp(scrollTop / diff);
  }

  function render() {
    ticking = false;
    var progress = computeProgress();
    inner.style.transform = 'scaleX(' + progress + ')';
  }

  function requestRender() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  function onResize() {
    updateCache(true); // 强制更新缓存
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('readystatechange', requestRender);

  // 初始化时更新缓存（强制）
  updateCache(true);
  render();
})();
