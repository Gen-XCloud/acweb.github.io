import request from './axios'

export interface TreeNode {
  title: string
  path: string
  fullPath: string
  isFolder: boolean
  level: number
  weight?: number
  fileCount?: number
  children?: TreeNode[]
}

export interface FlatNode {
  path: string
  level: number
  weight?: number
}

export interface DirectoriesResponse {
  success: boolean
  data?: {
    tree: TreeNode[]
    flatList: FlatNode[]
  }
  error?: string
}

/**
 * 获取目录树
 */
export function getDirectories(): Promise<DirectoriesResponse> {
  return request({
    url: '/directories',
    method: 'get'
  })
}

/**
 * 创建目录
 */
export function createDirectory(data: { parentPath: string; name: string; weight?: number }) {
  return request({
    url: '/directories',
    method: 'post',
    data
  })
}

/**
 * 重命名目录
 */
export function renameDirectory(path: string, newName: string) {
  return request({
    url: `/directories/${encodeURIComponent(path)}`,
    method: 'put',
    data: { newName }
  })
}

/**
 * 删除目录
 */
export function deleteDirectory(path: string) {
  return request({
    url: `/directories/${encodeURIComponent(path)}`,
    method: 'delete'
  })
}

/**
 * 更新目录权重
 */
export function updateDirectoryWeight(path: string, weight: number) {
  return request({
    url: `/directories/weight`,
    method: 'patch',
    data: { path, weight }
  })
}
