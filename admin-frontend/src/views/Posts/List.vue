<template>
  <div class="posts-list">
    <!-- 移动端目录抽屉 -->
    <el-drawer
      v-model="showDirectoryDrawer"
      :size="'80%'"
      :direction="'ltr'"
      title="目录结构"
      class="mobile-directory-drawer"
    >
      <DirectoryTree
        :data="directoryTree"
        :current-path="currentDirectory"
        :draggable="true"
        @select="selectDirectory"
        @refresh="loadDirectories"
      />
    </el-drawer>

    <div class="posts-layout">
      <!-- 左侧目录树（桌面端） -->
      <div class="directory-sidebar desktop-only">
        <div class="sidebar-header">
          <h3>目录结构</h3>
        </div>
        <DirectoryTree
          :data="directoryTree"
          :current-path="currentDirectory"
          :draggable="true"
          @select="selectDirectory"
          @refresh="loadDirectories"
        />
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-area">
        <el-card shadow="never">
          <template #header>
            <div class="list-header">
              <div class="header-left">
                <el-button
                  class="mobile-only mobile-directory-btn"
                  @click="showDirectoryDrawer = true"
                >
                  <el-icon><FolderOpened /></el-icon>
                </el-button>
                <span>文章列表</span>
              </div>
              <el-button type="primary" @click="createPost">
                <el-icon><Plus /></el-icon>
                <span class="btn-text">新建文章</span>
              </el-button>
            </div>
          </template>

          <!-- 面包屑导航 -->
          <div v-if="currentDirectory" class="breadcrumb-bar">
            <DirectoryBreadcrumb
              :path="currentDirectory"
              @navigate="navigateToDirectory"
            />
            <el-button
              text
              type="primary"
              size="small"
              @click="clearDirectoryFilter"
              class="clear-filter-btn"
            >
              <el-icon><Close /></el-icon>
              清除过滤
            </el-button>
          </div>

          <div class="filter-bar">
            <el-input
              v-model="searchQuery"
              placeholder="搜索文章标题（按回车搜索）"
              clearable
              style="width: 300px"
              @keyup.enter="loadPosts"
              @clear="loadPosts"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>

            <el-select
              v-model="selectedCategory"
              placeholder="筛选分类"
              clearable
              filterable
              style="width: 200px"
              @change="loadPosts"
            >
              <el-option
                v-for="cat in categories"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>

            <el-select
              v-model="selectedTag"
              placeholder="筛选标签"
              clearable
              filterable
              style="width: 200px"
              @change="loadPosts"
            >
              <el-option
                v-for="tag in tags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>

          <!-- 批量操作工具栏 -->
          <div class="batch-toolbar" v-if="batchMode || selectedPosts.length > 0">
            <el-button
              v-if="!batchMode"
              type="primary"
              plain
              @click="toggleBatchMode"
            >
              <el-icon><Operation /></el-icon>
              批量操作
            </el-button>
            <template v-if="batchMode">
              <el-button plain @click="toggleBatchMode">
                <el-icon><Close /></el-icon>
                取消批量
              </el-button>
              <span class="batch-count" v-if="selectedPosts.length > 0">
                已选择 {{ selectedPosts.length }} 篇
              </span>
              <el-button
                v-if="selectedPosts.length > 0"
                type="primary"
                @click="showBatchMoveDialog"
              >
                <el-icon><FolderOpened /></el-icon>
                移动 ({{ selectedPosts.length }})
              </el-button>
              <el-button
                v-if="selectedPosts.length > 0"
                type="warning"
                @click="showBatchUpdateDialog"
              >
                <el-icon><Edit /></el-icon>
                批量编辑
              </el-button>
              <el-button
                v-if="selectedPosts.length > 0"
                type="danger"
                @click="confirmBatchDelete"
              >
                <el-icon><Delete /></el-icon>
                删除 ({{ selectedPosts.length }})
              </el-button>
            </template>
          </div>

      <!-- 桌面端：表格视图 -->
      <el-table
        ref="tableRef"
        :data="posts"
        style="width: 100%"
        v-loading="loading"
        class="desktop-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="batchMode"
          type="selection"
          width="55"
        />
        <el-table-column prop="title" label="标题" min-width="250">
          <template #default="{ row }">
            <a class="post-title-link" @click="editPost(row)">
              {{ row.title }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="directory" label="所属目录" width="300">
          <template #default="{ row }">
            <el-tag v-if="row.directory" type="info" size="small">
              {{ row.directory }}
            </el-tag>
            <span v-else class="no-directory">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="categories" label="分类" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="cat in (row.params?.categories || [])"
              :key="cat"
              size="small"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ cat }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="120" align="center">
          <template #default="{ row }">
            <WeightEditor
              v-model="row.params.weight"
              type="weight"
              mode="inline"
              @save="(value) => updateWeight(row, value)"
              v-if="typeof row.params?.weight === 'number'"
            />
            <span v-else class="no-weight" @click="row.params = row.params || {}; row.params.weight = 0">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="标签" width="250">
          <template #default="{ row }">
            <el-tag
              v-for="tag in (row.params?.tags || [])"
              :key="tag"
              size="small"
              type="info"
              style="margin-right: 4px; margin-bottom: 4px"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="editPost(row)">
              编辑
            </el-button>
            <el-button text type="danger" @click="deletePost(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移动端：卡片视图 -->
      <div class="mobile-card-list" v-loading="loading">
        <div
          v-for="post in posts"
          :key="post.path"
          class="post-card"
          @click="editPost(post)"
        >
          <div class="post-card-header">
            <h3 class="post-card-title">{{ post.title }}</h3>
            <el-icon class="post-card-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="post-card-meta">
            <el-tag
              v-if="post.params?.categories && post.params.categories[0]"
              size="small"
              class="meta-tag"
            >
              {{ post.params.categories[0] }}
            </el-tag>
            <span class="post-card-date">{{ formatDate(post.date) }}</span>
          </div>
          <div v-if="post.params?.tags && post.params.tags.length" class="post-card-tags">
            <el-tag
              v-for="tag in post.params.tags.slice(0, 3)"
              :key="tag"
              size="small"
              type="info"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div class="post-card-actions" @click.stop>
            <el-button text type="danger" size="small" @click="deletePost(post)">
              删除
            </el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadPosts"
        @size-change="loadPosts"
        style="margin-top: 16px; justify-content: flex-end"
      />
        </el-card>
      </div>
    </div>

    <!-- 批量移动对话框 -->
    <el-dialog
      v-model="batchMoveDialogVisible"
      title="批量移动文章"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="目标目录">
          <DirectorySelector v-model="targetDirectory" placeholder="选择目标目录" />
        </el-form-item>
        <el-form-item>
          <el-alert type="info" :closable="false">
            已选择 {{ selectedPosts.length }} 篇文章
          </el-alert>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchMoveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchMove" :loading="batchMoving">
          确定移动
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑对话框 -->
    <el-dialog
      v-model="batchUpdateDialogVisible"
      title="批量编辑元数据"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchUpdateForm" label-width="120px">
        <el-form-item>
          <el-alert type="info" :closable="false">
            已选择 {{ selectedPosts.length }} 篇文章
          </el-alert>
        </el-form-item>

        <el-form-item label="更新模式">
          <el-radio-group v-model="batchUpdateForm.mode">
            <el-radio value="replace">替换</el-radio>
            <el-radio value="append">追加（仅分类/标签）</el-radio>
          </el-radio-group>
          <div class="form-hint">
            替换：覆盖原有值 | 追加：保留原有值并添加新值
          </div>
        </el-form-item>

        <el-form-item label="分类">
          <el-select
            v-model="batchUpdateForm.categories"
            multiple
            allow-create
            filterable
            placeholder="选择或输入分类"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="batchUpdateForm.tags"
            multiple
            allow-create
            filterable
            placeholder="选择或输入标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="权重">
          <el-input-number
            v-model="batchUpdateForm.weight"
            :min="0"
            :max="999"
            placeholder="不填则不修改"
            style="width: 100%"
          />
          <div class="form-hint">
            留空表示不修改权重
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchUpdateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchUpdate" :loading="batchUpdating">
          确定更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Close, Operation, Edit, Delete } from '@element-plus/icons-vue'
import { getPostsList, deletePostApi, updatePostWeight, batchMovePosts, batchDeletePosts, batchUpdatePosts } from '@/api/posts'
import { getDirectories } from '@/api/directory'
import { useTaxonomy } from '@/composables/useTaxonomy'
import DirectoryTree from '@/components/DirectoryTree.vue'
import DirectoryBreadcrumb from '@/components/DirectoryBreadcrumb.vue'
import DirectorySelector from '@/components/DirectorySelector.vue'
import WeightEditor from '@/components/WeightEditor.vue'

const router = useRouter()
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedTag = ref('')

// 使用全局分类标签管理
const { categories, tags } = useTaxonomy()

// 目录相关状态
const showDirectoryDrawer = ref(false)
const directoryTree = ref([])
const currentDirectory = ref('')

const posts = ref([])
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// 批量操作状态
const batchMode = ref(false)
const selectedPosts = ref([])
const tableRef = ref()

// 批量移动
const batchMoveDialogVisible = ref(false)
const targetDirectory = ref('')
const batchMoving = ref(false)

// 批量编辑
const batchUpdateDialogVisible = ref(false)
const batchUpdating = ref(false)
const batchUpdateForm = ref({
  mode: 'replace',
  categories: [],
  tags: [],
  weight: null
})

const loadPosts = async () => {
  loading.value = true
  try {
    // 如果使用了搜索、分类或标签筛选，则不限制目录（全局搜索）
    const hasFilter = searchQuery.value || selectedCategory.value || selectedTag.value

    const params = {
      page: pagination.value.page,
      size: pagination.value.size,
      search: searchQuery.value,
      category: selectedCategory.value,
      tag: selectedTag.value,
      directory: hasFilter ? '' : currentDirectory.value // 有筛选条件时全局搜索
    }
    console.log('📄 加载文章列表，参数:', params)

    const data = await getPostsList(params)

    posts.value = data.data.items || []
    pagination.value.total = data.data.total || 0

    console.log(`✅ 已加载 ${posts.value.length} 篇文章（共 ${pagination.value.total} 篇）`)
  } catch (error) {
    ElMessage.error('加载文章列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const createPost = () => {
  router.push({ name: 'PostCreate' })
}

const editPost = (post) => {
  router.push({
    name: 'PostEdit',
    query: { path: post.path }
  })
}

const deletePost = async (post) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章"${post.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deletePostApi(post.path)
    ElMessage.success('删除成功')
    loadPosts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 格式化日期（移动端）
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}-${day}`
}

// 格式化目录路径（去除数字前缀，如 "11.运维" -> "运维"）
const formatDirectory = (directory) => {
  if (!directory) return ''
  return directory
    .split('/')
    .map(part => part.replace(/^\d+\./, '').trim())
    .join(' / ')
}

// 加载目录树
const loadDirectories = async () => {
  try {
    const response = await getDirectories()
    console.log('📁 目录树 API 响应:', response)
    if (response.success && response.data?.tree) {
      directoryTree.value = response.data.tree
      console.log('✅ 目录树数据已加载，节点数:', response.data.tree.length)
    } else {
      console.warn('⚠️ 目录树数据格式错误或为空')
    }
  } catch (error) {
    console.error('❌ 加载目录树失败:', error)
  }
}

// 选择目录
const selectDirectory = (node) => {
  console.log('🎯 点击目录节点:', node)
  console.log('   - 目录路径:', node.path)
  console.log('   - 目录标题:', node.title)
  currentDirectory.value = node.path
  showDirectoryDrawer.value = false // 关闭移动端抽屉
  loadPosts() // 重新加载文章列表
}

// 面包屑导航
const navigateToDirectory = (path) => {
  currentDirectory.value = path
  loadPosts()
}

// 清除目录过滤
const clearDirectoryFilter = () => {
  currentDirectory.value = ''
  loadPosts()
}

// 更新文章权重
const updateWeight = async (post, weight) => {
  try {
    await updatePostWeight(post.path, weight)
    ElMessage.success('权重更新成功')
    post.weight = weight // 更新本地数据
  } catch (error) {
    ElMessage.error('权重更新失败')
    console.error(error)
  }
}

// 批量操作方法
const toggleBatchMode = () => {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    // 退出批量模式时清空选择
    selectedPosts.value = []
    tableRef.value?.clearSelection()
  }
}

const handleSelectionChange = (selection) => {
  selectedPosts.value = selection
}

const showBatchMoveDialog = () => {
  if (selectedPosts.value.length === 0) {
    ElMessage.warning('请先选择要移动的文章')
    return
  }
  targetDirectory.value = ''
  batchMoveDialogVisible.value = true
}

const confirmBatchMove = async () => {
  if (!targetDirectory.value) {
    ElMessage.warning('请选择目标目录')
    return
  }

  batchMoving.value = true
  try {
    const paths = selectedPosts.value.map(p => p.path)
    const res = await batchMovePosts(paths, targetDirectory.value)

    if (res.data && res.data.successCount > 0) {
      ElMessage.success(`成功移动 ${res.data.successCount} 篇文章`)
    }
    if (res.data && res.data.failedCount > 0) {
      ElMessage.warning(`${res.data.failedCount} 篇文章移动失败`)
      console.error('失败的文章:', res.data.failedItems, res.data.messages)
    }

    batchMoveDialogVisible.value = false
    selectedPosts.value = []
    batchMode.value = false
    await loadPosts()
  } catch (error) {
    ElMessage.error('批量移动失败：' + (error.message || '未知错误'))
    console.error(error)
  } finally {
    batchMoving.value = false
  }
}

const confirmBatchDelete = async () => {
  if (selectedPosts.value.length === 0) {
    ElMessage.warning('请先选择要删除的文章')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedPosts.value.length} 篇文章吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const paths = selectedPosts.value.map(p => p.path)
    const res = await batchDeletePosts(paths)

    if (res.data && res.data.successCount > 0) {
      ElMessage.success(`成功删除 ${res.data.successCount} 篇文章`)
    }
    if (res.data && res.data.failedCount > 0) {
      ElMessage.warning(`${res.data.failedCount} 篇文章删除失败`)
      console.error('失败的文章:', res.data.failedItems, res.data.messages)
    }

    selectedPosts.value = []
    batchMode.value = false
    await loadPosts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error.message || '未知错误'))
      console.error(error)
    }
  }
}

const showBatchUpdateDialog = () => {
  if (selectedPosts.value.length === 0) {
    ElMessage.warning('请先选择要编辑的文章')
    return
  }

  // 重置表单
  batchUpdateForm.value = {
    mode: 'replace',
    categories: [],
    tags: [],
    weight: null
  }

  batchUpdateDialogVisible.value = true
}

const confirmBatchUpdate = async () => {
  const metadata = {}
  let hasChanges = false

  // 构建要更新的元数据
  if (batchUpdateForm.value.categories && batchUpdateForm.value.categories.length > 0) {
    metadata.categories = batchUpdateForm.value.categories
    hasChanges = true
  }
  if (batchUpdateForm.value.tags && batchUpdateForm.value.tags.length > 0) {
    metadata.tags = batchUpdateForm.value.tags
    hasChanges = true
  }
  if (batchUpdateForm.value.weight !== null && batchUpdateForm.value.weight !== undefined) {
    metadata.weight = batchUpdateForm.value.weight
    hasChanges = true
  }

  if (!hasChanges) {
    ElMessage.warning('请至少选择一项要更新的内容')
    return
  }

  batchUpdating.value = true
  try {
    const paths = selectedPosts.value.map(p => p.path)
    const res = await batchUpdatePosts(paths, metadata, batchUpdateForm.value.mode)

    if (res.data && res.data.successCount > 0) {
      ElMessage.success(`成功更新 ${res.data.successCount} 篇文章`)
    }
    if (res.data && res.data.failedCount > 0) {
      ElMessage.warning(`${res.data.failedCount} 篇文章更新失败`)
      console.error('失败的文章:', res.data.failedItems, res.data.messages)
    }

    batchUpdateDialogVisible.value = false
    selectedPosts.value = []
    batchMode.value = false
    await loadPosts()
  } catch (error) {
    ElMessage.error('批量更新失败：' + (error.message || '未知错误'))
    console.error(error)
  } finally {
    batchUpdating.value = false
  }
}

onMounted(() => {
  loadDirectories()
  loadPosts()
})
</script>


<style scoped lang="scss">
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

// ============================================
// 主布局容器
// ============================================

.posts-list {
  height: 100%;
}

.posts-layout {
  display: flex;
  gap: $spacing-6;
  height: 100%;
}

// ============================================
// 左侧目录树 (Soft UI 风格)
// ============================================

.directory-sidebar {
  width: 250px;
  flex-shrink: 0;
  background: $bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-md;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: $spacing-5;
  border-bottom: 1px solid $border-light;
  background: $bg-secondary;

  h3 {
    margin: 0;
    font-size: $text-lg;
    font-weight: $font-semibold;
    color: $text-primary;
  }
}

.directory-sidebar :deep(.directory-tree) {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-3;

  @include scrollbar(6px, $border-default, transparent);
}

// ============================================
// 右侧内容区域
// ============================================

.content-area {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

// ============================================
// 列表头部
// ============================================

.list-header {
  @include flex-between;
}

.header-left {
  @include flex-start;
  gap: $spacing-4;

  span {
    font-size: $text-lg;
    font-weight: $font-semibold;
    color: $text-primary;
  }
}

.mobile-directory-btn {
  display: none;
}

// ============================================
// 面包屑导航栏
// ============================================

.breadcrumb-bar {
  @include flex-between;
  margin-bottom: $spacing-4;
  padding-bottom: $spacing-3;
  border-bottom: 1px solid $border-light;
}

.clear-filter-btn {
  flex-shrink: 0;
  margin-left: $spacing-3;
}

// ============================================
// 筛选栏 (现代化)
// ============================================

.filter-bar {
  display: flex;
  gap: $spacing-4;
  margin-bottom: $spacing-4;
  flex-wrap: wrap;

  :deep(.el-input),
  :deep(.el-select) {
    transition: $transition-all;

    &:focus-within {
      transform: translateY(-2px);
    }
  }
}

// ============================================
// 表格优化
// ============================================

.no-weight {
  color: $text-muted;
  cursor: pointer;
  font-size: $text-sm;
  transition: $transition-colors;

  &:hover {
    color: $primary;
  }
}

.no-directory {
  color: $text-muted;
  font-size: $text-sm;
}

.post-title-link {
  color: $primary;
  cursor: pointer;
  font-weight: $font-medium;
  transition: $transition-colors;

  &:hover {
    color: $primary-dark;
    text-decoration: underline;
  }
}

// ============================================
// 移动端卡片列表 (Soft UI 风格)
// ============================================

.mobile-card-list {
  display: none;
}

.post-card {
  @include card-soft;
  padding: $spacing-5;
  margin-bottom: $spacing-4;
  cursor: pointer;
  transition: all 150ms ease-out;  // 统一过渡

  &:hover {
    box-shadow: $shadow-lg;        // 仅阴影变化
    // ❌ 移除 transform: translateY(-2px)
  }

  // ❌ 移除 :active 动画
}

.post-card-header {
  @include flex-between;
  align-items: flex-start;
  margin-bottom: $spacing-3;
}

.post-card-title {
  flex: 1;
  margin: 0;
  font-size: $text-lg;
  font-weight: $font-medium;
  color: $text-primary;
  line-height: $leading-snug;
  word-break: break-word;
}

.post-card-arrow {
  flex-shrink: 0;
  margin-left: $spacing-2;
  color: $text-muted;
  font-size: $text-lg;
  transition: color 150ms ease-out;  // 仅颜色过渡

  .post-card:hover & {
    color: $primary;  // 变为主题色
    // ❌ 移除 transform: translateX(4px)
  }
}

.post-card-meta {
  @include flex-start;
  gap: $spacing-3;
  margin-bottom: $spacing-2;
}

.meta-tag {
  flex-shrink: 0;
}

.post-card-date {
  font-size: $text-sm;
  color: $text-muted;
}

.post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-2;
  margin-bottom: $spacing-2;
}

.tag-item {
  font-size: $text-xs;
}

.post-card-actions {
  @include flex-end;
  padding-top: $spacing-2;
  border-top: 1px solid $border-light;
}

// ============================================
// 批量操作工具栏
// ============================================

.batch-toolbar {
  @include flex-start;
  gap: $spacing-3;
  margin-bottom: $spacing-4;
  padding: $spacing-4;
  background: rgba($info, 0.06);
  border-radius: $radius-lg;
  border: 1px solid rgba($info, 0.12);
}

.batch-count {
  font-size: $text-base;
  color: $text-primary;
  font-weight: $font-medium;
}

.form-hint {
  margin-top: $spacing-1;
  font-size: $text-sm;
  color: $text-muted;
  line-height: $leading-relaxed;
}

// ============================================
// 响应式设计 (Mobile-First)
// ============================================

.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

// 平板和移动端
@media screen and (max-width: 768px) {
  .posts-layout {
    flex-direction: column;
    gap: 0;
  }

  // 隐藏桌面目录树
  .desktop-only {
    display: none;
  }

  // 显示移动端元素
  .mobile-only {
    display: block;
  }

  .mobile-directory-btn {
    display: inline-flex;
  }

  // 隐藏桌面表格
  .desktop-table {
    display: none;
  }

  // 显示移动端卡片
  .mobile-card-list {
    display: block;
  }

  .filter-bar {
    flex-direction: column;

    :deep(.el-input),
    :deep(.el-select) {
      width: 100% !important;
    }
  }

  .btn-text {
    display: none;
  }

  .list-header span {
    font-size: $text-base;
  }

  .batch-toolbar {
    flex-wrap: wrap;
  }
}

// 手机竖屏
@media screen and (max-width: 480px) {
  .post-card {
    padding: $spacing-4;
    border-radius: $radius-lg;
  }

  .post-card-title {
    font-size: $text-base;
  }

  .post-card-date {
    font-size: $text-xs;
  }

  .batch-toolbar {
    padding: $spacing-3;
  }
}
</style>
