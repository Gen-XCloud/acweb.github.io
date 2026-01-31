import request from './axios'

// 获取友链数据
export const getFriendLinks = () => {
  return request.get('/friendlinks')
}

// 更新友链数据
export const updateFriendLinks = (data) => {
  return request.put('/friendlinks', data)
}

// 获取赞助者数据
export const getSponsors = () => {
  return request.get('/sponsors')
}

// 更新赞助者数据
export const updateSponsors = (data) => {
  return request.put('/sponsors', data)
}
