<template>
  <ComingSoon
    title="附件管理"
    description="管理所有上传的文件和附件"
    :features="[
      '文件上传和管理',
      '附件分类和标签',
      '文件搜索和过滤',
      '批量上传和删除',
      '存储空间统计',
      '外部存储支持（OSS、S3）'
    ]"
  />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>
