import axios from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'https://localhost:7042/api' : 'https://logistic-management.runasp.net/api')

export const api = axios.create({ baseURL })
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login' }
  return Promise.reject(err)
})
export default api
