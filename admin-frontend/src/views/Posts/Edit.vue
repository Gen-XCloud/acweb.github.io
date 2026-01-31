<template>
  <PostEditorLayout
    :title="isCreate ? '新建文章' : '编辑文章'"
    :loading="loading"
    :saving="saving"
    :is-mobile="isMobile"
    :is-fullscreen="isFullscreen"
    @back="goBack"
    @save="savePost"
  >
    <!-- 桌面端 / 移动端普通模式：元数据表单 -->
    <PostMetadataForm
      v-if="!isMobile || !isFullscreen"
      v-model="form"
      :category-options="categoryOptions"
      :tag-options="tagOptions"
      :is-mobile="isMobile"
    />

    <!-- 桌面端 / 移动端普通模式：内容编辑器 -->
    <PostContentEditor
      v-if="!isMobile"
      v-model="form.content"
      :is-mobile="isMobile"
      @fullscreen-change="handleFullscreenChange"
    />

    <!-- 移动端普通模式：内容编辑器 -->
    <PostContentEditor
      v-if="isMobile && !isFullscreen"
      v-model="form.content"
      :is-mobile="isMobile"
      @fullscreen-change="handleFullscreenChange"
    />

    <!-- 移动端全屏模式：纯编辑器 -->
    <template #fullscreen>
      <MdEditorV3
        v-model="form.content"
        @fullscreen-change="handleFullscreenChange"
      />
    </template>
  </PostEditorLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import PostEditorLayout from '@/components/PostEditor/PostEditorLayout.vue'
import PostMetadataForm from '@/components/PostEditor/PostMetadataForm.vue'
import PostContentEditor from '@/components/PostEditor/PostContentEditor.vue'
import MarkdownEditorSkeleton from '@/components/Editor/MarkdownEditorSkeleton.vue'
import { usePostEditor } from '@/composables/usePostEditor'

// 懒加载MdEditorV3 - 移动端全屏模式使用
const MdEditorV3 = defineAsyncComponent({
  loader: () => import('@/components/Editor/MdEditorV3.vue'),
  loadingComponent: MarkdownEditorSkeleton,
  delay: 200,
  timeout: 10000
})

// 使用编辑器 composable
const {
  loading,
  saving,
  form,
  isCreate,
  categoryOptions,
  tagOptions,
  loadPost,
  savePost,
  goBack
} = usePostEditor()

// 响应式状态
const isMobile = ref(false)
const isFullscreen = ref(false)

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 处理全屏变化
const handleFullscreenChange = (fullscreen) => {
  isFullscreen.value = fullscreen
}

// 生命周期
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadPost()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* 所有样式已迁移到各个子组件中 */
</style>
