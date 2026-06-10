import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dang_nhap',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallback.vue')
  },
  {
    path: '/dang_ky_the',
    name: 'CardRegistration',
    component: () => import('../views/CardRegistration.vue')
  },
  {
    path: '/dang_ky_the/form',
    name: 'CardRegistrationForm',
    component: () => import('../views/CardRegistrationForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dang_ky_the/tra_cuu',
    name: 'CardRegistrationLookup',
    component: () => import('../views/CardRegistrationLookup.vue')
  },
  {
    path: '/tim_kiem',
    name: 'Search',
    component: () => import('../views/Search.vue')
  },
  {
    path: '/tai_lieu/:id',
    name: 'BookDetail',
    component: () => import('../views/BookDetail.vue')
  },
  {
    path: '/bai_viet',
    name: 'Articles',
    component: () => import('../views/Articles.vue')
  },
  {
    path: '/thong_bao',
    name: 'Notifications',
    component: () => import('../views/Notifications.vue'),
    meta: { requiresAuth: true, role: 'ban_doc' }
  },
  {
    path: '/dich_vu',
    name: 'Services',
    component: () => import('../views/Services.vue')
  },
  {
    path: '/gioi_thieu',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  // Reader Dashboard (Bạn đọc)
  {
    path: '/tai_khoan',
    name: 'ReaderDashboard',
    component: () => import('../views/ReaderDashboard.vue'),
    meta: { requiresAuth: true, role: 'ban_doc' }
  },
  // Admin / Staff Layout and Sub-routes (Quản trị/Nhân viên)
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'nhan_vien' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/DashboardOverview.vue')
      },
      {
        path: 'phe_duyet_the',
        name: 'AdminCardApproval',
        component: () => import('../views/admin/CardApproval.vue')
      },
      {
        path: 'quan_ly_muon_tra',
        name: 'AdminLoanManagement',
        component: () => import('../views/admin/LoanManagement.vue')
      },
      {
        path: 'quan_ly_tai_khoan',
        name: 'AdminUserManagement',
        component: () => import('../views/admin/UserManagement.vue')
      },
      {
        path: 'cau_hinh',
        name: 'AdminConfig',
        component: () => import('../views/admin/SystemConfig.vue')
      },
      {
        path: 'quan_ly_dat_cho',
        name: 'AdminSeatBookings',
        component: () => import('../views/admin/SeatBookings.vue')
      },
      {
        path: 'quan_ly_bai_viet',
        name: 'AdminArticles',
        component: () => import('../views/admin/ArticleManagement.vue')
      },
      {
        path: 'vi_pham',
        name: 'AdminViolations',
        component: () => import('../views/admin/ViolationManagement.vue')
      },
      {
        path: 'gui_thong_bao',
        name: 'AdminNotifications',
        component: () => import('../views/admin/SendNotifications.vue')
      },
      {
        path: 'giam_sat',
        name: 'AdminMonitoring',
        component: () => import('../views/admin/SystemMonitoring.vue')
      }
    ]
  },
  // Fallback Route for Undefined Paths
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

// Route Guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait/load session profile if token is present but user profile is null
  if (authStore.token && !authStore.user) {
    await authStore.fetchProfile()
  }

  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.role // 'guest', 'ban_doc' (or 'nguoiDung'), 'nhan_vien' (or 'nhanVien', 'admin')

  // Helper logic matching original middleware.js
  const isUserStaff = userRole === 'nhan_vien' || userRole === 'nhanVien' || userRole === 'admin'
  const isUserReader = userRole === 'ban_doc' || userRole === 'nguoiDung'

  // 1. Guest restrictions
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      return next('/dang_nhap')
    }

    // 2. Role checks
    if (to.meta.role === 'nhan_vien' && !isUserStaff) {
      return next('/tai_khoan') // Redirect reader to reader dashboard
    }
    if (to.meta.role === 'ban_doc' && !isUserReader) {
      return next('/admin') // Redirect staff to admin dashboard
    }
  }

  // 3. Guest only page (like /dang_nhap)
  if (to.meta.guestOnly && isAuthenticated) {
    if (isUserStaff) {
      return next('/admin')
    } else {
      return next('/tai_khoan')
    }
  }

  // Allow standard routing
  next()
})

export default router
