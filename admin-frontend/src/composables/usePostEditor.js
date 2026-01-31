import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostDetail, createPost, updatePost } from '@/api/posts'
import { useTaxonomy } from '@/composables/useTaxonomy'

/**
 * 文章编辑器 Composable
 * 处理文章的加载、保存、验证等核心逻辑
 */
export function usePostEditor() {
  const router = useRouter()
  const route = useRoute()

  // 状态管理
  const loading = ref(false)
  const saving = ref(false)
  const postPath = ref('')
  const originalHasWeight = ref(false)
  const originalDirectoryPath = ref('')
  const originalFilename = ref('')

  // 表单数据
  const form = reactive({
    title: '',
    directoryPath: '',
    filename: '',
    weight: 0,
    date: new Date().toISOString(),
    draft: false,
    categories: [],
    tags: [],
    description: '',
    coverImg: '',
    content: ''
  })

  // 使用全局分类标签管理
  const { categories: categoryOptions, tags: tagOptions, addCategories, addTags } = useTaxonomy()

  // 计算属性
  const isCreate = computed(() => route.name === 'PostCreate')

  /**
   * 加载文章数据
   */
  const loadPost = async () => {
    if (isCreate.value) return

    const path = route.query.path
    if (!path) {
      ElMessage.error('缺少文章路径')
      goBack()
      return
    }

    loading.value = true
    try {
      const data = await getPostDetail(path)
      const post = data.data

      // 确保 frontMatter 存在
      if (!post || !post.frontMatter) {
        throw new Error('文章数据格式错误')
      }

      postPath.value = post.path
      form.title = post.frontMatter.title || ''
      form.date = post.frontMatter.date || new Date().toISOString()
      form.draft = post.frontMatter.draft || false

      // 记录原文章是否有 weight 字段
      originalHasWeight.value = post.frontMatter.hasOwnProperty('weight')
      form.weight = post.frontMatter.weight ?? 0

      form.categories = post.frontMatter.categories || []
      form.tags = post.frontMatter.tags || []
      form.description = post.frontMatter.description || ''
      form.coverImg = post.frontMatter.coverImg || ''
      form.content = post.content || ''

      // 从路径中提取目录和文件名
      let pathStr = post.path

      // 去除可能的前缀
      pathStr = pathStr.replace(/^hugo-teek-site\/content\/docs\//, '')
      pathStr = pathStr.replace(/^content\/docs\//, '')
      pathStr = pathStr.replace(/^docs\//, '')

      const pathParts = pathStr.split('/')
      form.filename = pathParts.pop() || ''
      form.directoryPath = pathParts.join('/')

      // 保存原始值，用于判断是否修改
      originalDirectoryPath.value = form.directoryPath
      originalFilename.value = form.filename

      console.log('📄 加载文章:', {
        原始路径: post.path,
        处理后路径: pathStr,
        目录: form.directoryPath,
        文件名: form.filename
      })
    } catch (error) {
      ElMessage.error('加载文章失败')
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存文章
   */
  const savePost = async () => {
    if (!form.title) {
      ElMessage.warning('请输入文章标题')
      return false
    }

    saving.value = true
    try {
      const data = {
        title: form.title,
        content: form.content,
        metadata: {
          date: form.date,
          draft: form.draft,
          categories: form.categories,
          tags: form.tags,
          description: form.description,
          coverImg: form.coverImg
        }
      }

      // 只在以下情况保存 weight:
      // 1. 新建文章且 weight 不为 0
      // 2. 编辑文章且原本就有 weight
      // 3. 编辑文章且用户修改了 weight(不为 0)
      if (isCreate.value) {
        // 新建文章:只在非 0 时保存 weight
        if (form.weight !== 0) {
          data.metadata.weight = form.weight
        }
      } else {
        // 编辑文章:原本有 weight 或者用户修改了(不为 0)
        if (originalHasWeight.value || form.weight !== 0) {
          data.metadata.weight = form.weight
        }
      }

      if (isCreate.value) {
        // 新建文章 - 包含新增字段
        data.directoryPath = form.directoryPath || ''
        data.filename = form.filename || ''
        data.category = form.categories[0] || '未分类'
        await createPost(data)
        ElMessage.success('创建成功')
      } else {
        // 更新文章 - 只在用户修改了目录或文件名时才发送
        data.path = postPath.value

        // 检查目录是否修改
        if (form.directoryPath && form.directoryPath !== originalDirectoryPath.value) {
          data.directoryPath = form.directoryPath
          console.log('📂 目录已修改:', originalDirectoryPath.value, '->', form.directoryPath)
        }

        // 检查文件名是否修改
        if (form.filename && form.filename !== originalFilename.value) {
          data.filename = form.filename
          console.log('📄 文件名已修改:', originalFilename.value, '->', form.filename)
        }

        await updatePost(postPath.value, data)
        ElMessage.success('保存成功')
      }

      // 保存成功后，将新的分类和标签添加到缓存
      addCategories(form.categories)
      addTags(form.tags)

      goBack()
      return true
    } catch (error) {
      ElMessage.error(isCreate.value ? '创建失败' : '保存失败')
      console.error(error)
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 返回列表页
   */
  const goBack = () => {
    router.push({ name: 'ContentPosts' })
  }

  /**
   * 处理图片加载错误
   */
  const handleImageError = (e) => {
    e.target.style.display = 'none'
  }

  return {
    // 状态
    loading,
    saving,
    form,
    isCreate,
    categoryOptions,
    tagOptions,

    // 方法
    loadPost,
    savePost,
    goBack,
    handleImageError
  }
}
