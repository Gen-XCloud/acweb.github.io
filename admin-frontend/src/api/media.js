import request from './axios'

export const getMediaList = () => {
  return request.get('/media')
}

export const deleteMediaApi = (url) => {
  return request.delete('/media', { params: { path: url } })
}
