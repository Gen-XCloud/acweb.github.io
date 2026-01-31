<template>
  <el-dialog
    :model-value="modelValue"
    :title="menuItem?.id ? '编辑菜单' : '新增菜单'"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <!-- 基础信息 -->
      <el-divider content-position="left">基础信息</el-divider>

      <el-form-item label="菜单名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入菜单名称" />
      </el-form-item>

      <el-form-item label="URL 地址" prop="url">
        <el-input v-model="form.url" placeholder="请输入 URL 地址">
          <template #append>
            <el-dropdown @command="handleUrlSelect">
              <el-button>
                快捷选择
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="url in urlSuggestions.sections"
                    :key="url"
                    :command="url"
                  >
                    {{ url }}
                  </el-dropdown-item>
                  <el-dropdown-item divided disabled>
                    常用页面
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-for="url in urlSuggestions.common"
                    :key="url"
                    :command="url"
                  >
                    {{ url }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="排序权重" prop="weight">
        <el-input-number
          v-model="form.weight"
          :min="0"
          :step="1"
          :precision="1"
        />
        <span class="form-tip">数字越小越靠前</span>
      </el-form-item>

      <!-- 层级关系 -->
      <el-divider content-position="left">层级关系</el-divider>

      <!-- 菜单类型提示 -->
      <el-alert
        :title="menuTypeTitle"
        :type="menuTypeAlertType"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template #default>
          <div style="font-size: 13px;">
            {{ menuTypeDescription }}
          </div>
        </template>
      </el-alert>

      <el-form-item label="父级菜单" prop="parent">
        <el-select
          v-model="form.parent"
          placeholder="不选择则为顶级导航栏"
          clearable
        >
          <el-option
            v-for="option in parentOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <span style="float: left">{{ option.label }}</span>
            <span style="float: right; color: #8492a6; font-size: 12px">
              {{ option.value }}
            </span>
          </el-option>
        </el-select>
        <span class="form-tip">选择父级后，此菜单将显示在该导航栏的下拉菜单中</span>
      </el-form-item>

      <el-form-item label="标识符" prop="identifier">
        <el-input
          v-model="form.identifier"
          placeholder="如果此菜单需要包含子菜单，请设置标识符"
        />
        <span class="form-tip">仅字母、数字和连字符，例如: tech, topics, about</span>
      </el-form-item>

      <!-- 高级参数 -->
      <el-divider content-position="left">高级参数</el-divider>

      <el-form-item label="图标">
        <IconSelector v-model="form.params.icon" placeholder="请选择图标" />
        <span class="form-tip">为菜单添加图标（可选）</span>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="form.params.description"
          type="textarea"
          :rows="2"
          placeholder="菜单描述文本"
        />
      </el-form-item>

      <el-form-item label="外部链接">
        <el-switch v-model="form.params.external" />
        <span class="form-tip">是否为外部链接</span>
      </el-form-item>

      <el-form-item label="打开方式" v-if="form.params.external">
        <el-select v-model="form.params.target" placeholder="选择打开方式">
          <el-option label="当前窗口" value="_self" />
          <el-option label="新窗口" value="_blank" />
        </el-select>
      </el-form-item>

      <el-form-item label="隐藏菜单">
        <el-switch v-model="form.params.hidden" />
        <span class="form-tip">隐藏后不在前台显示</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import IconSelector from './IconSelector.vue'

const props = defineProps({
  modelValue: Boolean,
  menuItem: Object,
  urlSuggestions: {
    type: Object,
    default: () => ({ sections: [], common: [] })
  },
  parentOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const formRef = ref()
const saving = ref(false)

const form = reactive({
  id: '',
  name: '',
  url: '',
  weight: 1,
  identifier: '',
  parent: '',
  params: {
    icon: '',
    description: '',
    external: false,
    hidden: false,
    target: '_blank'
  }
})

// 计算菜单类型
const menuTypeTitle = computed(() => {
  if (form.parent && form.identifier) {
    return '📂 父菜单（带下拉）'
  } else if (form.parent) {
    return '📄 子菜单'
  } else if (form.identifier) {
    return '📂 父菜单（顶级带下拉）'
  } else {
    return '📌 顶级菜单（独立）'
  }
})

const menuTypeDescription = computed(() => {
  if (form.parent && form.identifier) {
    return `此菜单会显示在"${form.parent}"的下拉列表中，同时自己也可以有下拉子菜单`
  } else if (form.parent) {
    return `此菜单会显示在"${form.parent}"的下拉列表中`
  } else if (form.identifier) {
    return '此菜单会显示在顶级导航栏，点击后展开下拉列表'
  } else {
    return '此菜单会显示在顶级导航栏，点击后直接跳转到指定URL'
  }
})

const menuTypeAlertType = computed(() => {
  if (form.parent) {
    return 'info'
  } else if (form.identifier) {
    return 'warning'
  } else {
    return 'success'
  }
})

const rules = {
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入 URL 地址', trigger: 'blur' },
    {
      pattern: /^(\/|#|http:\/\/|https:\/\/)/,
      message: 'URL 必须以 / 或 # 或 http:// 开头',
      trigger: 'blur'
    }
  ],
  weight: [
    { required: true, message: '请输入权重', trigger: 'blur' }
  ],
  identifier: [
    {
      pattern: /^[a-zA-Z0-9-]*$/,
      message: '标识符只能包含字母、数字和连字符',
      trigger: 'blur'
    }
  ]
}

// 监听对话框打开，重新加载表单数据
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.menuItem) {
    // 重置表单
    Object.assign(form, {
      id: props.menuItem.id || '',
      name: props.menuItem.name || '',
      url: props.menuItem.url || '',
      weight: props.menuItem.weight || 1,
      identifier: props.menuItem.identifier || '',
      parent: props.menuItem.parent || '',
      params: {
        icon: props.menuItem.params?.icon || '',
        description: props.menuItem.params?.description || '',
        external: props.menuItem.params?.external || false,
        hidden: props.menuItem.params?.hidden || false,
        target: props.menuItem.params?.target || '_blank'
      }
    })
  }
})

// 监听 URL 变化，自动检测是否为外部链接
watch(() => form.url, (newUrl) => {
  if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
    form.params.external = true
  }
})

// URL 快捷选择
function handleUrlSelect(url) {
  form.url = url

  // 如果是外部链接，自动设置 external
  if (url.startsWith('http://') || url.startsWith('https://')) {
    form.params.external = true
  }
}

// 保存
async function handleSave() {
  try {
    await formRef.value.validate()

    saving.value = true
    emit('save', { ...form })
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    saving.value = false
  }
}

// 关闭
function handleClose() {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}
</script>

<style scoped>
.form-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
