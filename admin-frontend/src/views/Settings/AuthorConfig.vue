<template>
  <div class="author-config">
    <el-alert
      title="作者信息配置"
      type="info"
      description="这些配置来自 config/teek-plugins/author.toml，所有主题共享"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-form :model="form" label-width="120px" v-loading="loading">
      <el-form-item label="作者姓名" required>
        <el-input v-model="form.name" placeholder="请输入作者姓名" />
        <span class="form-hint">显示在文章署名、版权声明等位置</span>
      </el-form-item>

      <el-form-item label="作者邮箱">
        <el-input v-model="form.email" placeholder="email@example.com" />
        <span class="form-hint">可选，留空不显示</span>
      </el-form-item>

      <el-form-item label="个人网站">
        <el-input v-model="form.link" placeholder="https://example.com" />
        <span class="form-hint">作者个人网站或博客链接</span>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="saveConfig" :loading="saving">
          保存配置
        </el-button>
        <el-button @click="loadConfig">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAuthorConfig, updateAuthorConfig } from '@/api/config'

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  name: '',
  email: '',
  link: ''
})

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await getAuthorConfig()
    if (res.code === 200 && res.data) {
      Object.assign(form, {
        name: res.data.name || '',
        email: res.data.email || '',
        link: res.data.link || ''
      })
    }
  } catch (error) {
    ElMessage.error('加载配置失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  if (!form.name) {
    ElMessage.warning('请输入作者姓名')
    return
  }

  saving.value = true
  try {
    const res = await updateAuthorConfig(form)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      await loadConfig()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.author-config {
  max-width: 1200px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-top: 5px;
}
</style>
