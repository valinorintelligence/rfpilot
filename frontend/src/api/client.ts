import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rfpilot_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('rfpilot_refresh')
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', null, {
            params: { refresh_token: refreshToken },
          })
          const { access_token, refresh_token: newRefresh } = res.data
          localStorage.setItem('rfpilot_token', access_token)
          localStorage.setItem('rfpilot_refresh', newRefresh)
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('rfpilot_token')
          localStorage.removeItem('rfpilot_refresh')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
