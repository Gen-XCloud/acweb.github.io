import request from './axios'

export const getDashboard = () => {
  return request.get('/dashboard')
}
