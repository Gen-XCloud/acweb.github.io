<template>
  <div class="theme-config">
    <el-alert
      title="主题配置管理"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <div>当前主题：<strong>{{ themeName }}</strong></div>
        <div style="margin-top: 8px; font-size: 13px">
          这里可以编辑主题特定的配置文件。修改后会自动触发配置合并。
        </div>
      </template>
    </el-alert>

    <el-card shadow="never" v-loading="loading">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="file in configFiles"
          :key="file.name"
          :label="file.label"
          :name="file.name"
        >
          <div class="config-editor">
            <el-alert
              :title="file.description"
              type="info"
              :closable="false"
              style="margin-bottom: 15px"
            />

            <el-input
              v-model="currentContent"
              type="textarea"
              :rows="25"
              placeholder="配置文件内容 (TOML 格式)"
              class="config-textarea"
            />

            <div class="action-buttons">
              <el-button
                type="primary"
                @click="saveConfig"
                :loading="saving"
                :disabled="!currentContent"
              >
                <el-icon><Check /></el-icon>
                保存配置
              </el-button>
              <el-button @click="loadConfig">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
              <el-button @click="triggerMerge" :loading="merging">
                <el-icon><Refresh /></el-icon>
                手动合并配置
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, RefreshRight, Refresh } from '@element-plus/icons-vue'
import { getThemeConfig, updateThemeConfig, mergeConfig } from '@/api/theme'

const route = useRoute()
const loading = ref(false)
const saving = ref(false)
const merging = ref(false)

// 主题名称（从路由参数或查询参数获取）
const themeName = ref(route.params.theme || route.query.theme || 'hugo-teek')

// 配置文件列表
const configFiles = reactive([
  {
    name: 'params.toml',
    label: '主题参数',
    description: '主题的核心UI配置（布局、首页、博主卡片、打赏、微信等）'
  },
  {
    name: 'services.toml',
    label: '外部服务',
    description: '外部服务配置（统计分析、评论系统等）'
  },
  {
    name: 'homepage.toml',
    label: '首页卡片',
    description: '首页侧边栏卡片配置（公告、日历、热门标签、友链等）'
  },
  {
    name: 'sections.toml',
    label: 'URL 映射',
    description: 'Section URL 映射配置（中文目录名 → SEO URL）'
  },
  {
    name: 'teektools.toml',
    label: '构建工具',
    description: '主题特定的构建工具配置'
  }
])

// 当前选中的标签页
const activeTab = ref('params.toml')

// 当前编辑的内容
const currentContent = ref('')

// 所有配置文件的内容缓存
const configCache = reactive({})

// 加载主题配置
const loadConfig = async () => {
  loading.value = true
  try {
    const res = await getThemeConfig(themeName.value)
    if (res.code === 200 && res.data && res.data.config) {
      // 缓存所有配置文件的内容
      for (const [fileName, config] of Object.entries(res.data.config)) {
        configCache[fileName] = serializeConfig(config)
      }
      // 加载当前选中标签页的内容
      currentContent.value = configCache[activeTab.value] || ''
    } else {
      ElMessage.warning('配置文件为空或不存在')
    }
  } catch (error) {
    ElMessage.error('加载配置失败：' + (error.message || '未知错误'))
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 将配置对象序列化为 TOML 字符串（简单实现）
const serializeConfig = (config) => {
  // 这里简单地将对象转为 JSON 格式显示
  // 实际应该使用 TOML 序列化库，但为了简化 P0 实现先用 JSON
  return JSON.stringify(config, null, 2)
}

// 将 TOML 字符串解析为配置对象（简单实现）
const parseConfig = (content) => {
  try {
    // P0 阶段简单地使用 JSON 解析
    // P1 阶段应该使用专门的 TOML 解析库
    return JSON.parse(content)
  } catch (error) {
    throw new Error('配置格式错误：' + error.message)
  }
}

// 保存配置
const saveConfig = async () => {
  if (!currentContent.value.trim()) {
    ElMessage.warning('配置内容不能为空')
    return
  }

  saving.value = true
  try {
    // 解析配置内容
    const config = parseConfig(currentContent.value)

    // 调用 API 更新配置
    const res = await updateThemeConfig(
      themeName.value,
      activeTab.value,
      config
    )

    if (res.code === 200) {
      ElMessage.success('保存成功！配置正在合并...')
      // 更新缓存
      configCache[activeTab.value] = currentContent.value
      // 重新加载配置以确保同步
      await loadConfig()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '未知错误'))
    console.error(error)
  } finally {
    saving.value = false
  }
}

// 手动触发配置合并
const triggerMerge = async () => {
  merging.value = true
  try {
    const res = await mergeConfig()
    if (res.code === 200) {
      ElMessage.success('配置合并成功')
    } else {
      ElMessage.error(res.message || '配置合并失败')
    }
  } catch (error) {
    ElMessage.error('配置合并失败：' + (error.message || '未知错误'))
    console.error(error)
  } finally {
    merging.value = false
  }
}

// 切换标签页时加载对应的配置内容
const handleTabChange = (tabName) => {
  currentContent.value = configCache[tabName] || ''
}

// 监听当前内容变化，更新缓存
watch(currentContent, (newValue) => {
  if (activeTab.value) {
    configCache[activeTab.value] = newValue
  }
})

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.theme-config {
  max-width: 1400px;
}

.config-editor {
  padding: 10px 0;
}

.config-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
}

.config-textarea :deep(textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
