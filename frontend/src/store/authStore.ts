import { create } from 'zustand'
import api from '../api/client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  department: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; full_name: string; company?: string; jobTitle?: string }) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('rfpilot_token'),
  isAuthenticated: !!localStorage.getItem('rfpilot_token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token } = res.data
    localStorage.setItem('rfpilot_token', access_token)
    localStorage.setItem('rfpilot_refresh', refresh_token)
    set({ token: access_token, isAuthenticated: true })
    await get().fetchUser()
  },

  register: async (data) => {
    await api.post('/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      role: 'engineer',
      department: data.company || null,
    })
    await get().login(data.email, data.password)
  },

  logout: () => {
    localStorage.removeItem('rfpilot_token')
    localStorage.removeItem('rfpilot_refresh')
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true })
      const res = await api.get('/auth/me')
      set({ user: res.data, isLoading: false })
    } catch {
      set({ isLoading: false })
      get().logout()
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('rfpilot_token', token)
    set({ token, isAuthenticated: true })
  },
}))
