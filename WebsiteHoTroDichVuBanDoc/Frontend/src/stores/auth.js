import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('auth_token') || null,
    user: null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.vaitro || 'guest'
  },
  actions: {
    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        params.append('username', username)
        params.append('password', password)

        const response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        const data = response.data
        this.token = data.access_token
        localStorage.setItem('auth_token', this.token)
        
        // Cấu hình Authorization header mặc định cho axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        await this.fetchProfile()
        return true
      } catch (err) {
        console.error('Lỗi đăng nhập:', err)
        this.error = err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.'
        return false
      } finally {
        this.loading = false
      }
    },
    async fetchProfile() {
      if (!this.token) return
      
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        const response = await axios.get(`${API_BASE_URL}/nguoi-dung/me`)
        this.user = response.data
      } catch (err) {
        console.error('Lỗi tải thông tin cá nhân:', err)
        this.logout()
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('auth_token')
      delete axios.defaults.headers.common['Authorization']
    }
  }
})
