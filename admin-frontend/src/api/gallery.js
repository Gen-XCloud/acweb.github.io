import request from './axios'

// 获取图库项列表
export const getGalleryItems = (params) => request.get('/gallery', { params })

// 获取单个图库项
export const getGalleryItem = (id) => request.get(`/gallery/${id}`)

// 上传本地图片
export const uploadGalleryImage = (formData) => {
  return request.post('/gallery/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 添加外部图片
export const addRemoteImage = (data) => request.post('/gallery/remote', data)

// 更新图库项
export const updateGalleryItem = (id, data) => request.put(`/gallery/${id}`, data)

// 删除图库项
export const deleteGalleryItem = (id) => request.delete(`/gallery/${id}`)

// 移动图库项
export const moveGalleryItem = (id, albumId) => request.post(`/gallery/${id}/move`, { albumId })

// 批量删除
export const batchDeleteGalleryItems = (ids) => request.post('/gallery/batch-delete', { ids })

// 批量移动
export const batchMoveGalleryItems = (ids, albumId) => request.post('/gallery/batch-move', { ids, albumId })

// 检查URL可用性
export const checkURLAvailability = (url) => request.post('/gallery/check-url', { url })

// 生成缩略图
export const generateThumbnail = (id) => request.post(`/gallery/${id}/thumbnail`)

// 获取所有标签
export const getAllTags = () => request.get('/gallery/tags')

// 获取统计信息
export const getGalleryStats = () => request.get('/gallery/stats')
