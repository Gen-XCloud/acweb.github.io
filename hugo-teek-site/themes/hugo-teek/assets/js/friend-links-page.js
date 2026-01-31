/**
 * 友链页面交互逻辑
 * 从 VitePress Teek 主题迁移
 */

(function () {
  'use strict';

  // ========================================
  // 星爆特效类
  // ========================================
  class StarBurst {
    constructor() {
      this.stars = [];
      this.container = null;
    }

    /**
     * 初始化星爆效果
     * @param {HTMLElement} containerEl - 星星容器元素
     */
    init(containerEl) {
      if (!containerEl) {
        console.warn('[StarBurst] Container element not found');
        return;
      }

      this.container = containerEl;
      this.stars = Array.from(containerEl.querySelectorAll('.star-item'));

      if (this.stars.length === 0) {
        console.warn('[StarBurst] No star elements found');
      }
    }

    /**
     * 鼠标进入头像时触发星爆效果
     * @param {MouseEvent} event - 鼠标事件
     */
    onAvatarEnter(event) {
      if (!this.container || this.stars.length === 0) return;

      const avatarRect = event.currentTarget.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      // 计算头像中心相对于容器的坐标
      const centerX = avatarRect.left + avatarRect.width / 2 - containerRect.left;
      const centerY = avatarRect.top + avatarRect.height / 2 - containerRect.top;

      // 6个星星的固定偏移量（爆炸扩散效果）
      const offsets = [
        { x: -50, y: -60 },
        { x: 20, y: -60 },
        { x: -70, y: 0 },
        { x: 60, y: -12 },
        { x: -40, y: 50 },
        { x: 30, y: 50 }
      ];

      // 设置每个星星的初始位置和目标位置
      this.stars.forEach((star, i) => {
        star.style.left = `${centerX}px`;
        star.style.top = `${centerY}px`;
        star.style.setProperty('--offset-x', `${offsets[i].x}px`);
        star.style.setProperty('--offset-y', `${offsets[i].y}px`);
      });

      // 触发动画
      this.container.classList.add('show');
    }

    /**
     * 鼠标离开头像时隐藏星星
     */
    onAvatarLeave() {
      if (!this.container) return;
      this.container.classList.remove('show');
    }
  }

  // ========================================
  // 鼠标跟随光圈类
  // ========================================
  class CursorLight {
    constructor(cardElement) {
      this.card = cardElement;
      this.light = null;
      this.x = 0;
      this.y = 0;
      this.targetX = 0;
      this.targetY = 0;
      this.size = 0;
      this.targetSize = 0;
      this.opacity = 0;
      this.color = this.getRandomColor();
      this.animating = false;
      this.rafId = null;
    }

    /**
     * 获取随机颜色（8种预设颜色）
     * @returns {string} rgba 颜色字符串
     */
    getRandomColor() {
      const presetColors = [
        "rgba(255, 99, 132, 0.8)",   // 红色调
        "rgba(54, 162, 235, 0.8)",    // 蓝色调
        "rgba(255, 159, 64, 0.8)",    // 橙色调
        "rgba(75, 192, 192, 0.8)",    // 青色调
        "rgba(153, 102, 255, 0.8)",   // 紫色调
        "rgba(255, 206, 86, 0.8)",    // 黄色调
        "rgba(231, 233, 237, 0.8)",   // 灰色调
        "rgba(0, 255, 255, 0.8)"      // 青绿色
      ];
      return presetColors[Math.floor(Math.random() * presetColors.length)];
    }

    /**
     * 平滑插值函数
     * @param {number} start - 起始值
     * @param {number} end - 目标值
     * @param {number} t - 插值因子 (0-1)
     * @returns {number} 插值结果
     */
    lerp(start, end, t) {
      return start + (end - start) * t;
    }

    /**
     * 获取渐变颜色
     * @param {string} lightColor - 光圈基础颜色
     * @returns {string} CSS渐变字符串
     */
    getGradientColor(lightColor) {
      const matches = lightColor.match(/\d+/g);
      if (!matches || matches.length < 3) return '';

      const [r, g, b] = matches.map(Number);
      return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    /**
     * 鼠标进入卡片时创建光圈
     */
    onMouseEnter() {
      // 创建光圈元素
      this.light = document.createElement('div');
      this.light.classList.add('light');
      this.light.style.position = 'absolute';
      this.light.style.borderRadius = '50%';
      this.light.style.pointerEvents = 'none';
      this.light.style.background = 'rgba(255,255,255,0)';
      this.card.appendChild(this.light);

      // 初始化位置为卡片中心
      const rect = this.card.getBoundingClientRect();
      this.x = this.card.offsetWidth / 2;
      this.y = this.card.offsetHeight / 2;
      this.size = Math.max(this.card.offsetWidth, this.card.offsetHeight) * 1.8;
      this.opacity = 0;
      this.targetX = this.x;
      this.targetY = this.y;

      // 启动动画循环
      this.animating = true;
      this.animate();
    }

    /**
     * 鼠标移动时更新目标位置
     * @param {MouseEvent} e - 鼠标事件
     */
    onMouseMove(e) {
      const rect = this.card.getBoundingClientRect();
      this.targetX = e.clientX - rect.left;
      this.targetY = e.clientY - rect.top;
    }

    /**
     * 鼠标离开卡片时移除光圈
     */
    onMouseLeave() {
      this.animating = false;

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      if (this.light) {
        this.light.style.opacity = '0';
        setTimeout(() => {
          if (this.light && this.light.parentNode) {
            this.light.parentNode.removeChild(this.light);
          }
          this.light = null;
        }, 300);
      }
    }

    /**
     * 动画渲染循环
     */
    animate() {
      if (!this.animating || !this.light) return;

      // 平滑插值更新位置
      this.x = this.lerp(this.x, this.targetX, 0.08);
      this.y = this.lerp(this.y, this.targetY, 0.08);

      // 平滑插值更新大小
      const maxDim = Math.max(this.card.offsetWidth, this.card.offsetHeight);
      this.targetSize = maxDim * 1.8;
      this.size = this.lerp(this.size, this.targetSize, 0.1);

      // 平滑插值更新不透明度
      this.opacity = this.lerp(this.opacity, 0.6, 0.1);

      // 生成径向渐变
      const gradientColor = this.getGradientColor(this.color);
      const gradient = `radial-gradient(circle at ${this.x}px ${this.y}px, ${gradientColor} 0%, rgba(255,255,255,0) 100%)`;

      // 更新光圈样式
      this.light.style.background = gradient;
      this.light.style.width = `${this.size}px`;
      this.light.style.height = `${this.size}px`;
      this.light.style.left = `${this.x - this.size / 2}px`;
      this.light.style.top = `${this.y - this.size / 2}px`;
      this.light.style.opacity = this.opacity.toString();

      // 继续动画
      this.rafId = requestAnimationFrame(() => this.animate());
    }
  }

  // ========================================
  // 工具函数
  // ========================================

  /**
   * 随机访问一个友链
   */
  function randomVisit() {
    const links = Array.from(document.querySelectorAll('.tags-group-icon'));
    if (links.length === 0) {
      console.warn('[RandomVisit] No friend links found');
      return;
    }

    const randomLink = links[Math.floor(Math.random() * links.length)];
    window.open(randomLink.href, '_blank');
  }

  /**
   * 复制友链申请格式
   */
  function copyMessageFormat() {
    const formatEl = document.getElementById('messageFormat');
    if (!formatEl) {
      console.error('[CopyFormat] Message format element not found');
      return;
    }

    const text = formatEl.textContent || formatEl.innerText;

    // 使用 Clipboard API 复制文本
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopySuccess();
      }).catch(err => {
        console.error('[CopyFormat] Failed to copy:', err);
        // 降级方案：使用 execCommand
        fallbackCopy(text);
      });
    } else {
      // 降级方案
      fallbackCopy(text);
    }
  }

  /**
   * 显示复制成功提示
   */
  function showCopySuccess() {
    const btn = document.querySelector('.copy-button-text');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = '已复制 !';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  }

  /**
   * 降级复制方案（使用 execCommand）
   * @param {string} text - 要复制的文本
   */
  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showCopySuccess();
      } else {
        console.error('[CopyFormat] Fallback copy failed');
      }
    } catch (err) {
      console.error('[CopyFormat] Fallback copy error:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }

  // ========================================
  // 初始化
  // ========================================

  /**
   * DOM 加载完成后初始化所有功能
   */
  function init() {
    // 初始化星爆效果
    const starsContainer = document.getElementById('starsContainer');
    if (starsContainer) {
      const starBurst = new StarBurst();
      starBurst.init(starsContainer);

      // 绑定头像事件
      const avatars = document.querySelectorAll('.tags-group-icon');
      avatars.forEach(avatar => {
        avatar.addEventListener('mouseenter', (e) => starBurst.onAvatarEnter(e));
        avatar.addEventListener('mouseleave', () => starBurst.onAvatarLeave());
      });
    }

    // 初始化卡片光圈效果
    const cards = document.querySelectorAll('.link-item-card[data-card]');
    cards.forEach(card => {
      const light = new CursorLight(card);

      card.addEventListener('mouseenter', () => light.onMouseEnter());
      card.addEventListener('mousemove', (e) => light.onMouseMove(e));
      card.addEventListener('mouseleave', () => light.onMouseLeave());
    });

    // 图片加载错误处理 - 使用默认占位图
    const allImages = document.querySelectorAll('.tags-group-icon img, .link-avatar img');
    allImages.forEach(img => {
      img.addEventListener('error', function() {
        console.warn('[FriendLinks] 图片加载失败:', this.src);
        // 使用简单的SVG占位图，避免再次请求失败
        this.src = 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">' +
          '<rect width="100" height="100" fill="#f3f4f6"/>' +
          '<text x="50" y="50" font-family="Arial" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">加载失败</text>' +
          '</svg>'
        );
        this.onerror = null; // 防止无限循环
      });
    });

    console.log('[FriendLinksPage] Initialized successfully');
  }

  // ========================================
  // 暴露全局 API
  // ========================================
  window.friendLinksPage = {
    randomVisit: randomVisit,
    copyMessageFormat: copyMessageFormat
  };

  // ========================================
  // 自动初始化
  // ========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM 已经加载完成
    init();
  }

})();
