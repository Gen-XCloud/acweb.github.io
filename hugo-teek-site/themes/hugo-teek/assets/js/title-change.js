(function () {
  if (typeof document === 'undefined') {
    return;
  }

  var body = document.body;
  if (!body || body.getAttribute('data-title-change') !== 'true') {
    return;
  }

  var hiddenTitle = body.getAttribute('data-title-hidden') || document.title;
  var returnTitle = body.getAttribute('data-title-return') || document.title;
  var delayAttr = parseInt(body.getAttribute('data-title-delay'), 10);
  var resetDelay = isNaN(delayAttr) ? 2000 : delayAttr;
  var originalTitle = document.title;
  var timerId = null;

  function clearTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function scheduleRestore() {
    clearTimer();
    timerId = setTimeout(function () {
      document.title = originalTitle;
      timerId = null;
    }, resetDelay);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      originalTitle = document.title;
      document.title = hiddenTitle;
      clearTimer();
    } else {
      document.title = returnTitle;
      scheduleRestore();
    }
  });

  // Note: beforeunload 事件监听器已被移除，因为它已被弃用
  // 页面卸载时定时器会自动清理，无需手动处理
})();
