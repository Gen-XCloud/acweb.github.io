// Code block copy button and auto-collapse
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('pre code').forEach(function(codeBlock) {
      const pre = codeBlock.parentElement;
      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = '复制';

      copyBtn.addEventListener('click', function() {
        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code).then(function() {
          copyBtn.textContent = '已复制';
          setTimeout(function() {
            copyBtn.textContent = '复制';
          }, 2000);
        });
      });

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyBtn);

      // Auto-collapse tall code blocks
      if (pre.offsetHeight > 700) {
        const originalHeight = pre.offsetHeight;
        pre.classList.add('code-collapsed');
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-code-btn';
        expandBtn.textContent = '展开';

        expandBtn.addEventListener('click', function() {
          const isCollapsed = pre.classList.contains('code-collapsed');

          if (isCollapsed) {
            // Expanding: 平滑展开
            pre.style.maxHeight = originalHeight + 'px';
            pre.classList.remove('code-collapsed');
            expandBtn.textContent = '折叠';
          } else {
            // Collapsing: 平滑折叠
            // 先设置当前高度，确保有过渡起点
            pre.style.maxHeight = pre.scrollHeight + 'px';
            // 强制重绘
            pre.offsetHeight;
            // 然后过渡到折叠状态
            requestAnimationFrame(() => {
              pre.classList.add('code-collapsed');
              pre.style.maxHeight = '400px';
            });
            expandBtn.textContent = '展开';
          }
        });

        wrapper.appendChild(expandBtn);
      }
    });
  });
})();
