<template>
  <div class="media-library">
    <el-card shadow="never">
      <template #header>
        <div class="media-header">
          <span>媒体库</span>
          <el-upload
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              上传图片
            </el-button>
          </el-upload>
        </div>
      </template>

      <el-row :gutter="16" v-loading="loading">
        <el-col
          v-for="item in mediaList"
          :key="item.url"
          :span="6"
        >
          <el-card
            shadow="hover"
            class="media-item"
            :body-style="{ padding: '0' }"
          >
            <img :src="item.url" :alt="item.name" class="media-image" />
            <div class="media-info">
              <div class="media-name">{{ item.name }}</div>
              <div class="media-actions">
                <el-button text size="small" @click="copyUrl(item.url)">
                  复制链接
                </el-button>
                <el-button text size="small" type="danger" @click="deleteMedia(item)">
                  删除
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="!loading && mediaList.length === 0" description="暂无图片" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMediaList, deleteMediaApi } from '@/api/media'

const loading = ref(false)
const mediaList = ref([])
const uploadUrl = '/api/v1/media/upload'

const loadMedia = async () => {
  loading.value = true
  try {
    const data = await getMediaList()
    mediaList.value = data.data || []
  } catch (error) {
    ElMessage.error('加载媒体列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  if (response.success) {
    ElMessage.success('上传成功')
    loadMedia()
  } else {
    ElMessage.error(response.message || response.error || '上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const copyUrl = (url) => {
  navigator.clipboard.writeText(url)
  ElMessage.success('链接已复制到剪贴板')
}

const deleteMedia = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${item.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteMediaApi(item.url)
    ElMessage.success('删除成功')
    loadMedia()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

onMounted(() => {
  loadMedia()
})
</script>

<style scoped>
.media-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-item {
  margin-bottom: 16px;
  cursor: pointer;
  transition: transform 0.2s;
}

.media-item:hover {
  transform: translateY(-4px);
}

.media-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.media-info {
  padding: 12px;
}

.media-name {
  font-size: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-actions {
  display: flex;
  justify-content: space-between;
}
</style>
