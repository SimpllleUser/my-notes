import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/entities/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home').then((m) => m.HomePage),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/pages/auth').then((m) => m.AuthPage),
    },
    {
      path: '/ui-kit',
      name: 'ui-kit',
      component: () => import('@/pages/ui-kit').then((m) => m.UIKit),
      meta: { requiresAuth: true },
    },
  ],
})

let sessionChecked = false

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!sessionChecked) {
    await authStore.getSession()
    sessionChecked = true
  }

  if (to.meta.requiresAuth && !authStore.isAuthed) {
    return { name: 'auth' }
  }

  if (to.name === 'auth' && authStore.isAuthed) {
    return { name: 'home' }
  }
})

export default router
