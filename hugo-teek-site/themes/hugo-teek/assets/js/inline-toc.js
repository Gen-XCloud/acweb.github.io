// Inline TOC: 自动渲染 [[toc]] 和 [toc] 为文章目录
(function() {
  'use strict';

  function initInlineToc() {
    // 查找文章内容容器
    const articleContent = document.querySelector('.vp-doc, .tk-doc-content');
    if (!articleContent) return;

    // 查找所有可能的 TOC 标记
    const paragraphs = articleContent.querySelectorAll('p');
    let tocPlaceholders = [];

    paragraphs.forEach(p => {
      const text = p.textContent.trim();
      // 支持 [[toc]] 和 [toc] 两种语法
      if (text === '[[toc]]' || text === '[toc]') {
        tocPlaceholders.push(p);
      }
    });

    if (tocPlaceholders.length === 0) return;

    console.log(`[内嵌目录] 找到 ${tocPlaceholders.length} 个目录标记`);

    // 提取文章中的所有标题（h2, h3, h4）
    const headings = articleContent.querySelectorAll('h2, h3, h4');
    if (headings.length === 0) {
      console.log('[内嵌目录] 未找到标题，跳过渲染');
      return;
    }

    // 生成目录 HTML
    function generateTOC() {
      const tocItems = [];

      headings.forEach(heading => {
        const level = parseInt(heading.tagName.substring(1)); // h2 -> 2
        const text = heading.textContent.trim();
        const id = heading.id || createId(text);

        // 确保标题有 id（用于跳转）
        if (!heading.id) {
          heading.id = id;
        }

        tocItems.push({
          level: level,
          text: text,
          id: id
        });
      });

      // 构建 HTML
      let html = '<nav class="inline-toc" role="navigation" aria-label="文章目录">';
      html += '<div class="inline-toc-title">📋 目录</div>';
      html += '<ul class="inline-toc-list">';

      let currentLevel = 2;
      tocItems.forEach((item, index) => {
        const indent = (item.level - 2) * 16; // 每级缩进 16px

        html += `<li class="inline-toc-item inline-toc-level-${item.level}" style="padding-left: ${indent}px;">`;
        html += `<a href="#${item.id}" class="inline-toc-link">${item.text}</a>`;
        html += '</li>';
      });

      html += '</ul>';
      html += '</nav>';

      return html;
    }

    // 生成 ID（用于没有 id 的标题）
    function createId(text) {
      return text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // 生成目录
    const tocHTML = generateTOC();

    // 替换所有 TOC 标记
    tocPlaceholders.forEach(placeholder => {
      const tocElement = document.createElement('div');
      tocElement.innerHTML = tocHTML;
      placeholder.parentNode.replaceChild(tocElement.firstChild, placeholder);
      console.log('[内嵌目录] 已渲染目录');
    });

    // 添加平滑滚动
    document.querySelectorAll('.inline-toc-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vp-nav-height')) || 64;
          const offset = navHeight + 20;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // 更新 URL hash（但不跳转）
          history.replaceState(null, '', `#${targetId}`);
        }
      });
    });

    console.log('[内嵌目录] 初始化完成');
  }

  // 导出到全局，供 Swup 调用
  window.initInlineToc = initInlineToc;

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInlineToc);
  } else {
    initInlineToc();
  }
})();
