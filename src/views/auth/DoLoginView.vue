<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { prefetchCatalog } from '@/composables/useCatalog'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const status = ref('loading') // 'loading' | 'error'
const errorKey = ref('')

onMounted(async () => {
  authStore.hydrate()

  if (authStore.isAuthenticated) {
    redirectUser()
    return
  }

  const token = String(route.params.token || '').trim()
  if (!token) {
    status.value = 'error'
    errorKey.value = 'invalidCode'
    return
  }

  const result = await authStore.login(token)
  if (!result.ok) {
    status.value = 'error'
    errorKey.value = result.error
    return
  }

  await prefetchCatalog().catch(() => {})
  redirectUser()
})

function redirectUser() {
  const redirect = route.query.redirect
  const safe =
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//')
      ? redirect
      : '/'
  router.replace(safe)
}
</script>

<template>
  <div class="dologin-page" role="main" aria-live="polite">
    <div class="dologin-page__card">
      <div class="dologin-page__brand" aria-hidden="true">⚽</div>

      <template v-if="status === 'loading'">
        <div class="dologin-page__spinner" aria-label="Loading…"></div>
        <p class="dologin-page__text">{{ t('dologin.loading') }}</p>
      </template>

      <template v-else>
        <p class="dologin-page__error" role="alert">
          {{ t('dologin.errorTitle') }}
        </p>
        <p class="dologin-page__error-detail">
          {{ t(`auth.errors.${errorKey}`, t('dologin.errorFallback')) }}
        </p>
        <RouterLink to="/login" class="dologin-page__btn">
          {{ t('dologin.goToLogin') }}
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.dologin-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 48px var(--content-padding, 20px);
  background: var(--color-bg);
}

.dologin-page__card {
  width: 100%;
  max-width: 360px;
  padding: 48px 32px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  box-shadow: var(--shadow-card);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.dologin-page__brand {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 4px;
}

/* Spinner */
.dologin-page__spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
  border-top-color: var(--color-primary);
  animation: dologin-spin 0.7s linear infinite;
}

@keyframes dologin-spin {
  to { transform: rotate(360deg); }
}

.dologin-page__text {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
}

.dologin-page__error {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.dologin-page__error-detail {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.dologin-page__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  height: 48px;
  padding: 0 28px;
  border-radius: var(--radius-button);
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: var(--transition-default);
}

.dologin-page__btn:hover {
  filter: brightness(1.1);
}
</style>
