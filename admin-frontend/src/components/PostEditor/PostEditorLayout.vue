<template>
  <div class="post-editor-layout" :class="layoutClasses">
    <!-- 移动端顶部操作栏 -->
    <div v-if="isMobile" class="mobile-header">
      <el-button text @click="$emit('back')" class="mobile-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="mobile-title">{{ title }}</span>
      <el-button
        type="primary"
        @click="$emit('save')"
        :loading="saving"
        class="mobile-btn"
      >
        保存
      </el-button>
    </div>

    <!-- 桌面端 / 移动端内容区 -->
    <el-card shadow="never" v-if="!isMobile || !isFullscreen">
      <!-- 桌面端头部 -->
      <template #header v-if="!isMobile">
        <div class="edit-header">
          <span>{{ title }}</span>
          <div class="header-actions">
            <el-button @click="$emit('back')">返回</el-button>
            <el-button type="primary" @click="$emit('save')" :loading="saving">
              保存
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表单内容插槽 -->
      <el-form :label-width="isMobile ? '80px' : '120px'" v-loading="loading">
        <slot></slot>
      </el-form>
    </el-card>

    <!-- 移动端全屏编辑模式 -->
    <div v-if="isMobile && isFullscreen" class="mobile-fullscreen-editor">
      <slot name="fullscreen"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isFullscreen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['back', 'save'])

// 动态类名
const layoutClasses = computed(() => ({
  'mobile-mode': props.isMobile,
  'fullscreen-mode': props.isFullscreen
}))
</script>

<style lang="scss" scoped>
@import './styles/index.scss';
</style>
