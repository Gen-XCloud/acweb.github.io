<template>
  <div class="settings-container">
    <el-card shadow="never">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基础配置 -->
        <el-tab-pane label="基础配置" name="hugo">
          <HugoConfig />
        </el-tab-pane>

        <!-- 站点元信息 -->
        <el-tab-pane label="站点信息" name="site">
          <SiteConfig />
        </el-tab-pane>

        <!-- 作者信息 -->
        <el-tab-pane label="作者信息" name="author">
          <AuthorConfig />
        </el-tab-pane>

        <!-- 文档版权 -->
        <el-tab-pane label="文档版权" name="docmeta">
          <DocMetaConfig />
        </el-tab-pane>

        <!-- 页脚配置 -->
        <el-tab-pane label="页脚配置" name="footer">
          <FooterConfig />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HugoConfig from './HugoConfig.vue'
import SiteConfig from './SiteConfig.vue'
import AuthorConfig from './AuthorConfig.vue'
import DocMetaConfig from './DocMetaConfig.vue'
import FooterConfig from './FooterConfig.vue'

const activeTab = ref('hugo')
</script>

<style scoped>
.settings-container {
  /* 移除 padding，由 MainLayout 统一控制 */
}

:deep(.el-tabs__content) {
  padding: 20px;
}
</style>
