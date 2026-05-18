<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useAuth } from '@/composables/useAuth'
import { sanitizeAccessCodeInput } from '@/utils/accessCode'
import { DEMO_ACCESS_CODE } from '@/config/auth'

const { t } = useI18n()
const brandStore = useBrandStore()
const { authStore, ensureHydrated, redirectAfterAuth, goToSignup } = useAuth()

const accessCode = ref('')
const errorKey = ref('')
const submitting = ref(false)

const config = computed(() => brandStore.config)
const isF2 = computed(() => brandStore.activeBrand === 'football2')
const showDemoHint = import.meta.env.DEV

onMounted(() => {
  ensureHydrated()
  if (authStore.isAuthenticated) {
    redirectAfterAuth()
  }
})

function onAccessCodeInput(event) {
  accessCode.value = sanitizeAccessCodeInput(event.target.value)
}

async function onSubmit() {
  errorKey.value = ''
  submitting.value = true
  const result = await authStore.login(accessCode.value)
  submitting.value = false
  if (!result.ok) {
    errorKey.value = result.error
    return
  }
  redirectAfterAuth()
}

const errorMessage = computed(() =>
  errorKey.value ? t(`auth.errors.${errorKey.value}`) : ''
)
</script>

<template>
  <div class="auth-page" :class="{ 'auth-page--f2': isF2 }">
    <div class="auth-page__card">
      <RouterLink to="/" class="auth-page__brand">
        {{ config?.displayName }}
      </RouterLink>

      <h1 class="auth-page__title">{{ t('auth.loginTitle') }}</h1>
      <p class="auth-page__subtitle">{{ t('auth.loginSubtitle') }}</p>

      <form class="auth-form" @submit.prevent="onSubmit">
        <label class="auth-form__field">
          <span class="auth-form__label">{{ t('auth.accessCode') }}</span>
          <input
            v-model="accessCode"
            type="text"
            class="auth-form__input auth-form__input--code"
            :placeholder="t('auth.accessCodePlaceholder')"
            autocomplete="one-time-code"
            autocapitalize="characters"
            maxlength="32"
            minlength="4"
            required
            @input="onAccessCodeInput"
          />
        </label>

        <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>

        <p v-if="showDemoHint" class="auth-form__demo-hint">
          {{ t('auth.demoHint', { code: DEMO_ACCESS_CODE }) }}
        </p>

        <button type="submit" class="auth-form__submit" :disabled="submitting">
          {{ submitting ? t('auth.signingIn') : t('auth.loginButton') }}
        </button>
      </form>

      <p class="auth-page__footer">
        {{ t('auth.noAccount') }}
        <button type="button" class="auth-page__link" @click="goToSignup($route.query.redirect)">
          {{ t('auth.signupLink') }}
        </button>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 48px var(--content-padding);
  background: var(--color-bg);
}

.auth-page--f2 {
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-soft, #edeef2) 100%);
}

.auth-page__card {
  width: 100%;
  max-width: 420px;
  padding: 40px 36px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-card);
}

.auth-page--f2 .auth-page__card {
  border-radius: 28px;
  box-shadow: var(--shadow-card-hover);
}

.auth-page__brand {
  display: inline-block;
  margin-bottom: 28px;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
  text-decoration: none;
}

.auth-page__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(28px, 5vw, 36px);
  font-weight: 800;
  color: var(--color-text);
  text-transform: uppercase;
  line-height: 1.05;
}

.auth-page--f2 .auth-page__title {
  text-transform: none;
  letter-spacing: -0.02em;
}

.auth-page__subtitle {
  margin: 10px 0 28px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-form__label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.auth-form__input {
  height: 52px;
  padding: 0 16px;
  border-radius: var(--radius-button);
  border: 1px solid var(--color-line-strong);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 16px;
  transition: var(--transition-default);
}

.auth-page--f2 .auth-form__input {
  border-radius: 14px;
  background: var(--color-surface);
}

.auth-form__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.auth-form__input--code {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2em;
  text-align: center;
}

.auth-form__error {
  margin: 0;
  font-size: 14px;
  color: var(--color-red);
}

.auth-form__demo-hint {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  border: 1px dashed color-mix(in srgb, var(--color-accent) 50%, transparent);
}

.auth-form__submit {
  height: 52px;
  margin-top: 4px;
  border: none;
  border-radius: var(--radius-button);
  background: var(--color-accent);
  color: #1a1500;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: var(--transition-default);
  min-height: 44px;
}

.auth-page--f2 .auth-form__submit {
  border-radius: 28px;
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-heading);
  text-transform: none;
  letter-spacing: 0.02em;
}

.auth-form__submit:hover:not(:disabled) {
  filter: brightness(1.06);
}

.auth-form__submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-page__footer {
  margin: 24px 0 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.auth-page__link {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.auth-page--f2 .auth-page__link {
  color: var(--color-secondary, #2979ff);
}
</style>
