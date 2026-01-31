<template>
  <el-collapse v-model="activeNames" :class="collapseClass">
    <el-collapse-item title="文章信息" name="meta">
      <el-form-item label="文章标题" required>
        <el-input v-model="modelValue.title" placeholder="请输入文章标题" />
      </el-form-item>

      <el-form-item label="保存位置">
        <DirectorySelector
          v-model="modelValue.directoryPath"
          placeholder="选择保存目录"
          clearable
        />
        <div v-if="!isMobile" class="field-hint">选择文章保存的目录位置</div>
      </el-form-item>

      <el-form-item label="文件名">
        <el-input
          v-model="modelValue.filename"
          placeholder="留空自动生成，支持前缀如: 1.kubernetes.md"
        />
        <div class="field-hint">文件名需要包含.md扩展名</div>
      </el-form-item>

      <el-form-item label="排序权重">
        <WeightEditor
          v-model="modelValue.weight"
          type="weight"
          mode="dialog"
          :min="0"
          :max="9999"
          button-type="default"
          :size="isMobile ? 'small' : 'default'"
        />
        <div v-if="!isMobile" class="field-hint">用于控制文章在列表中的显示顺序</div>
      </el-form-item>

      <el-form-item label="分类">
        <el-select
          v-model="modelValue.categories"
          multiple
          filterable
          allow-create
          placeholder="选择或输入分类"
          style="width: 100%"
        >
          <el-option
            v-for="cat in categoryOptions"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="标签">
        <el-select
          v-model="modelValue.tags"
          multiple
          filterable
          allow-create
          placeholder="选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in tagOptions"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="发布日期">
        <el-date-picker
          v-model="modelValue.date"
          type="datetime"
          placeholder="选择日期时间"
          value-format="YYYY-MM-DDTHH:mm:ssZ"
          :style="{ width: isMobile ? '100%' : 'auto' }"
        />
      </el-form-item>

      <el-form-item label="是否草稿">
        <el-switch v-model="modelValue.draft" />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="modelValue.description"
          type="textarea"
          :rows="3"
          placeholder="文章描述"
        />
      </el-form-item>

      <el-form-item label="封面图">
        <el-input v-model="modelValue.coverImg" placeholder="封面图 URL" />
        <div v-if="modelValue.coverImg" class="cover-preview">
          <img :src="modelValue.coverImg" alt="封面图预览" @error="handleImageError" />
        </div>
      </el-form-item>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
import { ref } from 'vue'
import DirectorySelector from '@/components/DirectorySelector.vue'
import WeightEditor from '@/components/WeightEditor.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  categoryOptions: {
    type: Array,
    default: () => []
  },
  tagOptions: {
    type: Array,
    default: () => []
  },
  isMobile: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// 折叠面板控制
const activeNames = ref([])

// 动态 class
const collapseClass = props.isMobile ? 'mobile-meta-collapse' : 'desktop-meta-collapse'

// 处理图片加载错误
const handleImageError = (e) => {
  e.target.style.display = 'none'
}
</script>

<style lang="scss" scoped>
@import './styles/index.scss';
</style>
