import { createRouter, createWebHistory } from 'vue-router'
import { setupAuthGuard } from './guards'
import { setUnauthorizedHandler, logEvent } from '@/services/footballApi'
import { useAuthStore } from '@/stores/auth'
import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'

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
    path: '/dologin/:token',
    name: 'DoLogin',
    component: () => import('@/views/auth/DoLoginView.vue'),
    meta: { public: true },
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
  {
    path: '/tournament',
    name: 'Tournament',
    component: () => import('@/views/WorldCupView.vue'),
  },
  {
    path: '/tournament/team/:teamId',
    name: 'TournamentTeamSquad',
    component: () => import('@/views/live/TeamSquadView.vue'),
    props: true,
  },
  // Legacy redirects — old /world-cup links keep working
  { path: '/world-cup',                redirect: '/tournament' },
  { path: '/world-cup/team/:teamId',   redirect: to => `/tournament/team/${to.params.teamId}` },
  {
    path: '/news',
    name: 'News',
    component: () => import('@/views/NewsView.vue'),
  },
  // Phase 2 placeholders
  {
    path: '/trivia',
    name: 'Trivia',
    component: () => import('@/views/trivia/TriviaView.vue'),
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/history/HistoryView.vue'),
  },
  {
    path: '/live',
    name: 'Live',
    component: () => import('@/views/live/LiveView.vue'),
  },
  {
    path: '/live/match/:matchId',
    name: 'MatchDetail',
    component: () => import('@/views/live/MatchDetailView.vue'),
  },
  {
    path: '/live/tournament/:competitionId',
    redirect: '/tournament',
  },
  {
    path: '/live/h2h/:team1Id/:team2Id',
    name: 'H2H',
    component: () => import('@/views/live/H2HView.vue'),
  },
  {
    path: '/live/standings/:competitionId',
    name: 'Standings',
    component: () => import('@/views/live/StandingsView.vue'),
  },
  {
    path: '/live/competition/:competitionId',
    name: 'CompetitionDetail',
    component: () => import('@/views/live/CompetitionDetailView.vue'),
  },
  {
    path: '/live/team/:teamId',
    name: 'TeamDetail',
    component: () => import('@/views/live/TeamDetailView.vue'),
  },
  {
    path: '/live/tournament/team/:teamId',
    redirect: to => ({ name: 'TournamentTeamSquad', params: { teamId: to.params.teamId } }),
  },
  // Legal pages — all served by a single shared view, legalKey drives content
  {
    path: '/about',
    name: 'About',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'about' },
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'contact' },
  },
  {
    path: '/faq',
    name: 'Faq',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'faq' },
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'terms' },
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'privacy' },
  },
  {
    path: '/cookies',
    name: 'Cookies',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'cookies' },
  },
  {
    path: '/unsubscribe',
    name: 'Unsubscribe',
    component: () => import('@/legal/LegalPageView.vue'),
    meta: { public: true, legalKey: 'unsubscribe' },
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

// Page view logging (603) — single global hook, catches every navigation
// (including public/legal pages). For product pages the route :id param IS the
// store.product.id, so attach it; other :id-like params (matchId, teamId) are
// NOT product ids and are intentionally omitted.
const PRODUCT_ROUTE_NAMES = new Set(['GameDetail', 'GamePlay', 'VideoDetail'])
router.afterEach((to) => {
  const product = PRODUCT_ROUTE_NAMES.has(to.name) ? to.params.id : undefined
  logEvent({ event_type: 603, page: to.name || to.path, product })
})

setUnauthorizedHandler(() => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated) return
  const redirect = router.currentRoute.value.fullPath
  auth.logout()
  useGamesStore().clear()
  useVideosStore().clear()
  router.push({
    name: 'Login',
    query: redirect && redirect !== '/login' ? { redirect } : undefined,
  })
})

export default router
