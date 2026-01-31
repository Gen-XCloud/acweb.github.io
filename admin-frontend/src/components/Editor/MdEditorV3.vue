<template>
  <div class="md-editor-v3-wrapper">
    <MdEditor
      v-model="content"
      :theme="theme"
      :preview-theme="previewTheme"
      :code-theme="codeTheme"
      @on-upload-img="handleUploadImg"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

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

const content = ref(props.modelValue)
const theme = ref('light')
const previewTheme = ref('vuepress')
const codeTheme = ref('github')

// 监听内容变化
watch(content, (newValue) => {
  emit('update:modelValue', newValue)
})

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue
  }
})

// 图片上传处理
const handleUploadImg = async (files, callback) => {
  const formData = new FormData()
  formData.append('file', files[0])

  try {
    const response = await fetch(props.uploadUrl, {
      method: 'POST',
      body: formData
    })
    const result = await response.json()

    if (result.success) {
      callback([result.data.url])
    } else {
      console.error('上传失败:', result.message)
    }
  } catch (error) {
    console.error('上传错误:', error)
  }
}

// 保存快捷键处理
const handleSave = (value) => {
  emit('update:modelValue', value)
}

// 暴露方法给父组件
defineExpose({
  getValue: () => content.value,
  setValue: (value) => { content.value = value }
})
</script>

<style scoped>
.md-editor-v3-wrapper {
  width: 100%;
}
</style>
