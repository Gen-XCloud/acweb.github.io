<template>
  <el-dialog
    v-model="visible"
    title="插入微信公众号解锁"
    width="500px"
    :before-close="handleClose"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="关键字" required>
        <el-input
          v-model="form.keyword"
          placeholder="请输入公众号关键字"
          clearable
        >
          <template #append>
            <el-tooltip content="读者在公众号中输入此关键字获取解锁码">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-input>
        <div class="form-tip">默认: HugoTeek</div>
      </el-form-item>

      <el-form-item label="解锁密码" required>
        <el-input
          v-model="form.code"
          placeholder="请输入解锁密码"
          clearable
          maxlength="10"
        >
          <template #append>
            <el-tooltip content="读者需要输入此密码才能解锁内容">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
        </el-input>
        <div class="form-tip">默认: 0000（留空则自动生成）</div>
      </el-form-item>

      <el-alert
        title="提示"
        type="info"
        :closable="false"
        show-icon
      >
        <p>在 shortcode 下方的所有内容将被锁定，需要解锁才能查看。</p>
        <p>建议在文章中间位置插入，前半部分作为引流内容。</p>
      </el-alert>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'

const visible = ref(false)
const vditorInstance = ref(null)

const form = reactive({
  keyword: 'HugoTeek',
  code: '0000'
})

const show = (vditor) => {
  visible.value = true
  vditorInstance.value = vditor
  // 重置表单
  form.keyword = 'HugoTeek'
  form.code = '0000'
}

const handleClose = () => {
  visible.value = false
}

const handleConfirm = () => {
  const keyword = form.keyword.trim() || 'HugoTeek'
  const code = form.code.trim() || '0000'

  const shortcode = `\n\n{{< wechat-unlock keyword="${keyword}" code="${code}" >}}\n\n`

  // 插入到编辑器
  if (vditorInstance.value) {
    // 使用与 vitepress-syntax.js 相同的插入方法
    try {
      // 检查是否有 insertValue 方法
      if (typeof vditorInstance.value.insertValue === 'function') {
        vditorInstance.value.insertValue(shortcode, true)
      } else {
        // IR 模式 - 使用 getValue 和 setValue
        const currentValue = vditorInstance.value.getValue() || ''
        vditorInstance.value.setValue(currentValue + shortcode)
      }
    } catch (error) {
      console.error('插入shortcode失败:', error)
    }
  }

  visible.value = false
}

defineExpose({ show })
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.el-alert {
  margin-top: 12px;
}

.el-alert p {
  margin: 4px 0;
  font-size: 13px;
}
</style>
