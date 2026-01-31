/**
 * Markdown 编辑器封装（基于 Vditor）
 * 支持分屏预览、图片上传、VitePress 容器语法
 */

class MarkdownEditor {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.vditor = null;
    this.options = options;

    if (!this.container) {
      console.error('容器元素未找到');
      return;
    }

    // 设置 VitePress 渲染器（在 Vditor 加载前）
    this.setupVitePressRenderer();

    // 初始化编辑器
    this.init();
  }

  /**
   * 初始化 Vditor 编辑器
   */
  init() {
    const {
      value = '',
      uploadUrl = '',
      onChange = null,
      height = 600,
      mode = 'sv'  // sv = 分屏预览
    } = this.options;

    this.vditor = new Vditor(this.container, {
      height,
      mode,  // 'sv' | 'wysiwyg' | 'ir'
      placeholder: '开始写作...',
      theme: 'classic',
      icon: 'material',

      // 工具栏配置
      toolbar: [
        'headings',
        'bold',
        'italic',
        'strike',
        '|',
        'line',
        'quote',
        'list',
        'ordered-list',
        'check',
        'code',
        'inline-code',
        '|',
        'insert-after',
        'insert-before',
        'table',
        '|',
        'link',
        'upload',
        '|',
        'undo',
        'redo',
        '|',
        {
          name: 'vitepress-tip',
          tipPosition: 's',
          tip: '插入提示框',
          className: 'vditor-tooltipped vditor-tooltipped--s',
          icon: '<svg><use xlink:href="#vditor-icon-info"></use></svg>',
          click: () => this.insertVitePressContainer('tip', '提示')
        },
        {
          name: 'vitepress-warning',
          tipPosition: 's',
          tip: '插入警告框',
          className: 'vditor-tooltipped vditor-tooltipped--s',
          icon: '<svg><use xlink:href="#vditor-icon-alert"></use></svg>',
          click: () => this.insertVitePressContainer('warning', '警告')
        },
        {
          name: 'vitepress-danger',
          tipPosition: 's',
          tip: '插入危险框',
          className: 'vditor-tooltipped vditor-tooltipped--s',
          icon: '<svg><use xlink:href="#vditor-icon-close"></use></svg>',
          click: () => this.insertVitePressContainer('danger', '危险')
        },
        '|',
        'preview',
        'fullscreen',
        {
          name: 'help',
          tipPosition: 's',
          tip: '帮助',
          className: 'vditor-tooltipped vditor-tooltipped--s',
          icon: '<svg><use xlink:href="#vditor-icon-question"></use></svg>',
          click: () => {
            window.open('https://ld246.com/guide/markdown', '_blank');
          }
        }
      ],

      // 缓存配置
      cache: {
        enable: false  // 由外部管理缓存
      },

      // 上传配置
      upload: uploadUrl ? {
        url: uploadUrl,
        fieldName: 'file[]',
        multiple: true,
        accept: 'image/*',
        max: 10 * 1024 * 1024,  // 10MB

        // 解析响应
        format: (files, responseText) => {
          try {
            const data = JSON.parse(responseText);

            // 适配 Vditor 格式
            if (data.code === 0 && data.data && data.data.succMap) {
              return JSON.stringify({
                msg: '',
                code: 0,
                data: {
                  errFiles: data.data.errFiles || [],
                  succMap: data.data.succMap
                }
              });
            }

            // 错误处理
            return JSON.stringify({
              msg: data.message || '上传失败',
              code: 1,
              data: {
                errFiles: files
              }
            });
          } catch (error) {
            console.error('上传响应解析失败:', error);
            return JSON.stringify({
              msg: '上传失败',
              code: 1,
              data: { errFiles: files }
            });
          }
        },

        // 上传前校验
        validate: (files) => {
          const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

          for (const file of files) {
            if (!validTypes.includes(file.type)) {
              alert(`文件 "${file.name}" 不是有效的图片格式`);
              return false;
            }

            if (file.size > 10 * 1024 * 1024) {
              alert(`文件 "${file.name}" 超过 10MB 限制`);
              return false;
            }
          }

          return true;
        }
      } : undefined,

      // 预览配置
      preview: {
        delay: 500,
        mode: 'both',  // both | editor | preview
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true,
          fixTermTypo: true,
          chinesePunct: true,
          codeBlockPreview: true,
          mathBlockPreview: true
        },
        math: {
          inlineDigit: false,
          engine: 'KaTeX'  // 数学公式支持
        },
        theme: {
          current: 'light',
          path: this.getVditorPath() + '/css/content-theme'
        },
        hljs: {
          style: 'github',
          lineNumber: true
        },
        actions: ['desktop', 'tablet', 'mobile', 'mp-wechat', 'zhihu']
      },

      // 计数器
      counter: {
        enable: true,
        type: 'markdown'
      },

      // 大纲
      outline: {
        enable: true,
        position: 'right'
      },

      // 提示
      hint: {
        emoji: {
          '+1': '👍',
          '-1': '👎',
          'heart': '❤️',
          'smile': '😄',
          'tada': '🎉'
        },
        emojiPath: 'https://cdn.jsdelivr.net/npm/vditor@3.10.4/dist/images/emoji'
      },

      // 触摸设备优化
      touch: {
        enable: true
      },

      // 调整大小
      resize: {
        enable: true,
        position: 'bottom'
      },

      // 编辑器类名
      classes: {
        preview: 'vitepress-content'
      },

      // 回调函数
      after: () => {
        // 设置初始值
        if (value) {
          this.vditor.setValue(value);
        }

        // 设置焦点
        this.vditor.focus();

        console.log('✅ Vditor 编辑器初始化完成');
      },

      input: (value) => {
        // 输入回调
        if (onChange && typeof onChange === 'function') {
          onChange(value);
        }

        // 自动保存草稿
        this.autoSave(value);
      },

      // 焦点回调
      focus: (value) => {
        // console.log('编辑器获得焦点');
      },

      // 失焦回调
      blur: (value) => {
        // console.log('编辑器失去焦点');
      }
    });
  }

  /**
   * 获取 Vditor 库路径
   */
  getVditorPath() {
    // 尝试从 script 标签获取
    const scripts = document.querySelectorAll('script[src*="vditor"]');
    if (scripts.length > 0) {
      const src = scripts[0].src;
      return src.substring(0, src.lastIndexOf('/'));
    }

    // 默认路径
    return '/admin/lib/vditor/dist';
  }

  /**
   * 插入 VitePress 容器
   * @param {string} type - 容器类型 (tip, warning, danger, info, details)
   * @param {string} title - 标题
   */
  insertVitePressContainer(type, title = '') {
    const titleLine = title ? ` ${title}` : '';
    const template = `\n::: ${type}${titleLine}\n在此输入内容\n:::\n`;
    this.vditor.insertValue(template);
  }

  /**
   * 自动保存草稿
   * @param {string} content - 内容
   */
  autoSave(content) {
    try {
      // 从 URL 获取文章路径
      const hash = window.location.hash;
      if (!hash.includes('posts/edit')) {
        return;
      }

      const params = new URLSearchParams(hash.split('?')[1]);
      const path = params.get('path');

      if (path && content) {
        const draftKey = `draft-${path}`;
        localStorage.setItem(draftKey, content);
        localStorage.setItem(`${draftKey}-time`, new Date().toISOString());

        // 可选：显示自动保存提示
        // console.log('草稿已自动保存:', new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  /**
   * 设置 VitePress 容器渲染器
   */
  setupVitePressRenderer() {
    // 等待 Vditor 加载后再扩展渲染器
    const setupInterval = setInterval(() => {
      if (window.Vditor && window.Vditor.preview) {
        clearInterval(setupInterval);

        // 保存原始渲染函数
        const originalRender = window.Vditor.preview.render || window.Vditor.preview.md2html;

        if (!originalRender) {
          console.warn('Vditor 预览渲染函数未找到');
          return;
        }

        // 扩展渲染函数
        const customRender = function(md, options) {
          // 先用原生渲染
          let html = originalRender.call(this, md, options);

          // 转换 VitePress 容器语法
          html = html.replace(
            /:::\s*(tip|warning|danger|info|details)(\s+([^\n]*))?\n([\s\S]*?):::/g,
            (match, type, titlePart, title, content) => {
              const containerTitle = (title || '').trim();
              const titleHtml = containerTitle
                ? `<p class="custom-block-title">${containerTitle}</p>`
                : '';

              // 使用 marked 或原生渲染处理内容
              const renderedContent = content.trim();

              return `
                <div class="custom-block custom-block-${type}">
                  ${titleHtml}
                  <p>${renderedContent}</p>
                </div>
              `;
            }
          );

          return html;
        };

        // 替换渲染函数
        if (window.Vditor.preview.md2html) {
          window.Vditor.preview.md2html = customRender;
        }
        if (window.Vditor.preview.render) {
          window.Vditor.preview.render = customRender;
        }

        console.log('✅ VitePress 渲染器已配置');
      }
    }, 100);

    // 超时后清除
    setTimeout(() => clearInterval(setupInterval), 5000);
  }

  /**
   * 获取编辑器内容
   * @returns {string} Markdown 内容
   */
  getValue() {
    return this.vditor ? this.vditor.getValue() : '';
  }

  /**
   * 设置编辑器内容
   * @param {string} content - Markdown 内容
   */
  setValue(content) {
    if (this.vditor) {
      this.vditor.setValue(content);
    }
  }

  /**
   * 获取 HTML 内容
   * @returns {string} HTML 内容
   */
  getHTML() {
    return this.vditor ? this.vditor.getHTML() : '';
  }

  /**
   * 插入内容
   * @param {string} value - 要插入的内容
   */
  insertValue(value) {
    if (this.vditor) {
      this.vditor.insertValue(value);
    }
  }

  /**
   * 获取焦点
   */
  focus() {
    if (this.vditor) {
      this.vditor.focus();
    }
  }

  /**
   * 失去焦点
   */
  blur() {
    if (this.vditor) {
      this.vditor.blur();
    }
  }

  /**
   * 禁用编辑器
   */
  disabled() {
    if (this.vditor) {
      this.vditor.disabled();
    }
  }

  /**
   * 启用编辑器
   */
  enable() {
    if (this.vditor) {
      this.vditor.enable();
    }
  }

  /**
   * 销毁编辑器
   */
  destroy() {
    if (this.vditor) {
      try {
        this.vditor.destroy();
        this.vditor = null;
        console.log('✅ Vditor 编辑器已销毁');
      } catch (error) {
        console.error('销毁编辑器失败:', error);
      }
    }
  }

  /**
   * 获取选中的文本
   * @returns {string} 选中的文本
   */
  getSelection() {
    return this.vditor ? this.vditor.getSelection() : '';
  }

  /**
   * 设置主题
   * @param {string} theme - 主题名称 (light|dark)
   */
  setTheme(theme) {
    if (this.vditor && this.vditor.setTheme) {
      this.vditor.setTheme(theme, theme);
    }
  }
}

// 导出（兼容 ES6 模块和全局变量）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarkdownEditor;
} else if (typeof window !== 'undefined') {
  window.MarkdownEditor = MarkdownEditor;
}
