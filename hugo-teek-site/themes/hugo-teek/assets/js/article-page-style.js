(function () {
  const storageKey = 'tk-page-style';
  const toggleSelector = '[data-page-style]';
  const supportedStyles = new Set(['card', 'segment']);
  const targetClasses = {
    card: 'tk-card',
    segment: 'tk-segment'
  };
  const removableClasses = ['tk-card', 'tk-card-nav', 'tk-segment', 'tk-segment-nav'];

  const detectCurrentStyle = body => {
    if (!body) return 'card';
    if (body.classList.contains('tk-segment') || body.classList.contains('tk-segment-nav')) {
      return 'segment';
    }
    return 'card';
  };

  const applyStyle = (body, style, skipAnimation = false) => {
    const target = targetClasses[style] || targetClasses.card;
    
    // 如果跳过动画（首次加载），直接切换
    if (skipAnimation) {
      removableClasses.forEach(cls => body.classList.remove(cls));
      body.classList.add(target);
      return;
    }
    
    // 添加过渡类，准备动画
    body.classList.add('tk-style-transitioning');
    
    // 使用 requestAnimationFrame 确保动画流畅
    requestAnimationFrame(() => {
      // 淡出当前内容
      body.style.opacity = '0.3';
      body.style.transform = 'translateY(10px)';
      
      // 等待淡出动画完成后切换类名
      setTimeout(() => {
        removableClasses.forEach(cls => body.classList.remove(cls));
        body.classList.add(target);
        
        // 立即准备淡入
        requestAnimationFrame(() => {
          // 淡入新内容
          body.style.opacity = '1';
          body.style.transform = 'translateY(0)';
          
          // 动画完成后移除过渡类
          setTimeout(() => {
            body.classList.remove('tk-style-transitioning');
          }, 500);
        });
      }, 300);
    });
  };

  const syncButtons = style => {
    document.querySelectorAll(toggleSelector).forEach(btn => {
      const isActive = btn.getAttribute('data-page-style') === style;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  const init = () => {
    const buttons = Array.from(document.querySelectorAll(toggleSelector));
    const body = document.body;

    if (!body || buttons.length === 0) return;

    const saved = localStorage.getItem(storageKey);
    let activeStyle = supportedStyles.has(saved) ? saved : detectCurrentStyle(body);

    applyStyle(body, activeStyle, true); // 首次加载跳过动画
    syncButtons(activeStyle);
    localStorage.setItem(storageKey, activeStyle);

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStyle = btn.getAttribute('data-page-style');
        if (!supportedStyles.has(nextStyle) || nextStyle === activeStyle) return;

        applyStyle(body, nextStyle);
        syncButtons(nextStyle);
        localStorage.setItem(storageKey, nextStyle);
        activeStyle = nextStyle;
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
