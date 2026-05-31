<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'
import AppIcon from '@/components/shared/AppIcon.vue'
import AuthLink from '@/components/shared/AuthLink.vue'
import brandLogo from '@brand/assets/logo.svg'
import { filterVisibleNav, PHASE2_LIVE_HERO_ENABLED } from '@/config/navigation'
import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'
import LiveBadge from '@/components/livescore/LiveBadge.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const brandStore = useBrandStore()
const authStore = useAuthStore()
const { goToLogin, goToSignup } = useAuth()

const mobileOpen = ref(false)
const config = computed(() => brandStore.config)
const isF2 = computed(() => brandStore.activeBrand === 'football2')

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value
}

function closeMobile() {
  mobileOpen.value = false
}

// Always derive label from i18n — brand config labels are English-only fallbacks
const navItems = computed(() =>
  filterVisibleNav(
    (config.value?.nav || [
      { key: 'home',    path: '/' },
      { key: 'games',   path: '/games' },
      { key: 'videos',  path: '/videos' },
      { key: 'trivia',  path: '/trivia' },
      { key: 'history', path: '/history' },
      { key: 'live',    path: '/live' },
    ]).map(item => ({ ...item, label: t(`nav.${item.key}`) }))
  )
)

function isActive(item) {
  if (item.path === '/') return route.path === '/'
  return route.path.startsWith(item.path)
}

const isLoggedIn = computed(() => authStore.isAuthenticated)

function onAuthCtaClick() {
  if (isLoggedIn.value) {
    authStore.logout()
    useGamesStore().clear()
    useVideosStore().clear()
    router.push('/')
    return
  }
  if (isF2.value) goToSignup()
  else goToLogin()
}
</script>

<template>
  <header class="app-header" :class="{ 'app-header--f2': isF2 }">
    <div class="app-header__inner">
      <!-- Logo -->
      <RouterLink to="/" class="app-header__logo" aria-label="Go to homepage" @click="closeMobile">
        <img
          :src="brandLogo"
          :alt="config?.displayName || 'Football Portal'"
          class="app-header__logo-img"
        />
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="app-header__nav" aria-label="Main navigation">
        <AuthLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.path"
          :public="item.path === '/'"
          class="app-header__nav-link"
          :class="{
            'app-header__nav-link--active': isActive(item),
            'app-header__nav-link--highlight': item.highlight && !isActive(item),
          }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          {{ item.label }}
          <span v-if="!isF2 && isActive(item)" class="app-header__nav-indicator" aria-hidden="true"></span>
        </AuthLink>
      </nav>

      <div class="app-header__spacer"></div>

      <!-- Right side actions -->
      <div class="app-header__actions">
        <RouterLink
          v-if="PHASE2_LIVE_HERO_ENABLED"
          to="/live"
          class="app-header__live-btn"
          :aria-label="t('nav.live', 'Live')"
        >
          <LiveBadge :show-count="true" />
        </RouterLink>
        <button type="button" class="app-header__cta" @click="onAuthCtaClick">
          <AppIcon v-if="isF2 && !isLoggedIn" name="user" :size="16" stroke="currentColor" />
          {{ isLoggedIn ? t('auth.logout') : isF2 ? t('auth.signupLink') : t('auth.loginLink') }}
        </button>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="app-header__hamburger"
        :aria-expanded="mobileOpen"
        :aria-label="mobileOpen ? t('a11y.closeMenu') : t('a11y.openMenu')"
        @click="toggleMobile"
      >
        <AppIcon :name="mobileOpen ? 'x' : 'menu'" :size="22" />
      </button>
    </div>

    <!-- Mobile menu -->
    <Transition name="mobile-menu">
      <div v-if="mobileOpen" class="app-header__mobile-menu" role="dialog" aria-modal="true" :aria-label="t('a11y.openMenu')">
        <nav aria-label="Mobile navigation">
          <AuthLink
            v-for="item in navItems"
            :key="item.key"
            :to="item.path"
            :public="item.path === '/'"
            class="app-header__mobile-link"
            :class="{
              'app-header__mobile-link--active': isActive(item),
              'app-header__mobile-link--highlight': item.highlight && !isActive(item),
            }"
            :aria-current="isActive(item) ? 'page' : undefined"
            @click="closeMobile"
          >
            {{ item.label }}
          </AuthLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--header-height);
  background: var(--header-bg);
  backdrop-filter: var(--header-backdrop);
  -webkit-backdrop-filter: var(--header-backdrop);
  border-bottom: var(--header-border);
}

.app-header__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  padding-inline: var(--content-padding);
  height: 100%;
  display: flex;
  align-items: center;
  gap: 32px;
}

/* Logo */
.app-header__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.app-header__logo-img {
  display: block;
  height: 40px;
  width: auto;
}

.app-header--f2 .app-header__logo-img {
  height: 42px;
}

/* Nav */
.app-header__nav {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.app-header__nav-link {
  position: relative;
  padding: 10px 14px;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--nav-inactive-color);
  background: transparent;
  transition: var(--transition-default);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}

.app-header__nav-link--active {
  color: var(--nav-active-color);
  background: var(--nav-active-bg);
}

.app-header__nav-link:hover:not(.app-header__nav-link--active) {
  color: var(--color-text);
}

.app-header__nav-link--highlight {
  color: var(--color-accent);
  font-weight: 700;
}

.app-header__nav-link--highlight:hover {
  color: var(--color-accent) !important;
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

.app-header__nav-indicator {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 4px;
  height: 2px;
  background: var(--nav-indicator);
  border-radius: 2px;
}

.app-header--f2 .app-header__nav-link {
  border-radius: 999px;
  text-transform: none;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
}

.app-header--f2 .app-header__nav-link--active {
  font-weight: 700;
}

/* Spacer */
.app-header__spacer { flex: 1; }

/* Actions */
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}


.app-header__live-btn {
  height: 38px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: var(--transition-default);
}

.app-header__live-btn:hover {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.app-header__cta {
  height: 38px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-accent);
  color: #1a1500;
  border: none;
  border-radius: var(--radius-button);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: var(--transition-default);
  min-height: 44px;
}

.app-header--f2 .app-header__cta {
  height: 44px;
  border-radius: 22px;
  background: var(--color-text);
  color: var(--color-surface);
  text-transform: none;
}

.app-header__cta:hover {
  filter: brightness(1.08);
}

/* Hamburger */
.app-header__hamburger {
  display: none;
  width: 44px;
  height: 44px;
  min-width: 44px; /* never shrink below touch target */
  justify-content: center;
  align-items: center;
  background: none;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
  flex-shrink: 0;
}

/* Mobile menu */
.app-header__mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-line);
  padding: 16px var(--content-padding);
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 49;
}

.app-header--f2 .app-header__mobile-menu {
  background: var(--color-surface);
}

.app-header__mobile-link {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-decoration: none;
  min-height: 52px;
  transition: var(--transition-default);
}

.app-header__mobile-link--active,
.app-header__mobile-link:hover {
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.app-header__mobile-link--highlight {
  color: var(--color-accent);
  font-weight: 700;
}

.app-header__mobile-link--highlight:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}

/* Transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 767px) {
  .app-header__nav,
  .app-header__actions {
    display: none;
  }
  .app-header__hamburger {
    display: flex; /* flex: better cross-browser than grid for buttons */
  }
  .app-header__inner {
    padding-inline: 1rem; /* reduce from 40px so hamburger always fits */
    gap: 12px;
  }
  .app-header__logo-img {
    max-width: 130px; /* cap logo width so it can't push hamburger off-screen */
    height: 36px;
  }
  .app-header__spacer {
    min-width: 0; /* allow spacer to collapse completely on very narrow screens */
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .app-header__live-btn {
    display: none;
  }
}
</style>
