import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['token'] = token
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { data, config } = response
    if(data.code === '200') {
      return data.data
    } else {
      if (data.code === '-1') {
        if (!config.url?.includes('/login')) {
          ElMessage.error(data.msg || '登录过期，请重新登录')
          localStorage.removeItem('token')
          router.push({ name: 'login'})
        } else {
          ElMessage.error(data.msg || '登录过期，请重新登录')
        }
      } else {
        ElMessage.error(data.msg || data.message || '请求失败')
      }
      return Promise.reject(data.msg || data.message || '请求失败')
    }
  },
  (error) => {
    ElMessage.error('网络错误，请检查网络连接')
    return Promise.reject(error)
  }
)

export default service