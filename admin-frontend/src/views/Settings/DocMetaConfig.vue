<template>
  <div class="docmeta-config">
    <el-alert
      title="文档版权配置"
      type="info"
      description="这些配置来自 config/teek-plugins/docmeta.toml，控制文档版权声明"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-form :model="form" label-width="140px" v-loading="loading">
      <el-form-item label="启用版权声明">
        <el-switch v-model="form.enabled" />
        <span class="form-hint">是否在文档页面底部显示版权信息</span>
      </el-form-item>

      <el-form-item label="作者名称">
        <el-input v-model="form.authorName" placeholder="请输入作者名称" />
      </el-form-item>

      <el-form-item label="作者主页">
        <el-input v-model="form.authorUrl" placeholder="https://example.com" />
      </el-form-item>

      <el-form-item label="许可证名称">
        <el-select v-model="form.licenseName" placeholder="选择许可证类型">
          <el-option label="CC BY-NC-SA 4.0" value="CC BY-NC-SA 4.0" />
          <el-option label="CC BY-SA 4.0" value="CC BY-SA 4.0" />
          <el-option label="CC BY-NC 4.0" value="CC BY-NC 4.0" />
          <el-option label="CC BY 4.0" value="CC BY 4.0" />
          <el-option label="MIT License" value="MIT License" />
          <el-option label="Apache License 2.0" value="Apache License 2.0" />
          <el-option label="保留所有权利" value="All Rights Reserved" />
        </el-select>
        <span class="form-hint">选择内容许可证类型</span>
      </el-form-item>

      <el-form-item label="许可证链接">
        <el-input v-model="form.licenseUrl" placeholder="https://creativecommons.org/licenses/..." />
        <span class="form-hint">许可证详情页面链接</span>
      </el-form-item>

      <el-form-item label="站点名称">
        <el-input v-model="form.siteName" placeholder="站点名称" />
      </el-form-item>

      <el-form-item label="站点链接">
        <el-input v-model="form.siteUrl" placeholder="https://example.com" />
      </el-form-item>

      <el-divider />

      <el-form-item>
        <el-alert
          title="版权声明预览"
          type="success"
          :closable="false"
        >
          <template #default>
            <div class="copyright-preview">
              <p>
                <strong>本文作者：</strong>
                <a :href="form.authorUrl || '#'">{{ form.authorName || '未设置' }}</a>
              </p>
              <p>
                <strong>原文链接：</strong>
                <a :href="form.siteUrl || '#'">{{ form.siteName || '未设置' }}</a>
              </p>
              <p>
                <strong>版权声明：</strong>
                本博客所有文章除特别声明外，均采用
                <a :href="form.licenseUrl || '#'">{{ form.licenseName || '未设置' }}</a>
                许可协议，转载请注明出处！
              </p>
            </div>
          </template>
        </el-alert>
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
import { getDocMetaConfig, updateDocMetaConfig } from '@/api/config'

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  enabled: true,
  authorName: '',
  authorUrl: '',
  licenseName: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh',
  siteName: '',
  siteUrl: ''
})

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await getDocMetaConfig()
    if (res.code === 200 && res.data) {
      Object.assign(form, {
        enabled: res.data.enabled !== false,
        authorName: res.data.authorName || '',
        authorUrl: res.data.authorUrl || '',
        licenseName: res.data.licenseName || 'CC BY-NC-SA 4.0',
        licenseUrl: res.data.licenseUrl || '',
        siteName: res.data.siteName || '',
        siteUrl: res.data.siteUrl || ''
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
    const res = await updateDocMetaConfig(form)
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
.docmeta-config {
  max-width: 1200px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-top: 5px;
}

.copyright-preview {
  line-height: 1.8;
}

.copyright-preview p {
  margin: 8px 0;
}

.copyright-preview a {
  color: #409eff;
  text-decoration: none;
}

.copyright-preview a:hover {
  text-decoration: underline;
}
</style>
