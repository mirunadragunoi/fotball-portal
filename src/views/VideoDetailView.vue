<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVideosStore } from '@/stores/videos'
import { useBrandStore } from '@/stores/brand'
import VideoCard from '@/components/videos/VideoCard.vue'
import AppIcon from '@/components/shared/AppIcon.vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useVideosStore()
const brandStore = useBrandStore()

const video = computed(() => store.getById(route.params.id))
const isF2 = computed(() => brandStore.activeBrand === 'football2')

// Click-to-load player: show thumbnail + play button until user clicks,
// then swap in a native <video> with autoplay. Saves bandwidth and avoids
// requesting the MP4 before the user actually wants it.
const isPlaying = ref(false)
function startPlayback() {
  if (video.value?.videoUrl) isPlaying.value = true
}
// Reset playback state when navigating between videos
watch(() => route.params.id, () => { isPlaying.value = false })

const related = computed(() =>
  store.all
    .filter(v => v.id !== video.value?.id && v.category === video.value?.category)
    .slice(0, 4)
)

onMounted(async () => {
  await store.ensureVideo(route.params.id)
  if (!store.getById(route.params.id)) router.replace('/videos')
})

const LOCALE_BCP47 = { en: 'en-GB', ro: 'ro-RO', cz: 'cs-CZ', sk: 'sk-SK', pl: 'pl-PL' }
function formatDate(iso) {
  if (!iso) return ''
  const bcp47 = LOCALE_BCP47[String(locale.value || 'en').toLowerCase()] || 'en-GB'
  return new Date(iso).toLocaleDateString(bcp47, { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <main v-if="video">
    <!-- Video player section -->
    <section class="vd-player-section">
      <div class="vd-player-section__inner">
        <!-- Breadcrumb -->
        <nav class="vd-breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/videos">{{ t('nav.videos') }}</RouterLink>
          <span aria-hidden="true">/</span>
          <span>{{ video.category }}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{{ video.title }}</span>
        </nav>

        <div class="vd-player-layout">
          <!-- Player -->
          <div class="vd-player-main">
            <div class="vd-player" :class="{ 'vd-player--f2': isF2 }">
              <video
                v-if="isPlaying"
                :src="video.videoUrl"
                :poster="video.thumbnail"
                class="vd-player__video"
                controls
                autoplay
                playsinline
              ></video>
              <template v-else>
                <img
                  :src="video.thumbnail"
                  :alt="video.title"
                  class="vd-player__thumb"
                />
                <div class="vd-player__overlay" aria-hidden="true"></div>
                <div class="vd-player__center">
                  <button
                    class="vd-player__play"
                    :aria-label="t('videos.playLabel', { title: video.title })"
                    :disabled="!video.videoUrl"
                    @click="startPlayback"
                  >
                    <AppIcon name="play" :size="28" :stroke="isF2 ? 'var(--color-text)' : '#1a1500'" />
                  </button>
                </div>
                <div class="vd-player__cat-label">{{ video.category }}</div>
                <div v-if="video.duration" class="vd-player__duration">{{ video.duration }}</div>
              </template>
            </div>

            <!-- Title + meta -->
            <h1 class="vd-title">{{ video.title }}</h1>
            <div class="vd-meta">
              <span>{{ t('videos.viewsCount', { count: video.views }) }}</span>
              <template v-if="video.publishedAt">
                <span class="vd-meta__sep" aria-hidden="true">·</span>
                <span>{{ formatDate(video.publishedAt) }}</span>
              </template>
              <span class="vd-meta__sep" aria-hidden="true">·</span>
              <span class="vd-meta__cat">{{ video.category }}</span>
            </div>
            <p class="vd-description">{{ video.description }}</p>
          </div>

          <!-- Sidebar: related in same category -->
          <aside class="vd-sidebar" :aria-label="t('videos.moreInCategory', { category: video.category })">
            <h2 class="vd-sidebar__heading">{{ t('videos.moreInCategory', { category: video.category }) }}</h2>
            <div class="vd-sidebar__list">
              <VideoCard
                v-for="v in store.all.filter(v2 => v2.id !== video.id && v2.category === video.category).slice(0, 4)"
                :key="v.id"
                :video="v"
                :compact="true"
              />
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- Related videos -->
    <section v-if="related.length" class="vd-related" aria-labelledby="related-videos-heading">
      <div class="vd-related__inner">
        <SectionHeader
          :eyebrow="t('videos.watchMore')"
          :title="t('videos.relatedVideos')"
          :link="t('videos.allVideos')"
          link-to="/videos"
          id="related-videos-heading"
        />
        <div class="vd-related__grid">
          <VideoCard v-for="v in related" :key="v.id" :video="v" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.vd-player-section {
  padding: 40px var(--content-padding) 56px;
}

.vd-player-section__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.vd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.vd-breadcrumb a {
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

.vd-breadcrumb a:hover {
  color: var(--color-text);
}

.vd-player-layout {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 40px;
  align-items: start;
}

/* Player */
.vd-player {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  margin-bottom: 24px;
}

.vd-player--f2 {
  border-radius: 20px;
}

.vd-player__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.vd-player__video {
  width: 100%;
  height: 100%;
  display: block;
  background: #000;
  object-fit: contain;
}

.vd-player__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.vd-player__center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.vd-player__play {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-accent);
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 15%, transparent),
              0 16px 40px color-mix(in srgb, var(--color-accent) 35%, transparent);
  transition: transform 0.2s ease;
}

.vd-player--f2 .vd-player__play {
  background: var(--color-surface);
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
}

.vd-player__play:hover {
  transform: scale(1.08);
}

.vd-player__cat-label {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 8px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-accent) 20%, transparent);
  color: var(--color-accent);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.vd-player__duration {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 3px 7px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.72);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

/* Title and meta */
.vd-title {
  font-family: var(--font-heading);
  font-size: clamp(22px, 3vw, 36px);
  font-weight: 800;
  line-height: 1.1;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 12px;
}

:root[data-brand="football2"] .vd-title {
  text-transform: none;
  letter-spacing: -0.01em;
}

.vd-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.vd-meta__sep {
  opacity: 0.4;
}

.vd-meta__cat {
  padding: 3px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
}


.vd-description {
  margin-top: 20px;
  font-size: 15px;
  line-height: 1.65;
  color: color-mix(in srgb, var(--color-text) 80%, transparent);
}

/* Sidebar */
.vd-sidebar__heading {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 20px;
}

:root[data-brand="football2"] .vd-sidebar__heading {
  text-transform: none;
}

.vd-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Related */
.vd-related {
  padding: 0 var(--content-padding) 80px;
}

.vd-related__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.vd-related__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1023px) {
  .vd-player-layout { grid-template-columns: 1fr; }
  .vd-sidebar { display: none; }
  .vd-related__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .vd-player-section { padding: 24px 16px 32px; }
  .vd-related { padding: 0 16px 48px; }
  .vd-related__grid { grid-template-columns: 1fr; gap: 16px; }
}
</style>
