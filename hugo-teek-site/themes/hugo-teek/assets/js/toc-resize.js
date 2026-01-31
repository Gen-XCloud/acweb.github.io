/**
 * TOC Resize Functionality
 * 目录宽度拖拽调整功能
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'toc-width';
  const DEFAULT_WIDTH = 256;
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 500;

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;
  let handle = null;
  let aside = null;

  /**
   * 初始化
   */
  function init() {
    // 只在文档页面初始化
    if (!document.querySelector('.VPDoc')) {
      return;
    }

    aside = document.querySelector('.VPDoc .aside');
    if (!aside) {
      return;
    }

    // 创建拖拽手柄
    createHandle();

    // 恢复保存的宽度
    restoreSavedWidth();

    // 绑定事件
    bindEvents();
  }

  /**
   * 创建拖拽手柄元素
   */
  function createHandle() {
    handle = document.createElement('div');
    handle.className = 'toc-resize-handle';
    handle.setAttribute('aria-label', '拖拽调整目录宽度');

    const asideContainer = aside.querySelector('.aside-container');
    if (asideContainer) {
      asideContainer.appendChild(handle);
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    if (!handle) return;

    handle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // 防止拖拽时选中文本
    handle.addEventListener('selectstart', function(e) {
      e.preventDefault();
    });
  }

  /**
   * 鼠标按下
   */
  function handleMouseDown(e) {
    isDragging = true;
    startX = e.clientX;
    startWidth = aside.offsetWidth;

    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    e.preventDefault();
  }

  /**
   * 鼠标移动
   */
  function handleMouseMove(e) {
    if (!isDragging) return;

    // 计算新宽度（向左拖动增大，向右拖动减小）
    const deltaX = e.clientX - startX;
    let newWidth = startWidth - deltaX;

    // 限制宽度范围
    newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));

    // 应用新宽度
    setTocWidth(newWidth);

    e.preventDefault();
  }

  /**
   * 鼠标松开
   */
  function handleMouseUp() {
    if (!isDragging) return;

    isDragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // 保存宽度到 localStorage
    const currentWidth = aside.offsetWidth;
    localStorage.setItem(STORAGE_KEY, currentWidth);
  }

  /**
   * 设置 TOC 宽度
   */
  function setTocWidth(width) {
    document.documentElement.style.setProperty('--toc-width', width + 'px');
  }

  /**
   * 恢复保存的宽度
   */
  function restoreSavedWidth() {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setTocWidth(width);
      }
    }
  }

  // 导出到全局，供Swup调用
  window.initTocResize = function() {
    init();
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
