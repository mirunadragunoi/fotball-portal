import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('@/views/GamesView.vue'),
  },
  {
    path: '/games/:slug',
    name: 'GameDetail',
    component: () => import('@/views/GameDetailView.vue'),
  },
  {
    path: '/games/:slug/play',
    name: 'GamePlay',
    component: () => import('@/views/GamePlayView.vue'),
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('@/views/VideosView.vue'),
  },
  {
    path: '/videos/:slug',
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

export default router
