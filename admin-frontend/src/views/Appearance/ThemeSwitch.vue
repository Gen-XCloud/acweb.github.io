<template>
  <div class="theme-switch">
    <el-card shadow="never">
      <template #header>
        <span>主题切换</span>
      </template>

      <el-row :gutter="20" v-loading="loading">
        <el-col
          v-for="theme in themes"
          :key="theme.name"
          :span="12"
        >
          <el-card
            :class="['theme-card', { active: theme.active }]"
            shadow="hover"
          >
            <div class="theme-name">
              {{ theme.displayName }}
              <el-tag v-if="theme.active" type="success" size="small">
                当前主题
              </el-tag>
            </div>
            <div class="theme-description">
              {{ theme.description }}
            </div>
            <div class="theme-actions">
              <el-button
                type="primary"
                size="small"
                @click.stop="switchTheme(theme)"
                :disabled="theme.active"
              >
                {{ theme.active ? '当前使用' : '切换主题' }}
              </el-button>
              <el-button
                type="default"
                size="small"
                @click.stop="configureTheme(theme)"
              >
                配置主题
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getThemes, switchThemeApi } from '@/api/theme'

const router = useRouter()
const loading = ref(false)
const themes = ref([])

const loadThemes = async () => {
  loading.value = true
  try {
    const data = await getThemes()
    themes.value = data.data || []
  } catch (error) {
    ElMessage.error('加载主题列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const switchTheme = async (theme) => {
  if (theme.active) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要切换到"${theme.displayName}"主题吗？`,
      '确认切换',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    loading.value = true
    await switchThemeApi(theme.name)
    ElMessage.success('主题切换成功')
    loadThemes()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('主题切换失败')
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

const configureTheme = (theme) => {
  // 跳转到主题配置页面，并传递主题名称作为查询参数
  router.push({
    name: 'AppearanceThemeConfig',
    query: { theme: theme.name }
  })
}

onMounted(() => {
  loadThemes()
})
</script>

<style scoped>
.theme-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.theme-card:hover {
  border-color: #1890ff;
  transform: translateY(-4px);
}

.theme-card.active {
  border-color: #52c41a;
  background-color: #f6ffed;
}

.theme-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.theme-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.theme-actions .el-button {
  flex: 1;
}
</style>
