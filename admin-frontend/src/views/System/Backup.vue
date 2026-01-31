<template>
  <ComingSoon
    title="备份管理"
    description="保护您的网站数据安全"
    :features="[
      '一键全站备份',
      '定时自动备份',
      '增量备份',
      '备份恢复',
      '云存储备份（OSS、S3）',
      '备份文件管理',
      '备份历史记录'
    ]"
  />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>
