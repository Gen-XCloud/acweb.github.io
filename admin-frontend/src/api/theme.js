import request from './axios'

export const getThemes = () => {
  return request.get('/themes')
}

export const switchThemeApi = (themeName) => {
  return request.post('/themes/switch', { theme: themeName })
}

// 主题配置管理 API
// 获取指定主题的配置
export const getThemeConfig = (theme) => {
  return request.get(`/themes/${theme}/config`)
}

// 更新主题配置
export const updateThemeConfig = (theme, fileName, config) => {
  return request.put(`/themes/${theme}/config`, {
    fileName,
    config
  })
}

// 触发配置合并
export const mergeConfig = () => {
  return request.post('/config/merge')
}
