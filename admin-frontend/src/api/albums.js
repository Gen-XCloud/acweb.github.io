import request from './axios'

// 获取相册列表
export const getAlbums = () => request.get('/albums')

// 获取单个相册
export const getAlbum = (id) => request.get(`/albums/${id}`)

// 创建相册
export const createAlbum = (data) => request.post('/albums', data)

// 更新相册
export const updateAlbum = (id, data) => request.put(`/albums/${id}`, data)

// 删除相册
export const deleteAlbum = (id) => request.delete(`/albums/${id}`)

// 相册排序
export const reorderAlbums = (albumIds) => request.post('/albums/reorder', { albumIds })
