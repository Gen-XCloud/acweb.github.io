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

        <el-form-item label="站点 URL">
          <el-input v-model="form.baseURL" placeholder="https://example.com" />
        </el-form-item>

        <el-form-item label="语言代码">
          <el-input v-model="form.languageCode" placeholder="zh-CN" />
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

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  title: '',
  baseURL: '',
  languageCode: '',
  description: ''
})

const loadSettings = async () => {
  loading.value = true
  try {
    const data = await getHugoConfig()
    const config = data.data || {}

    form.title = config.title || ''
    form.baseURL = config.baseURL || ''
    form.languageCode = config.languageCode || ''
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
  max-width: 800px;
}
</style>
