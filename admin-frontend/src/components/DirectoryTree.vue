<template>
  <div class="directory-tree">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :current-node-key="currentPath"
      :highlight-current="true"
      :expand-on-click-node="false"
      :default-expand-all="false"
      :draggable="draggable"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
      node-key="path"
      @node-click="handleNodeClick"
      @node-contextmenu="handleContextMenu"
      @node-drop="handleDrop"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <span class="node-icon">
            <el-icon v-if="data.isFolder">
              <Folder />
            </el-icon>
            <el-icon v-else>
              <Document />
            </el-icon>
          </span>
          <span class="node-label" :title="getDisplayName(data)">
            {{ getDisplayName(data) }}
          </span>
          <span v-if="data.fileCount !== undefined" class="node-count">
            ({{ data.fileCount }})
          </span>
        </div>
      </template>
    </el-tree>

    <!-- 右键菜单 -->
    <el-dialog
      v-model="contextMenuVisible"
      :title="contextMenuTitle"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-menu @select="handleMenuSelect">
        <el-menu-item index="create" v-if="currentNode">
          <el-icon><FolderAdd /></el-icon>
          <span>新建子文件夹</span>
        </el-menu-item>
        <el-menu-item index="rename" v-if="currentNode">
          <el-icon><Edit /></el-icon>
          <span>重命名</span>
        </el-menu-item>
        <el-menu-item index="delete" v-if="currentNode">
          <el-icon><Delete /></el-icon>
          <span>删除文件夹</span>
        </el-menu-item>
      </el-menu>
    </el-dialog>

    <!-- 创建文件夹对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建文件夹"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
        <el-form-item label="文件夹名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="例如：Docker 或 运维"
            clearable
          />
        </el-form-item>
        <el-form-item label="数字前缀">
          <el-input-number
            v-model="createForm.weight"
            :min="0"
            :max="999"
            placeholder="不填则不添加前缀"
            style="width: 100%"
          />
          <div class="form-hint">
            添加数字前缀可以控制排序，如 11、20、30
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate" :loading="creating">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog
      v-model="renameDialogVisible"
      title="重命名文件夹"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="renameForm" :rules="renameRules" ref="renameFormRef" label-width="120px">
        <el-form-item label="新名称" prop="name">
          <el-input
            v-model="renameForm.name"
            placeholder="请输入新名称"
            clearable
          />
          <div class="form-hint">
            可以包含数字前缀，如 "15.新名称"
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRename" :loading="renaming">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Folder, Document, FolderAdd, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createDirectory, renameDirectory, deleteDirectory, updateDirectoryWeight } from '../api/directory'

interface TreeNode {
  title: string
  path: string
  fullPath: string
  isFolder: boolean
  level: number
  weight?: number
  fileCount?: number
  children?: TreeNode[]
}

interface Props {
  data: TreeNode[]
  currentPath?: string
  showFiles?: boolean
  selectable?: boolean
  draggable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentPath: '',
  showFiles: false,
  selectable: false,
  draggable: false
})

const emit = defineEmits<{
  select: [node: TreeNode]
  dragEnd: [dragNode: TreeNode, dropNode: TreeNode, position: string]
  refresh: []
}>()

const treeRef = ref()
const currentNode = ref<TreeNode | null>(null)
const contextMenuVisible = ref(false)
const contextMenuTitle = ref('')

// 创建文件夹
const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const creating = ref(false)
const createForm = ref({
  name: '',
  weight: 0
})
const createRules: FormRules = {
  name: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' }
  ]
}

// 重命名文件夹
const renameDialogVisible = ref(false)
const renameFormRef = ref<FormInstance>()
const renaming = ref(false)
const renameForm = ref({
  name: ''
})
const renameRules: FormRules = {
  name: [
    { required: true, message: '请输入新名称', trigger: 'blur' }
  ]
}

const treeProps = {
  children: 'children',
  label: 'title',
  isLeaf: (data: TreeNode) => {
    if (props.showFiles) {
      return !data.isFolder && (!data.children || data.children.length === 0)
    }
    return !data.isFolder
  }
}

// 过滤树数据（如果不显示文件，则只保留目录）
const treeData = computed(() => {
  if (props.showFiles) {
    return props.data
  }
  return filterFoldersOnly(props.data)
})

// 递归过滤，只保留目录节点
function filterFoldersOnly(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .filter(node => node.isFolder)
    .map(node => ({
      ...node,
      children: node.children ? filterFoldersOnly(node.children) : undefined
    }))
}

// 获取显示名称（保留数字前缀）
function getDisplayName(node: TreeNode): string {
  // 返回 path 的最后一段，保留完整名称（包括数字前缀）
  const parts = node.path.split('/')
  return parts[parts.length - 1]
}

// 节点点击事件
function handleNodeClick(data: TreeNode) {
  emit('select', data)
}

// 右键菜单
function handleContextMenu(event: MouseEvent, data: TreeNode, node: any, element: any) {
  event.preventDefault()
  currentNode.value = data
  contextMenuTitle.value = `管理: ${getDisplayName(data)}`
  contextMenuVisible.value = true
}

// 菜单选择
function handleMenuSelect(index: string) {
  contextMenuVisible.value = false

  switch (index) {
    case 'create':
      showCreateDialog()
      break
    case 'rename':
      showRenameDialog()
      break
    case 'delete':
      showDeleteConfirm()
      break
  }
}

// 显示创建文件夹对话框
function showCreateDialog() {
  createForm.value = {
    name: '',
    weight: 0
  }
  createDialogVisible.value = true
}

// 确认创建
async function confirmCreate() {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return

    creating.value = true
    try {
      const res = await createDirectory({
        parentPath: currentNode.value?.path || '',
        name: createForm.value.name,
        weight: createForm.value.weight
      })

      if (res.success) {
        ElMessage.success('文件夹创建成功')
        createDialogVisible.value = false
        emit('refresh')
      } else {
        ElMessage.error(res.error || '创建失败')
      }
    } catch (error: any) {
      ElMessage.error('创建失败：' + error.message)
    } finally {
      creating.value = false
    }
  })
}

// 显示重命名对话框
function showRenameDialog() {
  if (!currentNode.value) return

  renameForm.value = {
    name: getDisplayName(currentNode.value)
  }
  renameDialogVisible.value = true
}

// 确认重命名
async function confirmRename() {
  if (!renameFormRef.value || !currentNode.value) return

  await renameFormRef.value.validate(async (valid) => {
    if (!valid) return

    renaming.value = true
    try {
      const res = await renameDirectory(currentNode.value!.path, renameForm.value.name)

      if (res.success) {
        ElMessage.success('重命名成功')
        renameDialogVisible.value = false
        emit('refresh')
      } else {
        ElMessage.error(res.error || '重命名失败')
      }
    } catch (error: any) {
      ElMessage.error('重命名失败：' + error.message)
    } finally {
      renaming.value = false
    }
  })
}

// 显示删除确认
function showDeleteConfirm() {
  if (!currentNode.value) return

  ElMessageBox.confirm(
    `确定要删除文件夹 "${getDisplayName(currentNode.value)}" 吗？如果文件夹内有文章，将无法删除。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await deleteDirectory(currentNode.value!.path)

      if (res.success) {
        ElMessage.success('文件夹删除成功')
        emit('refresh')
      } else {
        ElMessage.error(res.error || '删除失败')
      }
    } catch (error: any) {
      ElMessage.error('删除失败：' + error.message)
    }
  }).catch(() => {
    // 用户取消
  })
}

// 拖拽相关
function allowDrag(node: any) {
  // 只允许拖拽一级目录（根目录下的文件夹）
  return props.draggable && node.level === 1
}

function allowDrop(draggingNode: any, dropNode: any, type: string) {
  // 只允许在同一级别之间拖拽（before 或 after）
  return type !== 'inner' && dropNode.level === 1
}

async function handleDrop(draggingNode: any, dropNode: any, dropType: string) {
  // 获取所有一级节点
  const rootNodes = treeData.value

  // 找到拖拽节点的新位置
  const dragIndex = rootNodes.findIndex((n: TreeNode) => n.path === draggingNode.data.path)
  if (dragIndex === -1) return

  // 计算新的权重
  let newWeight = 0

  if (dropType === 'before') {
    // 插入到目标节点之前
    const targetIndex = rootNodes.findIndex((n: TreeNode) => n.path === dropNode.data.path)
    if (targetIndex === 0) {
      // 插入到第一个位置
      newWeight = (rootNodes[0].weight || 10) - 5
    } else {
      // 计算中间权重
      const prevWeight = rootNodes[targetIndex - 1].weight || 0
      const nextWeight = rootNodes[targetIndex].weight || 10
      newWeight = Math.floor((prevWeight + nextWeight) / 2)
    }
  } else {
    // 插入到目标节点之后
    const targetIndex = rootNodes.findIndex((n: TreeNode) => n.path === dropNode.data.path)
    if (targetIndex === rootNodes.length - 1) {
      // 插入到最后一个位置
      newWeight = (rootNodes[rootNodes.length - 1].weight || 10) + 5
    } else {
      // 计算中间权重
      const prevWeight = rootNodes[targetIndex].weight || 0
      const nextWeight = rootNodes[targetIndex + 1].weight || 10
      newWeight = Math.floor((prevWeight + nextWeight) / 2)
    }
  }

  // 调用 API 更新权重
  try {
    const res = await updateDirectoryWeight(draggingNode.data.path, newWeight)

    if (res.success) {
      ElMessage.success('目录排序成功')
      emit('refresh')
    } else {
      ElMessage.error(res.error || '排序失败')
      // 刷新以恢复原始顺序
      emit('refresh')
    }
  } catch (error: any) {
    ElMessage.error('排序失败：' + error.message)
    // 刷新以恢复原始顺序
    emit('refresh')
  }
}

// 监听 currentPath 变化，更新选中状态
watch(() => props.currentPath, (newPath) => {
  if (newPath && treeRef.value) {
    treeRef.value.setCurrentKey(newPath)
  }
}, { immediate: true })

// 暴露方法给父组件
defineExpose({
  setCurrentKey: (key: string) => {
    treeRef.value?.setCurrentKey(key)
  },
  getCurrentKey: () => {
    return treeRef.value?.getCurrentKey()
  },
  getCurrentNode: () => {
    return treeRef.value?.getCurrentNode()
  }
})
</script>

<style scoped lang="scss">
.directory-tree {
  width: 100%;
  height: 100%;
  overflow-y: auto;

  :deep(.el-tree) {
    background-color: transparent;
    color: inherit;
  }

  :deep(.el-tree-node__content) {
    height: 36px;
    line-height: 36px;
    padding-right: 8px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  }

  .tree-node {
    display: flex;
    align-items: center;
    width: 100%;
    font-size: 14px;
    user-select: none;

    .node-icon {
      display: flex;
      align-items: center;
      margin-right: 6px;
      font-size: 16px;
      color: #8c8c8c;
    }

    .node-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .node-count {
      margin-left: 8px;
      font-size: 12px;
      color: #8c8c8c;
    }
  }

  .form-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  // 暗色主题支持
  &.dark {
    :deep(.el-tree-node__content:hover) {
      background-color: rgba(255, 255, 255, 0.08);
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: #111b26;
      color: #1890ff;
    }

    .tree-node {
      .node-icon {
        color: rgba(255, 255, 255, 0.45);
      }

      .node-count {
        color: rgba(255, 255, 255, 0.45);
      }
    }

    .form-hint {
      color: rgba(255, 255, 255, 0.45);
    }
  }
}
</style>
