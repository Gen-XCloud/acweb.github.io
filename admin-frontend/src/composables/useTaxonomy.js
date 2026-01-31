/**
 * 分类和标签数据管理（使用 localStorage 缓存）
 */
import { ref } from 'vue'
import { getAllCategories, getAllTags } from '@/api/posts'

// 缓存键名
const CACHE_KEY_CATEGORIES = 'admin_categories'
const CACHE_KEY_TAGS = 'admin_tags'
const CACHE_KEY_TIMESTAMP = 'admin_taxonomy_timestamp'
const CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5分钟过期

// 全局状态（单例模式）
let categories = ref([])
let tags = ref([])
let loading = ref(false)

/**
 * 从 localStorage 读取缓存
 */
function loadFromCache() {
  try {
    const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP)
    const now = Date.now()

    // 检查是否过期
    if (timestamp && (now - parseInt(timestamp)) < CACHE_EXPIRE_TIME) {
      const cachedCategories = localStorage.getItem(CACHE_KEY_CATEGORIES)
      const cachedTags = localStorage.getItem(CACHE_KEY_TAGS)

      if (cachedCategories) {
        categories.value = JSON.parse(cachedCategories)
      }
      if (cachedTags) {
        tags.value = JSON.parse(cachedTags)
      }

      return true // 缓存有效
    }

    return false // 缓存过期或不存在
  } catch (error) {
    console.error('读取缓存失败:', error)
    return false
  }
}

/**
 * 保存到 localStorage
 */
function saveToCache() {
  try {
    localStorage.setItem(CACHE_KEY_CATEGORIES, JSON.stringify(categories.value))
    localStorage.setItem(CACHE_KEY_TAGS, JSON.stringify(tags.value))
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString())
  } catch (error) {
    console.error('保存缓存失败:', error)
  }
}

/**
 * 从 API 加载数据
 */
async function loadFromAPI() {
  loading.value = true
  try {
    const [categoriesRes, tagsRes] = await Promise.all([
      getAllCategories(),
      getAllTags()
    ])

    // 处理分类数据
    if (categoriesRes?.data) {
      categories.value = categoriesRes.data.map(item => item.name)
    }

    // 处理标签数据
    if (tagsRes?.data) {
      tags.value = tagsRes.data.map(item => item.name)
    }

    // 保存到缓存
    saveToCache()

    console.log(`✅ 已加载分类 ${categories.value.length} 个，标签 ${tags.value.length} 个`)
  } catch (error) {
    console.error('加载分类标签失败:', error)
    throw error
  } finally {
    loading.value = false
  }
}

/**
 * 刷新数据（强制从 API 重新加载）
 */
async function refresh() {
  return loadFromAPI()
}

/**
 * 清除缓存
 */
function clearCache() {
  localStorage.removeItem(CACHE_KEY_CATEGORIES)
  localStorage.removeItem(CACHE_KEY_TAGS)
  localStorage.removeItem(CACHE_KEY_TIMESTAMP)
  categories.value = []
  tags.value = []
}

/**
 * 添加新分类（本地添加 + 更新缓存）
 */
function addCategory(category) {
  if (category && !categories.value.includes(category)) {
    categories.value.unshift(category)
    saveToCache()
  }
}

/**
 * 添加新标签（本地添加 + 更新缓存）
 */
function addTag(tag) {
  if (tag && !tags.value.includes(tag)) {
    tags.value.unshift(tag)
    saveToCache()
  }
}

/**
 * 批量添加分类
 */
function addCategories(newCategories) {
  if (!Array.isArray(newCategories)) return

  newCategories.forEach(category => {
    if (category && !categories.value.includes(category)) {
      categories.value.push(category)
    }
  })
  saveToCache()
}

/**
 * 批量添加标签
 */
function addTags(newTags) {
  if (!Array.isArray(newTags)) return

  newTags.forEach(tag => {
    if (tag && !tags.value.includes(tag)) {
      tags.value.push(tag)
    }
  })
  saveToCache()
}

/**
 * 主 Hook - 使用分类和标签数据
 */
export function useTaxonomy() {
  // 首次调用时，尝试从缓存加载
  if (categories.value.length === 0 && tags.value.length === 0) {
    const cacheLoaded = loadFromCache()

    // 如果缓存无效或为空，从 API 加载
    if (!cacheLoaded || (categories.value.length === 0 && tags.value.length === 0)) {
      loadFromAPI()
    }
  }

  return {
    categories,
    tags,
    loading,
    refresh,
    clearCache,
    addCategory,
    addTag,
    addCategories,
    addTags
  }
}
