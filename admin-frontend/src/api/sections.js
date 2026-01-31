import request from './axios'

// 获取 Section URL 映射列表
export const getSectionMappings = () => {
  return request.get('/sections')
}

// 批量更新 Section URL 映射
export const updateSectionMappings = (mappings) => {
  return request.put('/sections', { mappings })
}

// 创建单个 Section URL 映射
export const createSectionMapping = (data) => {
  return request.post('/sections', data)
}

// 删除单个 Section URL 映射
export const deleteSectionMapping = (directory) => {
  return request.delete(`/sections/${encodeURIComponent(directory)}`)
}
