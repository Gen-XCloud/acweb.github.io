import request from './axios'

/**
 * 上传图片
 * @param {File} file - 图片文件
 * @returns {Promise}
 */
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
