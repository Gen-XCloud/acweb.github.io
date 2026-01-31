<template>
  <div class="markdown-editor">
    <div id="vditor" ref="vditorRef"></div>
    <!-- 微信解锁模态框 -->
    <WechatUnlockModal ref="wechatModalRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import WechatUnlockModal from './WechatUnlockModal.vue'
import './styles/index.scss'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  uploadUrl: {
    type: String,
    default: '/api/v1/media/upload'
  }
})

const emit = defineEmits(['update:modelValue', 'fullscreen-change'])

const vditorRef = ref(null)
const wechatModalRef = ref(null)
let vditorInstance = null
let isReady = ref(false)
const isMobile = ref(false)
let fullscreenObserver = null // 保存全屏 observer 引用

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 获取容器默认标题
const getDefaultTitle = (type) => {
  const titles = {
    info: 'INFO',
    tip: 'TIP',
    warning: 'WARNING',
    danger: 'DANGER',
    details: '详情'
  }
  return titles[type] || type.toUpperCase()
}

// 检查是否在预览模式
const isInPreviewMode = () => {
  if (!vditorInstance) return true
  // 检查编辑器容器是否有预览模式的类
  const vditorElement = document.getElementById('vditor')
  if (!vditorElement) return true
  // Vditor 在预览模式下会添加 vditor--preview 类
  return vditorElement.classList.contains('vditor--preview')
}

// 获取工具栏配置
const getToolbarConfig = () => {
  // VitePress 工具栏配置 - 使用闭包访问 vditorInstance
  const vitePressToolbar = [
    {
      name: 'vp-info',
      tipPosition: 's',
      tip: '插入 Info 容器',
      className: 'vp-toolbar-btn',
      icon: '<svg viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 832c-212.1 0-384-171.9-384-384s171.9-384 384-384 384 171.9 384 384-171.9 384-384 384z"/><path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/></svg>',
      click: () => {
        if (isInPreviewMode()) return // 预览模式下禁用
        if (vditorInstance) {
          vditorInstance.insertValue('\n::: info\n这是一条信息\n:::\n')
        }
      }
    },
    {
      name: 'vp-tip',
      tipPosition: 's',
      tip: '插入 Tip 容器',
      className: 'vp-toolbar-btn',
      icon: '<svg viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 832c-212.1 0-384-171.9-384-384s171.9-384 384-384 384 171.9 384 384-171.9 384-384 384z"/><path d="M512 760c-26.5 0-48-21.5-48-48V344c0-26.5 21.5-48 48-48s48 21.5 48 48v368c0 26.5-21.5 48-48 48z"/></svg>',
      click: () => {
        if (isInPreviewMode()) return // 预览模式下禁用
        if (vditorInstance) {
          vditorInstance.insertValue('\n::: tip\n这是一条提示\n:::\n')
        }
      }
    },
    {
      name: 'vp-warning',
      tipPosition: 's',
      tip: '插入 Warning 容器',
      className: 'vp-toolbar-btn',
      icon: '<svg viewBox="0 0 1024 1024"><path d="M464 720a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm16-304v184c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V416c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8z"/><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 832c-212.1 0-384-171.9-384-384s171.9-384 384-384 384 171.9 384 384-171.9 384-384 384z"/></svg>',
      click: () => {
        if (isInPreviewMode()) return // 预览模式下禁用
        if (vditorInstance) {
          vditorInstance.insertValue('\n::: warning\n这是一条警告\n:::\n')
        }
      }
    },
    {
      name: 'vp-danger',
      tipPosition: 's',
      tip: '插入 Danger 容器',
      className: 'vp-toolbar-btn',
      icon: '<svg viewBox="0 0 1024 1024"><path d="M685.248 104.704a32 32 0 0 1 27.264 15.296l320.384 523.776A32 32 0 0 1 1005.44 688H128.256a32 32 0 0 1-27.456-44.224L421.44 120a32 32 0 0 1 27.264-15.296h236.544zM512 576a32 32 0 1 0 0 64 32 32 0 0 0 0-64zm0-320a32 32 0 0 0-32 32v192a32 32 0 0 0 64 0V288a32 32 0 0 0-32-32z"/></svg>',
      click: () => {
        if (isInPreviewMode()) return // 预览模式下禁用
        if (vditorInstance) {
          vditorInstance.insertValue('\n::: danger\n这是一条危险提示\n:::\n')
        }
      }
    },
    {
      name: 'vp-details',
      tipPosition: 's',
      tip: '插入折叠容器',
      className: 'vp-toolbar-btn',
      icon: '<svg viewBox="0 0 1024 1024"><path d="M120 64h784c22.1 0 40 17.9 40 40v816c0 22.1-17.9 40-40 40H120c-22.1 0-40-17.9-40-40V104c0-22.1 17.9-40 40-40z m664 224H240c-8.8 0-16-7.2-16-16v-48c0-8.8 7.2-16 16-16h544c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16z m0 256H240c-8.8 0-16-7.2-16-16v-48c0-8.8 7.2-16 16-16h544c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16z m0 256H240c-8.8 0-16-7.2-16-16v-48c0-8.8 7.2-16 16-16h544c8.8 0 16 7.2 16 16v48c0 8.8-7.2 16-16 16z"/></svg>',
      click: () => {
        if (isInPreviewMode()) return // 预览模式下禁用
        if (vditorInstance) {
          vditorInstance.insertValue('\n::: details 点击展开\n隐藏内容\n:::\n')
        }
      }
    },
    {
      name: 'wechat-unlock',
      tipPosition: 's',
      tip: '插入微信公众号解锁',
      className: 'vp-toolbar-btn',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="5" y="11" width="14" height="10" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 15v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="16" r="0.8" fill="currentColor"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width="1.5"/></svg>',
      click: () => {
        if (isInPreviewMode()) return // 预览模式下禁用
        if (wechatModalRef.value && vditorInstance) {
          wechatModalRef.value.show(vditorInstance)
        }
      }
    }
  ]

  // 桌面端完整工具栏
  const desktopToolbar = [
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
    '|',
    'code',
    'inline-code',
    'link',
    'table',
    '|',
    ...vitePressToolbar,
    '|',
    'upload',
    'undo',
    'redo',
    '|',
    'fullscreen',
    'preview',
    'outline',
    'help'
  ]

  // 移动端精简工具栏
  const mobileToolbar = [
    'headings',
    'bold',
    'italic',
    '|',
    'list',
    'quote',
    '|',
    'code',
    'link',
    '|',
    ...vitePressToolbar.slice(0, 2), // 只保留前两个 VitePress 按钮
    '|',
    'upload',
    'preview'
  ]

  return isMobile.value ? mobileToolbar : desktopToolbar
}

// 初始化编辑器
const initEditor = () => {
  checkMobile()

  vditorInstance = new Vditor('vditor', {
    height: isMobile.value ? window.innerHeight - 250 : 600,
    mode: 'ir', // 即时渲染模式
    placeholder: '请输入文章内容...',
    theme: 'classic',
    value: props.modelValue,
    toolbar: getToolbarConfig(),
    // 使用国内CDN镜像，解决unpkg.com访问慢的问题
    cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.10.0',
    upload: {
      url: props.uploadUrl,
      max: 5 * 1024 * 1024, // 5MB
      multiple: false,
      fieldName: 'file',
      format(files, responseText) {
        try {
          const response = JSON.parse(responseText)
          if (response.success) {
            return JSON.stringify({
              code: 0,
              data: {
                errFiles: [],
                succMap: {
                  [files[0].name]: response.data.url
                }
              }
            })
          } else {
            return JSON.stringify({
              code: 1,
              msg: response.message || response.error || '上传失败'
            })
          }
        } catch (error) {
          return JSON.stringify({
            code: 1,
            msg: '上传失败'
          })
        }
      }
    },
    after() {
      isReady.value = true
      if (vditorInstance) {
        vditorInstance.setValue(props.modelValue || '')

        // 监听预览模式变化，给自定义按钮添加/移除 disabled class
        const observePreviewMode = () => {
          const vditorElement = document.getElementById('vditor')
          if (!vditorElement) return

          const updateCustomButtonsState = () => {
            const isPreview = vditorElement.classList.contains('vditor--preview')
            const customButtons = vditorElement.querySelectorAll('.vp-toolbar-btn')

            customButtons.forEach(btn => {
              if (isPreview) {
                btn.classList.add('vditor-menu--disabled')
              } else {
                btn.classList.remove('vditor-menu--disabled')
              }
            })
          }

          // 方案1: 监听工具栏点击事件
          const toolbar = vditorElement.querySelector('.vditor-toolbar')
          if (toolbar) {
            toolbar.addEventListener('click', () => {
              // 延迟检查，等待 Vditor 更新状态
              setTimeout(updateCustomButtonsState, 100)
            })
          }

          // 方案2: 使用 setInterval 定期检查（作为备用）
          let lastPreviewState = false
          const checkInterval = setInterval(() => {
            const currentPreviewState = vditorElement.classList.contains('vditor--preview')
            if (currentPreviewState !== lastPreviewState) {
              lastPreviewState = currentPreviewState
              updateCustomButtonsState()
            }
          }, 200)

          // 保存 interval ID 用于清理
          vditorElement._previewCheckInterval = checkInterval

          // 初始状态检查
          updateCustomButtonsState()
        }

        // 延迟执行，确保 DOM 已渲染
        setTimeout(observePreviewMode, 100)
      }
    },
    input(value) {
      emit('update:modelValue', value)
    },
    cache: {
      enable: false // 禁用缓存
    },
    // 移动端优化配置
    resize: {
      enable: !isMobile.value
    },
    counter: {
      enable: !isMobile.value
    },
    // IR 模式渲染配置
    render: {
      mode: 'wysiwyg'
    },
    preview: {
      mode: isMobile.value ? 'editor' : 'both',
      delay: 500,
      markdown: {
        toc: true,
        mark: true,
        footnotes: true,
        autoSpace: true
      },
      hljs: {
        style: 'github',
        lineNumber: true
      },
      // 预处理 Markdown - 将 VitePress 容器转换为 HTML
      transform: (markdown) => {
        console.log('[Transform] ========== 开始处理 ==========')

        // 处理 VitePress 容器语法
        markdown = markdown.replace(
          /:::\s*(info|tip|warning|danger|details)\s*(.*?)\n([\s\S]*?):::/g,
          (match, type, title, content) => {
            const displayTitle = title.trim() || getDefaultTitle(type)

            if (type === 'details') {
              // details 容器：显示可点击的标题，默认折叠
              return `<div class="vp-container ${type} collapsed"><p class="vp-container-title" data-type="${type}">${displayTitle}</p><div class="vp-container-content" style="display:none">${content.trim()}</div></div>`
            } else {
              // 其他容器：不显示标题，直接显示内容
              return `<div class="vp-container ${type}"><div class="vp-container-content">${content.trim()}</div></div>`
            }
          }
        )

        // 处理微信公众号解锁 shortcode - 匹配 HTML 转义后的格式
        // Vditor 会把 < > " 转义成 &lt; &gt; &quot;
        markdown = markdown.replace(
          /\{\{&lt;\s*wechat-unlock\s+keyword=&quot;([^&]+)&quot;\s+code=&quot;([^&]+)&quot;\s*&gt;\}\}/g,
          (match, keyword, code) => {
            console.log('[Transform] ✅ 成功匹配并替换 shortcode - keyword:', keyword, 'code:', code)
            return `<div class="wechat-unlock-preview"><div class="preview-meta"><span class="meta-badge">微信解锁</span><span class="meta-info">关键字: <code>${keyword}</code></span><span class="meta-info">解锁码: <code>${code || '自动生成'}</code></span></div><div class="unlock-gate-preview"><button class="unlock-button-preview" type="button"><svg class="button-icon-lock" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect><path d="M12 17v-2"></path><circle cx="12" cy="16" r="1"></circle><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg><span class="button-text">阅读更多</span></button></div><div class="preview-hint"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>此处后续内容需要解锁才能查看</div></div>`
          }
        )

        console.log('[Transform] 处理后包含 preview:', markdown.includes('wechat-unlock-preview'))
        console.log('[Transform] ========== 处理完成 ==========')
        return markdown
      },
      // DOM 渲染后处理 - 添加交互
      parse: (element) => {
        // 为 details 容器添加点击事件
        const detailsTitles = element.querySelectorAll('.vp-container.details .vp-container-title')
        detailsTitles.forEach(title => {
          // 添加点击事件
          title.style.cursor = 'pointer'
          title.addEventListener('click', function(e) {
            e.stopPropagation()
            const container = this.parentElement
            const content = container.querySelector('.vp-container-content')

            if (container.classList.contains('collapsed')) {
              // 展开
              container.classList.remove('collapsed')
              container.classList.add('open')
              if (content) {
                content.style.display = 'block'
              }
            } else {
              // 折叠
              container.classList.remove('open')
              container.classList.add('collapsed')
              if (content) {
                content.style.display = 'none'
              }
            }
          })
        })
      }
    },
    fullscreen: {
      index: 2000 // 全屏层级
    }
  })

  // 监听Vditor全屏事件
  if (vditorInstance) {
    const vditorElement = document.getElementById('vditor')
    if (vditorElement) {
      // 使用 MutationObserver 监听全屏class变化
      fullscreenObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isFullscreen = vditorElement.classList.contains('vditor--fullscreen')
            emit('fullscreen-change', isFullscreen)
          }
        })
      })
      fullscreenObserver.observe(vditorElement, { attributes: true })
    }
  }
}

// 响应式处理
const handleResize = () => {
  const wasMobile = isMobile.value
  checkMobile()

  // 如果移动/桌面状态切换，重新初始化编辑器
  if (wasMobile !== isMobile.value && vditorInstance) {
    const content = vditorInstance.getValue()
    isReady.value = false
    vditorInstance.destroy()
    setTimeout(() => {
      initEditor()
      if (vditorInstance) {
        vditorInstance.setValue(content)
      }
    }, 100)
  }
}

onMounted(() => {
  initEditor()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  // 清理预览模式检查的 interval
  const vditorElement = document.getElementById('vditor')
  if (vditorElement && vditorElement._previewCheckInterval) {
    clearInterval(vditorElement._previewCheckInterval)
  }

  // 清理全屏模式 MutationObserver
  if (fullscreenObserver) {
    fullscreenObserver.disconnect()
    fullscreenObserver = null
  }

  isReady.value = false
  if (vditorInstance) {
    vditorInstance.destroy()
  }
})

watch(() => props.modelValue, (newValue) => {
  if (!isReady.value || !vditorInstance) {
    return
  }

  if (typeof vditorInstance.getValue === 'function') {
    const currentValue = vditorInstance.getValue()
    if (currentValue !== newValue) {
      vditorInstance.setValue(newValue || '')
    }
  }
})

// 暴露方法给父组件
defineExpose({
  getValue: () => vditorInstance?.getValue() || '',
  setValue: (value) => vditorInstance?.setValue(value || '')
})
</script>

<!-- 编辑器样式 - 不使用scoped保证样式全局生效 -->
<style src="./MarkdownEditor.scss"></style>

<!-- 关键样式 - 使用scoped + :deep() 确保能覆盖 -->
<style scoped>
.markdown-editor {
  width: 100%;
}

/* 预览模式下禁用自定义按钮 - 关键样式 */
:deep(.vditor--preview .vp-toolbar-btn) {
  opacity: 0.3 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
}

:deep(.vditor--preview .vditor-toolbar__item:has(.vp-toolbar-btn)) {
  opacity: 0.3 !important;
  pointer-events: none !important;
}

:deep(.vditor--preview .vp-toolbar-btn:hover) {
  background: transparent !important;
  transform: none !important;
  color: #586069 !important;
  border-color: transparent !important;
}
</style>
