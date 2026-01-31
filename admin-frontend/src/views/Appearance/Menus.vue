<template>
  <div class="menu-manager">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <div class="header-actions">
            <el-button
              size="default"
              @click="toggleExpandAll"
            >
              <el-icon>
                <component :is="isAllExpanded ? Fold : Expand" />
              </el-icon>
              {{ isAllExpanded ? '折叠全部' : '展开全部' }}
            </el-button>
            <el-button type="primary" @click="createMenu">
              <el-icon><Plus /></el-icon>
              新增菜单
            </el-button>
          </div>
        </div>
      </template>

      <!-- 菜单树形列表 -->
      <div class="menu-tree-wrapper" v-loading="loading">
        <el-tree
          v-if="menuList.length > 0"
          ref="treeRef"
          :data="menuTree"
          node-key="id"
          :props="treeProps"
          :default-expand-all="isAllExpanded"
          draggable
          @node-drop="handleDrop"
        >
          <template #default="{ node, data }">
            <div class="tree-node-content">
              <div class="node-left">
                <!-- 图标显示 -->
                <el-icon v-if="data.params?.icon" :size="18" class="menu-icon">
                  <component :is="data.params.icon" />
                </el-icon>

                <span class="node-name">{{ data.name }}</span>

                <!-- 菜单类型标签 -->
                <el-tag v-if="getMenuType(data) === 'parent'" size="small" type="warning">
                  📂 父菜单
                </el-tag>
                <el-tag v-else-if="getMenuType(data) === 'child'" size="small" type="info">
                  📄 子菜单
                </el-tag>
                <el-tag v-else size="small" type="success">
                  📌 顶级
                </el-tag>

                <el-tag v-if="data.identifier" size="small" type="info">
                  ID: {{ data.identifier }}
                </el-tag>
                <el-tag v-if="data.params?.external" size="small" type="warning">
                  外部链接
                </el-tag>
                <el-tag v-if="data.params?.hidden" size="small" type="info">
                  隐藏
                </el-tag>
              </div>

              <div class="node-right">
                <span class="node-url">{{ data.url }}</span>
                <span class="node-weight">权重: {{ data.weight }}</span>
                <el-button text type="primary" @click.stop="editMenu(data)">
                  编辑
                </el-button>
                <el-button text type="danger" @click.stop="deleteMenu(data)">
                  删除
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>

        <!-- 空状态 -->
        <el-empty v-else description="暂无菜单项，点击右上角按钮新增" />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <MenuEditDialog
      v-model="showDialog"
      :menu-item="currentItem"
      :url-suggestions="urlSuggestions"
      :parent-options="parentOptions"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Fold, Expand } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'
import {
  getMenus,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenus
} from '@/api/menus'
import MenuEditDialog from '@/components/MenuEditDialog.vue'

const loading = ref(false)
const menuList = ref([])
const urlSuggestions = ref({
  sections: [],
  common: []
})
const showDialog = ref(false)
const currentItem = ref(null)
const treeRef = ref(null)
const isAllExpanded = ref(true)

const treeProps = {
  children: 'children',
  label: 'name'
}

// 构建树形结构
const menuTree = computed(() => {
  return buildTree(menuList.value)
})

// 父级选项（用于编辑时选择父级）
const parentOptions = computed(() => {
  return menuList.value
    .filter(item => item.identifier)
    .map(item => ({
      label: item.name,
      value: item.identifier
    }))
})

// 构建树形结构
function buildTree(items) {
  const tree = []
  const map = new Map()

  // 先创建映射
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  // 构建树
  items.forEach(item => {
    const node = map.get(item.id)
    if (item.parent) {
      // 找到父节点
      let parentNode = null
      items.forEach(parentItem => {
        if (parentItem.identifier === item.parent) {
          parentNode = map.get(parentItem.id)
        }
      })

      if (parentNode) {
        parentNode.children.push(node)
      } else {
        // 父节点不存在，作为根节点
        tree.push(node)
      }
    } else {
      tree.push(node)
    }
  })

  return tree
}

// 加载菜单
async function loadMenus() {
  loading.value = true
  try {
    const response = await getMenus()
    menuList.value = response.data.items || []
    urlSuggestions.value.sections = response.data.urlMappings || []
    urlSuggestions.value.common = ['/', '/archives/', '/categories/', '/tags/']
  } catch (error) {
    ElMessage.error('加载菜单失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 新增菜单
function createMenu() {
  currentItem.value = {
    name: '',
    url: '',
    weight: menuList.value.length + 1,
    identifier: '',
    parent: '',
    params: {
      icon: '',
      description: '',
      external: false,
      hidden: false,
      target: '_blank'
    }
  }
  showDialog.value = true
}

// 编辑菜单
function editMenu(item) {
  // 使用深拷贝确保数据独立
  currentItem.value = {
    ...item,
    params: item.params ? { ...item.params } : {}
  }
  showDialog.value = true
}

// 保存菜单
async function handleSave(item) {
  try {
    if (item.id) {
      await updateMenuItem(item.id, item)
      ElMessage.success('菜单更新成功')
    } else {
      await createMenuItem(item)
      ElMessage.success('菜单创建成功')
    }

    showDialog.value = false
    loadMenus()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
    console.error(error)
  }
}

// 删除菜单
async function deleteMenu(item) {
  // 只对有标识符的父菜单检查子菜单
  if (item.identifier) {
    const children = menuList.value.filter(menu => menu.parent === item.identifier)
    if (children.length > 0) {
      const childNames = children.map(c => c.name).join('、')
      ElMessage.warning(`此菜单有 ${children.length} 个子菜单（${childNames}），请先删除子菜单`)
      return
    }
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除菜单"${item.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteMenuItem(item.id)
    ElMessage.success('删除成功')
    loadMenus()
  } catch (error) {
    if (error !== 'cancel') {
      const errorMsg = error.response?.data?.error || error.message || '删除失败'
      ElMessage.error(errorMsg)
      console.error('删除菜单失败:', error)
    }
  }
}

// 判断菜单类型
function getMenuType(item) {
  if (item.identifier) {
    return 'parent' // 有标识符，可以作为父菜单
  } else if (item.parent) {
    return 'child' // 有父级，是子菜单
  } else {
    return 'top' // 顶级独立菜单
  }
}

// 一键折叠/展开
function toggleExpandAll() {
  isAllExpanded.value = !isAllExpanded.value

  // 获取所有节点
  const nodes = treeRef.value?.store?.root?.childNodes
  if (!nodes) return

  // 递归展开/折叠所有节点
  function toggleNodes(nodeList) {
    nodeList.forEach(node => {
      node.expanded = isAllExpanded.value
      if (node.childNodes && node.childNodes.length > 0) {
        toggleNodes(node.childNodes)
      }
    })
  }

  toggleNodes(nodes)
}

// 拖拽排序
async function handleDrop() {
  // 重新计算权重
  const updateItems = []
  let weight = 1

  function traverse(nodes) {
    nodes.forEach(node => {
      updateItems.push({
        id: node.id,
        weight: weight++
      })
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }

  traverse(menuTree.value)

  try {
    await reorderMenus({ items: updateItems })
    ElMessage.success('排序更新成功')
    loadMenus()
  } catch (error) {
    ElMessage.error('排序更新失败')
    console.error(error)
  }
}

onMounted(() => {
  loadMenus()
})
</script>

<style scoped>
.menu-manager {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.menu-tree-wrapper {
  min-height: 400px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 16px;
  flex: 1;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.node-name {
  font-weight: 500;
}

.node-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-url {
  color: #909399;
  font-size: 12px;
}

.node-weight {
  color: #909399;
  font-size: 12px;
}
</style>
