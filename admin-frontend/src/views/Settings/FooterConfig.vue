<template>
  <div class="footer-config">
    <el-alert
      title="页脚通用配置"
      type="info"
      description="这些配置来自 config/teek-plugins/footer.toml，包含页脚的通用信息（ICP备案、版权等）"
      :closable="false"
      style="margin-bottom: 20px"
    />

    <el-form :model="form" label-width="140px" v-loading="loading">
      <el-divider content-position="left">版权信息</el-divider>

      <el-form-item label="版权起始年份">
        <el-input-number
          v-model="form.copyrightYearStart"
          :min="2000"
          :max="new Date().getFullYear()"
        />
        <span class="form-hint">显示为 "© 2024-2025" 格式</span>
      </el-form-item>

      <el-form-item label="版权后缀文本">
        <el-input v-model="form.copyrightSuffix" placeholder="请输入版权后缀" />
        <span class="form-hint">显示在年份之后，如 "© 2024 余温Gueen的博客"</span>
      </el-form-item>

      <el-form-item label="自定义消息">
        <el-input
          v-model="form.customMessage"
          type="textarea"
          :rows="2"
          placeholder="页脚自定义消息"
        />
        <span class="form-hint">显示在页脚中间或底部的自定义文本</span>
      </el-form-item>

      <el-divider content-position="left">ICP 备案</el-divider>

      <el-form-item label="启用 ICP 备案">
        <el-switch v-model="form.icpEnabled" />
        <span class="form-hint">是否显示 ICP 备案信息</span>
      </el-form-item>

      <el-form-item label="ICP 备案号" v-if="form.icpEnabled">
        <el-input v-model="form.icpNumber" placeholder="苏ICP备2024144209号" />
        <span class="form-hint">网站备案号</span>
      </el-form-item>

      <el-form-item label="备案查询链接" v-if="form.icpEnabled">
        <el-input v-model="form.icpUrl" placeholder="http://beian.miit.gov.cn/" />
        <span class="form-hint">ICP 备案查询页面链接</span>
      </el-form-item>

      <el-divider />

      <el-form-item>
        <el-alert
          title="页脚预览"
          type="success"
          :closable="false"
        >
          <template #default>
            <div class="footer-preview">
              <div class="copyright-line">
                © {{ form.copyrightYearStart || 2024 }}-{{ new Date().getFullYear() }}
                {{ form.copyrightSuffix || '未设置' }}
              </div>
              <div class="message-line" v-if="form.customMessage">
                {{ form.customMessage }}
              </div>
              <div class="icp-line" v-if="form.icpEnabled && form.icpNumber">
                <a :href="form.icpUrl || '#'">{{ form.icpNumber }}</a>
              </div>
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
import { getFooterConfig, updateFooterConfig } from '@/api/config'

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  copyrightYearStart: 2024,
  copyrightSuffix: '',
  customMessage: '',
  icpEnabled: true,
  icpNumber: '',
  icpUrl: 'http://beian.miit.gov.cn/'
})

const loadConfig = async () => {
  loading.value = true
  try {
    const res = await getFooterConfig()
    if (res.code === 200 && res.data) {
      Object.assign(form, {
        copyrightYearStart: res.data.copyrightYearStart || 2024,
        copyrightSuffix: res.data.copyrightSuffix || '',
        customMessage: res.data.customMessage || '',
        icpEnabled: res.data.icpEnabled !== false,
        icpNumber: res.data.icpNumber || '',
        icpUrl: res.data.icpUrl || 'http://beian.miit.gov.cn/'
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
    const res = await updateFooterConfig(form)
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
.footer-config {
  max-width: 1200px;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-top: 5px;
}

.footer-preview {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 2;
}

.copyright-line {
  color: #606266;
  font-size: 14px;
}

.message-line {
  color: #909399;
  font-size: 13px;
  font-style: italic;
}

.icp-line {
  margin-top: 10px;
}

.icp-line a {
  color: #409eff;
  text-decoration: none;
  font-size: 12px;
}

.icp-line a:hover {
  text-decoration: underline;
}
</style>
