<template>
  <main class="legal-page">
    <div class="legal-container">

      <!-- Page header -->
      <header class="legal-header">
        <h1 class="legal-title">{{ t(`legal.pages.${pageKey}.title`) }}</h1>
        <p class="legal-summary">{{ t(`legal.pages.${pageKey}.summary`) }}</p>
      </header>

      <!-- Loading skeletons -->
      <div v-if="isLoading" class="legal-skeletons" aria-busy="true" aria-label="Loading">
        <div class="skeleton-line skeleton-line--wide" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-line--narrow" />
        <div class="skeleton-line" />
        <div class="skeleton-line skeleton-line--wide" />
        <div class="skeleton-line skeleton-line--narrow" />
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="legal-error" role="alert">
        {{ loadError }}
      </div>

      <!-- FAQ accordion -->
      <section v-else-if="pageKey === 'faq'" class="faq-list">
        <p v-if="!faqItems.length" class="legal-empty">{{ t('legal.error') }}</p>
        <details
          v-for="item in faqItems"
          :key="item.order ?? item.question"
          class="faq-item"
        >
          <summary class="faq-question">{{ item.question }}</summary>
          <div class="faq-answer" v-html="toHtml(item.answer)" />
        </details>
      </section>

      <!-- Unsubscribe form -->
      <section v-else-if="pageKey === 'unsubscribe'" class="unsubscribe-section">
        <!-- Per-portal/country intro text from the backend, shown above the form -->
        <div
          v-if="content"
          class="legal-content unsubscribe-intro"
          v-html="toHtml(String(content))"
        />
        <div v-if="submitSuccess" class="legal-success" role="status">
          {{ t('legal.unsubscribe_form.success') }}
        </div>
        <form v-else class="unsubscribe-form" @submit.prevent="submitUnsubscribe" novalidate>
          <label class="form-label" for="unsub-phone">
            {{ t('legal.unsubscribe_form.phone_label') }}
          </label>

          <div class="phone-input" :class="{ 'phone-input--valid': isPhoneValid }">
            <span class="dial-code" aria-hidden="true">
              {{ selectedPhoneCountryMeta.dialCode }}
            </span>
            <input
              id="unsub-phone"
              :value="phoneNumber"
              inputmode="numeric"
              type="tel"
              :maxlength="selectedPhoneCountryMeta.length"
              :placeholder="selectedPhoneCountryMeta.hint"
              autocomplete="tel-national"
              @input="onPhoneInput"
            />
          </div>

          <div ref="recaptchaContainer" class="recaptcha-box" aria-label="reCAPTCHA" />

          <p v-if="submitError" class="form-error" role="alert">{{ submitError }}</p>

          <button
            type="submit"
            class="legal-submit"
            :disabled="isSubmitting || !isPhoneValid || !recaptchaToken"
          >
            {{ isSubmitting
              ? t('legal.unsubscribe_form.submitting')
              : t('legal.unsubscribe_form.submit') }}
          </button>
        </form>
      </section>

      <!-- Generic HTML content (terms, privacy, cookies, about, contact) -->
      <div
        v-else-if="content"
        class="legal-content"
        v-html="toHtml(String(content))"
      />

    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as api from '@/services/footballApi'
import { getCountryKey } from '@/config/brand'

const route = useRoute()
const { t, locale } = useI18n()

const pageKey = computed(() => route.meta?.legalKey || '')

// ─── Content state ─────────────────────────────────────────────────────────────
const isLoading   = ref(true)
const loadError   = ref('')
const content     = ref(null)   // HTML string for non-FAQ pages
const faqItems    = ref([])     // [{ question, answer, order }]

// ─── Unsubscribe form ──────────────────────────────────────────────────────────
const phoneNumber      = ref('')
const recaptchaToken   = ref('')
const recaptchaWidgetId = ref(null)
const recaptchaContainer = ref(null)
const isSubmitting     = ref(false)
const submitSuccess    = ref(false)
const submitError      = ref('')

// ─── Phone country definitions ─────────────────────────────────────────────────
const PHONE_COUNTRIES = [
  { code: 'UK', dialCode: '+44', hint: '7xxxxxxxxx', length: 10, pattern: /^7\d{9}$/ },
  { code: 'RO', dialCode: '+40', hint: '7xxxxxxxx',  length: 9,  pattern: /^7\d{8}$/ },
  { code: 'CZ', dialCode: '+420', hint: '7xxxxxxxx', length: 9,  pattern: /^7\d{8}$/ },
  { code: 'SK', dialCode: '+421', hint: '9xxxxxxxx', length: 9,  pattern: /^9\d{8}$/ },
  { code: 'PL', dialCode: '+48', hint: '5xxxxxxxx',  length: 9,  pattern: /^[5-9]\d{8}$/ },
]

const selectedPhoneCountry = computed(() => {
  if (String(locale.value || '').toLowerCase() === 'ro') return 'RO'
  return getCountryKey()
})

const selectedPhoneCountryMeta = computed(() =>
  PHONE_COUNTRIES.find(c => c.code === selectedPhoneCountry.value) || PHONE_COUNTRIES[0]
)

const isPhoneValid = computed(() =>
  selectedPhoneCountryMeta.value.pattern.test(phoneNumber.value)
)

function onPhoneInput(event) {
  const digits = event.target.value
    .replace(/\D/g, '')
    .slice(0, selectedPhoneCountryMeta.value.length)
  phoneNumber.value = digits
  event.target.value = digits
}

watch(selectedPhoneCountry, () => { phoneNumber.value = '' })

// Returns locale in UPPERCASE for backends that require it
function currentApiLanguage() {
  return String(locale.value || 'en').toUpperCase()
}

// ─── HTML rendering ────────────────────────────────────────────────────────────
const BLOCK_TAG_RE = /^<(p|div|ul|ol|li|h[1-6]|blockquote|table|section|article|header|footer|figure|pre)\b/i

function normalizeNewlines(str) {
  // backend may send literal "\n" (two chars) instead of real newline
  return str.replace(/\\n/g, '\n')
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function toHtml(raw) {
  if (!raw) return ''
  const normalized = normalizeNewlines(raw)
  if (BLOCK_TAG_RE.test(normalized.trim())) return normalized
  return normalized
    .split(/\n\n+/)
    .map(para => {
      const lines = para.split('\n').map(line =>
        /<[a-z]/i.test(line) ? line : escapeHtml(line)
      )
      return `<p>${lines.join('<br>')}</p>`
    })
    .join('\n')
}

// Service already extracts the right shape per endpoint — FAQ comes as an array
// of { order, question, answer }; everything else is a string of HTML/text or null.
function sortFaq(items) {
  return Array.isArray(items)
    ? [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : []
}

// ─── reCAPTCHA ─────────────────────────────────────────────────────────────────
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

function loadRecaptchaScript() {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha?.render) { resolve(); return }

    if (!document.querySelector('script[data-recaptcha-v2]')) {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.recaptchaV2 = 'true'
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'))
      document.head.appendChild(script)
    }

    // script.onload does NOT guarantee grecaptcha.render is ready — poll instead
    let waited = 0
    const interval = window.setInterval(() => {
      if (window.grecaptcha?.render) {
        window.clearInterval(interval)
        resolve()
      } else if ((waited += 100) >= 10000) {
        window.clearInterval(interval)
        reject(new Error('reCAPTCHA failed to initialize within 10s'))
      }
    }, 100)
  })
}

async function renderRecaptcha() {
  if (
    pageKey.value !== 'unsubscribe' ||
    !recaptchaContainer.value ||
    recaptchaWidgetId.value !== null
  ) return

  await loadRecaptchaScript()

  const theme = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light'

  recaptchaWidgetId.value = window.grecaptcha.render(recaptchaContainer.value, {
    sitekey: RECAPTCHA_SITE_KEY,
    theme,
    callback: (token) => {
      recaptchaToken.value = token
      submitError.value = ''
    },
    'expired-callback': () => {
      recaptchaToken.value = ''
    },
    'error-callback': () => {
      recaptchaToken.value = ''
      submitError.value = t('legal.unsubscribe_form.recaptcha_error')
    },
  })
}

function resetRecaptcha() {
  recaptchaToken.value = ''
  if (window.grecaptcha && recaptchaWidgetId.value !== null) {
    window.grecaptcha.reset(recaptchaWidgetId.value)
  }
}

// ─── Content loading ───────────────────────────────────────────────────────────
const LOADERS = {
  about:       api.getAbout,
  contact:     api.getLegalContact,
  faq:         api.getLegalFaq,
  terms:       api.getLegalTerms,
  privacy:     api.getLegalPrivacy,
  cookies:     api.getLegalCookies,
  unsubscribe: api.getLegalUnsubscribe,
}

async function loadContent() {
  isLoading.value    = true
  loadError.value    = ''
  content.value      = null
  faqItems.value     = []
  submitSuccess.value = false
  submitError.value  = ''

  const loader = LOADERS[pageKey.value]
  if (loader) {
    try {
      const raw = await loader({ language: currentApiLanguage() })
      if (pageKey.value === 'faq') {
        faqItems.value = sortFaq(raw)
      } else if (raw != null) {
        content.value = raw
      }
    } catch {
      if (pageKey.value !== 'unsubscribe') {
        loadError.value = t('legal.error')
      }
    }
  }

  isLoading.value = false

  if (pageKey.value === 'unsubscribe') {
    await nextTick()
    try {
      await renderRecaptcha()
    } catch (e) {
      console.warn('reCAPTCHA render failed:', e?.message || e)
    }
  }
}

// ─── Unsubscribe submit ────────────────────────────────────────────────────────
async function submitUnsubscribe() {
  if (!isPhoneValid.value || !recaptchaToken.value || isSubmitting.value) return
  isSubmitting.value = true
  submitError.value  = ''

  try {
    await api.unsubscribePhoneNumber({
      country:        selectedPhoneCountry.value,
      language:       currentApiLanguage(),
      phoneNumber:    phoneNumber.value,
      recaptchaToken: recaptchaToken.value,
    })
    submitSuccess.value = true
  } catch (e) {
    submitError.value = e?.message || t('legal.unsubscribe_form.error')
    resetRecaptcha()
  } finally {
    isSubmitting.value = false
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────
watch(pageKey, loadContent, { immediate: true })

// Don't destroy the widget on unmount — just clear the internal ID reference
onBeforeUnmount(() => { recaptchaWidgetId.value = null })
</script>

<style scoped>
.legal-page {
  min-height: calc(100dvh - var(--header-height, 64px));
  background: var(--color-bg);
  color: var(--color-text);
  padding-block: 3rem 5rem;
}

.legal-container {
  max-width: 760px;
  margin-inline: auto;
  padding-inline: 1.25rem;
}

/* ── Header ── */
.legal-header {
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--color-line, rgba(0,0,0,.1));
  padding-bottom: 1.5rem;
}

.legal-title {
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 .6rem;
  color: var(--color-text);
}

.legal-summary {
  font-size: 1.05rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

/* ── Skeletons ── */
.legal-skeletons {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}

.skeleton-line {
  height: 1rem;
  border-radius: 4px;
  background: var(--color-surface, #eee);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
  width: 85%;
}
.skeleton-line--wide   { width: 100%; height: 1.25rem; }
.skeleton-line--narrow { width: 55%; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}

/* ── Error / empty ── */
.legal-error,
.legal-empty {
  padding: 1.5rem;
  border-radius: var(--radius-card, 12px);
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-red, #e53935);
  color: var(--color-red, #e53935);
  font-size: .95rem;
}

/* ── HTML content ── */
.legal-content {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-text);
}

.legal-content :deep(h2),
.legal-content :deep(h3) {
  font-family: var(--font-heading);
  font-weight: 700;
  margin-top: 2rem;
  color: var(--color-text);
}

.legal-content :deep(p)  { margin: .75rem 0; }
.legal-content :deep(ul),
.legal-content :deep(ol) { padding-left: 1.5rem; margin: .75rem 0; }
.legal-content :deep(li) { margin-bottom: .35rem; }
.legal-content :deep(a)  { color: var(--color-primary); }

/* ── FAQ ── */
.faq-list { display: flex; flex-direction: column; gap: .5rem; }

.faq-item {
  border-radius: var(--radius-card, 12px);
  background: var(--color-surface);
  border: 1px solid var(--color-line, rgba(0,0,0,.08));
  overflow: hidden;
  transition: box-shadow .15s;
}
.faq-item[open] { box-shadow: var(--shadow-card); }

.faq-question {
  cursor: pointer;
  padding: 1rem 1.25rem;
  font-weight: 600;
  font-size: .95rem;
  color: var(--color-text);
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  user-select: none;
}
.faq-question::after {
  content: '﹢';
  flex-shrink: 0;
  color: var(--color-primary);
  font-size: 1.1rem;
}
.faq-item[open] .faq-question::after { content: '−'; }

.faq-answer {
  padding: .25rem 1.25rem 1rem;
  font-size: .9rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-line, rgba(0,0,0,.06));
}

/* ── Unsubscribe form ── */
.unsubscribe-section { max-width: 480px; }

.legal-success {
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius-card, 12px);
  background: rgba(22, 163, 74, .1);
  border: 1px solid #16a34a;
  color: #15803d;
  font-weight: 600;
}

.unsubscribe-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-label {
  font-size: .9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: -.5rem;
}

/* Phone input compound control */
.phone-input {
  display: grid;
  grid-template-columns: auto 1fr;
  border: 1px solid var(--color-line, rgba(0,0,0,.2));
  border-radius: var(--radius-button, 8px);
  overflow: hidden;
  transition: border-color 150ms, box-shadow 150ms;
  background: var(--color-surface);
}

.phone-input--valid {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .15);
}

.dial-code {
  display: flex;
  align-items: center;
  padding: .7rem .9rem;
  background: var(--color-surface-2, var(--color-surface));
  font-size: .9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  border-right: 1px solid var(--color-line, rgba(0,0,0,.1));
  white-space: nowrap;
  user-select: none;
}

.phone-input input {
  padding: .7rem .9rem;
  border: none;
  outline: none;
  background: transparent;
  font-size: .95rem;
  color: var(--color-text);
  width: 100%;
  font-family: var(--font-body);
  min-height: 44px;
}

.phone-input input::placeholder { color: var(--color-text-secondary); opacity: .6; }

/* reCAPTCHA placeholder — prevents layout shift */
.recaptcha-box { min-height: 78px; }

.form-error {
  padding: .6rem .9rem;
  border-radius: var(--radius-button, 8px);
  background: rgba(229, 57, 53, .08);
  border: 1px solid var(--color-red, #e53935);
  color: var(--color-red, #e53935);
  font-size: .85rem;
  margin: 0;
}

.legal-submit {
  min-height: 48px;
  padding: .75rem 2rem;
  border: none;
  border-radius: var(--radius-button, 8px);
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity .15s, transform .1s;
  align-self: flex-start;
}
.legal-submit:hover:not(:disabled) { opacity: .88; }
.legal-submit:active:not(:disabled) { transform: scale(.97); }
.legal-submit:disabled { cursor: not-allowed; opacity: .55; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .legal-page { padding-block: 1.5rem 3rem; }
  .unsubscribe-section { max-width: 100%; }
}
</style>
