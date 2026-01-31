import request from './axios'

// 获取预览服务器状态
export const getPreviewStatus = () => {
  return request.get('/preview/status')
}

// 启动预览服务器
export const startPreviewServer = () => {
  return request.post('/preview/start')
}

// 停止预览服务器
export const stopPreviewServer = () => {
  return request.post('/preview/stop')
}

// 重新构建站点
export const rebuildSite = () => {
  return request.post('/preview/rebuild')
}
