<template>
  <div class="sponsors-manager">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>赞助者管理</span>
          <el-button type="primary" @click="addSponsor">
            <el-icon><Plus /></el-icon>
            新增赞助者
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 赞助者列表 -->
        <el-table
          v-if="sponsors.sponsors && sponsors.sponsors.length > 0"
          :data="sponsors.sponsors"
          style="width: 100%"
        >
          <el-table-column prop="name" label="姓名" width="150" />
          <el-table-column prop="amount" label="金额" width="100">
            <template #default="{ row }">
              <el-tag type="success">¥{{ row.amount }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="日期" width="150" />
          <el-table-column prop="message" label="留言" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row, $index }">
              <el-button text type="primary" size="small" @click="editSponsor($index)">
                编辑
              </el-button>
              <el-button text type="danger" size="small" @click="deleteSponsor($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 空状态 -->
        <el-empty v-else description="暂无赞助者记录，点击右上角按钮新增" />
      </div>

      <template #footer>
        <div class="footer-info">
          <span>共 {{ sponsors.sponsors?.length || 0 }} 位赞助者</span>
          <el-button type="primary" :loading="saving" @click="save">
            保存所有更改
          </el-button>
        </div>
      </template>
    </el-card>

    <!-- 编辑赞助者对话框 -->
    <el-dialog
      v-model="showSponsorDialog"
      :title="currentEditIndex === -1 ? '新增赞助者' : '编辑赞助者'"
      width="500px"
    >
      <el-form :model="currentSponsor" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="currentSponsor.name" placeholder="请输入赞助者姓名" />
        </el-form-item>

        <el-form-item label="金额" required>
          <el-input v-model="currentSponsor.amount" placeholder="请输入金额">
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>

        <el-form-item label="日期" required>
          <el-date-picker
            v-model="currentSponsor.date"
            type="date"
            placeholder="选择日期"
            format="YYYY/MM/DD"
            value-format="YYYY/MM/DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="留言">
          <el-input
            v-model="currentSponsor.message"
            type="textarea"
            :rows="3"
            placeholder="请输入留言"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSponsorDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSponsorEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSponsors, updateSponsors } from '@/api/content'

const loading = ref(false)
const saving = ref(false)
const sponsors = ref({ sponsors: [] })
const showSponsorDialog = ref(false)
const currentSponsor = ref({})
const currentEditIndex = ref(-1)

// 加载赞助者数据
async function loadData() {
  loading.value = true
  try {
    const response = await getSponsors()
    sponsors.value = response.data || { sponsors: [] }
  } catch (error) {
    ElMessage.error('加载赞助者数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 新增赞助者
function addSponsor() {
  const today = new Date()
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`

  currentSponsor.value = {
    name: '匿名',
    amount: '10',
    date: dateStr,
    message: '感谢支持！'
  }
  currentEditIndex.value = -1
  showSponsorDialog.value = true
}

// 编辑赞助者
function editSponsor(index) {
  currentSponsor.value = { ...sponsors.value.sponsors[index] }
  currentEditIndex.value = index
  showSponsorDialog.value = true
}

// 保存赞助者编辑
function saveSponsorEdit() {
  if (!currentSponsor.value.name || !currentSponsor.value.amount || !currentSponsor.value.date) {
    ElMessage.warning('请填写必填项')
    return
  }

  if (currentEditIndex.value === -1) {
    // 新增 - 添加到开头
    sponsors.value.sponsors.unshift({ ...currentSponsor.value })
  } else {
    // 编辑
    sponsors.value.sponsors[currentEditIndex.value] = { ...currentSponsor.value }
  }

  showSponsorDialog.value = false
  ElMessage.success(currentEditIndex.value === -1 ? '赞助者添加成功' : '赞助者更新成功')
}

// 删除赞助者
async function deleteSponsor(index) {
  try {
    const sponsor = sponsors.value.sponsors[index]
    await ElMessageBox.confirm(
      `确定要删除赞助者"${sponsor.name}"的记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    sponsors.value.sponsors.splice(index, 1)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消
  }
}

// 保存所有更改
async function save() {
  saving.value = true
  try {
    await updateSponsors(sponsors.value)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.sponsors-manager {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
