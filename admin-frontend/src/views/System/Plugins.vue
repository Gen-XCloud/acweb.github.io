<template>
  <ComingSoon
    title="插件管理"
    description="扩展您的网站功能"
    :features="[
      '插件安装和卸载',
      '插件启用/禁用',
      '插件配置管理',
      '插件更新检测',
      '插件冲突检测',
      '热门插件推荐'
    ]"
  />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>
