<template>
  <div class="basic-settings">
    <el-card shadow="never">
      <template #header>
        <span>基础信息</span>
      </template>

      <el-form :model="form" label-width="120px" v-loading="loading">
        <el-form-item label="站点标题">
          <el-input v-model="form.title" placeholder="请输入站点标题" />
        </el-form-item>

        <el-form-item label="站点副标题">
          <el-input v-model="form.subtitle" placeholder="请输入站点副标题" />
          <span class="form-hint">显示在站点标题下方的副标题</span>
        </el-form-item>

        <el-form-item label="站点 URL">
          <el-input v-model="form.baseURL" placeholder="https://example.com" />
        </el-form-item>

        <el-form-item label="Logo">
          <ImageSelector v-model="form.logo" placeholder="选择或上传Logo图片" />
          <span class="form-hint">站点Logo图片，建议宽度200-400px</span>
        </el-form-item>

        <el-form-item label="Favicon">
          <ImageSelector v-model="form.favicon" placeholder="选择或上传Favicon" />
          <span class="form-hint">站点图标（浏览器标签页），建议32x32或64x64</span>
        </el-form-item>

        <el-form-item label="站点描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入站点描述"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="saving">
            保存设置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getHugoConfig, updateHugoConfig } from '@/api/config'
import ImageSelector from '@/components/ImageSelector.vue'

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  title: '',
  subtitle: '',
  baseURL: '',
  logo: '',
  favicon: '',
  description: ''
})

const loadSettings = async () => {
  loading.value = true
  try {
    const data = await getHugoConfig()
    const config = data.data || {}

    form.title = config.title || ''
    form.subtitle = config.subtitle || ''
    form.baseURL = config.baseURL || ''
    form.logo = config.logo || ''
    form.favicon = config.favicon || ''
    form.description = config.description || ''
  } catch (error) {
    ElMessage.error('加载设置失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    await updateHugoConfig(form)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.basic-settings {
  max-width: 1200px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-top: 5px;
}
</style>
