import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuard } from './guards'
import { setUnauthorizedHandler } from '@/services/footballApi'
import { useAuthStore } from '@/stores/auth'
import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'
import { useFavoritesStore } from '@/stores/favorites'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true, authPage: true },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/views/auth/SignupView.vue'),
    meta: { public: true, authPage: true },
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('@/views/GamesView.vue'),
  },
  {
    path: '/games/:id',
    name: 'GameDetail',
    component: () => import('@/views/GameDetailView.vue'),
  },
  {
    path: '/games/:id/play',
    name: 'GamePlay',
    component: () => import('@/views/GamePlayView.vue'),
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('@/views/VideosView.vue'),
  },
  {
    path: '/videos/:id',
    name: 'VideoDetail',
    component: () => import('@/views/VideoDetailView.vue'),
  },
  // Phase 2 placeholders
  {
    path: '/trivia',
    name: 'Trivia',
    component: () => import('@/views/ComingSoonView.vue'),
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/ComingSoonView.vue'),
  },
  {
    path: '/live',
    name: 'Live',
    component: () => import('@/views/ComingSoonView.vue'),
  },
  // Catch-all 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  },
})

setupAuthGuard(router)

setUnauthorizedHandler(() => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return
  const redirect = router.currentRoute.value.fullPath
  auth.logout()
  useGamesStore().clear()
  useVideosStore().clear()
  useFavoritesStore().clear()
  router.push({
    name: 'Login',
    query: redirect && redirect !== '/login' ? { redirect } : undefined,
  })
})

export default router
