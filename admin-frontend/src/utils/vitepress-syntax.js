/**
 * VitePress 容器语法工具栏配置
 */

/**
 * 兼容不同模式的插入方法
 * @param {Vditor} vditor - Vditor 实例
 * @param {string} text - 要插入的文本
 */
const insertText = (vditor, text) => {
  try {
    // 检查是否有 insertValue 方法（sv/wysiwyg 模式）
    if (typeof vditor.insertValue === 'function') {
      vditor.insertValue(text, true)
      return
    }

    // IR 模式 - 使用 getValue 和 setValue
    const currentValue = vditor.getValue() || ''

    // 尝试获取光标位置
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)

      // 查找编辑区域
      const editorElement = document.querySelector('.vditor-ir__marker--pre') ||
                           document.querySelector('.vditor-ir') ||
                           document.querySelector('.vditor-sv')

      if (editorElement && editorElement.contains(range.commonAncestorContainer)) {
        // 在光标位置插入
        const textNode = document.createTextNode(text)
        range.deleteContents()
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)

        // 触发 input 事件
        editorElement.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }
    }

    // 兜底：追加到末尾
    vditor.setValue(currentValue + text)
  } catch (error) {
    console.error('插入文本失败:', error)
    // 最后的兜底方案
    const currentValue = vditor.getValue() || ''
    vditor.setValue(currentValue + text)
  }
}

export const vitePressToolbar = [
  {
    name: 'vp-info',
    tipPosition: 's',
    tip: '插入 Info 容器',
    className: 'vp-toolbar-btn',
    icon: '<svg viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 832c-212.1 0-384-171.9-384-384s171.9-384 384-384 384 171.9 384 384-171.9 384-384 384z"/><path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/></svg>',
    click: (vditor) => {
      insertText(vditor, '\n::: info\n这是一条信息\n:::\n')
    }
  },
  {
    name: 'vp-tip',
    tipPosition: 's',
    tip: '插入 Tip 容器',
    className: 'vp-toolbar-btn',
    icon: '<svg viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 832c-212.1 0-384-171.9-384-384s171.9-384 384-384 384 171.9 384 384-171.9 384-384 384z"/><path d="M512 760c-26.5 0-48-21.5-48-48V344c0-26.5 21.5-48 48-48s48 21.5 48 48v368c0 26.5-21.5 48-48 48z"/></svg>',
    click: (vditor) => {
      insertText(vditor, '\n::: tip\n这是一条提示\n:::\n')
    }
  },
  {
    name: 'vp-warning',
    tipPosition: 's',
    tip: '插入 Warning 容器',
    className: 'vp-toolbar-btn',
    icon: '<svg viewBox="0 0 1024 1024"><path d="M464 720a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm16-304v184c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V416c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8z"/><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 832c-212.1 0-384-171.9-384-384s171.9-384 384-384 384 171.9 384 384-171.9 384-384 384z"/></svg>',
    click: (vditor) => {
      insertText(vditor, '\n::: warning\n这是一条警告\n:::\n')
    }
  },
  {
    name: 'vp-danger',
    tipPosition: 's',
    tip: '插入 Danger 容器',
    className: 'vp-toolbar-btn',
    icon: '<svg viewBox="0 0 1024 1024"><path d="M685.248 104.704a32 32 0 0 1 27.264 15.296l320.384 523.776A32 32 0 0 1 1005.44 688H128.256a32 32 0 0 1-27.456-44.224L421.44 120a32 32 0 0 1 27.264-15.296h236.544zM512 576a32 32 0 1 0 0 64 32 32 0 0 0 0-64zm0-320a32 32 0 0 0-32 32v192a32 32 0 0 0 64 0V288a32 32 0 0 0-32-32z"/></svg>',
    click: (vditor) => {
      insertText(vditor, '\n::: danger\n这是一条危险提示\n:::\n')
    }
  },
  {
    name: 'vp-details',
    tipPosition: 's',
    tip: '插入折叠容器',
    className: 'vp-toolbar-btn',
    icon: '<svg viewBox="0 0 1024 1024"><path d="M120 64h784c22.1 0 40 17.9 40 40v816c0 22.1-17.9 40-40 40H120c-22.1 0-40-17.9-40-40V104c0-22.1 17.9-40 40-40z m664 224H240c-8.8 0-16-7.2-16-16v-48c0-8.8 7.2-16 16-16h544c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16z m0 256H240c-8.8 0-16-7.2-16-16v-48c0-8.8 7.2-16 16-16h544c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16z m0 256H240c-8.8 0-16-7.2-16-16v-48c0-8.8 7.2-16 16-16h544c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16z"/></svg>',
    click: (vditor) => {
      insertText(vditor, '\n::: details 点击展开\n隐藏内容\n:::\n')
    }
  },
  {
    name: 'wechat-unlock',
    tipPosition: 's',
    tip: '插入微信公众号解锁',
    className: 'vp-toolbar-btn',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 15v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width="1.5"/></svg>',
    click: (vditor) => {
      // 调用全局方法显示模态框
      if (typeof window.showWechatUnlockModal === 'function') {
        window.showWechatUnlockModal(vditor)
      } else {
        console.warn('WechatUnlockModal not initialized')
        // 兜底：直接插入默认模板
        insertText(vditor, '\n\n{{< wechat-unlock keyword="HugoTeek" code="0000" >}}\n\n')
      }
    }
  }
]
