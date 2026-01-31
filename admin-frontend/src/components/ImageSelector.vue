<template>
  <div class="image-selector">
    <!-- 主输入框：可以直接粘贴URL -->
    <el-input
      v-model="imageUrl"
      :placeholder="placeholder || '输入图片URL或点击右侧按钮上传'"
      @change="handleUrlChange"
    >
      <template #append>
        <el-button @click="openDialog" :icon="Upload">
          上传
        </el-button>
      </template>
      <template #prefix>
        <el-icon v-if="imageUrl"><Picture /></el-icon>
      </template>
    </el-input>

    <!-- 图片预览（在输入框下方） -->
    <div v-if="imageUrl" class="image-preview-box">
      <img :src="imageUrl" alt="预览" />
      <el-button
        class="clear-button"
        type="danger"
        size="small"
        circle
        @click="clearImage"
      >
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="上传图片"
      width="600px"
      destroy-on-close
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="上传新图片" name="upload">
          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              class="upload-box"
              drag
              :action="uploadAction"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :show-file-list="false"
              :accept="accept"
            >
              <el-icon class="upload-icon"><Upload /></el-icon>
              <div class="upload-text">
                <div>拖拽图片到此处，或点击上传</div>
                <div class="upload-hint">支持 JPG, PNG, GIF, WEBP 格式，最大5MB</div>
              </div>
            </el-upload>
          </div>
        </el-tab-pane>

        <el-tab-pane label="从图库选择" name="library">
          <div class="media-library" v-loading="loadingMedia">
            <el-empty v-if="mediaList.length === 0" description="暂无图片" />
            <div v-else class="media-grid">
              <div
                v-for="item in mediaList"
                :key="item.url"
                class="media-item"
                :class="{ selected: item.url === selectedImage }"
                @click="selectFromLibrary(item.url)"
              >
                <img :src="item.url" :alt="item.name" />
                <div class="media-name">{{ item.name }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Close, Upload } from '@element-plus/icons-vue'
import { uploadImage } from '@/api/upload'
import { getMediaList } from '@/api/media'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '输入图片URL或点击右侧按钮上传'
  },
  accept: {
    type: String,
    default: 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
  }
})

const emit = defineEmits(['update:modelValue'])

const imageUrl = ref(props.modelValue)
const dialogVisible = ref(false)
const activeTab = ref('upload')
const selectedImage = ref('')
const uploadRef = ref(null)
const loadingMedia = ref(false)
const mediaList = ref([])

// 上传地址
const uploadAction = computed(() => {
  return import.meta.env.VITE_API_BASE_URL + '/api/v1/upload/image'
})

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  imageUrl.value = newVal
})

// 监听输入框变化
watch(imageUrl, (newVal) => {
  emit('update:modelValue', newVal)
})

// 处理URL输入变化
const handleUrlChange = () => {
  emit('update:modelValue', imageUrl.value)
}

const openDialog = () => {
  selectedImage.value = imageUrl.value
  dialogVisible.value = true

  // 打开图库时加载图片列表
  if (activeTab.value === 'library') {
    loadMediaList()
  }
}

const clearImage = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
}

const beforeUpload = async (file) => {
  // 检查文件大小（5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error('不支持的文件类型')
    return false
  }

  // 使用自定义上传
  try {
    const res = await uploadImage(file)
    if (res.code === 200 && res.data && res.data.url) {
      selectedImage.value = res.data.url
      imageUrl.value = res.data.url
      ElMessage.success('图片上传成功')
      // 自动关闭对话框
      dialogVisible.value = false
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    ElMessage.error('上传失败：' + (error.message || '未知错误'))
  }

  // 阻止 el-upload 的默认上传
  return false
}

const handleUploadSuccess = (response) => {
  // 这个函数不会被调用，因为 before-upload 返回 false
}

const handleUploadError = (error) => {
  ElMessage.error('上传失败')
  console.error(error)
}

const loadMediaList = async () => {
  loadingMedia.value = true
  try {
    const res = await getMediaList()
    if (res.code === 200) {
      mediaList.value = res.data || []
    } else {
      ElMessage.error('加载图库失败')
    }
  } catch (error) {
    ElMessage.error('加载图库失败')
    console.error(error)
  } finally {
    loadingMedia.value = false
  }
}

const selectFromLibrary = (url) => {
  selectedImage.value = url
}

const confirmSelection = () => {
  if (selectedImage.value) {
    imageUrl.value = selectedImage.value
    emit('update:modelValue', selectedImage.value)
    dialogVisible.value = false
  } else {
    ElMessage.warning('请选择一张图片')
  }
}

// 监听tab切换，加载图库
watch(activeTab, (newTab) => {
  if (newTab === 'library' && mediaList.value.length === 0) {
    loadMediaList()
  }
})
</script>

<style scoped>
.image-selector {
  width: 100%;
}

.image-preview-box {
  margin-top: 10px;
  position: relative;
  width: 100%;
  max-width: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background: #fafafa;
}

.image-preview-box img {
  width: 100%;
  max-height: 150px;
  object-fit: contain;
  display: block;
}

.clear-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

.upload-area {
  padding: 20px;
}

.upload-box {
  width: 100%;
}

.upload-box :deep(.el-upload) {
  width: 100%;
}

.upload-box :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 60px;
  color: #409eff;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.media-library {
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.media-item:hover {
  border-color: #409eff;
  transform: scale(1.05);
}

.media-item.selected {
  border-color: #67c23a;
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.5);
}

.media-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px;
  font-size: 12px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
