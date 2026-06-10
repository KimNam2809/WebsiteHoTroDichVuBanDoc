<template>
  <div class="space-y-6 animate-fade-in">

    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Users class="text-blue-600" :size="32" />
          Quản lý tài khoản
        </h1>
        <p class="text-gray-500 mt-1">Danh sách và phân quyền người dùng hệ thống.</p>
      </div>

      <div class="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
        <button @click="addNewStaff" class="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
          + Thêm nhân viên
        </button>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
      <div class="relative flex-1 w-full md:max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
        <input
          type="text"
          placeholder="Tìm theo tên, email, username..."
          v-model="search"
          class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
        <button
          v-for="role in ['all', 'admin', 'nhanVien', 'nguoiDung']"
          :key="role"
          @click="roleFilter = role"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all',
            roleFilter === role
              ? 'bg-gray-800 text-white shadow-md'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          ]"
        >
          {{ role === 'all' ? 'Tất cả' : roleNames[role] }}
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b border-gray-200 text-gray-500 uppercase text-xs tracking-wider">
              <th class="px-6 py-4 font-bold">Người dùng</th>
              <th class="px-6 py-4 font-bold">Liên hệ</th>
              <th class="px-6 py-4 font-bold">Vai trò</th>
              <th class="px-6 py-4 font-bold">Ngày tạo</th>
              <th class="px-6 py-4 font-bold">Trạng thái</th>
              <th class="px-6 py-4 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td colSpan="6" class="px-6 py-4">
                  <div class="h-4 bg-gray-200 rounded w-full"></div>
                </td>
              </tr>
            </template>
            <template v-else-if="filteredUsers.length > 0">
              <tr v-for="user in filteredUsers" :key="user.manguoidung" class="hover:bg-blue-50/30 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-white shadow-sm">
                      {{ user.hoten ? user.hoten.charAt(0).toUpperCase() : user.tenDangNhap.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-bold text-gray-900">{{ user.hoten || user.tenDangNhap }}</p>
                      <p class="text-xs text-gray-500">@{{ user.tenDangNhap }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div class="flex items-center gap-2">
                    <Mail :size="14" class="text-gray-400" />
                    {{ user.email || 'Chưa cập nhật' }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border',
                    roleColors[user.vaitro] || 'bg-gray-100 text-gray-600 border-gray-200'
                  ]">
                    <Shield v-if="user.vaitro === 'admin'" :size="12" class="mr-1" />
                    {{ roleNames[user.vaitro] || user.vaitro }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 font-medium">
                  {{ formatDate(user.ngaytao) }}
                </td>
                <td class="px-6 py-4">
                  <span :class="[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
                    user.trangthai ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  ]">
                    <span :class="['w-2 h-2 rounded-full', user.trangthai ? 'bg-green-500' : 'bg-red-500', 'animate-pulse']"></span>
                    {{ user.trangthai ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click="handleToggleStatus(user.manguoidung, user.trangthai)"
                      :class="[
                        'p-2 rounded-lg transition-all',
                        user.trangthai ? 'text-red-500 hover:bg-red-50 hover:text-red-700' : 'text-green-500 hover:bg-green-50 hover:text-green-700'
                      ]"
                      :title="user.trangthai ? 'Khóa tài khoản' : 'Mở khóa'"
                    >
                      <Lock v-if="user.trangthai" :size="18" />
                      <Unlock v-else :size="18" />
                    </button>
                    <button class="p-2 text-gray-400 hover:bg-gray-100 rounded-lg hover:text-gray-700">
                      <MoreVertical :size="18" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colSpan="6" class="px-6 py-12 text-center text-gray-400 italic">
                Không tìm thấy người dùng nào phù hợp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { Search, Mail, Shield, Lock, Unlock, MoreVertical, Users } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const users = ref([])
const filteredUsers = ref([])
const isLoading = ref(true)

const search = ref('')
const roleFilter = ref('all')

const roleColors = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  nhanVien: 'bg-blue-100 text-blue-700 border-blue-200',
  nguoiDung: 'bg-green-100 text-green-700 border-green-200'
}

const roleNames = {
  admin: 'Quản Trị Viên',
  nhanVien: 'Nhân Viên',
  nguoiDung: 'Bạn Đọc'
}

const loadUsers = async () => {
  isLoading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/nguoi-dung/`)
    users.value = res.data || []
    filterUsers()
  } catch (error) {
    console.error('Lỗi tải danh sách người dùng:', error)
  } finally {
    isLoading.value = false
  }
}

const filterUsers = () => {
  let result = [...users.value]

  if (search.value) {
    const s = search.value.toLowerCase().trim()
    result = result.filter(u =>
      (u.hoten && u.hoten.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s)) ||
      (u.tenDangNhap && u.tenDangNhap.toLowerCase().includes(s))
    )
  }

  if (roleFilter.value !== 'all') {
    result = result.filter(u => u.vaitro === roleFilter.value)
  }

  filteredUsers.value = result
}

watch([search, roleFilter, users], filterUsers)

const handleToggleStatus = async (userId, currentStatus) => {
  if (!confirm(`Bạn có chắc muốn ${currentStatus ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return

  try {
    await axios.put(`${API_BASE_URL}/nguoi-dung/${userId}`, {
      trangThai: !currentStatus
    })
    users.value = users.value.map(u =>
      u.manguoidung === userId ? { ...u, trangthai: !currentStatus } : u
    )
    alert('Cập nhật trạng thái thành công!')
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error)
    alert(error.response?.data?.detail || 'Lỗi cập nhật trạng thái.')
  }
}

const addNewStaff = () => {
  alert('Tính năng thêm nhân viên mới đang được xây dựng...')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadUsers()
})
</script>
