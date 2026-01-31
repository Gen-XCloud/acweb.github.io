import request from './axios'

export const getPostsList = (params) => {
  return request.get('/posts', { params })
}

export const getPostDetail = (path) => {
  return request.get(`/posts/${encodeURIComponent(path)}`)
}

export const createPost = (data) => {
  return request.post('/posts', data)
}

export const updatePost = (path, data) => {
  return request.put(`/posts/${encodeURIComponent(path)}`, data)
}

export const deletePostApi = (path) => {
  return request.delete(`/posts/${encodeURIComponent(path)}`)
}

export const updatePostWeight = (path, weight) => {
  return request.put('/posts-weight', { path, weight })
}

export const reorderPosts = (items) => {
  return request.post('/posts/reorder', { items })
}

export const getAllTags = () => {
  return request.get('/tags')
}

export const getAllCategories = () => {
  return request.get('/categories')
}

// 批量操作
export const batchMovePosts = (paths, targetDir) => {
  return request.post('/posts/batch-move', { paths, targetDir })
}

export const batchDeletePosts = (paths) => {
  return request.post('/posts/batch-delete', { paths })
}

export const batchUpdatePosts = (paths, metadata, updateMode = 'replace') => {
  return request.post('/posts/batch-update', { paths, metadata, updateMode })
}
