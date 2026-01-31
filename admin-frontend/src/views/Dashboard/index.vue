<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>文章总数</span>
            </div>
          </template>
          <div class="stat-value">{{ stats.totalPosts }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><FolderOpened /></el-icon>
              <span>分类数</span>
            </div>
          </template>
          <div class="stat-value">{{ stats.totalCategories }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><PriceTag /></el-icon>
              <span>标签数</span>
            </div>
          </template>
          <div class="stat-value">{{ stats.totalTags }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Reading /></el-icon>
              <span>总字数</span>
            </div>
          </template>
          <div class="stat-value">{{ formatNumber(stats.totalWords) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span>分类统计</span>
          </template>
          <div ref="categoryChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>最近文章</span>
          </template>
          <el-scrollbar height="300px">
            <div
              v-for="post in stats.recentPosts"
              :key="post.path"
              class="post-item"
              @click="editPost(post)"
            >
              <div class="post-title">{{ post.title }}</div>
              <div class="post-meta">
                <span>{{ post.date }}</span>
                <span v-if="post.categories">{{ post.categories[0] }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span>标签云</span>
          </template>
          <div ref="tagCloudChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import 'echarts-wordcloud'
import { getDashboard } from '@/api/dashboard'
import { registerHugoTeekTheme } from '@/assets/echarts-theme'

const router = useRouter()
const categoryChart = ref(null)
const tagCloudChart = ref(null)

// 注册 ECharts 主题
registerHugoTeekTheme(echarts)

const stats = ref({
  totalPosts: 0,
  totalCategories: 0,
  totalTags: 0,
  totalWords: 0,
  recentPosts: [],
  categoryStats: [],
  tagCloud: []
})

const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-CN').format(num)
}

const loadDashboard = async () => {
  try {
    const data = await getDashboard()
    stats.value = data.data

    // 渲染分类图表 (使用主题)
    if (categoryChart.value) {
      const chart = echarts.init(categoryChart.value, 'hugo-teek')
      chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}篇 ({d}%)'
        },
        legend: {
          bottom: '5%',
          left: 'center'
        },
        series: [
          {
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: true,
              formatter: '{b}: {d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            data: stats.value.categoryStats.map(item => ({
              name: item.name,
              value: item.count
            }))
          }
        ]
      })

      // 响应式调整
      window.addEventListener('resize', () => chart.resize())
    }

    // 渲染标签云 (使用主题颜色)
    if (tagCloudChart.value && stats.value.tagCloud) {
      const tagChart = echarts.init(tagCloudChart.value, 'hugo-teek')
      const tagData = stats.value.tagCloud.map(item => ({
        name: item.name,
        value: item.count
      }))

      tagChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}篇'
        },
        series: [{
          type: 'wordCloud',
          shape: 'circle',
          sizeRange: [14, 50],
          rotationRange: [-45, 45],
          rotationStep: 45,
          gridSize: 8,
          drawOutOfBound: false,
          textStyle: {
            fontFamily: 'Fira Sans, sans-serif',
            fontWeight: 'normal',
            color: function() {
              const colors = [
                '#2563EB', '#F97316', '#10B981', '#F59E0B',
                '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'
              ]
              return colors[Math.floor(Math.random() * colors.length)]
            }
          },
          emphasis: {
            focus: 'self',
            textStyle: {
              textShadowBlur: 10,
              textShadowColor: '#333'
            }
          },
          data: tagData
        }]
      })

      // 响应式调整
      window.addEventListener('resize', () => tagChart.resize())
    }
  } catch (error) {
    console.error('加载仪表盘失败:', error)
  }
}

const editPost = (post) => {
  router.push({
    name: 'PostEdit',
    query: { path: post.path }
  })
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped lang="scss">
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

.dashboard {
  padding: 0;
}

// ============================================
// 统计卡片 (简化风格)
// ============================================

:deep(.el-card) {
  @include card-soft;
  transition: all 150ms ease-out;
  cursor: pointer;

  &:hover {
    box-shadow: $shadow-lg;        // 仅阴影变化
    // ❌ 移除 transform: translateY(-4px)
  }
}

.card-header {
  @include flex-start;
  gap: $spacing-3;
  font-weight: $font-semibold;
  font-size: $text-base;
  color: $text-primary;

  .el-icon {
    @include flex-center;
    width: 48px;
    height: 48px;
    border-radius: $radius-lg;     // 8px
    background: $primary;          // ✅ 纯色替代渐变
    color: white;
    font-size: $text-2xl;
    // ❌ 移除 box-shadow
  }
}

// 为不同卡片设置不同纯色 (无渐变)
:deep(.el-col:nth-child(1)) .card-header .el-icon {
  background: $primary;            // 浅蓝
}

:deep(.el-col:nth-child(2)) .card-header .el-icon {
  background: $accent;             // 薄荷绿
}

:deep(.el-col:nth-child(3)) .card-header .el-icon {
  background: #A78BFA;             // 浅紫 (纯色)
}

:deep(.el-col:nth-child(4)) .card-header .el-icon {
  background: #FBBF24;             // 浅黄 (纯色)
}

.stat-value {
  font-family: $font-mono;
  font-size: $text-4xl;
  font-weight: $font-bold;
  color: $primary;
  text-align: center;
  padding: $spacing-6 0;
  letter-spacing: -1px;
  line-height: 1;
}

// ============================================
// 最近文章列表 (简化风格)
// ============================================

.post-item {
  padding: $spacing-4;
  border-radius: $radius-md;
  margin-bottom: $spacing-3;
  cursor: pointer;
  transition: all 150ms ease-out;
  border: 1px solid transparent;

  &:hover {
    background: rgba($primary, 0.04);
    border-color: rgba($primary, 0.12);
    // ❌ 移除 transform: translateX(4px)
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.post-title {
  font-weight: $font-medium;
  font-size: $text-base;
  margin-bottom: $spacing-2;
  color: $text-primary;
  @include line-clamp(2);
}

.post-meta {
  font-size: $text-sm;
  color: $text-muted;
  @include flex-start;
  gap: $spacing-4;

  span {
    @include flex-center;
    gap: $spacing-1;

    &:not(:last-child)::after {
      content: '•';
      margin-left: $spacing-4;
      color: $border-default;
    }
  }
}

// ============================================
// 图表容器响应式
// ============================================

:deep(.el-card__body) {
  > div[ref] {
    min-height: 300px;
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .stat-value {
    font-size: $text-3xl;
    padding: $spacing-4 0;
  }

  .card-header {
    font-size: $text-sm;

    .el-icon {
      width: 40px;
      height: 40px;
      font-size: $text-xl;
    }
  }

  :deep(.el-card__body) {
    > div[ref] {
      min-height: 250px;
    }
  }
}
</style>
