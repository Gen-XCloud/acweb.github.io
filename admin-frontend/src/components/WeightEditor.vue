<template>
  <div class="weight-editor">
    <!-- 内联编辑模式 -->
    <div v-if="mode === 'inline'" class="inline-editor">
      <div v-if="!editing" class="display-value" @click="startEdit">
        <span class="weight-value">{{ displayValue }}</span>
        <el-icon class="edit-icon"><Edit /></el-icon>
      </div>

      <div v-else class="edit-input">
        <el-input-number
          ref="inputRef"
          v-model="localValue"
          :min="min"
          :max="max"
          :step="step"
          :precision="0"
          :controls="false"
          size="small"
          @blur="handleBlur"
          @keyup.enter="handleSave"
          @keyup.esc="handleCancel"
        />
        <el-button
          size="small"
          type="primary"
          :icon="Check"
          @click="handleSave"
        />
        <el-button
          size="small"
          :icon="Close"
          @click="handleCancel"
        />
      </div>
    </div>

    <!-- 对话框模式 -->
    <div v-else-if="mode === 'dialog'" class="dialog-trigger">
      <el-button
        :size="size"
        :type="buttonType"
        @click="showDialog = true"
      >
        <el-icon><Sort /></el-icon>
        <span v-if="!hideLabel">设置权重</span>
      </el-button>

      <el-dialog
        v-model="showDialog"
        title="设置排序权重"
        width="400px"
      >
        <el-form label-width="80px">
          <el-form-item label="权重值">
            <el-input-number
              v-model="localValue"
              :min="min"
              :max="max"
              :step="step"
              :precision="0"
              style="width: 100%"
            />
            <div class="hint">
              较大的权重值会排在前面。范围: {{ min }} - {{ max }}
            </div>
          </el-form-item>

          <el-form-item v-if="type === 'prefix'" label="效果预览">
            <div class="preview">
              文件名将变为: <code>{{ localValue }}.{{ previewFilename }}</code>
            </div>
          </el-form-item>
        </el-form>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showDialog = false">取消</el-button>
            <el-button type="primary" @click="handleDialogSave">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <!-- 标签模式（只读显示） -->
    <div v-else class="tag-mode">
      <el-tag :size="size" :type="tagType">
        {{ type === 'prefix' ? `#${modelValue}` : `权重: ${modelValue}` }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Edit, Check, Close, Sort } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: number
  type?: 'prefix' | 'weight'
  mode?: 'inline' | 'dialog' | 'tag'
  min?: number
  max?: number
  step?: number
  size?: 'large' | 'default' | 'small'
  buttonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  tagType?: 'success' | 'info' | 'warning' | 'danger'
  hideLabel?: boolean
  filename?: string // 用于预览文件名（仅 prefix 模式）
}

const props = withDefaults(defineProps<Props>(), {
  type: 'weight',
  mode: 'inline',
  min: 0,
  max: 9999,
  step: 1,
  size: 'default',
  buttonType: 'text',
  tagType: 'info',
  hideLabel: false,
  filename: 'example.md'
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  save: [value: number]
}>()

const editing = ref(false)
const showDialog = ref(false)
const localValue = ref(props.modelValue)
const inputRef = ref()

// 显示值
const displayValue = computed(() => {
  if (props.type === 'prefix') {
    return props.modelValue > 0 ? `#${props.modelValue}` : '无'
  }
  return props.modelValue
})

// 预览文件名（去除已有的数字前缀）
const previewFilename = computed(() => {
  if (!props.filename) return 'example.md'
  // 移除已有的数字前缀
  return props.filename.replace(/^\d+\./, '')
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 开始编辑
function startEdit() {
  editing.value = true
  localValue.value = props.modelValue

  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 取消编辑
function handleCancel() {
  editing.value = false
  localValue.value = props.modelValue
}

// 保存编辑
function handleSave() {
  if (localValue.value < props.min || localValue.value > props.max) {
    ElMessage.warning(`权重值必须在 ${props.min} - ${props.max} 之间`)
    return
  }

  emit('update:modelValue', localValue.value)
  emit('save', localValue.value)
  editing.value = false
}

// 失去焦点时保存
function handleBlur() {
  setTimeout(() => {
    if (editing.value) {
      handleSave()
    }
  }, 200)
}

// 对话框模式保存
function handleDialogSave() {
  if (localValue.value < props.min || localValue.value > props.max) {
    ElMessage.warning(`权重值必须在 ${props.min} - ${props.max} 之间`)
    return
  }

  emit('update:modelValue', localValue.value)
  emit('save', localValue.value)
  showDialog.value = false
}
</script>

<style scoped lang="scss">
.weight-editor {
  display: inline-block;

  .inline-editor {
    .display-value {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
      height: 28px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: rgba(0, 0, 0, 0.04);

        .edit-icon {
          opacity: 1;
        }
      }

      .weight-value {
        font-size: 14px;
        color: #1890ff;
        font-weight: 500;
      }

      .edit-icon {
        font-size: 14px;
        color: #8c8c8c;
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .edit-input {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      :deep(.el-input-number) {
        width: 80px;

        .el-input__inner {
          text-align: center;
        }
      }
    }
  }

  .dialog-trigger {
    display: inline-block;

    .hint {
      margin-top: 8px;
      font-size: 12px;
      color: #8c8c8c;
      line-height: 1.5;
    }

    .preview {
      padding: 8px 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-size: 13px;

      code {
        color: #1890ff;
        font-weight: 500;
      }
    }
  }

  .tag-mode {
    display: inline-block;
  }

  // 暗色主题
  &.dark {
    .inline-editor {
      .display-value {
        &:hover {
          background-color: rgba(255, 255, 255, 0.08);
        }

        .edit-icon {
          color: rgba(255, 255, 255, 0.45);
        }
      }
    }

    .dialog-trigger {
      .hint {
        color: rgba(255, 255, 255, 0.45);
      }

      .preview {
        background-color: rgba(255, 255, 255, 0.04);
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }
}
</style>
