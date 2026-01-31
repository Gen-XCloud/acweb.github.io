// ========================================
// 光标彩色粒子特效
// Cursor Colorful Particle Effect
// ========================================
// 从 VitePress Theme Teek 移植
// 鼠标移动时生成彩色星星拖尾效果

(function() {
  'use strict';

  let fallDirection = 1;
  let x1 = 0;
  let y1 = 0;

  // 视口高度
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  // 配置参数
  const dist_to_draw = 50;        // 最小移动距离才生成粒子
  const delay = 1000;             // 粒子动画时长（毫秒）
  const fsize = ['1.1rem', '1.4rem', '.8rem', '1.7rem'];  // 随机字体大小

  // 彩色星星配置（VP原版6种颜色）
  const colors = [
    '#E23636',      // 红色
    '#001affff',    // 蓝色
    '#00ffeaff',    // 青色
    '#ff009dff',    // 粉色
    '#ff9595ff',    // 淡红色
    '#004370ff'     // 深蓝色
  ];

  // 工具函数
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const selRand = (arr) => arr[rand(0, arr.length - 1)];
  const distanceTo = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const shouldDraw = (x, y) => distanceTo(x1, y1, x, y) >= dist_to_draw;

  // 创建粒子容器
  const container = document.createElement('div');
  container.id = 'guangbiao-container';
  document.body.appendChild(container);

  // 添加星星粒子
  const addStar = (x, y) => {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.top = `${y + rand(-20, 20)}px`;
    star.style.left = `${x}px`;
    star.style.color = selRand(colors);
    star.style.fontSize = selRand(fsize);
    container.appendChild(star);

    const fs = 10 + 5 * parseFloat(getComputedStyle(star).fontSize);

    // 3D旋转消失动画
    star.animate(
      {
        transform: [
          `translate(${rand(-5, 5)}px, ${(y + fs > vh ? vh - y : fs) * fallDirection * 0.3}px)`,
          `translate(${rand(-20, 20)}px, ${(y + fs > vh ? vh - y : fs) * fallDirection}px) rotateX(${rand(1, 500)}deg) rotateY(${rand(1, 500)}deg)`
        ],
        opacity: [1, 0]
      },
      {
        duration: delay,
        fill: 'forwards'
      }
    );

    // 动画结束后移除元素
    setTimeout(() => star.remove(), delay);
  };

  // 鼠标移动事件监听
  window.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    if (shouldDraw(clientX, clientY)) {
      addStar(clientX, clientY);
      x1 = clientX;
      y1 = clientY;
    }
  });

})();
