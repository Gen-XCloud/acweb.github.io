<template>
  <ComingSoon
    title="评论管理"
    description="管理和审核文章评论"
    :features="[
      '评论审核和批准',
      '垃圾评论过滤',
      '评论者IP和邮箱管理',
      '评论统计和分析',
      '批量操作（删除、标记）'
    ]"
  />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
</script>
