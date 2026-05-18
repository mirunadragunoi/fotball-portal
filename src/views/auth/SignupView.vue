<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const brandStore = useBrandStore()
const { authStore, ensureHydrated, goToLogin } = useAuth()

const phone = ref('')
const issuedCode = ref('')
const maskedPhone = ref('')
const errorKey = ref('')
const submitting = ref(false)
const codeSent = ref(false)

const config = computed(() => brandStore.config)
const isF2 = computed(() => brandStore.activeBrand === 'football2')

onMounted(() => {
  ensureHydrated()
})

function formatPhoneDisplay(digits) {
  if (!digits) return ''
  return digits.length > 4 ? `***${digits.slice(-4)}` : digits
}

async function onSubmit() {
  errorKey.value = ''
  submitting.value = true
  const result = await authStore.signup(phone.value)
  submitting.value = false
  if (!result.ok) {
    errorKey.value = result.error
    return
  }
  issuedCode.value = result.accessCode || ''
  maskedPhone.value = formatPhoneDisplay(result.phone)
  codeSent.value = true
}

const errorMessage = computed(() =>
  errorKey.value ? t(`auth.errors.${errorKey.value}`) : ''
)
</script>

<template>
  <div class="auth-page" :class="{ 'auth-page--f2': isF2 }">
    <div class="auth-page__card">
      <RouterLink to="/" class="auth-page__brand">
        {{ config?.portalName || config?.displayName }}
      </RouterLink>

      <template v-if="!codeSent">
        <h1 class="auth-page__title">{{ t('auth.signupTitle') }}</h1>
        <p class="auth-page__subtitle">{{ t('auth.signupSubtitle') }}</p>

        <form class="auth-form" @submit.prevent="onSubmit">
          <label class="auth-form__field">
            <span class="auth-form__label">{{ t('auth.phone') }}</span>
            <input
              v-model="phone"
              type="tel"
              class="auth-form__input"
              :placeholder="t('auth.phonePlaceholder')"
              autocomplete="tel"
              inputmode="tel"
              required
            />
          </label>

          <p v-if="errorMessage" class="auth-form__error" role="alert">{{ errorMessage }}</p>

          <button type="submit" class="auth-form__submit" :disabled="submitting">
            {{ submitting ? t('auth.sendingCode') : t('auth.sendCodeButton') }}
          </button>
        </form>

        <p class="auth-page__footer">
          {{ t('auth.haveAccount') }}
          <button type="button" class="auth-page__link" @click="goToLogin($route.query.redirect)">
            {{ t('auth.loginLink') }}
          </button>
        </p>
      </template>

      <template v-else>
        <h1 class="auth-page__title">{{ t('auth.codeSentTitle') }}</h1>
        <p class="auth-page__subtitle">
          {{ t('auth.codeSentSubtitle', { phone: maskedPhone }) }}
        </p>

        <div class="auth-code-display" role="status" aria-live="polite">
          <span class="auth-code-display__label">{{ t('auth.yourAccessCode') }}</span>
          <span v-if="issuedCode" class="auth-code-display__value">{{ issuedCode }}</span>
          <p class="auth-code-display__note">
            {{ issuedCode ? t('auth.codeSentDevNote') : t('auth.codeSentSmsNote') }}
          </p>
        </div>

        <button
          type="button"
          class="auth-form__submit"
          @click="goToLogin($route.query.redirect)"
        >
          {{ t('auth.goToLogin') }}
        </button>
      </template>
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

.auth-form__error {
  margin: 0;
  font-size: 14px;
  color: var(--color-red);
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
  width: 100%;
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

.auth-code-display {
  margin-bottom: 24px;
  padding: 24px 20px;
  border-radius: var(--radius-card);
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
  text-align: center;
}

.auth-code-display__label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.auth-code-display__value {
  display: block;
  margin-top: 12px;
  font-family: var(--font-heading);
  font-size: 40px;
  font-weight: 800;
  letter-spacing: 0.25em;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.auth-code-display__note {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-text-secondary);
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
