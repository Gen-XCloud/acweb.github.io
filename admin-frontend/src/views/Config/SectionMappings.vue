<template>
  <div class="section-mapping-manager">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <span>菜单映射管理</span>
            <el-tooltip placement="right">
              <template #content>
                <div style="max-width: 300px;">
                  Section URL 映射用于将内容目录名称映射到 SEO 友好的 URL 路径。<br><br>
                  例如：<br>
                  - 目录：content/docs/11.运维/<br>
                  - URL：/linux/<br><br>
                  修改映射后需要重新运行构建工具。
                </div>
              </template>
              <el-icon style="margin-left: 8px; cursor: help;">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-button type="primary" @click="createMapping">
            <el-icon><Plus /></el-icon>
            新增映射
          </el-button>
        </div>
      </template>

      <!-- 多目录配置说明 -->
      <el-alert
        v-if="docsDirs.length > 1"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          <div class="collapsible-header" @click="showMultiDirDetails = !showMultiDirDetails">
            <span>多文档目录配置</span>
            <el-icon class="collapse-icon" :class="{ 'is-expanded': showMultiDirDetails }">
              <ArrowDown />
            </el-icon>
          </div>
        </template>
        <template #default>
          <el-collapse-transition>
            <div v-show="showMultiDirDetails" class="multi-dir-notice">
              <p class="notice-title">
                <el-icon><WarningFilled /></el-icon>
                当前项目配置了 {{ docsDirs.length }} 个文档根目录，它们共享相同的 URL 映射规则：
              </p>
              <ul class="docs-dirs-list">
                <li v-for="(dir, index) in docsDirs" :key="index">
                  <div class="dir-info">
                    <div class="dir-header">
                      <el-tag :type="dir.isMain ? 'primary' : 'info'" size="small">
                        {{ dir.isMain ? '主目录' : `额外目录 ${index}` }}
                      </el-tag>
                      <el-tag v-if="!dir.exists" type="danger" size="small">
                        <el-icon><WarningFilled /></el-icon>
                        不存在
                      </el-tag>
                      <el-tag v-else type="success" size="small">
                        <el-icon><CircleCheckFilled /></el-icon>
                        已存在
                      </el-tag>
                    </div>
                    <div class="dir-paths">
                      <div class="path-item">
                        <span class="path-label">相对路径：</span>
                        <code>{{ dir.relPath }}</code>
                        <el-button
                          text
                          type="primary"
                          size="small"
                          @click="copyPath(dir.relPath)"
                        >
                          <el-icon><CopyDocument /></el-icon>
                        </el-button>
                      </div>
                      <div class="path-item">
                        <span class="path-label">绝对路径：</span>
                        <code class="abs-path">{{ dir.path }}</code>
                        <el-button
                          text
                          type="primary"
                          size="small"
                          @click="copyPath(dir.path)"
                        >
                          <el-icon><CopyDocument /></el-icon>
                        </el-button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
              <div class="override-rules">
                <strong>文件覆盖规则：</strong>
                <ul>
                  <li>所有文档目录中的同名子目录（如 "11.运维"）会被合并到同一个 URL 路径</li>
                  <li>如果多个目录包含相同相对路径的文件，后面配置的目录会覆盖前面的文件</li>
                  <li>例如：如果主目录和额外目录都有 <code>11.运维/docker.md</code>，最终使用额外目录中的版本</li>
                </ul>
              </div>
            </div>
          </el-collapse-transition>
        </template>
      </el-alert>

      <!-- 单目录提示 -->
      <el-alert
        v-else-if="docsDirs.length === 1"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #title>
          <div class="collapsible-header" @click="showSingleDirDetails = !showSingleDirDetails">
            <span>配置说明</span>
            <el-icon class="collapse-icon" :class="{ 'is-expanded': showSingleDirDetails }">
              <ArrowDown />
            </el-icon>
          </div>
        </template>
        <template #default>
          <el-collapse-transition>
            <div v-show="showSingleDirDetails" class="single-dir-notice">
              <p>当前使用默认文档目录，每个子目录的 URL 映射规则在下方配置。修改后需要重新运行构建工具使映射生效。</p>
              <div class="dir-paths">
                <div class="path-item">
                  <span class="path-label">相对路径：</span>
                  <code>{{ docsDirs[0]?.relPath || 'hugo-teek-site/content/docs' }}</code>
                  <el-button
                    text
                    type="primary"
                    size="small"
                    @click="copyPath(docsDirs[0]?.relPath || 'hugo-teek-site/content/docs')"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </div>
                <div class="path-item">
                  <span class="path-label">绝对路径：</span>
                  <code class="abs-path">{{ docsDirs[0]?.path || '' }}</code>
                  <el-button
                    v-if="docsDirs[0]?.path"
                    text
                    type="primary"
                    size="small"
                    @click="copyPath(docsDirs[0].path)"
                  >
                    <el-icon><CopyDocument /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </template>
      </el-alert>

      <!-- 映射列表 -->
      <el-table
        :data="mappings"
        v-loading="loading"
        border
        style="width: 100%"
      >
        <el-table-column prop="directory" label="目录名称" width="300">
          <template #default="{ row }">
            <el-tag type="info" size="large">{{ row.directory }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="urlPath" label="URL 路径" min-width="200">
          <template #default="{ row }">
            <el-tag type="success" size="large">{{ row.urlPath }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="示例" min-width="350">
          <template #default="{ row }">
            <div class="example-text">
              <span class="label">目录：</span>
              <code>content/docs/{{ row.directory }}/</code>
              <br>
              <span class="label">URL：</span>
              <code>{{ row.urlPath }}</code>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="editMapping(row)">
              编辑
            </el-button>
            <el-button text type="danger" @click="deleteMapping(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="mappings.length === 0 && !loading" description="暂无映射配置" />
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="currentMapping.directory ? '编辑映射' : '新增映射'"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="目录名称" prop="directory">
          <el-input
            v-model="form.directory"
            placeholder="例如：11.运维"
            :disabled="!!currentMapping.directory"
          />
          <div class="form-tip">
            与 content/docs/ 下的实际目录名称保持一致
          </div>
        </el-form-item>

        <el-form-item label="URL 路径" prop="urlPath">
          <el-input v-model="form.urlPath" placeholder="例如：/linux/">
            <template #prepend>/</template>
            <template #append>/</template>
          </el-input>
          <div class="form-tip">
            SEO 友好的 URL 路径，自动添加前后斜杠
          </div>
        </el-form-item>

        <el-alert
          title="映射示例"
          type="info"
          :closable="false"
          style="margin-top: 16px;"
        >
          <template #default>
            <div style="font-size: 13px;">
              <p style="margin: 0 0 8px 0;">
                <strong>原始路径：</strong><code>content/docs/{{ form.directory || '目录名' }}/文章.md</code>
              </p>
              <p style="margin: 0;">
                <strong>生成 URL：</strong><code>{{ normalizeUrl(form.urlPath) || '/url-path/' }}文章/</code>
              </p>
            </div>
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, QuestionFilled, WarningFilled, CopyDocument, CircleCheckFilled, ArrowDown } from '@element-plus/icons-vue'
import {
  getSectionMappings,
  createSectionMapping,
  updateSectionMappings,
  deleteSectionMapping
} from '@/api/sections'

const loading = ref(false)
const mappings = ref([])
const docsDirs = ref([]) // 文档目录列表（包含绝对路径等信息）
const showDialog = ref(false)
const saving = ref(false)
const formRef = ref()
const currentMapping = ref({})

// 折叠状态
const showMultiDirDetails = ref(false) // 多目录提示默认折叠
const showSingleDirDetails = ref(false) // 单目录提示默认折叠

const form = reactive({
  directory: '',
  urlPath: ''
})

const rules = {
  directory: [
    { required: true, message: '请输入目录名称', trigger: 'blur' }
  ],
  urlPath: [
    { required: true, message: '请输入 URL 路径', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const normalized = normalizeUrl(value)
        if (!normalized.startsWith('/') || !normalized.endsWith('/')) {
          callback(new Error('URL 路径必须以 / 开头和结尾'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 规范化 URL（自动添加前后斜杠）
function normalizeUrl(url) {
  if (!url) return ''
  let normalized = url.trim()
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized
  }
  if (!normalized.endsWith('/')) {
    normalized = normalized + '/'
  }
  return normalized
}

// 加载映射列表
async function loadMappings() {
  loading.value = true
  try {
    const response = await getSectionMappings()
    mappings.value = response.data.items || []
    docsDirs.value = response.data.docsDirs || []
  } catch (error) {
    ElMessage.error('加载映射列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 复制路径到剪贴板
async function copyPath(path) {
  try {
    await navigator.clipboard.writeText(path)
    ElMessage.success('路径已复制到剪贴板')
  } catch (error) {
    // 降级方案：使用 textarea
    const textarea = document.createElement('textarea')
    textarea.value = path
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('路径已复制到剪贴板')
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textarea)
  }
}

// 新增映射
function createMapping() {
  currentMapping.value = {}
  form.directory = ''
  form.urlPath = ''
  showDialog.value = true
}

// 编辑映射
function editMapping(mapping) {
  currentMapping.value = { ...mapping }
  form.directory = mapping.directory
  form.urlPath = mapping.urlPath
  showDialog.value = true
}

// 保存
async function handleSave() {
  try {
    await formRef.value.validate()

    saving.value = true

    // 规范化 URL
    const normalizedUrl = normalizeUrl(form.urlPath)

    if (currentMapping.value.directory) {
      // 编辑模式：更新整个列表
      const updatedMappings = mappings.value.map(m =>
        m.directory === currentMapping.value.directory
          ? { directory: form.directory, urlPath: normalizedUrl }
          : m
      )
      await updateSectionMappings(updatedMappings)
      ElMessage.success('映射更新成功')
    } else {
      // 新增模式
      await createSectionMapping({
        directory: form.directory,
        urlPath: normalizedUrl
      })
      ElMessage.success('映射创建成功')
    }

    showDialog.value = false
    loadMappings()
  } catch (error) {
    if (error !== 'cancel') {
      const errorMsg = error.response?.data?.error || error.message || '保存失败'
      ElMessage.error(errorMsg)
      console.error(error)
    }
  } finally {
    saving.value = false
  }
}

// 删除映射
async function deleteMapping(mapping) {
  try {
    await ElMessageBox.confirm(
      `确定要删除映射 "${mapping.directory}" → "${mapping.urlPath}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteSectionMapping(mapping.directory)
    ElMessage.success('删除成功')
    loadMappings()
  } catch (error) {
    if (error !== 'cancel') {
      const errorMsg = error.response?.data?.error || error.message || '删除失败'
      ElMessage.error(errorMsg)
      console.error(error)
    }
  }
}

// 关闭对话框
function handleDialogClose() {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadMappings()
})
</script>

<style scoped>
.section-mapping-manager {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 折叠标题样式 */
.collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
  user-select: none;
}

.collapsible-header:hover {
  opacity: 0.8;
}

.collapse-icon {
  transition: transform 0.3s;
  font-size: 14px;
}

.collapse-icon.is-expanded {
  transform: rotate(180deg);
}

/* 多目录配置说明样式 */
.multi-dir-notice {
  font-size: 14px;
  line-height: 1.8;
  margin-top: 12px;
}

.single-dir-notice {
  font-size: 14px;
  line-height: 1.8;
  margin-top: 12px;
}

.single-dir-notice p {
  margin: 0 0 12px 0;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-weight: 500;
  color: #e6a23c;
}

.docs-dirs-list {
  list-style: none;
  padding: 0;
  margin: 12px 0;
}

.docs-dirs-list li {
  margin-bottom: 16px;
  padding: 16px;
  background: #fdf6ec;
  border-radius: 8px;
  border: 1px solid #f5dab1;
}

.docs-dirs-list li:last-child {
  margin-bottom: 0;
}

.dir-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dir-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dir-paths {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.path-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}

.path-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  min-width: 70px;
}

.path-item code {
  flex: 1;
  background: #f5f7fa;
  padding: 6px 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #409eff;
  font-size: 13px;
  word-break: break-all;
  border: 1px solid #dcdfe6;
}

.path-item code.abs-path {
  color: #67c23a;
}

.override-rules {
  margin-top: 16px;
  padding: 12px;
  background: #fff8e1;
  border-left: 3px solid #e6a23c;
  border-radius: 4px;
}

.override-rules strong {
  color: #e6a23c;
  display: block;
  margin-bottom: 8px;
}

.override-rules ul {
  margin: 0;
  padding-left: 20px;
}

.override-rules li {
  margin: 6px 0;
  color: #606266;
}

.override-rules code {
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #e6a23c;
  border: 1px solid #f5dab1;
}

.example-text {
  font-size: 13px;
  line-height: 1.8;
}

.example-text .label {
  color: #606266;
  font-weight: 500;
  display: inline-block;
  width: 50px;
}

.example-text code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #409eff;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
