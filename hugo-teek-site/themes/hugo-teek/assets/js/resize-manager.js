// 统一的 Resize 事件管理器
// 解决多个文件各自监听resize事件导致的性能问题
(function() {
  'use strict';

  const ResizeManager = {
    callbacks: [],
    rafId: null,
    lastWidth: window.innerWidth,
    lastHeight: window.innerHeight,

    // 注册回调函数
    // @param {Function} callback - 回调函数，接收(width, height)参数
    // @param {Number} priority - 优先级，数字越大越先执行
    register(callback, priority = 0) {
      this.callbacks.push({ callback, priority });
      // 按优先级排序（降序）
      this.callbacks.sort((a, b) => b.priority - a.priority);
      console.log(`[ResizeManager] Registered callback with priority ${priority}, total: ${this.callbacks.length}`);
    },

    // 执行所有回调
    execute() {
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;

      // 只在尺寸真正改变时执行
      if (currentWidth === this.lastWidth && currentHeight === this.lastHeight) {
        return;
      }

      this.lastWidth = currentWidth;
      this.lastHeight = currentHeight;

      console.log(`[ResizeManager] Executing ${this.callbacks.length} callbacks, size: ${currentWidth}x${currentHeight}`);

      // 批量执行所有回调
      this.callbacks.forEach(({ callback, priority }) => {
        try {
          callback(currentWidth, currentHeight);
        } catch (e) {
          console.error('[ResizeManager] Callback error:', e);
        }
      });
    },

    // 防抖处理resize事件
    handleResize() {
      // 取消之前的requestAnimationFrame
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      // 使用requestAnimationFrame批量处理
      this.rafId = requestAnimationFrame(() => {
        this.execute();
        this.rafId = null;
      });
    }
  };

  // 监听resize事件（passive优化）
  window.addEventListener('resize', () => {
    ResizeManager.handleResize();
  }, { passive: true });

  // 导出到全局
  window.ResizeManager = ResizeManager;

  console.log('[ResizeManager] Initialized');
})();
