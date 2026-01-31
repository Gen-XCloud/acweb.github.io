<template>
  <div class="icon-selector">
    <el-input
      v-model="displayValue"
      :placeholder="placeholder"
      readonly
      @click="showDialog = true"
    >
      <template #prefix v-if="modelValue">
        <el-icon :size="16">
          <component :is="modelValue" />
        </el-icon>
      </template>
      <template #append>
        <el-button @click.stop="showDialog = true">
          <el-icon><Search /></el-icon>
        </el-button>
      </template>
    </el-input>

    <!-- 图标选择对话框 -->
    <el-dialog
      v-model="showDialog"
      title="选择图标"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- 搜索框 -->
      <el-input
        v-model="searchKeyword"
        placeholder="搜索图标名称..."
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <!-- 图标列表 -->
      <div class="icon-list" v-loading="loading">
        <div
          v-for="icon in filteredIcons"
          :key="icon"
          class="icon-item"
          :class="{ active: modelValue === icon }"
          @click="handleSelect(icon)"
        >
          <el-icon :size="24">
            <component :is="icon" />
          </el-icon>
          <span class="icon-name">{{ icon }}</span>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="filteredIcons.length === 0"
          description="未找到匹配的图标"
          :image-size="100"
        />
      </div>

      <template #footer>
        <el-button @click="handleClear">清空</el-button>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请选择图标'
  }
})

const emit = defineEmits(['update:modelValue'])

const showDialog = ref(false)
const searchKeyword = ref('')
const loading = ref(false)
const selectedIcon = ref('')

// 获取所有图标
const allIcons = computed(() => {
  // 排除一些特殊的导出项
  return Object.keys(Icons).filter(key =>
    key !== 'default' &&
    typeof Icons[key] === 'object'
  )
})

// 过滤图标
const filteredIcons = computed(() => {
  if (!searchKeyword.value) {
    return allIcons.value
  }
  const keyword = searchKeyword.value.toLowerCase()
  return allIcons.value.filter(icon =>
    icon.toLowerCase().includes(keyword)
  )
})

// 显示值
const displayValue = computed(() => {
  return props.modelValue || ''
})

// 选择图标
function handleSelect(icon) {
  selectedIcon.value = icon
}

// 确认选择
function handleConfirm() {
  if (selectedIcon.value) {
    emit('update:modelValue', selectedIcon.value)
  }
  showDialog.value = false
}

// 清空选择
function handleClear() {
  selectedIcon.value = ''
  emit('update:modelValue', '')
  showDialog.value = false
}

// 监听对话框打开
import { watch } from 'vue'
watch(showDialog, (isOpen) => {
  if (isOpen) {
    selectedIcon.value = props.modelValue
    searchKeyword.value = ''
  }
})
</script>

<style scoped>
.icon-selector {
  width: 100%;
}

.search-input {
  margin-bottom: 16px;
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  background: white;
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 80px;
}

.icon-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.icon-name {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
}

.icon-item:hover .icon-name {
  color: var(--el-color-primary);
  font-weight: 500;
}
</style>
