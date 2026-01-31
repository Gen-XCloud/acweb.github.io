<template>
  <el-collapse v-model="activeNames" :class="collapseClass">
    <el-collapse-item title="文章内容" name="content">
      <div class="editor-wrapper">
        <!-- 只在折叠面板展开时才加载编辑器 -->
        <MdEditorV3
          v-if="shouldLoadEditor"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          @fullscreen-change="handleFullscreenChange"
        />
        <!-- 未加载时显示骨架屏 -->
        <MarkdownEditorSkeleton v-else />
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import MarkdownEditorSkeleton from '@/components/Editor/MarkdownEditorSkeleton.vue'

// 懒加载MdEditorV3 - 原生Vue 3组件，按需导入
const MdEditorV3 = defineAsyncComponent({
  loader: () => import('@/components/Editor/MdEditorV3.vue'),
  loadingComponent: MarkdownEditorSkeleton,
  delay: 200,
  timeout: 10000
})

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'fullscreen-change'])

// 折叠面板控制
const activeNames = ref(['content']) // 默认展开内容编辑器

// 编辑器加载控制 - 只在折叠面板展开后才真正加载编辑器
const shouldLoadEditor = ref(false)

// 监听折叠面板状态，延迟加载编辑器
watch(activeNames, (newValue) => {
  if (newValue.includes('content')) {
    // 展开时，延迟200ms加载，避免与动画冲突
    setTimeout(() => {
      shouldLoadEditor.value = true
    }, 200)
  }
}, { immediate: true }) // immediate确保初始展开时也会触发

// 动态 class
const collapseClass = computed(() => props.isMobile ? 'mobile-content-collapse' : 'desktop-content-collapse')

// 处理全屏变化
const handleFullscreenChange = (fullscreen) => {
  emit('fullscreen-change', fullscreen)
}
</script>

<style lang="scss" scoped>
@import './styles/index.scss';
</style>
