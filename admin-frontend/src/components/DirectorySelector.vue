<template>
  <div class="directory-selector">
    <el-input
      :model-value="displayValue"
      placeholder="点击选择目录"
      readonly
      :clearable="clearable"
      @click="showDialog = true"
      @clear="handleClear"
    >
      <template #prefix>
        <el-icon><Folder /></el-icon>
      </template>
      <template #suffix>
        <el-icon><ArrowDown /></el-icon>
      </template>
    </el-input>

    <el-dialog
      v-model="showDialog"
      title="选择保存目录"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="selector-content">
        <!-- 搜索框 -->
        <el-input
          v-model="searchText"
          placeholder="搜索目录..."
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 目录树 -->
        <div class="tree-container">
          <el-tree
            ref="treeRef"
            :data="filteredTreeData"
            :props="treeProps"
            :highlight-current="true"
            :expand-on-click-node="false"
            :default-expand-all="false"
            node-key="path"
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="node-icon">
                  <el-icon><Folder /></el-icon>
                </span>
                <span class="node-label">
                  {{ data.title }}
                </span>
                <span v-if="data.fileCount !== undefined" class="node-count">
                  ({{ data.fileCount }}篇)
                </span>
              </div>
            </template>
          </el-tree>

          <!-- 空状态 -->
          <el-empty
            v-if="filteredTreeData.length === 0"
            description="未找到匹配的目录"
            :image-size="80"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Folder, ArrowDown, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getDirectories } from '@/api/directory'

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
  modelValue: string
  placeholder?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '点击选择目录',
  clearable: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showDialog = ref(false)
const searchText = ref('')
const treeRef = ref()
const treeData = ref<TreeNode[]>([])
const selectedPath = ref('')
const loading = ref(false)

const treeProps = {
  children: 'children',
  label: 'title'
}

// 显示值（显示完整路径，保留数字前缀）
const displayValue = computed(() => {
  if (!props.modelValue) return ''

  // 直接显示完整路径（路径本身就包含数字前缀）
  // 例如: "40.专题/20.编程/20.go"
  return props.modelValue
})

// 过滤后的树数据（基于搜索）
const filteredTreeData = computed(() => {
  if (!searchText.value) return treeData.value

  return filterTree(treeData.value, searchText.value.toLowerCase())
})

// 递归查找节点
function findNodeByPath(nodes: TreeNode[], path: string): TreeNode | null {
  for (const node of nodes) {
    if (node.path === path || node.fullPath === path) {
      return node
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path)
      if (found) return found
    }
  }
  return null
}

// 递归过滤树（包含匹配的节点及其父节点）
function filterTree(nodes: TreeNode[], keyword: string): TreeNode[] {
  const result: TreeNode[] = []

  for (const node of nodes) {
    const titleMatch = node.title.toLowerCase().includes(keyword)
    const pathMatch = node.path.toLowerCase().includes(keyword)

    let filteredChildren: TreeNode[] = []
    if (node.children) {
      filteredChildren = filterTree(node.children, keyword)
    }

    if (titleMatch || pathMatch || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      })
    }
  }

  return result
}

// 加载目录树数据
async function loadDirectories() {
  loading.value = true
  try {
    const response = await getDirectories()
    if (response.success && response.data?.tree) {
      treeData.value = response.data.tree
    }
  } catch (error) {
    console.error('加载目录树失败:', error)
    ElMessage.error('加载目录树失败')
  } finally {
    loading.value = false
  }
}

// 节点点击事件
function handleNodeClick(data: TreeNode) {
  selectedPath.value = data.path
  // 高亮选中节点
  treeRef.value?.setCurrentKey(data.path)
}

// 确认选择
function handleConfirm() {
  if (!selectedPath.value) {
    ElMessage.warning('请选择一个目录')
    return
  }

  emit('update:modelValue', selectedPath.value)
  showDialog.value = false
}

// 清除选择
function handleClear() {
  emit('update:modelValue', '')
  selectedPath.value = ''
}

// 监听对话框打开，重置状态
watch(showDialog, (newVal) => {
  if (newVal) {
    selectedPath.value = props.modelValue
    searchText.value = ''

    // 设置当前选中节点
    if (selectedPath.value && treeRef.value) {
      treeRef.value.setCurrentKey(selectedPath.value)
    }
  }
})

// 组件挂载时加载数据
onMounted(() => {
  loadDirectories()
})
</script>

<style scoped lang="scss">
.directory-selector {
  width: 100%;

  :deep(.el-input__inner) {
    cursor: pointer;
  }

  .selector-content {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .search-input {
      width: 100%;
    }

    .tree-container {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 8px;

      :deep(.el-tree) {
        background-color: transparent;
      }

      :deep(.el-tree-node__content) {
        height: 36px;
        line-height: 36px;

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

        .node-icon {
          display: flex;
          align-items: center;
          margin-right: 6px;
          font-size: 16px;
          color: #faad14;
        }

        .node-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          .node-weight {
            color: #1890ff;
            font-weight: 500;
            margin-right: 4px;
          }
        }

        .node-count {
          margin-left: 8px;
          font-size: 12px;
          color: #8c8c8c;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
