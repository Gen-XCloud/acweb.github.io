<template>
  <div class="site-config">
    <el-alert
      title="站点元信息配置"
      type="info"
      description="这些配置来自 config/teek-plugins/site.toml，所有主题共享"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-form :model="form" label-width="140px" v-loading="loading">
      <el-form-item label="站点描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="站点描述，用于 SEO 和 meta 标签"
        />
        <span class="form-hint">将显示在搜索引擎结果中</span>
      </el-form-item>

      <el-form-item label="站点关键词">
        <el-select
          v-model="form.keywords"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入关键词后按回车添加"
          style="width: 100%"
        >
        </el-select>
        <span class="form-hint">用于 SEO，多个关键词用标签管理</span>
      </el-form-item>

      <el-form-item label="站点启动日期">
        <el-date-picker
          v-model="form.siteStartDate"
          type="date"
          placeholder="选择站点启动日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        <span class="form-hint">用于统计和展示站点运行天数</span>
      </el-form-item>

      <el-form-item label="默认封面图片">
        <el-input
          v-model="form.defaultCoverImage"
          placeholder="https://example.com/cover.jpg"
        />
        <span class="form-hint">当文章未指定封面时使用此图片</span>
      </el-form-item>

      <el-form-item label="主要内容类型">
        <el-select
          v-model="form.mainSections"
          multiple
          placeholder="选择主要内容类型"
          style="width: 100%"
        >
          <el-option label="docs（文档）" value="docs" />
          <el-option label="posts（文章）" value="posts" />
          <el-option label="blog（博客）" value="blog" />
        </el-select>
        <span class="form-hint">Hugo 使用此配置确定哪些 section 是主要内容</span>
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
import { getSiteConfig, updateSiteConfig } from '@/api/config'

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  description: '',
  keywords: [],
  siteStartDate: '',
  defaultCoverImage: '',
  mainSections: ['docs']
})

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await getSiteConfig()
    if (res.code === 200 && res.data) {
      Object.assign(form, {
        description: res.data.description || '',
        keywords: res.data.keywords || [],
        siteStartDate: res.data.siteStartDate || '',
        defaultCoverImage: res.data.defaultCoverImage || '',
        mainSections: res.data.mainSections || ['docs']
      })
    }
  } catch (error) {
    ElMessage.error('加载配置失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    const res = await updateSiteConfig(form)
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
.site-config {
  /* 让表单占用更多空间，同时保持合理的最大宽度 */
  max-width: 1200px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-top: 5px;
}
</style>
