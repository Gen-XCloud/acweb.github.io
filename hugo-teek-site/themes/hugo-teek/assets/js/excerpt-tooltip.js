/**
 * 文章卡片描述 Tooltip
 * 把完整描述填入tooltip元素
 */
(function() {
  'use strict';

  function init() {
    document.querySelectorAll('.card-excerpt-compact[data-full-desc]').forEach(excerpt => {
      const fullDesc = excerpt.getAttribute('data-full-desc');
      const tooltip = excerpt.nextElementSibling;

      if (tooltip && tooltip.classList.contains('excerpt-tooltip') && fullDesc) {
        tooltip.textContent = fullDesc;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
