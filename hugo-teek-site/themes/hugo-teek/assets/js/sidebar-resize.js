// ========================================
// Simple Sidebar - Resize功能
// ========================================

(function() {
  'use strict';

  // ========================================
  // 配置常量
  // ========================================

  const STORAGE_KEY = 'simple-sidebar-width';
  const DEFAULT_WIDTH = 280;
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 500;

  // ========================================
  // 元素引用
  // ========================================

  const sidebar = document.querySelector('.VPSidebar');
  const handle = document.querySelector('.simple-sidebar__resize-handle');

  if (!sidebar || !handle) {
    console.log('[SidebarResize] sidebar或handle未找到，跳过初始化');
    return;
  }

  console.log('[SidebarResize] 初始化');

  // ========================================
  // 状态变量
  // ========================================

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  // ========================================
  // 核心函数：设置侧边栏宽度
  // ========================================

  function setSidebarWidth(width) {
    // 限制范围
    width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));

    // 使用CSS变量统一控制宽度
    document.documentElement.style.setProperty('--sidebar-width', width + 'px');

    return width;
  }

  // ========================================
  // 事件处理：鼠标按下
  // ========================================

  function handleMouseDown(e) {
    isDragging = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;

    // 添加拖拽状态
    handle.classList.add('is-dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    console.log('[SidebarResize] 开始拖拽', { startWidth, startX });
  }

  // ========================================
  // 事件处理：鼠标移动
  // ========================================

  function handleMouseMove(e) {
    if (!isDragging) return;

    // 计算新宽度
    const deltaX = e.clientX - startX;
    let newWidth = startWidth + deltaX;

    // 应用新宽度
    setSidebarWidth(newWidth);
  }

  // ========================================
  // 事件处理：鼠标松开
  // ========================================

  function handleMouseUp() {
    if (!isDragging) return;

    isDragging = false;

    // 移除拖拽状态
    handle.classList.remove('is-dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // 保存到localStorage
    const currentWidth = sidebar.offsetWidth;
    localStorage.setItem(STORAGE_KEY, currentWidth);

    console.log('[SidebarResize] 结束拖拽，保存宽度:', currentWidth);
  }

  // ========================================
  // 初始化：恢复保存的宽度
  // ========================================

  function restoreSavedWidth() {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setSidebarWidth(width);
        console.log('[SidebarResize] 恢复保存的宽度:', width);
      }
    }
  }

  // ========================================
  // 绑定事件
  // ========================================

  handle.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // 页面加载时恢复宽度
  restoreSavedWidth();

  console.log('[SidebarResize] 初始化完成');

})();
