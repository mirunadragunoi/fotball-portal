<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { setLocale, availableLocales } from '@/i18n/index.js'
import { getCountryKey } from '@/config/brand'
import brandFooterLogo from '@brand/assets/logo-footer.svg'

const { t, locale } = useI18n()
const brandStore = useBrandStore()
const config = computed(() => brandStore.config)
const isF2 = computed(() => brandStore.activeBrand === 'football2')
const showLangSwitcher = computed(() => availableLocales.length > 1)

function onLangChange(e) {
  setLocale(e.target.value)
}

// Unsubscribe link is enabled only where the SMS-based unsubscribe flow applies.
const UNSUBSCRIBE_COUNTRIES = new Set(['CZ', 'SK'])

const legalLinks = computed(() => {
  const all = [
    { key: 'about',       to: '/about' },
    { key: 'contact',     to: '/contact' },
    { key: 'faq',         to: '/faq' },
    { key: 'terms',       to: '/terms' },
    { key: 'privacy',     to: '/privacy' },
    { key: 'cookies',     to: '/cookies' },
    { key: 'unsubscribe', to: '/unsubscribe' },
  ]
  const country = getCountryKey()
  return all.filter(
    (link) => link.key !== 'unsubscribe' || UNSUBSCRIBE_COUNTRIES.has(country),
  )
})
</script>

<template>
  <footer class="app-footer" :class="{ 'app-footer--f2': isF2 }">
    <div class="app-footer__inner">
      <div class="app-footer__main">

        <!-- Brand column -->
        <div class="app-footer__brand">
          <RouterLink to="/" class="app-footer__logo-link" aria-label="Homepage">
            <img
              :src="brandFooterLogo"
              :alt="config?.displayName || 'Football Portal'"
              class="app-footer__logo-img"
            />
          </RouterLink>
          <p class="app-footer__tagline">{{ t('brand.tagline') }}</p>
          <div v-if="isF2" class="app-footer__dots" aria-hidden="true">
            <span style="background: var(--color-primary)"></span>
            <span style="background: var(--color-secondary)"></span>
            <span style="background: var(--color-red)"></span>
            <span style="background: var(--color-accent)"></span>
          </div>
        </div>

        <!-- Legal links column -->
        <nav class="app-footer__legal-nav" aria-label="Legal pages">
          <RouterLink
            v-for="link in legalLinks"
            :key="link.key"
            :to="link.to"
            class="app-footer__legal-link"
          >
            {{ t(`legal.pages.${link.key}.title`) }}
          </RouterLink>
        </nav>

      </div>

      <!-- Bottom bar -->
      <div class="app-footer__bottom">
        <p class="app-footer__copy">{{ t('footer.copy') }}</p>

        <div class="app-footer__bottom-right">
          <label v-if="showLangSwitcher" class="app-footer__lang-wrap" aria-label="Language">
            <select
              class="app-footer__lang-select"
              :value="locale"
              @change="onLangChange"
            >
              <option
                v-for="loc in availableLocales"
                :key="loc.code"
                :value="loc.code"
              >
                {{ loc.label }}
              </option>
            </select>
          </label>
          <span v-else class="app-footer__lang-static">
            {{ availableLocales[0]?.label }}
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: color-mix(in srgb, var(--color-bg) 80%, #000);
  border-top: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 14px;
  margin-top: auto;
}

.app-footer--f2 {
  background: var(--color-text);
  color: rgba(255,255,255,0.65);
  border-top: none;
  border-radius: 40px 40px 0 0;
  margin-top: 40px;
}

.app-footer__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  padding: 56px var(--content-padding) 32px;
}

/* Main section: brand col + legal nav */
.app-footer__main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}

/* Brand column */
.app-footer__logo-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  margin-bottom: 16px;
}

.app-footer__logo-img {
  display: block;
  height: 56px;
  width: auto;
  max-width: 200px;
}

.app-footer--f2 .app-footer__logo-img { height: 58px; }

.app-footer__tagline {
  max-width: 300px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--color-text-secondary);
}

.app-footer--f2 .app-footer__tagline { color: rgba(255,255,255,0.55); }

.app-footer__dots {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.app-footer__dots span {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: block;
  opacity: 0.9;
}

/* Legal nav */
.app-footer__legal-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}

.app-footer__legal-link {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: var(--transition-default);
  white-space: nowrap;
}

.app-footer--f2 .app-footer__legal-link { color: rgba(255,255,255,0.6); }

.app-footer__legal-link:hover {
  color: var(--color-text);
}

.app-footer--f2 .app-footer__legal-link:hover { color: #fff; }

/* Bottom bar */
.app-footer__bottom {
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--color-line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
}

.app-footer--f2 .app-footer__bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
  margin-top: 40px;
}

.app-footer__copy { margin: 0; }

.app-footer__bottom-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-footer__lang-static {
  font-size: 12px;
  opacity: 0.7;
}

/* Language switcher */
.app-footer__lang-wrap { display: flex; align-items: center; }

.app-footer__lang-select {
  background: transparent;
  border: 1px solid var(--color-line);
  border-radius: 4px;
  color: inherit;
  font-family: var(--font-body);
  font-size: 12px;
  padding: 3px 8px;
  cursor: pointer;
  outline: none;
}

.app-footer--f2 .app-footer__lang-select {
  border-color: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.6);
}

.app-footer__lang-select:focus { border-color: var(--color-primary); }

/* Responsive */
@media (max-width: 767px) {
  .app-footer__inner {
    padding: 40px 1.25rem 24px;
  }
  .app-footer__main {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .app-footer__legal-nav {
    grid-template-columns: 1fr 1fr;
  }
  .app-footer__bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    margin-top: 32px;
  }
}

@media (max-width: 380px) {
  .app-footer__legal-nav {
    grid-template-columns: 1fr;
  }
}
</style>
