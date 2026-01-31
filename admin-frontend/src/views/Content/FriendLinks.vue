<template>
  <div class="friendlinks-manager">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>友链管理</span>
          <el-button type="primary" @click="addGroup">
            <el-icon><Plus /></el-icon>
            新增分组
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 友链分组列表 -->
        <el-collapse v-model="activeGroups" v-if="friendLinks.links && friendLinks.links.length > 0">
          <el-collapse-item
            v-for="(group, groupIndex) in friendLinks.links"
            :key="groupIndex"
            :name="groupIndex"
          >
            <template #title>
              <div class="group-header">
                <span class="group-title">{{ group.title || '未命名分组' }}</span>
                <el-tag type="info" size="small">{{ group.list.length }} 个友链</el-tag>
              </div>
            </template>

            <!-- 分组基础信息 -->
            <div class="group-info">
              <el-form label-width="80px">
                <el-form-item label="分组标题">
                  <el-input v-model="group.title" placeholder="请输入分组标题" />
                </el-form-item>
                <el-form-item label="分组描述">
                  <el-input v-model="group.desc" placeholder="请输入分组描述（可选）" />
                </el-form-item>
              </el-form>

              <!-- 操作按钮 -->
              <div class="group-actions">
                <el-button type="primary" size="small" @click="addLink(groupIndex)">
                  <el-icon><Plus /></el-icon>
                  新增友链
                </el-button>
                <el-button type="danger" size="small" @click="deleteGroup(groupIndex)">
                  删除分组
                </el-button>
              </div>
            </div>

            <!-- 友链列表 -->
            <div class="links-list">
              <el-row :gutter="20">
                <el-col
                  v-for="(link, linkIndex) in group.list"
                  :key="linkIndex"
                  :xs="24"
                  :sm="12"
                  :md="8"
                  :lg="6"
                >
                  <el-card class="link-card" shadow="hover">
                    <div class="link-preview">
                      <el-avatar :src="link.avatar" :size="60">
                        {{ link.name.charAt(0) }}
                      </el-avatar>
                      <div class="link-info">
                        <div class="link-name">
                          {{ link.name }}
                          <el-tag v-if="link.badge" type="warning" size="small">
                            {{ link.badge }}
                          </el-tag>
                        </div>
                        <div class="link-desc">{{ link.description }}</div>
                      </div>
                    </div>

                    <div class="link-actions">
                      <el-button text type="primary" size="small" @click="editLink(groupIndex, linkIndex)">
                        编辑
                      </el-button>
                      <el-button text type="danger" size="small" @click="deleteLink(groupIndex, linkIndex)">
                        删除
                      </el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 空状态 -->
        <el-empty v-else description="暂无友链分组，点击右上角按钮新增" />
      </div>

      <template #footer>
        <el-button type="primary" :loading="saving" @click="save">
          保存所有更改
        </el-button>
      </template>
    </el-card>

    <!-- 编辑友链对话框 -->
    <el-dialog
      v-model="showLinkDialog"
      title="编辑友链"
      width="600px"
    >
      <el-form :model="currentLink" label-width="100px">
        <el-form-item label="友链名称" required>
          <el-input v-model="currentLink.name" placeholder="请输入友链名称" />
        </el-form-item>

        <el-form-item label="友链URL" required>
          <el-input v-model="currentLink.url" placeholder="https://example.com" />
        </el-form-item>

        <el-form-item label="头像URL" required>
          <el-input v-model="currentLink.avatar" placeholder="https://example.com/avatar.png">
            <template #append>
              <el-button @click="previewAvatar">预览</el-button>
            </template>
          </el-input>
          <el-avatar v-if="currentLink.avatar" :src="currentLink.avatar" :size="50" style="margin-top: 10px" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="currentLink.description"
            type="textarea"
            :rows="3"
            placeholder="请输入友链描述"
          />
        </el-form-item>

        <el-form-item label="徽章">
          <el-input v-model="currentLink.badge" placeholder="可选，如：Teek作者" />
        </el-form-item>

        <el-form-item label="不规则显示">
          <el-switch v-model="currentLink.irregular" />
          <span style="margin-left: 10px; font-size: 12px; color: #909399;">
            开启后友链卡片样式略有不同
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="saveLinkEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getFriendLinks, updateFriendLinks } from '@/api/content'

const loading = ref(false)
const saving = ref(false)
const friendLinks = ref({ links: [] })
const activeGroups = ref([0])
const showLinkDialog = ref(false)
const currentLink = ref({})
const currentEditIndex = ref({ groupIndex: -1, linkIndex: -1 })

// 加载友链数据
async function loadData() {
  loading.value = true
  try {
    const response = await getFriendLinks()
    friendLinks.value = response.data || { links: [] }
    // 默认展开第一个分组
    if (friendLinks.value.links.length > 0) {
      activeGroups.value = [0]
    }
  } catch (error) {
    ElMessage.error('加载友链数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 新增分组
function addGroup() {
  friendLinks.value.links.push({
    title: '新分组',
    desc: '',
    list: []
  })
  // 展开新分组
  activeGroups.value.push(friendLinks.value.links.length - 1)
}

// 删除分组
async function deleteGroup(groupIndex) {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组"${friendLinks.value.links[groupIndex].title}"吗？此操作将删除该分组下的所有友链。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    friendLinks.value.links.splice(groupIndex, 1)
    ElMessage.success('分组删除成功')
  } catch (error) {
    // 用户取消
  }
}

// 新增友链
function addLink(groupIndex) {
  currentLink.value = {
    name: '新友链',
    url: 'https://example.com',
    avatar: 'https://example.com/avatar.png',
    description: '网站描述',
    badge: '',
    irregular: true
  }
  currentEditIndex.value = { groupIndex, linkIndex: -1 }
  showLinkDialog.value = true
}

// 编辑友链
function editLink(groupIndex, linkIndex) {
  const link = friendLinks.value.links[groupIndex].list[linkIndex]
  currentLink.value = { ...link }
  currentEditIndex.value = { groupIndex, linkIndex }
  showLinkDialog.value = true
}

// 保存友链编辑
function saveLinkEdit() {
  if (!currentLink.value.name || !currentLink.value.url || !currentLink.value.avatar) {
    ElMessage.warning('请填写必填项')
    return
  }

  const { groupIndex, linkIndex } = currentEditIndex.value

  if (linkIndex === -1) {
    // 新增
    friendLinks.value.links[groupIndex].list.push({ ...currentLink.value })
  } else {
    // 编辑
    friendLinks.value.links[groupIndex].list[linkIndex] = { ...currentLink.value }
  }

  showLinkDialog.value = false
  ElMessage.success(linkIndex === -1 ? '友链添加成功' : '友链更新成功')
}

// 删除友链
async function deleteLink(groupIndex, linkIndex) {
  try {
    const link = friendLinks.value.links[groupIndex].list[linkIndex]
    await ElMessageBox.confirm(
      `确定要删除友链"${link.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    friendLinks.value.links[groupIndex].list.splice(linkIndex, 1)
    ElMessage.success('友链删除成功')
  } catch (error) {
    // 用户取消
  }
}

// 预览头像
function previewAvatar() {
  if (!currentLink.value.avatar) {
    ElMessage.warning('请先输入头像URL')
  }
}

// 保存所有更改
async function save() {
  saving.value = true
  try {
    await updateFriendLinks(friendLinks.value)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.friendlinks-manager {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.group-title {
  font-size: 16px;
  font-weight: 500;
}

.group-info {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.group-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.links-list {
  padding: 16px;
}

.link-card {
  margin-bottom: 16px;
  height: 100%;
}

.link-preview {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.link-desc {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.link-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}
</style>
