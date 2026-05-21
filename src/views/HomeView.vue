<script setup>
import { shallowRef, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import AppIcon from '@/components/shared/AppIcon.vue'
import FeaturedGames from '@/components/home/FeaturedGames.vue'
import FeaturedVideos from '@/components/home/FeaturedVideos.vue'
import HomeShowcase from '@/components/home/HomeShowcase.vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import AuthLink from '@/components/shared/AuthLink.vue'
import { useLandingImages } from '@/composables/useLandingImages'

const { t } = useI18n()
const brandStore = useBrandStore()
const { images: landing } = useLandingImages()
const activeBrand = computed(() => brandStore.activeBrand)

const HeroComponent = shallowRef(null)

async function loadHero(brand) {
  try {
    const mod = await import(`@/brands/${brand}/components/AppHero.vue`)
    HeroComponent.value = mod.default
  } catch {
    try {
      const fallback = await import('@/brands/football1/components/AppHero.vue')
      HeroComponent.value = fallback.default
    } catch {
      HeroComponent.value = null
    }
  }
}

onMounted(() => loadHero(activeBrand.value))
watch(activeBrand, loadHero)

// F2 editorial strip content
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const f2Tiles = computed(() => [
  { label: t('home.playGames'),   sub: t('home.tilesChooseFrom', { count: 124 }), color: '#00C853', icon: 'play-o', path: '/games' },
  { label: t('home.watchVideos'), sub: t('home.updatedDaily'), color: '#2979FF', icon: 'play', path: '/videos' },
])

const leaderboard = [
  { r: 1, n: 'mariella_b',  xp: 4820, you: false },
  { r: 2, n: 'ezra.k',      xp: 4610, you: false },
  { r: 3, n: 'you',         xp: 4480, you: true },
  { r: 4, n: 'deon_22',     xp: 4205, you: false },
  { r: 5, n: 'sofia.lions', xp: 3960, you: false },
]
</script>

<template>
  <main>
    <!-- Dynamic brand hero -->
    <component :is="HeroComponent" v-if="HeroComponent" />

    <!-- F2: Quick category tiles -->
    <section v-if="isF2" class="home-tiles" aria-labelledby="home-tiles-heading">
      <div class="home-tiles__inner">
        <h2 id="home-tiles-heading" class="visually-hidden">{{ t('home.quickLinks') }}</h2>
        <div class="home-tiles__grid">
          <AuthLink
            v-for="tile in f2Tiles"
            :key="tile.label"
            :to="tile.path"
            class="home-tile"
            :style="{ '--tile-color': tile.color }"
          >
            <div class="home-tile__icon" aria-hidden="true">
              <AppIcon :name="tile.icon" :size="22" stroke="currentColor" />
            </div>
            <div>
              <div class="home-tile__label">{{ tile.label }}</div>
              <div class="home-tile__sub">{{ tile.sub }}</div>
            </div>
          </AuthLink>
        </div>
      </div>
    </section>

    <FeaturedGames />

    <HomeShowcase />

    <!-- F1 editorial strip -->
    <section v-if="!isF2" class="home-editorial" aria-label="Editorial feature">
      <div class="home-editorial__inner">
        <div class="home-editorial__card">
          <div class="home-editorial__text">
            <div class="home-editorial__eyebrow">
              <span class="home-editorial__eyebrow-bar" aria-hidden="true"></span>
              {{ t('home.editorialF1Eyebrow') }}
            </div>
            <h2 class="home-editorial__headline">{{ t('home.editorialF1Headline1') }}<br />{{ t('home.editorialF1Headline2') }}</h2>
            <p class="home-editorial__body">{{ t('home.editorialF1Body') }}</p>
            <button class="home-editorial__cta">{{ t('home.editorialF1Cta') }}</button>
          </div>
          <div class="home-editorial__image" aria-hidden="true">
            <img
              :src="landing.editorial"
              :alt="landing.editorialAlt"
              class="home-editorial__img"
              loading="lazy"
            />
            <div class="home-editorial__img-fade"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- F2 editorial strip -->
    <section v-if="isF2" class="home-editorial home-editorial--f2" aria-label="Editorial feature">
      <div class="home-editorial__inner">
        <div class="home-editorial__card home-editorial__card--f2">
          <div class="home-editorial__image home-editorial__image--f2">
            <img
              :src="landing.editorial"
              :alt="landing.editorialAlt"
              class="home-editorial__img"
              loading="lazy"
            />
          </div>
          <div class="home-editorial__text">
            <div class="home-editorial__eyebrow home-editorial__eyebrow--f2">{{ t('home.editorialF2Eyebrow') }}</div>
            <h2 class="home-editorial__headline home-editorial__headline--f2">{{ t('home.editorialF2Headline1') }}<br />{{ t('home.editorialF2Headline2') }}</h2>
            <p class="home-editorial__body">{{ t('home.editorialF2Body') }}</p>
            <AuthLink to="/videos" class="home-editorial__cta home-editorial__cta--f2">{{ t('home.editorialF2Cta') }}</AuthLink>
          </div>
        </div>
      </div>
    </section>

    <!-- F2 trophy/leaderboard strip -->
    <section v-if="isF2" class="home-trophy" aria-label="Leaderboard feature">
      <div class="home-trophy__inner">
        <div class="home-trophy__card">
          <div v-if="landing.trophyBg" class="home-trophy__bg" aria-hidden="true">
            <img :src="landing.trophyBg" :alt="landing.trophyAlt" class="home-trophy__bg-img" loading="lazy" />
            <div class="home-trophy__bg-overlay"></div>
          </div>
          <div class="home-trophy__blob" aria-hidden="true"></div>
          <div class="home-trophy__left">
            <div class="home-trophy__eyebrow">{{ t('home.trophyEyebrow') }}</div>
            <h2 class="home-trophy__headline">{{ t('home.trophyHeadline1') }}<br />{{ t('home.trophyHeadline2') }}</h2>
            <p class="home-trophy__body">{{ t('home.trophyBody') }}</p>
            <button class="home-trophy__cta">{{ t('home.trophyCta') }}</button>
          </div>
          <div class="home-trophy__board" role="list" aria-label="Leaderboard">
            <div
              v-for="(row, i) in leaderboard"
              :key="i"
              class="home-trophy__row"
              :class="{ 'home-trophy__row--you': row.you }"
              role="listitem"
            >
              <div class="home-trophy__rank" :class="`home-trophy__rank--${i}`" :aria-label="`Rank ${row.r}`">{{ row.r }}</div>
              <div class="home-trophy__name">{{ row.n }}</div>
              <div class="home-trophy__xp">{{ row.xp.toLocaleString() }} <span class="home-trophy__xp-label">XP</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <FeaturedVideos />
  </main>
</template>

<style scoped>
/* F2 tiles */
.home-tiles {
  padding: 40px var(--content-padding) 0;
}

.home-tiles__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.home-tiles__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 560px;
}

.home-tile {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  text-decoration: none;
  transition: var(--transition-default);
}

.home-tile:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.home-tile__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--tile-color) 18%, transparent);
  color: var(--tile-color);
  display: grid;
  place-items: center;
}

.home-tile__label {
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}

.home-tile__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* F1 editorial */
.home-editorial {
  padding: 56px var(--content-padding);
}

.home-editorial__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.home-editorial__card {
  background: var(--color-surface);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  min-height: 320px;
}

.home-editorial__text {
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.home-editorial__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.home-editorial__eyebrow-bar {
  width: 24px;
  height: 1.5px;
  background: var(--color-accent);
}

.home-editorial__headline {
  margin: 16px 0 16px;
  font-family: var(--font-heading);
  font-size: 56px;
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-text);
}

.home-editorial__body {
  max-width: 440px;
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1.55;
}

.home-editorial__cta {
  margin-top: 32px;
  align-self: flex-start;
  height: 44px;
  padding: 0 18px;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-line-strong);
  border-radius: var(--radius-button);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: var(--transition-default);
}

.home-editorial__cta:hover {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.home-editorial__image {
  position: relative;
}

.home-editorial__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-editorial__img-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(270deg, transparent 0%, var(--color-surface) 100%);
}

.home-editorial--f2 {
  padding-top: 0;
}

.home-editorial__card--f2 {
  grid-template-columns: 1fr 1.1fr;
}

.home-editorial__image--f2 {
  min-height: 320px;
}

.home-editorial__eyebrow--f2 {
  color: var(--color-primary);
}

.home-editorial__eyebrow--f2::before {
  content: none;
}

.home-editorial__headline--f2 {
  text-transform: none;
  font-size: clamp(36px, 5vw, 52px);
}

.home-editorial__cta--f2 {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  background: var(--color-primary);
  color: #fff;
  border: none;
}

.home-editorial__cta--f2:hover {
  filter: brightness(1.06);
  background: var(--color-primary);
}

/* F2 trophy strip */
.home-trophy {
  padding: 64px var(--content-padding) 0;
}

.home-trophy__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.home-trophy__card {
  background: var(--color-text);
  border-radius: 32px;
  padding: 40px 48px;
  color: #fff;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 48px;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.home-trophy__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.home-trophy__bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.home-trophy__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, rgba(16, 17, 42, 0.94) 0%, rgba(16, 17, 42, 0.82) 45%, rgba(16, 17, 42, 0.7) 100%);
}

.home-trophy__left,
.home-trophy__board {
  position: relative;
  z-index: 1;
}

.home-trophy__blob {
  position: absolute;
  top: -80px;
  right: -80px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 196, 0, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.home-trophy__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  color: var(--color-accent);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  width: fit-content;
}

.home-trophy__headline {
  margin: 16px 0 12px;
  font-family: var(--font-heading);
  font-size: 44px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: #fff;
}

.home-trophy__body {
  max-width: 360px;
  color: rgba(255,255,255,0.75);
  font-size: 15px;
  line-height: 1.55;
}

.home-trophy__cta {
  margin-top: 24px;
  height: 48px;
  padding: 0 22px;
  border-radius: 24px;
  background: var(--color-accent);
  color: var(--color-text);
  border: none;
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: var(--transition-default);
}

.home-trophy__cta:hover {
  filter: brightness(1.08);
}

.home-trophy__board {
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 8px;
}

.home-trophy__row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  color: rgba(255,255,255,0.85);
}

.home-trophy__row--you {
  background: var(--color-primary);
  color: #fff;
}

.home-trophy__rank {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  display: grid;
  place-items: center;
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.home-trophy__rank--0 { background: #FFC400; color: var(--color-text); }
.home-trophy__rank--1 { background: #C0C0C0; color: var(--color-text); }
.home-trophy__rank--2 { background: #CD7F32; color: var(--color-text); }

.home-trophy__name {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
}

.home-trophy__xp {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 800;
}

.home-trophy__xp-label {
  font-size: 11px;
  opacity: 0.6;
}

@media (max-width: 1023px) {
  .home-tiles__grid { max-width: none; }
  .home-editorial__card { grid-template-columns: 1fr; }
  .home-editorial__image { display: none; }
  .home-trophy__card { grid-template-columns: 1fr; }
  .home-trophy__board { display: none; }
}

@media (max-width: 767px) {
  .home-tiles { padding: 24px 16px 0; }
  .home-tiles__grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .home-editorial { padding: 32px 16px; }
  .home-editorial__text { padding: 32px 24px; }
  .home-editorial__headline { font-size: 40px; }
  .home-trophy { padding: 32px 16px 0; }
  .home-trophy__card { padding: 28px 24px; border-radius: 24px; }
  .home-trophy__headline { font-size: 32px; }
}
</style>
