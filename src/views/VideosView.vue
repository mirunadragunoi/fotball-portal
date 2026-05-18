<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useVideosStore } from '@/stores/videos'
import VideoFilters from '@/components/videos/VideoFilters.vue'
import VideoGrid from '@/components/videos/VideoGrid.vue'
import VideoCard from '@/components/videos/VideoCard.vue'

const { t } = useI18n()
const store = useVideosStore()
const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')
const totalVideos = computed(() => store.all.length)

onMounted(() => {
  store.loadVideos()
})
</script>

<template>
  <main>
    <!-- Page header -->
    <section class="videos-header" aria-labelledby="videos-heading">
      <div class="videos-header__inner">
        <div v-if="!isF2" class="videos-header__eyebrow">
          <span class="videos-header__eyebrow-bar" aria-hidden="true"></span>
          {{ totalVideos }} videos · 8 categories
        </div>
        <div v-else class="videos-header__eyebrow-f2">
          <span class="videos-header__eyebrow-dot" aria-hidden="true"></span>
          {{ totalVideos }} videos · updated daily
        </div>

        <h1 id="videos-heading" class="videos-header__title">
          {{ isF2 ? 'Watch it all.' : t('videos.title') }}
        </h1>
        <p class="videos-header__subtitle">{{ t('videos.subtitle') }}</p>
      </div>
    </section>

    <!-- F1: featured hero grid -->
    <section v-if="!isF2 && store.featured.length" class="videos-hero-grid" aria-label="Featured videos">
      <div class="videos-hero-grid__inner">
        <div class="videos-hero-grid__layout">
          <!-- Big featured card -->
          <RouterLink
            :to="`/videos/${store.featured[0].id}`"
            class="videos-hero-card videos-hero-card--big"
            :aria-label="`Watch: ${store.featured[0].title}`"
          >
            <img
              :src="store.featured[0].thumbnail"
              :alt="store.featured[0].title"
              class="videos-hero-card__img"
              loading="eager"
            />
            <div class="videos-hero-card__overlay" aria-hidden="true"></div>
            <div class="videos-hero-card__play" aria-hidden="true">
              <div class="videos-hero-card__play-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--color-text)" aria-hidden="true"><path d="M7 5l12 7-12 7V5z"/></svg>
              </div>
            </div>
            <div class="videos-hero-card__info">
              <span class="videos-hero-card__featured-tag">Featured</span>
              <h3 class="videos-hero-card__title">{{ store.featured[0].title }}</h3>
              <p class="videos-hero-card__meta">{{ store.featured[0].duration }} · {{ store.featured[0].views }} views · {{ store.featured[0].category }}</p>
            </div>
          </RouterLink>

          <!-- Small cards -->
          <RouterLink
            v-for="video in store.featured.slice(1, 5)"
            :key="video.id"
            :to="`/videos/${video.id}`"
            class="videos-hero-card"
            :aria-label="`Watch: ${video.title}`"
          >
            <img :src="video.thumbnail" :alt="video.title" class="videos-hero-card__img" loading="lazy" />
            <div class="videos-hero-card__overlay" aria-hidden="true"></div>
            <div class="videos-hero-card__info videos-hero-card__info--small">
              <span class="videos-hero-card__cat-label">{{ video.category }}</span>
              <h3 class="videos-hero-card__title videos-hero-card__title--small">{{ video.title }}</h3>
              <p class="videos-hero-card__meta">{{ video.duration }} · {{ video.views }} views</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <VideoFilters />

    <!-- Grid -->
    <section class="videos-grid-section">
      <div class="videos-grid-section__inner">
        <VideoGrid
          :videos="store.filtered"
          :loading="store.loading"
          @reset="store.resetFilters"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.videos-header {
  padding: 56px var(--content-padding) 32px;
  border-bottom: 1px solid var(--color-line);
}

.videos-header__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.videos-header__eyebrow {
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

.videos-header__eyebrow-bar {
  display: inline-block;
  width: 24px;
  height: 1.5px;
  background: var(--color-accent);
}

.videos-header__eyebrow-f2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-red) 18%, transparent);
  color: var(--color-red);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.videos-header__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-red);
}

.videos-header__title {
  margin: 16px 0 0;
  font-family: var(--font-heading);
  font-size: clamp(56px, 8vw, 88px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-text);
}

:root[data-brand="football2"] .videos-header__title {
  font-size: clamp(40px, 6vw, 64px);
  text-transform: none;
  letter-spacing: -0.02em;
  line-height: 1;
}

.videos-header__subtitle {
  margin-top: 18px;
  max-width: 560px;
  color: var(--color-text-secondary);
  font-size: 17px;
  line-height: 1.55;
}

/* Hero grid */
.videos-hero-grid {
  padding: 40px var(--content-padding) 32px;
}

.videos-hero-grid__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.videos-hero-grid__layout {
  display: grid;
  grid-template-columns: 1.7fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
}

.videos-hero-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  min-height: 220px;
  display: block;
  text-decoration: none;
  transition: var(--transition-default);
}

.videos-hero-card:hover {
  transform: translateY(-2px);
}

.videos-hero-card--big {
  grid-row: 1 / span 2;
  min-height: 480px;
}

.videos-hero-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.videos-hero-card:hover .videos-hero-card__img {
  transform: scale(1.04);
}

.videos-hero-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.92) 100%);
}

.videos-hero-card__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.videos-hero-card__play-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-accent) 90%, transparent);
  display: grid;
  place-items: center;
  transition: transform 0.2s ease;
}

.videos-hero-card:hover .videos-hero-card__play-circle {
  transform: scale(1.1);
}

.videos-hero-card__info {
  position: absolute;
  left: 24px;
  bottom: 24px;
  right: 24px;
  color: var(--color-text);
}

.videos-hero-card__info--small {
  left: 14px;
  bottom: 14px;
  right: 14px;
}

.videos-hero-card__featured-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  background: var(--color-red);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.videos-hero-card__cat-label {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  display: block;
  margin-bottom: 8px;
}

.videos-hero-card__title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 800;
  line-height: 1.05;
  text-transform: uppercase;
  letter-spacing: -0.005em;
  margin: 0 0 10px;
}

.videos-hero-card__title--small {
  font-size: 18px;
  margin: 0 0 6px;
}

.videos-hero-card__meta {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Grid section */
.videos-grid-section {
  padding: 32px var(--content-padding) 80px;
}

.videos-grid-section__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

@media (max-width: 1023px) {
  .videos-hero-grid__layout {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
  }
  .videos-hero-card--big {
    grid-column: 1 / -1;
    grid-row: auto;
    min-height: 320px;
  }
}

@media (max-width: 767px) {
  .videos-header { padding: 40px 16px 24px; }
  .videos-hero-grid { display: none; }
  .videos-grid-section { padding: 24px 16px 48px; }
}
</style>
