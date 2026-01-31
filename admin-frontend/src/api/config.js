import request from './axios'

// Hugo 核心配置
export const getHugoConfig = () => {
  return request.get('/config/hugo')
}

export const updateHugoConfig = (data) => {
  return request.put('/config/hugo', data)
}

// 通用配置 API (新增)
// 获取站点元信息配置
export const getSiteConfig = () => {
  return request.get('/config/site')
}

export const updateSiteConfig = (data) => {
  return request.put('/config/site', data)
}

// 获取作者信息配置
export const getAuthorConfig = () => {
  return request.get('/config/author')
}

export const updateAuthorConfig = (data) => {
  return request.put('/config/author', data)
}

// 获取文档版权配置
export const getDocMetaConfig = () => {
  return request.get('/config/docmeta')
}

export const updateDocMetaConfig = (data) => {
  return request.put('/config/docmeta', data)
}

// 获取页脚通用配置
export const getFooterConfig = () => {
  return request.get('/config/footer')
}

export const updateFooterConfig = (data) => {
  return request.put('/config/footer', data)
}

// 配置验证
export const validateConfig = (configType, content) => {
  return request.post('/config/validate', {
    configType,
    content
  })
}

// 获取默认配置
export const getDefaultConfig = (type) => {
  return request.get(`/config/defaults/${type}`)
}

// 触发配置合并
export const mergeConfig = () => {
  return request.post('/config/merge')
}
