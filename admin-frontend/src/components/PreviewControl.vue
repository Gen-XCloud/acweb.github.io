<template>
  <div class="preview-control">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>站点预览</span>
          <el-tag :type="serverStatusType" size="small">
            {{ serverStatusText }}
          </el-tag>
        </div>
      </template>

      <!-- 服务器状态信息 -->
      <el-alert
        v-if="serverStatus.running"
        type="success"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          <div>
            <strong>预览服务器正在运行</strong>
          </div>
        </template>
        <div style="margin-top: 8px; font-size: 13px">
          访问地址: <el-link :href="serverStatus.url" target="_blank" type="primary">
            {{ serverStatus.url }}
          </el-link>
        </div>
      </el-alert>

      <el-alert
        v-else
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          预览服务器未启动
        </template>
        <div style="margin-top: 8px; font-size: 13px">
          点击"启动预览服务器"按钮即可在浏览器中实时预览站点
        </div>
      </el-alert>

      <!-- 操作按钮 -->
      <div class="preview-actions">
        <el-button
          v-if="!serverStatus.running"
          type="primary"
          size="large"
          @click="handleStart"
          :loading="starting"
          :disabled="building"
        >
          <el-icon><VideoPlay /></el-icon>
          启动预览服务器
        </el-button>

        <template v-else>
          <el-button
            type="primary"
            size="large"
            @click="openPreview"
          >
            <el-icon><View /></el-icon>
            打开预览
          </el-button>

          <el-button
            size="large"
            @click="handleRebuild"
            :loading="building"
            :disabled="starting || stopping"
          >
            <el-icon><Refresh /></el-icon>
            重新构建
          </el-button>

          <el-button
            type="danger"
            size="large"
            @click="handleStop"
            :loading="stopping"
            :disabled="starting || building"
          >
            <el-icon><VideoPause /></el-icon>
            停止服务器
          </el-button>
        </template>
      </div>

      <!-- 构建日志 -->
      <el-collapse v-if="buildLog" style="margin-top: 20px">
        <el-collapse-item title="查看构建日志" name="log">
          <div class="build-log">
            <pre>{{ buildLog }}</pre>
          </div>
        </el-collapse-item>
      </el-collapse>

      <!-- 使用说明 -->
      <el-divider />
      <div class="tips">
        <h4>使用说明</h4>
        <ul>
          <li>预览服务器默认运行在 <code>http://localhost:1313</code></li>
          <li>修改内容后，Hugo 会自动检测并重新生成页面</li>
          <li>修改配置后，建议点击"重新构建"以确保配置生效</li>
          <li>预览服务器会占用一个终端进程，关闭前请先停止服务器</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause, View, Refresh } from '@element-plus/icons-vue'
import {
  getPreviewStatus,
  startPreviewServer,
  stopPreviewServer,
  rebuildSite
} from '@/api/preview'

const starting = ref(false)
const stopping = ref(false)
const building = ref(false)
const buildLog = ref('')

const serverStatus = ref({
  running: false,
  url: 'http://localhost:1313',
  port: 1313
})

// 服务器状态文本
const serverStatusText = computed(() => {
  return serverStatus.value.running ? '运行中' : '未运行'
})

// 服务器状态类型
const serverStatusType = computed(() => {
  return serverStatus.value.running ? 'success' : 'info'
})

// 加载服务器状态
const loadStatus = async () => {
  try {
    const res = await getPreviewStatus()
    if (res.success && res.data) {
      serverStatus.value = res.data
    }
  } catch (error) {
    console.error('获取服务器状态失败:', error)
  }
}

// 启动服务器
const handleStart = async () => {
  starting.value = true
  try {
    const res = await startPreviewServer()
    if (res.success) {
      ElMessage.success('预览服务器启动成功！')
      serverStatus.value.running = true
      serverStatus.value.url = res.url || 'http://localhost:1313'

      // 2秒后自动打开预览
      setTimeout(() => {
        openPreview()
      }, 2000)
    } else {
      ElMessage.error(res.error || '启动失败')
    }
  } catch (error) {
    ElMessage.error('启动失败: ' + (error.message || '未知错误'))
  } finally {
    starting.value = false
  }
}

// 停止服务器
const handleStop = async () => {
  stopping.value = true
  try {
    const res = await stopPreviewServer()
    if (res.success) {
      ElMessage.success('预览服务器已停止')
      serverStatus.value.running = false
    } else {
      ElMessage.error(res.error || '停止失败')
    }
  } catch (error) {
    ElMessage.error('停止失败: ' + (error.message || '未知错误'))
  } finally {
    stopping.value = false
  }
}

// 打开预览
const openPreview = () => {
  if (serverStatus.value.url) {
    window.open(serverStatus.value.url, '_blank')
  }
}

// 重新构建
const handleRebuild = async () => {
  building.value = true
  buildLog.value = ''

  try {
    const res = await rebuildSite()
    if (res.success) {
      ElMessage.success('构建完成！')
      buildLog.value = res.output || '构建成功'
    } else {
      ElMessage.error(res.error || '构建失败')
      buildLog.value = res.output || res.error || '构建失败'
    }
  } catch (error) {
    ElMessage.error('构建失败: ' + (error.message || '未知错误'))
    buildLog.value = error.message || '构建失败'
  } finally {
    building.value = false
  }
}

// 定时检查状态
let statusInterval = null

onMounted(() => {
  loadStatus()
  // 每5秒检查一次状态
  statusInterval = setInterval(loadStatus, 5000)
})

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval)
  }
})
</script>

<style scoped>
.preview-control {
  max-width: 900px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.build-log {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.build-log pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tips {
  margin-top: 10px;
}

.tips h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.tips ul {
  margin: 0;
  padding-left: 20px;
  color: #909399;
  font-size: 13px;
  line-height: 2;
}

.tips code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: #e6a23c;
}
</style>
