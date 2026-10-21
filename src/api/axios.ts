import axios from 'axios'
import type { AxiosError } from 'axios'

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5099/api' : 'https://logistic-management.runasp.net/api')

export const api = axios.create({ baseURL })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  // IIS / MonsterASP returns 411 for bodyless POSTs. Send an empty JSON object
  // for actions that do not need a payload (start route, mark read, resend...).
  if (cfg.data == null && ['post', 'put', 'patch'].includes((cfg.method ?? '').toLowerCase())) {
    cfg.data = {}
  }
  return cfg
})

api.interceptors.response.use(
  r => r,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      const onLogin = window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/accept-invite')
      if (!onLogin && localStorage.getItem('token')) {
        localStorage.clear()
        window.location.assign('/login')
      }
    }
    return Promise.reject(err)
  },
)

export function apiError(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; title?: string; error?: string } | undefined
    if (data?.message) return data.message
    if (data?.title) return data.title
    if (data?.error) return data.error
    if (err.response?.status === 403) return 'You do not have permission to do that.'
    if (err.response?.status === 404) return 'Not found.'
    if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.'
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}

export default api
