<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useAuthStore } from '@/stores/auth'
import { useAuth } from '@/composables/useAuth'
import AppIcon from '@/components/shared/AppIcon.vue'
import AuthLink from '@/components/shared/AuthLink.vue'
import { filterVisibleNav, PHASE2_NAV_ENABLED } from '@/config/navigation'
import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'
import { useFavoritesStore } from '@/stores/favorites'

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

const navItems = computed(() =>
  filterVisibleNav(
    config.value?.nav || [
      { key: 'home', label: t('nav.home'), path: '/' },
      { key: 'games', label: t('nav.games'), path: '/games' },
      { key: 'videos', label: t('nav.videos'), path: '/videos' },
      { key: 'trivia', label: t('nav.trivia'), path: '/trivia' },
      { key: 'history', label: t('nav.history'), path: '/history' },
      { key: 'live', label: t('nav.live'), path: '/live' },
    ]
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
    useFavoritesStore().clear()
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
        <div class="app-header__logo-mark" aria-hidden="true">
          <AppIcon v-if="isF2" name="bolt" :size="20" stroke="#fff" />
          <div v-else class="app-header__logo-dot"></div>
        </div>
        <span class="app-header__logo-text">
          {{ config?.displayName || 'Pitchside' }}<span class="app-header__logo-dot-text" aria-hidden="true">.</span>
        </span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="app-header__nav" aria-label="Main navigation">
        <AuthLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.path"
          :public="item.path === '/'"
          class="app-header__nav-link"
          :class="{ 'app-header__nav-link--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          {{ item.label }}
          <span v-if="!isF2 && isActive(item)" class="app-header__nav-indicator" aria-hidden="true"></span>
        </AuthLink>
      </nav>

      <div class="app-header__spacer"></div>

      <!-- Right side actions -->
      <div class="app-header__actions">
        <button class="app-header__search-btn" aria-label="Search games and videos">
          <AppIcon name="search" :size="15" />
          <span class="app-header__search-text">Search…</span>
          <kbd class="app-header__kbd" aria-hidden="true">⌘K</kbd>
        </button>
        <button
          v-if="!isF2 && PHASE2_NAV_ENABLED"
          class="app-header__live-btn"
          aria-label="Live matches"
        >
          <AppIcon name="live" :size="16" style="stroke: var(--color-red)" />
        </button>
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
            :class="{ 'app-header__mobile-link--active': isActive(item) }"
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
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.app-header__logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 60%, #000) 100%);
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 6px 18px rgba(0,0,0,0.5);
}

.app-header--f2 .app-header__logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #2979FF 100%);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.app-header__logo-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 12px var(--color-accent);
}

.app-header__logo-text {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
}

.app-header--f2 .app-header__logo-text {
  letter-spacing: -0.01em;
  text-transform: none;
}

.app-header__logo-dot-text {
  color: var(--color-accent);
  margin-left: 2px;
}

.app-header--f2 .app-header__logo-dot-text {
  display: none;
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

.app-header__search-btn {
  height: 38px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-default);
}

.app-header__search-btn:hover {
  border-color: var(--color-line-strong);
}

.app-header--f2 .app-header__search-btn {
  height: 44px;
  padding: 0 18px;
  background: var(--color-surface-2);
  border: none;
  border-radius: 22px;
  min-width: 200px;
}

.app-header__kbd {
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  font-size: 11px;
}

.app-header--f2 .app-header__kbd { display: none; }

.app-header__search-text {
  flex: 1;
}

.app-header__live-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
  border: 1px solid var(--color-line);
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-default);
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
  place-items: center;
  background: none;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  color: var(--color-text);
  cursor: pointer;
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
    display: grid;
  }
  .app-header__inner {
    gap: 16px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .app-header__search-text,
  .app-header__kbd,
  .app-header__live-btn {
    display: none;
  }
  .app-header__search-btn {
    min-width: unset;
    width: 44px;
    justify-content: center;
  }
}
</style>
