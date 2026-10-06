import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home').then((m) => m.HomePage),
    },
    {
      path: '/ui-kit',
      name: 'ui-kit',
      component: () => import('@/pages/ui-kit').then((m) => m.UIKit),
    },
  ],
})

export default router
