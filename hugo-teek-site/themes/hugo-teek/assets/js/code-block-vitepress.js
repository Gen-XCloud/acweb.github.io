// ========================================
// VitePress Theme Teek 代码块功能
// 复刻 vitepress-theme-teek-1.5.1 的代码块交互
// v2.0 - 增强版：支持高亮行、键盘快捷键、性能优化
// ========================================

(function () {
  'use strict';

  // 基础配置选项
  const config = {
    enabled: true,
    overlay: true, // 是否显示遮罩层
    foldHeight: 40, // 顶部工具栏高度
    copiedDuration: 2000, // 复制成功提示持续时间（毫秒）
    highlightLines: true, // 是否支持高亮行
  };

  /**
   * 获取响应式的折叠配置（根据屏幕宽度动态调整）
   * 注意：高度需要加上工具栏高度(40px)，因为 offsetHeight 包含工具栏
   */
  function getResponsiveConfig() {
    const width = window.innerWidth;
    const toolbarHeight = 40; // 工具栏高度

    if (width <= 640) {
      // 小屏幕（手机竖屏）：12px × 1.5 = 18px/行
      return {
        collapseHeight: 216 + toolbarHeight,  // 12行触发折叠 (18px × 12 + 40px)
        overlayHeight: 144 + toolbarHeight,   // 折叠后显示8行 (18px × 8 + 40px)
      };
    } else if (width <= 960) {
      // 中等屏幕（平板/手机横屏）：13px × 1.6 = 20.8px/行
      return {
        collapseHeight: 250 + toolbarHeight,  // 12行触发折叠 (20.8px × 12 + 40px)
        overlayHeight: 166 + toolbarHeight,   // 折叠后显示8行 (20.8px × 8 + 40px)
      };
    } else {
      // 桌面端：14px × 1.7 = 23.8px/行
      return {
        collapseHeight: 286 + toolbarHeight,  // 12行触发折叠 (23.8px × 12 + 40px)
        overlayHeight: 190 + toolbarHeight,   // 折叠后显示8行 (23.8px × 8 + 40px)
      };
    }
  }

  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (!config.enabled) return;

    // 初始化代码块
    initCodeBlocks();
  }

  /**
   * 初始化所有代码块
   */
  function initCodeBlocks() {
    const codeBlocks = document.querySelectorAll(
      '.vp-doc div[class*="language-"], .highlight, div[class*="language-"]'
    );

    codeBlocks.forEach((block) => {
      // 跳过已处理的代码块
      if (block.hasAttribute('data-code-initialized')) return;

      // 跳过特殊的代码块
      const parentClass = block.parentElement?.className || '';
      if (parentClass.includes('details') || parentClass.includes('tk-vp-code')) {
        return;
      }

      // 标记为已处理
      block.setAttribute('data-code-initialized', 'true');

      // 提取语言信息
      extractLanguage(block);

      // 添加复制按钮（如果还没有）
      if (!block.querySelector('.copy-code-button')) {
        addCopyButton(block);
      }

      // 添加折叠功能
      addToggleFeature(block);
    });
  }

  /**
   * 提取并设置语言标签
   */
  function extractLanguage(block) {
    if (block.hasAttribute('data-lang')) return;

    let lang = '';

    // 方法1: 从 class 中提取语言（如 language-go, language-javascript）
    const classList = Array.from(block.classList);
    const langClass = classList.find(
      (cls) => cls.startsWith('language-') || cls.includes('highlight-')
    );

    if (langClass) {
      lang = langClass.replace(/^language-/, '').replace(/^highlight-/, '');
    }

    // 方法2: 从 Hugo Chroma 的 code 元素的 data-lang 属性获取
    if (!lang) {
      const codeElement = block.querySelector('code[data-lang]');
      if (codeElement) {
        lang = codeElement.getAttribute('data-lang');
      }
    }

    // 方法3: 从 code 元素的 class 获取（Hugo Chroma常见格式）
    if (!lang) {
      const codeElement = block.querySelector('code');
      if (codeElement) {
        const codeClasses = Array.from(codeElement.classList);
        const codeLangClass = codeClasses.find(cls => cls.startsWith('language-'));
        if (codeLangClass) {
          lang = codeLangClass.replace(/^language-/, '');
        }
      }
    }

    // 方法4: 从 pre 元素的 class 获取
    if (!lang) {
      const preElement = block.querySelector('pre');
      if (preElement) {
        const preClasses = Array.from(preElement.classList);
        const preLangClass = preClasses.find(cls => cls.startsWith('language-'));
        if (preLangClass) {
          lang = preLangClass.replace(/^language-/, '');
        }
      }
    }

    // 方法5: 尝试从 markdown 的 fence info 获取（如果有注释）
    if (!lang) {
      const comment = block.querySelector('comment, .lang-comment');
      if (comment) {
        lang = comment.textContent.trim();
      }
    }

    // 方法6: 从 Hugo 生成的 div class 中提取（如 highlight-go）
    if (!lang && block.classList.contains('highlight')) {
      for (const cls of classList) {
        // 匹配 highlight 之后跟语言名的模式
        const match = cls.match(/^highlight$/);
        if (!match) {
          // 检查是否有其他包含语言的class
          const possibleLang = cls.replace('highlight-', '');
          if (possibleLang && possibleLang !== cls && possibleLang.length < 15) {
            lang = possibleLang;
            break;
          }
        }
      }
    }

    if (lang) {
      // 清理语言名称（移除可能的额外字符）
      lang = lang.trim().toLowerCase().split(' ')[0].split('-')[0];

      // 语言名称映射和美化
      const langMap = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        shell: 'bash',
        yml: 'yaml',
        md: 'markdown',
        golang: 'go',
        htm: 'html',
      };

      lang = langMap[lang] || lang;

      // 设置 data-lang 属性（CSS 会读取这个属性显示）
      block.setAttribute('data-lang', lang.toUpperCase());
    } else {
      // 如果无法识别语言，设置为通用标识
      block.setAttribute('data-lang', 'CODE');
    }
  }

  /**
   * 添加复制按钮
   */
  function addCopyButton(block) {
    const button = document.createElement('button');
    button.className = 'copy-code-button';
    button.type = 'button';
    button.setAttribute('aria-label', '复制代码');
    button.innerHTML = '<span>复制</span>';

    // 复制功能
    button.addEventListener('click', () => {
      const code = getCodeContent(block);
      copyToClipboard(code)
        .then(() => {
          button.classList.add('copied');
          button.setAttribute('aria-label', '已复制！');

          // 显示复制成功提示
          showCopyToast(block);

          // 恢复按钮状态
          setTimeout(() => {
            button.classList.remove('copied');
            button.setAttribute('aria-label', '复制代码');
          }, config.copiedDuration);
        })
        .catch((err) => {
          console.error('复制失败:', err);
          showCopyToast(block, false);
        });
    });

    block.appendChild(button);
  }

  /**
   * 显示复制提示
   */
  function showCopyToast(block, success = true) {
    // 移除已存在的提示
    const existingToast = block.querySelector('.copy-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // 创建新提示
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = success ? '✓ 已复制' : '✗ 复制失败';
    toast.style.cssText = `
      position: absolute;
      top: calc(var(--tk-code-block-fold-height) / 2);
      right: 80px;
      transform: translateY(-50%);
      padding: 6px 12px;
      background: ${success ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
      color: white;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    `;

    block.appendChild(toast);

    // 淡入动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // 1秒后淡出并移除
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 1000);
  }

  /**
   * 从元素中获取文本内容，排除行号元素
   * @param {Element} element - 要提取文本的元素
   * @returns {string} - 提取的纯文本（不含行号）
   */
  function getTextWithoutLineNumbers(element) {
    // 克隆节点以避免修改原始DOM
    const clone = element.cloneNode(true);

    // 移除所有行号元素（.lnt 和 .ln）
    const lineNumbers = clone.querySelectorAll('.lnt, .ln');
    lineNumbers.forEach(ln => ln.remove());

    // 返回纯文本
    return clone.innerText || clone.textContent || '';
  }

  /**
   * 获取代码内容（排除行号）
   */
  function getCodeContent(block) {
    // 处理 Hugo Chroma 的行号表格结构
    const codeTable = block.querySelector('.lntable');
    if (codeTable) {
      // 表格结构：第一个 td 是行号，第二个 td 是代码
      const codeCells = codeTable.querySelectorAll('.lntd');
      if (codeCells.length >= 2) {
        // 获取第二个 td（代码列）- 只从这里提取
        const codeCell = codeCells[1];
        const codeElement = codeCell.querySelector('code');
        if (codeElement) {
          // 方案1: 尝试从 .cl 元素中提取（每个.cl代表一行代码）
          const clElements = codeElement.querySelectorAll(':scope > .cl');
          if (clElements.length > 0) {
            // 使用辅助函数排除行号元素
            const lines = Array.from(clElements).map(cl => {
              return getTextWithoutLineNumbers(cl);
            });
            // 去重：如果连续两行完全相同，可能是重复bug
            const dedupedLines = [];
            for (let i = 0; i < lines.length; i++) {
              // 简单去重：避免连续重复行（但保留代码中本身就有的重复）
              if (i === 0 || lines[i] !== lines[i-1] || dedupedLines.length === 0) {
                dedupedLines.push(lines[i]);
              }
            }
            return dedupedLines.join('\n');
          }

          // 方案2: 如果没有.cl，尝试直接从pre获取
          const preElement = codeCell.querySelector('pre');
          if (preElement) {
            // 使用辅助函数排除行号
            return getTextWithoutLineNumbers(preElement);
          }

          // 方案3: 回退到code元素
          return getTextWithoutLineNumbers(codeElement);
        }
        // 最后回退：直接从td获取文本
        return getTextWithoutLineNumbers(codeCell);
      }
    }

    // 处理普通代码块（没有行号表格） - 这是最常用的情况
    const pre = block.querySelector('pre');
    if (!pre) return '';

    const code = pre.querySelector('code');
    if (!code) return getTextWithoutLineNumbers(pre);

    // 提取 .cl 元素的文本（使用:scope确保只选直接子元素）
    const clElements = code.querySelectorAll(':scope > .cl');
    if (clElements.length > 0) {
      return Array.from(clElements)
        .map(cl => getTextWithoutLineNumbers(cl))
        .join('\n');
    }

    return getTextWithoutLineNumbers(code);
  }

  /**
   * 复制到剪贴板
   */
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        textarea.remove();
        successful ? resolve() : reject(new Error('复制失败'));
      } catch (err) {
        textarea.remove();
        reject(err);
      }
    });
  }

  /**
   * 添加折叠/展开功能（批量读写分离优化 + localStorage状态持久化）
   */
  function addToggleFeature(block) {
    // 如果已经有箭头，跳过
    if (block.querySelector('.code-arrow')) return;

    // 🆕 生成代码块唯一ID（基于DOM位置）
    if (!block.dataset.blockId) {
      block.dataset.blockId = `code-block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    const blockId = block.dataset.blockId;

    // 预先创建箭头和遮罩层元素（减少DOM操作）
    const arrow = document.createElement('div');
    arrow.className = 'code-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    `;

    const overlay = config.overlay ? createOverlay(() => arrow.click()) : null;

    // 批量读取阶段（第一个 rAF）
    requestAnimationFrame(() => {
      const responsiveConfig = getResponsiveConfig();
      const { collapseHeight } = responsiveConfig;
      const originalHeight = block.offsetHeight;
      const needsCollapse = collapseHeight && originalHeight > collapseHeight;

      // 批量写入阶段（第二个 rAF）
      requestAnimationFrame(() => {
        if (needsCollapse) {
          // 🆕 添加 .initializing 类，禁用初始动画
          block.classList.add('initializing');

          // 添加遮罩层
          if (overlay) {
            block.appendChild(overlay);
          }

          // 🆕 修改：传入blockId以支持localStorage
          setupToggle(arrow, block, originalHeight, blockId);

          // 添加箭头
          block.appendChild(arrow);

          // 🆕 下一帧移除 .initializing 类，恢复动画
          requestAnimationFrame(() => {
            block.classList.remove('initializing');
          });
        } else {
          // 不需要折叠功能，清理预创建的元素
          arrow.remove();
          if (overlay) overlay.remove();
        }
      });
    });
  }

  /**
   * 创建遮罩层
   */
  function createOverlay(onClick) {
    const overlay = document.createElement('div');
    overlay.className = 'code-block-overlay';
    overlay.innerHTML = `
      <span>查看更多</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    `;
    overlay.addEventListener('click', onClick);
    return overlay;
  }

  /**
   * 设置折叠/展开功能（优化版：使用 max-height 提升性能 + 批量读写分离 + localStorage状态持久化）
   */
  function setupToggle(arrow, block, originalHeight, blockId) {
    // 获取响应式配置
    const responsiveConfig = getResponsiveConfig();
    const { collapseHeight, overlayHeight } = responsiveConfig;

    // 使用传入的 originalHeight（已在 addToggleFeature 中批量读取，避免重复触发 layout）
    // 使用 max-height 代替 height，减少重排开销
    block.style.maxHeight = `${originalHeight}px`;

    const overlay = block.querySelector('.code-block-overlay');
    const foldedHeight = config.overlay ? overlayHeight : config.foldHeight;

    // 🆕 读取保存的状态
    const savedState = localStorage.getItem(`code-fold-${blockId}`);

    // 切换函数（优化版：使用 max-height + requestAnimationFrame + localStorage）
    const toggle = () => {
      const isFolded = arrow.classList.contains('fold');

      // 立即切换箭头状态（避免延迟感）
      arrow.classList.toggle('fold');

      // 使用 requestAnimationFrame 确保浏览器在下一帧开始前应用样式变化
      requestAnimationFrame(() => {
        // 设置 max-height（性能优于 height，减少重排）
        block.style.maxHeight = isFolded
          ? `${originalHeight}px`     // 展开
          : `${foldedHeight}px`;       // 折叠

        // 切换遮罩层可见性（通过 class 控制 opacity 和 visibility）
        if (overlay) {
          overlay.classList.toggle('visible', !isFolded);
        }
      });

      // 🆕 保存状态到localStorage
      const newState = isFolded ? 'expanded' : 'folded';
      localStorage.setItem(`code-fold-${blockId}`, newState);
    };

    // 绑定点击事件
    arrow.addEventListener('click', toggle);

    // 🆕 修改：根据localStorage状态决定初始状态
    const shouldCollapse = originalHeight > collapseHeight;

    if (shouldCollapse) {
      // 默认折叠，除非用户之前展开过
      const shouldFold = savedState !== 'expanded';

      if (shouldFold) {
        // 直接应用折叠状态，无动画
        block.style.maxHeight = `${foldedHeight}px`;
        arrow.classList.add('fold');
        if (overlay) {
          overlay.classList.add('visible');
        }
      }
      // 如果savedState === 'expanded'，保持展开状态，无需额外操作
    }
  }

  /**
   * 性能优化：使用 Intersection Observer 延迟初始化代码块
   */
  function lazyInitCodeBlocks() {
    const codeBlocks = document.querySelectorAll(
      '.vp-doc div[class*="language-"], .highlight, div[class*="language-"]'
    );

    if (!('IntersectionObserver' in window)) {
      // 不支持 IntersectionObserver，直接初始化
      codeBlocks.forEach(block => initSingleBlock(block));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const block = entry.target;
            if (!block.hasAttribute('data-code-initialized')) {
              initSingleBlock(block);
            }
            observer.unobserve(block);
          }
        });
      },
      { rootMargin: '100px' } // 提前 100px 开始加载
    );

    codeBlocks.forEach((block) => observer.observe(block));
  }

  /**
   * 初始化单个代码块
   */
  function initSingleBlock(block) {
    // 跳过已处理的代码块
    if (block.hasAttribute('data-code-initialized')) return;

    // 跳过特殊的代码块
    const parentClass = block.parentElement?.className || '';
    if (parentClass.includes('details') || parentClass.includes('tk-vp-code')) {
      return;
    }

    // 标记为已处理
    block.setAttribute('data-code-initialized', 'true');

    // 提取语言信息
    extractLanguage(block);

    // 添加复制按钮（如果还没有）
    if (!block.querySelector('.copy-code-button')) {
      addCopyButton(block);
    }

    // 添加折叠功能
    addToggleFeature(block);
  }

  /**
   * 键盘快捷键支持
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + C: 复制焦点代码块
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        const activeCodeBlock = document.activeElement.closest(
          '.vp-doc div[class*="language-"], .highlight, div[class*="language-"]'
        );
        if (activeCodeBlock) {
          e.preventDefault();
          const copyButton = activeCodeBlock.querySelector('.copy-code-button');
          if (copyButton) {
            copyButton.click();
          }
        }
      }

      // Ctrl/Cmd + Shift + E: 展开/折叠焦点代码块
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        const activeCodeBlock = document.activeElement.closest(
          '.vp-doc div[class*="language-"], .highlight, div[class*="language-"]'
        );
        if (activeCodeBlock) {
          e.preventDefault();
          const arrow = activeCodeBlock.querySelector('.code-arrow');
          if (arrow) {
            arrow.click();
          }
        }
      }
    });
  }

  /**
   * 增强初始化函数
   */
  function initEnhanced() {
    if (!config.enabled) return;

    // 使用懒加载优化性能
    lazyInitCodeBlocks();

    // 设置键盘快捷键
    setupKeyboardShortcuts();

    // 监听动态添加的代码块（如通过 AJAX 加载）
    if ('MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const codeBlocks = node.querySelectorAll?.(
                '.vp-doc div[class*="language-"], .highlight, div[class*="language-"]'
              );
              codeBlocks?.forEach(block => initSingleBlock(block));
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  // 导出初始化函数供外部使用
  window.initCodeBlocksVitePress = init;
  window.initCodeBlocksVitePressEnhanced = initEnhanced;
})();
