<template>
  <div class="gallery-manager">
    <!-- Header -->
    <el-card shadow="never" style="margin-bottom: 20px;">
      <template #header>
        <div class="card-header">
          <div>
            <h2 style="margin: 0;">图库管理</h2>
            <span style="color: #909399; font-size: 14px;">管理相册和图片</span>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showAddImageDialog = true">
              <el-icon><Plus /></el-icon>
              添加图片
            </el-button>
            <el-button @click="showAlbumDialog = true">
              <el-icon><FolderAdd /></el-icon>
              新建相册
            </el-button>
          </div>
        </div>
      </template>

      <!-- Stats -->
      <div class="stats-row">
        <el-statistic title="总图片" :value="stats.totalItems || 0">
          <template #prefix>
            <el-icon><Picture /></el-icon>
          </template>
        </el-statistic>
        <el-statistic title="本地图片" :value="stats.localItems || 0">
          <template #prefix>
            <el-icon><Upload /></el-icon>
          </template>
        </el-statistic>
        <el-statistic title="外部图片" :value="stats.remoteItems || 0">
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
        </el-statistic>
        <el-statistic title="相册" :value="stats.totalAlbums || 0">
          <template #prefix>
            <el-icon><Folder /></el-icon>
          </template>
        </el-statistic>
      </div>
    </el-card>

    <!-- Albums List -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>相册列表</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索图片..."
            style="width: 300px;"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-row :gutter="12">
        <!-- All Images Album -->
        <el-col :xs="12" :sm="8" :md="6" :lg="4">
          <div
            :class="['album-card', { active: selectedAlbumId === null }]"
            @click="selectAlbum(null)"
          >
            <div class="album-cover">
              <el-icon :size="40"><PictureFilled /></el-icon>
            </div>
            <div class="album-info">
              <h3>所有图片</h3>
              <p>{{ stats.totalItems || 0 }} 张</p>
            </div>
          </div>
        </el-col>

        <!-- Album Cards -->
        <el-col
          v-for="album in albums"
          :key="album.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
        >
          <div
            :class="['album-card', { active: selectedAlbumId === album.id }]"
            @click="selectAlbum(album.id)"
          >
            <div class="album-cover">
              <el-icon v-if="!album.coverImage" :size="40"><Folder /></el-icon>
              <img v-else :src="album.coverImage" alt="cover" />
            </div>
            <div class="album-info">
              <h3>{{ album.name }}</h3>
              <p>{{ album.itemCount || 0 }} 张</p>
            </div>
            <div class="album-actions">
              <el-button
                text
                type="primary"
                size="small"
                @click.stop="editAlbum(album)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click.stop="deleteAlbumConfirm(album)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- Gallery Items -->
      <el-divider />

      <div v-if="galleryItems.length > 0" class="gallery-grid">
        <div
          v-for="(item, index) in galleryItems"
          :key="item.id"
          class="gallery-item"
        >
          <div class="item-image" @click="previewImage(index)">
            <el-tag
              :type="item.type === 'local' ? 'success' : 'warning'"
              size="small"
              class="item-type-tag"
            >
              {{ item.type === 'local' ? '本地' : '外部' }}
            </el-tag>
            <img
              v-if="item.type === 'local' && item.localFile"
              :src="item.localFile.url"
              :alt="item.title"
            />
            <img
              v-else-if="item.type === 'remote' && item.remoteFile"
              :src="item.remoteFile.thumbnailUrl || item.remoteFile.url"
              :alt="item.title"
            />
            <div class="image-overlay">
              <el-icon :size="30"><ZoomIn /></el-icon>
            </div>
          </div>
          <div class="item-info">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-actions">
              <el-button
                text
                type="primary"
                size="small"
                @click="editGalleryItem(item)"
              >
                编辑
              </el-button>
              <el-button
                text
                type="danger"
                size="small"
                @click="deleteGalleryItemConfirm(item)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-else
        description="暂无图片"
        :image-size="100"
      />

      <!-- Pagination -->
      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: center;"
        @current-change="loadGalleryItems"
      />
    </el-card>

    <!-- Album Dialog -->
    <el-dialog
      v-model="showAlbumDialog"
      :title="currentAlbum.id ? '编辑相册' : '新建相册'"
      width="500px"
    >
      <el-form :model="albumForm" label-width="80px">
        <el-form-item label="相册名称" required>
          <el-input v-model="albumForm.name" placeholder="请输入相册名称" />
        </el-form-item>
        <el-form-item label="相册描述">
          <el-input
            v-model="albumForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入相册描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAlbumDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAlbum">保存</el-button>
      </template>
    </el-dialog>

    <!-- Add Image Dialog -->
    <el-dialog
      v-model="showAddImageDialog"
      title="添加图片"
      width="600px"
    >
      <el-tabs v-model="addImageTab">
        <!-- Local Upload -->
        <el-tab-pane label="本地上传" name="local">
          <el-upload
            ref="uploadRef"
            :action="uploadAction"
            :headers="uploadHeaders"
            :data="uploadData"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            list-type="picture-card"
            multiple
            :auto-upload="false"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>

          <el-form :model="uploadForm" style="margin-top: 20px;">
            <el-form-item label="所属相册">
              <el-select v-model="uploadForm.albumId" placeholder="选择相册" style="width: 100%;">
                <el-option label="无相册" value="" />
                <el-option
                  v-for="album in albums"
                  :key="album.id"
                  :label="album.name"
                  :value="album.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="uploadForm.title" placeholder="图片标题（可选）" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="uploadForm.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Remote URL -->
        <el-tab-pane label="外部链接" name="remote">
          <el-form :model="remoteForm">
            <el-form-item label="图片URL" required>
              <el-input
                v-model="remoteForm.url"
                placeholder="https://example.com/image.jpg"
              >
                <template #append>
                  <el-button @click="checkURL" :loading="checkingURL">
                    检查
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="所属相册">
              <el-select v-model="remoteForm.albumId" placeholder="选择相册" style="width: 100%;">
                <el-option label="无相册" value="" />
                <el-option
                  v-for="album in albums"
                  :key="album.id"
                  :label="album.name"
                  :value="album.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="remoteForm.title" placeholder="图片标题（可选）" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="remoteForm.description" type="textarea" :rows="2" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="showAddImageDialog = false">取消</el-button>
        <el-button
          v-if="addImageTab === 'local'"
          type="primary"
          @click="submitUpload"
        >
          上传
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="addRemoteImageSubmit"
          :loading="addingRemote"
        >
          添加
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit Gallery Item Dialog -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑图片"
      width="500px"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="所属相册">
          <el-select v-model="editForm.albumId" style="width: 100%;">
            <el-option label="无相册" value="" />
            <el-option
              v-for="album in albums"
              :key="album.id"
              :label="album.name"
              :value="album.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加标签"
            style="width: 100%;"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGalleryItem">保存</el-button>
      </template>
    </el-dialog>

    <!-- Image Preview Dialog -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="currentPreviewItem?.title || '图片预览'"
      width="80%"
      :close-on-click-modal="true"
      class="preview-dialog"
    >
      <div class="preview-content">
        <div class="preview-image-wrapper">
          <el-button
            v-if="previewIndex > 0"
            class="preview-nav prev"
            circle
            @click="previewPrev"
          >
            <el-icon :size="20"><ArrowLeft /></el-icon>
          </el-button>

          <img
            v-if="currentPreviewItem"
            :src="getPreviewUrl(currentPreviewItem)"
            :alt="currentPreviewItem.title"
            class="preview-image"
          />

          <el-button
            v-if="previewIndex < galleryItems.length - 1"
            class="preview-nav next"
            circle
            @click="previewNext"
          >
            <el-icon :size="20"><ArrowRight /></el-icon>
          </el-button>
        </div>

        <div class="preview-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="标题">
              {{ currentPreviewItem?.title }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="currentPreviewItem?.type === 'local' ? 'success' : 'warning'" size="small">
                {{ currentPreviewItem?.type === 'local' ? '本地图片' : '外部图片' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ currentPreviewItem?.description || '无描述' }}
            </el-descriptions-item>
            <el-descriptions-item label="尺寸" v-if="currentPreviewItem?.type === 'local' && currentPreviewItem?.localFile">
              {{ currentPreviewItem.localFile.width }} × {{ currentPreviewItem.localFile.height }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小" v-if="currentPreviewItem?.type === 'local' && currentPreviewItem?.localFile">
              {{ formatFileSize(currentPreviewItem.localFile.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="URL" v-if="currentPreviewItem?.type === 'remote' && currentPreviewItem?.remoteFile">
              <el-link :href="currentPreviewItem.remoteFile.url" target="_blank" type="primary">
                查看原图
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="状态" v-if="currentPreviewItem?.type === 'remote' && currentPreviewItem?.remoteFile">
              <el-tag :type="currentPreviewItem.remoteFile.isAvailable ? 'success' : 'danger'" size="small">
                {{ currentPreviewItem.remoteFile.isAvailable ? '可用' : '不可用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="标签" :span="2" v-if="currentPreviewItem?.tags && currentPreviewItem.tags.length > 0">
              <el-tag
                v-for="tag in currentPreviewItem.tags"
                :key="tag"
                size="small"
                style="margin-right: 8px;"
              >
                {{ tag }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <template #footer>
        <el-button @click="showPreviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="editGalleryItem(currentPreviewItem)">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  FolderAdd,
  Picture,
  Upload,
  Link,
  Folder,
  Search,
  PictureFilled,
  Edit,
  Delete,
  ZoomIn,
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum
} from '@/api/albums'
import {
  getGalleryItems,
  uploadGalleryImage,
  addRemoteImage,
  updateGalleryItem,
  deleteGalleryItem,
  checkURLAvailability,
  getAllTags,
  getGalleryStats
} from '@/api/gallery'

// State
const albums = ref([])
const galleryItems = ref([])
const allTags = ref([])
const stats = ref({})
const selectedAlbumId = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Dialogs
const showAlbumDialog = ref(false)
const showAddImageDialog = ref(false)
const showEditDialog = ref(false)
const showPreviewDialog = ref(false)
const addImageTab = ref('local')
const checkingURL = ref(false)
const addingRemote = ref(false)

// Preview
const previewIndex = ref(0)
const currentPreviewItem = ref(null)

// Forms
const currentAlbum = ref({})
const albumForm = reactive({
  name: '',
  description: ''
})

const uploadRef = ref()
const uploadForm = reactive({
  albumId: '',
  title: '',
  description: ''
})

const uploadData = reactive({})
const uploadAction = '/api/v1/gallery/upload'
const uploadHeaders = {}

const remoteForm = reactive({
  url: '',
  albumId: '',
  title: '',
  description: ''
})

const currentItem = ref({})
const editForm = reactive({
  title: '',
  description: '',
  albumId: '',
  tags: []
})

// Methods
const loadAlbums = async () => {
  try {
    const response = await getAlbums()
    albums.value = response.data.items || []
  } catch (error) {
    ElMessage.error('加载相册列表失败')
  }
}

const loadGalleryItems = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      albumId: selectedAlbumId.value || '',
      search: searchQuery.value
    }
    const response = await getGalleryItems(params)
    galleryItems.value = response.data.items || []
    total.value = response.data.total || 0
  } catch (error) {
    ElMessage.error('加载图库列表失败')
  }
}

const loadStats = async () => {
  try {
    const response = await getGalleryStats()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

const loadTags = async () => {
  try {
    const response = await getAllTags()
    allTags.value = response.data.tags || []
  } catch (error) {
    console.error('Failed to load tags:', error)
  }
}

const selectAlbum = (albumId) => {
  selectedAlbumId.value = albumId
  currentPage.value = 1
  loadGalleryItems()
}

const handleSearch = () => {
  currentPage.value = 1
  loadGalleryItems()
}

const editAlbum = (album) => {
  currentAlbum.value = album
  albumForm.name = album.name
  albumForm.description = album.description
  showAlbumDialog.value = true
}

const saveAlbum = async () => {
  if (!albumForm.name) {
    ElMessage.warning('请输入相册名称')
    return
  }

  try {
    if (currentAlbum.value.id) {
      await updateAlbum(currentAlbum.value.id, albumForm)
      ElMessage.success('相册更新成功')
    } else {
      await createAlbum(albumForm)
      ElMessage.success('相册创建成功')
    }
    showAlbumDialog.value = false
    albumForm.name = ''
    albumForm.description = ''
    currentAlbum.value = {}
    loadAlbums()
    loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const deleteAlbumConfirm = (album) => {
  ElMessageBox.confirm(`确定删除相册"${album.name}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await deleteAlbum(album.id)
      ElMessage.success('删除成功')
      loadAlbums()
      loadStats()
      if (selectedAlbumId.value === album.id) {
        selectedAlbumId.value = null
      }
      loadGalleryItems()
    })
    .catch(() => {})
}

const beforeUpload = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const isValidType = validTypes.includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isValidType) {
    ElMessage.error('只支持 JPG、PNG、GIF、WebP 格式的图片')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const submitUpload = () => {
  uploadData.albumId = uploadForm.albumId
  uploadData.title = uploadForm.title
  uploadData.description = uploadForm.description
  uploadRef.value.submit()
}

const handleUploadSuccess = () => {
  ElMessage.success('上传成功')
  showAddImageDialog.value = false
  uploadForm.albumId = ''
  uploadForm.title = ''
  uploadForm.description = ''
  loadGalleryItems()
  loadStats()
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const checkURL = async () => {
  if (!remoteForm.url) {
    ElMessage.warning('请输入URL')
    return
  }

  checkingURL.value = true
  try {
    const response = await checkURLAvailability(remoteForm.url)
    if (response.data.isAvailable) {
      ElMessage.success('URL可用')
    } else {
      ElMessage.warning(`URL不可用 (HTTP ${response.data.statusCode})`)
    }
  } catch (error) {
    ElMessage.error('URL检查失败')
  } finally {
    checkingURL.value = false
  }
}

const addRemoteImageSubmit = async () => {
  if (!remoteForm.url) {
    ElMessage.warning('请输入URL')
    return
  }

  addingRemote.value = true
  try {
    await addRemoteImage(remoteForm)
    ElMessage.success('添加成功')
    showAddImageDialog.value = false
    remoteForm.url = ''
    remoteForm.albumId = ''
    remoteForm.title = ''
    remoteForm.description = ''
    loadGalleryItems()
    loadStats()
  } catch (error) {
    ElMessage.error('添加失败')
  } finally {
    addingRemote.value = false
  }
}

const editGalleryItem = (item) => {
  currentItem.value = item
  editForm.title = item.title
  editForm.description = item.description
  editForm.albumId = item.albumId
  editForm.tags = item.tags || []
  showEditDialog.value = true
}

const saveGalleryItem = async () => {
  try {
    await updateGalleryItem(currentItem.value.id, editForm)
    ElMessage.success('保存成功')
    showEditDialog.value = false
    loadGalleryItems()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteGalleryItemConfirm = (item) => {
  ElMessageBox.confirm(`确定删除图片"${item.title}"吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await deleteGalleryItem(item.id)
      ElMessage.success('删除成功')
      loadGalleryItems()
      loadStats()
    })
    .catch(() => {})
}

// Preview methods
const previewImage = (index) => {
  previewIndex.value = index
  currentPreviewItem.value = galleryItems.value[index]
  showPreviewDialog.value = true
}

const previewPrev = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--
    currentPreviewItem.value = galleryItems.value[previewIndex.value]
  }
}

const previewNext = () => {
  if (previewIndex.value < galleryItems.value.length - 1) {
    previewIndex.value++
    currentPreviewItem.value = galleryItems.value[previewIndex.value]
  }
}

const getPreviewUrl = (item) => {
  if (!item) return ''
  if (item.type === 'local' && item.localFile) {
    return item.localFile.url
  }
  if (item.type === 'remote' && item.remoteFile) {
    return item.remoteFile.url
  }
  return ''
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

onMounted(() => {
  loadAlbums()
  loadGalleryItems()
  loadStats()
  loadTags()
})
</script>

<style scoped>
.gallery-manager {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.album-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.album-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.3);
}

.album-card.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.album-cover {
  width: 100%;
  aspect-ratio: 1;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #909399;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.album-info h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-info p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.album-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.album-card:hover .album-actions {
  opacity: 1;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.gallery-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.gallery-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.item-image {
  width: 100%;
  aspect-ratio: 1;
  background: #f5f7fa;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.item-image:hover img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
}

.item-image:hover .image-overlay {
  opacity: 1;
}

.item-type-tag {
  position: absolute;
  top: 8px;
  left: 8px;
}

.item-info {
  padding: 12px;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  justify-content: space-between;
}

@media screen and (max-width: 768px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

/* Preview Dialog Styles */
:deep(.preview-dialog) {
  .el-dialog__body {
    padding: 0;
  }
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-image-wrapper {
  position: relative;
  width: 100%;
  min-height: 400px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
}

.preview-nav.prev {
  left: 20px;
}

.preview-nav.next {
  right: 20px;
}

.preview-info {
  padding: 0 20px 20px;
}

@media screen and (max-width: 768px) {
  .preview-image-wrapper {
    min-height: 300px;
  }

  .preview-nav {
    width: 36px;
    height: 36px;
  }

  .preview-nav.prev {
    left: 10px;
  }

  .preview-nav.next {
    right: 10px;
  }
}
</style>
