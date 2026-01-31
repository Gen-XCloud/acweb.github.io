<template>
  <div class="coming-soon">
    <el-card shadow="never">
      <div class="coming-soon-content">
        <el-icon class="icon" :size="80"><Tools /></el-icon>
        <h2>{{ title }}</h2>
        <p class="description">{{ description }}</p>
        <el-tag type="info" size="large">开发中</el-tag>
        <div class="features" v-if="features.length">
          <p class="features-title">计划功能：</p>
          <ul>
            <li v-for="(feature, index) in features" :key="index">
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '功能开发中'
  },
  description: {
    type: String,
    default: '该功能正在紧张开发中，敬请期待...'
  },
  features: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.coming-soon-content {
  text-align: center;
  padding: 40px 20px;
}

.icon {
  color: #909399;
  margin-bottom: 24px;
}

h2 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 24px;
}

.features {
  margin-top: 32px;
  text-align: left;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.features-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  color: #606266;
  font-size: 14px;
}

.features li:before {
  content: '•';
  position: absolute;
  left: 0;
  color: #409eff;
  font-size: 18px;
  line-height: 1;
}

@media screen and (max-width: 768px) {
  .coming-soon {
    min-height: 400px;
  }

  .coming-soon-content {
    padding: 24px 16px;
  }

  .icon {
    font-size: 60px !important;
  }

  h2 {
    font-size: 22px;
  }

  .description {
    font-size: 14px;
  }
}
</style>
