import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { prefetchCatalog } from '@/composables/useCatalog'
import { getBrandKey, getCountryKey } from '@/config/brand'
import { getSubscribeLandingUrl } from '@/config/landingUrls'

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
    // Active brand × country may have an external carrier landing page —
    // prefer it over the internal phone form. Falls back to /signup when
    // no mapping exists (e.g. UK on either brand).
    const externalUrl = getSubscribeLandingUrl(getBrandKey(), getCountryKey())
    if (externalUrl) {
      window.location.href = externalUrl
      return
    }
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
