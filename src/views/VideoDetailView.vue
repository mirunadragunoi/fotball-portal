<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVideosStore } from '@/stores/videos'
import { useBrandStore } from '@/stores/brand'
import VideoCard from '@/components/videos/VideoCard.vue'
import AppIcon from '@/components/shared/AppIcon.vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useVideosStore()
const brandStore = useBrandStore()

const video = computed(() => store.getBySlug(route.params.slug))
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const related = computed(() =>
  store.all
    .filter(v => v.id !== video.value?.id && v.category === video.value?.category)
    .slice(0, 4)
)

onMounted(() => {
  if (!video.value) router.replace('/videos')
})

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
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
              <img
                :src="video.thumbnail"
                :alt="`${video.title} video thumbnail`"
                class="vd-player__thumb"
              />
              <div class="vd-player__overlay" aria-hidden="true"></div>
              <div class="vd-player__center">
                <button class="vd-player__play" :aria-label="`Play ${video.title}`">
                  <AppIcon name="play" :size="28" :stroke="isF2 ? 'var(--color-text)' : '#1a1500'" />
                </button>
              </div>
              <div class="vd-player__cat-label">{{ video.category }}</div>
              <div class="vd-player__duration">{{ video.duration }}</div>
            </div>

            <!-- Title + meta -->
            <h1 class="vd-title">{{ video.title }}</h1>
            <div class="vd-meta">
              <span>{{ video.views }} views</span>
              <span class="vd-meta__sep" aria-hidden="true">·</span>
              <span>{{ formatDate(video.publishedAt) }}</span>
              <span class="vd-meta__sep" aria-hidden="true">·</span>
              <span class="vd-meta__cat">{{ video.category }}</span>
            </div>
            <div class="vd-actions">
              <button class="vd-action-btn">
                <AppIcon name="heart" :size="16" /> Save
              </button>
              <button class="vd-action-btn">
                <AppIcon name="share" :size="16" /> Share
              </button>
            </div>
            <p class="vd-description">{{ video.description }}</p>
          </div>

          <!-- Sidebar: related in same category -->
          <aside class="vd-sidebar" aria-label="More in this category">
            <h2 class="vd-sidebar__heading">More {{ video.category }}</h2>
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
          eyebrow="Watch more"
          :title="t('videos.relatedVideos')"
          link="All videos"
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

.vd-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.vd-action-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-button);
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  border: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: var(--transition-default);
}

.vd-action-btn:hover {
  color: var(--color-text);
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
