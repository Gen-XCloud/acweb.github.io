import request from './axios'

// 获取菜单列表
export const getMenus = () => {
  return request.get('/menus')
}

// 创建菜单项
export const createMenuItem = (data) => {
  return request.post('/menus', data)
}

// 更新菜单项
export const updateMenuItem = (id, data) => {
  return request.put(`/menus/${id}`, data)
}

// 删除菜单项
export const deleteMenuItem = (id) => {
  return request.delete(`/menus/${id}`)
}

// 批量排序
export const reorderMenus = (data) => {
  return request.post('/menus/reorder', data)
}

// 获取 URL 建议
export const getUrlSuggestions = () => {
  return request.get('/menus/url-suggestions')
}
