import { useAuthStore } from '@/stores/auth'

const PUBLIC_ROUTE_NAMES = new Set(['Home', 'Login', 'Signup'])

export function setupAuthGuard(router) {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    auth.hydrate()

    const isPublic = PUBLIC_ROUTE_NAMES.has(to.name) || to.meta?.public === true

    if (isPublic && (to.name === 'Login' || to.name === 'Signup') && auth.isAuthenticated) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
      const safe =
        redirect.startsWith('/') &&
        !redirect.startsWith('//') &&
        redirect !== '/login' &&
        redirect !== '/signup'
          ? redirect
          : '/games'
      return { path: safe }
    }

    if (!isPublic && !auth.isAuthenticated) {
      return {
        name: 'Login',
        query: { redirect: to.fullPath },
      }
    }

    return true
  })
}
