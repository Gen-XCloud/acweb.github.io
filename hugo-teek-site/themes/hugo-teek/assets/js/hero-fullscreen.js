// Hero Fullscreen Screensaver
class HeroFullscreen {
  constructor() {
    this.heroSection = document.querySelector('.hero-section-fullscreen');
    this.isFullscreen = false;

    if (!this.heroSection) {
      return;
    }

    this.init();
  }

  init() {
    // 监听F11键 - 仅在Hero区域可见时触发
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        // 检查是否在Hero区域
        if (this.isHeroVisible()) {
          e.preventDefault();
          this.toggleFullscreen();
        }
        // 如果已滚动到下方，不拦截F11，使用浏览器默认行为
      }
    });

    // 监听ESC键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isFullscreen) {
        this.exitFullscreen();
      }
    });

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.isFullscreen = false;
        document.body.classList.remove('hero-fullscreen-mode');
      }
    });
  }

  // 检测Hero区域是否在视口中可见
  isHeroVisible() {
    const heroHeight = this.heroSection.offsetHeight || window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;

    // 如果滚动距离小于Hero高度的50%，认为仍在Hero区域
    return scrollY < heroHeight * 0.5;
  }

  async toggleFullscreen() {
    if (!this.isFullscreen) {
      await this.enterFullscreen();
    } else {
      await this.exitFullscreen();
    }
  }

  async enterFullscreen() {
    try {
      if (this.heroSection.requestFullscreen) {
        await this.heroSection.requestFullscreen();
      } else if (this.heroSection.webkitRequestFullscreen) {
        await this.heroSection.webkitRequestFullscreen();
      } else if (this.heroSection.msRequestFullscreen) {
        await this.heroSection.msRequestFullscreen();
      }

      this.isFullscreen = true;
      document.body.classList.add('hero-fullscreen-mode');
      console.log('✅ 进入全屏屏保模式');
    } catch (error) {
      console.error('❌ 进入全屏失败:', error);
    }
  }

  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      this.isFullscreen = false;
      document.body.classList.remove('hero-fullscreen-mode');
      console.log('✅ 退出全屏屏保模式');
    } catch (error) {
      console.error('❌ 退出全屏失败:', error);
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new HeroFullscreen();
});
