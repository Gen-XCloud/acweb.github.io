// 🎨 主题切换动画 - 基于 clip-path 的涟漪效果
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const root = document.documentElement;
    const body = document.body;

    // 📦 获取本地存储的主题偏好
    const getStoredTheme = () => {
      try {
        return localStorage.getItem('theme');
      } catch (err) {
        return null;
      }
    };

    // 💾 存储主题偏好到本地存储
    const storeTheme = (value) => {
      try {
        localStorage.setItem('theme', value);
      } catch (err) {
        // 忽略存储错误
      }
    };

    // 🎭 应用主题（无动画版本，用于初始加载和系统主题变化）
    const applyThemeWithoutAnimation = (isDark) => {
      root.classList.toggle('dark-mode', isDark);
      body.classList.toggle('dark-mode', isDark);
      
      // 更新可访问性属性
      const isDarkMode = root.classList.contains('dark-mode');
      if (themeToggle) {
        themeToggle.setAttribute('aria-checked', isDarkMode ? 'true' : 'false');
      }
      if (mobileThemeToggle) {
        mobileThemeToggle.setAttribute('aria-checked', isDarkMode ? 'true' : 'false');
      }
    };

    // 🌟 创建涟漪动画效果
    const createRippleEffect = (event, isDark) => {
      // 获取点击位置坐标（相对于视口）
      const clickX = event.clientX;
      const clickY = event.clientY;
      
      // 计算覆盖整个屏幕所需的最小半径
      const radius = Math.max(
        Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)),
        500
      );
      
      // 创建覆盖层 - 作为主题过渡效果
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1'; // 降低z-index，使其位于背景之上，内容之下
      overlay.style.transition = 'clip-path 520ms ease-in-out';
      
      // 获取当前主题的背景样式作为初始状态
      const currentStyle = getComputedStyle(body);
      overlay.style.backgroundColor = currentStyle.backgroundColor;
      overlay.style.backgroundImage = currentStyle.backgroundImage;
      overlay.style.backgroundSize = currentStyle.backgroundSize;
      overlay.style.backgroundPosition = currentStyle.backgroundPosition;
      overlay.style.backgroundRepeat = currentStyle.backgroundRepeat;
      
      // 设置初始 clip-path：覆盖整个屏幕
      overlay.style.clipPath = `circle(${radius}px at ${clickX}px ${clickY}px)`;
      
      // 添加到 DOM
      document.body.appendChild(overlay);
      
      // 触发重排
      overlay.offsetHeight;
      
      // 使用 requestAnimationFrame 触发动画
      requestAnimationFrame(() => {
        // 切换主题（此时用户看不到，因为被覆盖层遮住）
        root.classList.toggle('dark-mode', isDark);
        body.classList.toggle('dark-mode', isDark);
        
        // 更新可访问性属性
        const isDarkMode = root.classList.contains('dark-mode');
        if (themeToggle) {
          themeToggle.setAttribute('aria-checked', isDarkMode ? 'true' : 'false');
        }
        if (mobileThemeToggle) {
          mobileThemeToggle.setAttribute('aria-checked', isDarkMode ? 'true' : 'false');
        }
        
        // 收缩覆盖层，显示新主题
        overlay.style.clipPath = `circle(0px at ${clickX}px ${clickY}px)`;
      });
      
      // 动画结束后移除覆盖层
      overlay.addEventListener('transitionend', () => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      });
    };

    // 🎯 主题切换处理函数
    const handleThemeToggle = (event) => {
      const nextIsDark = !root.classList.contains('dark-mode');
      createRippleEffect(event, nextIsDark);
      storeTheme(nextIsDark ? 'dark' : 'light');
    };

    // 🔄 系统主题变化处理
    const handleSchemeChange = (event) => {
      const saved = getStoredTheme();
      if (!saved) {
        applyThemeWithoutAnimation(event.matches);
      }
    };

    // 📱 初始加载主题
    const savedTheme = getStoredTheme();
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark) || root.classList.contains('dark-mode')) {
      applyThemeWithoutAnimation(true);
    } else if (savedTheme === 'light') {
      applyThemeWithoutAnimation(false);
    }

    // 🖥️ 桌面端主题切换按钮事件监听
    if (themeToggle) {
      themeToggle.addEventListener('click', handleThemeToggle);
    }

    // 📱 移动端主题切换按钮事件监听
    if (mobileThemeToggle) {
      mobileThemeToggle.addEventListener('click', handleThemeToggle);
    }

    // 🌓 系统主题变化监听
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSchemeChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleSchemeChange);
      }
    }
  });
})();
