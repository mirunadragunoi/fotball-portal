import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { prefetchCatalog } from '@/composables/useCatalog'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  function ensureHydrated() {
    authStore.hydrate()
  }

  async function redirectAfterAuth(fallback = '/') {
    await prefetchCatalog().catch(() => {})
    const target = typeof route.query.redirect === 'string' ? route.query.redirect : fallback
    const safe =
      target.startsWith('/') &&
      !target.startsWith('//') &&
      target !== '/login' &&
      target !== '/signup'
        ? target
        : fallback
    await router.replace(safe)
  }

  function goToLogin(redirectTo) {
    router.push({
      name: 'Login',
      query: redirectTo ? { redirect: redirectTo } : undefined,
    })
  }

  function goToSignup(redirectTo) {
    router.push({
      name: 'Signup',
      query: redirectTo ? { redirect: redirectTo } : undefined,
    })
  }

  /**
   * Navigate to an internal path only when authenticated; otherwise send to login.
   */
  function navigateProtected(path) {
    ensureHydrated()
    if (authStore.isAuthenticated) {
      router.push(path)
    } else {
      goToLogin(path)
    }
  }

  return {
    authStore,
    ensureHydrated,
    redirectAfterAuth,
    goToLogin,
    goToSignup,
    navigateProtected,
  }
}
