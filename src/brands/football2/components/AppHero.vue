<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useLandingImages } from '@/composables/useLandingImages'
import AppIcon from '@/components/shared/AppIcon.vue'
import AuthLink from '@/components/shared/AuthLink.vue'
import { useGamesStore } from '@/stores/games'

const { t } = useI18n()
const brandStore = useBrandStore()
const gamesStore = useGamesStore()
const config = computed(() => brandStore.config)
const { images: landing } = useLandingImages()
const previewGames = computed(() => gamesStore.featured.slice(0, 4))

onMounted(() => {
  gamesStore.loadGames()
})
</script>

<template>
  <section class="f2-hero" aria-label="Hero banner">
    <div class="f2-hero__card">
      <div class="f2-hero__photo" aria-hidden="true">
        <img
          :src="landing.hero"
          :alt="landing.heroAlt"
          class="f2-hero__photo-img"
          loading="eager"
          fetchpriority="high"
        />
        <div class="f2-hero__photo-overlay"></div>
      </div>
      <div class="f2-hero__blob f2-hero__blob--1" aria-hidden="true"></div>
      <div class="f2-hero__blob f2-hero__blob--2" aria-hidden="true"></div>

      <div class="f2-hero__inner">
        <!-- Left: text + CTA -->
        <div class="f2-hero__left">
          <span class="f2-hero__eyebrow">
            <span class="f2-hero__eyebrow-dot" aria-hidden="true"></span>
            {{ t('hero.eyebrowGeneric') }}
          </span>

          <h1 class="f2-hero__headline">
            {{ t('hero.f2.headline1') }}<br />
            <span class="f2-hero__headline-accent">{{ t('hero.f2.headlineAccent') }}</span>
          </h1>

          <p class="f2-hero__body">{{ t('hero.f2.body') }}</p>

          <div class="f2-hero__ctas">
            <AuthLink to="/competitions" class="f2-hero__cta-primary">
              <AppIcon name="trophy" :size="14" stroke="var(--color-text)" />
              {{ t('hero.f2.ctaPrimary') }}
            </AuthLink>
            <AuthLink to="/live" class="f2-hero__cta-secondary">
              {{ t('hero.f2.ctaSecondary') }}
            </AuthLink>
          </div>

          <!-- Trust strip -->
          <div class="f2-hero__trust" aria-label="Platform statistics">
            <template v-for="(stat, i) in (config?.hero?.stats || [])" :key="i">
              <span>
                <strong class="f2-hero__stat-value">{{ stat.value }}</strong>
                {{ stat.labelKey ? t(stat.labelKey) : stat.label }}
              </span>
              <span v-if="i < (config?.hero?.stats?.length || 0) - 1" class="f2-hero__trust-sep" aria-hidden="true"></span>
            </template>
          </div>
        </div>

        <!-- Right: phone mock -->
        <div class="f2-hero__right" aria-hidden="true">
          <div class="f2-hero__phone">
            <div class="f2-hero__phone-screen">
              <div class="f2-hero__phone-notch"></div>
              <div class="f2-hero__phone-content">
                <div class="f2-hero__phone-greeting">👋 Hey, Sam</div>
                <div class="f2-hero__phone-sub">You have 3 daily games left</div>
                <div class="f2-hero__phone-challenge">
                  <div class="f2-hero__challenge-label">Daily challenge</div>
                  <div class="f2-hero__challenge-title">Penalty Shootout · Best of 5</div>
                  <div class="f2-hero__challenge-xp">+50 XP</div>
                </div>
                <div class="f2-hero__phone-grid">
                  <div
                    v-for="game in previewGames"
                    :key="game.id"
                    class="f2-hero__phone-game"
                  >
                    <div class="f2-hero__phone-game-thumb" :style="{ background: `linear-gradient(135deg, ${game.color}, ${game.color}aa)` }"></div>
                    <div class="f2-hero__phone-game-title">{{ game.title }}</div>
                    <div class="f2-hero__phone-game-plays">{{ game.plays }} plays</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.f2-hero {
  padding: 40px var(--content-padding) 0;
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.f2-hero__card {
  background: linear-gradient(135deg, var(--color-primary) 0%, #2979FF 60%, #5E35B1 100%);
  border-radius: 32px;
  overflow: hidden;
  position: relative;
  min-height: 540px;
  padding: 56px;
  color: #fff;
}

.f2-hero__photo {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.f2-hero__photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
}

.f2-hero__photo-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, rgba(0, 80, 40, 0.92) 0%, rgba(41, 121, 255, 0.78) 45%, rgba(94, 53, 177, 0.55) 100%),
    linear-gradient(0deg, rgba(16, 17, 42, 0.35), transparent 50%);
}

/* Decorative blobs */
.f2-hero__blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
}

.f2-hero__blob--1 {
  top: -60px;
  right: -60px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255, 196, 0, 0.4) 0%, transparent 70%);
}

.f2-hero__blob--2 {
  bottom: -120px;
  left: 30%;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle, rgba(255, 23, 68, 0.33) 0%, transparent 70%);
}

.f2-hero__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 48px;
  align-items: center;
}

.f2-hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(10px);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fff;
}

.f2-hero__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
}

.f2-hero__headline {
  margin: 24px 0 0;
  font-family: var(--font-heading);
  font-size: clamp(52px, 6vw, 80px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: #fff;
}

.f2-hero__headline-accent {
  color: var(--color-accent);
  font-style: italic;
}

.f2-hero__body {
  margin-top: 22px;
  max-width: 460px;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.55;
  color: rgba(255,255,255,0.88);
}

.f2-hero__ctas {
  margin-top: 32px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.f2-hero__cta-primary {
  height: 56px;
  padding: 0 28px;
  border-radius: 28px;
  border: none;
  background: #fff;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.25);
  transition: var(--transition-default);
  min-height: 44px;
}

.f2-hero__cta-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.3);
}

.f2-hero__cta-secondary {
  height: 56px;
  padding: 0 24px;
  border-radius: 28px;
  background: rgba(255,255,255,0.18);
  color: #fff;
  border: 1.5px solid rgba(255,255,255,0.5);
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  backdrop-filter: blur(8px);
  transition: var(--transition-default);
  min-height: 44px;
}

.f2-hero__cta-secondary:hover {
  background: rgba(255,255,255,0.25);
}

.f2-hero__trust {
  margin-top: 40px;
  display: flex;
  gap: 28px;
  align-items: center;
  color: rgba(255,255,255,0.85);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  flex-wrap: wrap;
}

.f2-hero__stat-value {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin-right: 4px;
}

.f2-hero__trust-sep {
  width: 1px;
  height: 20px;
  background: rgba(255,255,255,0.3);
}

/* Phone mock */
.f2-hero__right {
  display: flex;
  justify-content: center;
  align-items: center;
}

.f2-hero__phone {
  width: 260px;
  height: 440px;
  border-radius: 32px;
  background: #000;
  padding: 8px;
  transform: rotate(6deg);
  box-shadow: 0 40px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1);
  flex-shrink: 0;
}

.f2-hero__phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 26px;
  overflow: hidden;
  background: var(--color-bg);
  position: relative;
}

.f2-hero__phone-notch {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 18px;
  border-radius: 9px;
  background: #000;
  z-index: 1;
}

.f2-hero__phone-content {
  padding: 36px 12px 12px;
}

.f2-hero__phone-greeting {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text);
}

.f2-hero__phone-sub {
  margin-top: 3px;
  font-size: 10px;
  color: var(--color-text-secondary);
}

.f2-hero__phone-challenge {
  margin-top: 12px;
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-red), #C2185B);
  color: #fff;
}

.f2-hero__challenge-label {
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.85;
}

.f2-hero__challenge-title {
  margin-top: 5px;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.f2-hero__challenge-xp {
  margin-top: 10px;
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.22);
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.f2-hero__phone-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.f2-hero__phone-game {
  background: var(--color-surface);
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.f2-hero__phone-game-thumb {
  height: 44px;
  border-radius: 6px;
}

.f2-hero__phone-game-title {
  margin-top: 5px;
  font-family: var(--font-heading);
  font-size: 9px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}

.f2-hero__phone-game-plays {
  margin-top: 2px;
  font-size: 8px;
  color: var(--color-text-secondary);
}

@media (max-width: 1023px) {
  .f2-hero__card {
    padding: 40px;
  }
  .f2-hero__inner {
    grid-template-columns: 1fr;
  }
  .f2-hero__right {
    display: none;
  }
}

@media (max-width: 767px) {
  .f2-hero {
    padding: 16px 16px 0;
  }
  .f2-hero__card {
    padding: 32px 24px;
    border-radius: 24px;
    min-height: auto;
  }
  .f2-hero__headline {
    font-size: 48px;
  }
  .f2-hero__ctas {
    flex-direction: column;
  }
  .f2-hero__cta-primary,
  .f2-hero__cta-secondary {
    width: 100%;
    justify-content: center;
  }
  .f2-hero__trust {
    gap: 16px;
  }
}
</style>
