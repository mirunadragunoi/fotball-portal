<script setup>
import { computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import AppIcon from '@/components/shared/AppIcon.vue'

defineProps({
  video:   { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const categoryColors = {
  Highlights: '#FF1744',
  Skills:     '#00C853',
  Funny:      '#FFC400',
  Classic:    '#2979FF',
  Tactics:    '#7C4DFF',
  Interviews: '#FF6F00',
}

function catColor(cat) {
  return categoryColors[cat] || 'var(--color-primary)'
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '0,0,0'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function formatDate(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso)
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}
</script>

<template>
  <article class="video-card" :class="{ 'video-card--f2': isF2, 'video-card--compact': compact }">
    <RouterLink
      :to="`/videos/${video.slug}`"
      class="video-card__thumb-link"
      :aria-label="`Watch: ${video.title}`"
    >
      <div class="video-card__thumb">
        <img
          :src="video.thumbnail"
          :alt="`${video.title} video thumbnail`"
          loading="lazy"
          class="video-card__img"
        />
        <div class="video-card__thumb-overlay" aria-hidden="true"></div>

        <!-- Category label -->
        <div
          class="video-card__cat"
          :style="isF2 ? { background: catColor(video.category), color: '#fff' }
                       : { background: `rgba(${hexToRgb(catColor(video.category))}, 0.18)`, color: catColor(video.category) }"
        >
          {{ video.category }}
        </div>

        <!-- Duration -->
        <div class="video-card__duration">{{ video.duration }}</div>

        <!-- Play button -->
        <div class="video-card__play" aria-hidden="true">
          <div class="video-card__play-circle">
            <AppIcon name="play" :size="isF2 ? 20 : 18" :stroke="isF2 ? 'var(--color-text)' : 'var(--color-text)'" />
          </div>
        </div>
      </div>
    </RouterLink>

    <div class="video-card__body">
      <RouterLink :to="`/videos/${video.slug}`" class="video-card__title-link">
        <p class="video-card__title">{{ video.title }}</p>
      </RouterLink>
      <div class="video-card__meta">
        <span>{{ video.views }} views</span>
        <span class="video-card__sep" aria-hidden="true">·</span>
        <span>{{ formatDate(video.publishedAt) }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.video-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  transition: var(--transition-default);
}

.video-card--f2 {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  gap: 0;
}

.video-card:hover {
  transform: translateY(-2px);
}

/* Thumbnail */
.video-card__thumb-link {
  display: block;
  border-radius: var(--radius-card);
  overflow: hidden;
}

.video-card--f2 .video-card__thumb-link {
  border-radius: 0;
}

.video-card__thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
}

.video-card--f2 .video-card__thumb {
  border: none;
  border-radius: 0;
}

.video-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  display: block;
}

.video-card:hover .video-card__img {
  transform: scale(1.04);
}

.video-card__thumb-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.9) 100%);
}

.video-card--f2 .video-card__thumb-overlay {
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%, transparent 50%, rgba(0,0,0,0.4) 100%);
}

.video-card__cat {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 3px 7px;
  border-radius: 3px;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.video-card--f2 .video-card__cat {
  left: 12px;
  top: 12px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 10px;
  letter-spacing: 0.06em;
}

.video-card__duration {
  position: absolute;
  left: 10px;
  bottom: 10px;
  padding: 3px 7px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: 0.04em;
}

.video-card--f2 .video-card__duration {
  left: auto;
  right: 12px;
  bottom: 12px;
  border-radius: 6px;
  background: rgba(16, 17, 42, 0.85);
  color: #fff;
}

.video-card__play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-card:hover .video-card__play,
.video-card__thumb:focus-within .video-card__play {
  opacity: 1;
}

.video-card--f2 .video-card__play {
  opacity: 1;
}

.video-card__play-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(13, 17, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  color: var(--color-text);
  transition: transform 0.2s ease;
}

.video-card--f2 .video-card__play-circle {
  width: 56px;
  height: 56px;
  background: var(--color-surface);
  border: none;
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
  color: var(--color-text);
}

.video-card:hover .video-card__play-circle {
  transform: scale(1.1);
}

/* Body */
.video-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.video-card--f2 .video-card__body {
  padding: 14px 16px 16px;
}

.video-card__title-link {
  text-decoration: none;
  display: block;
}

.video-card__title {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text);
  transition: color 0.15s;
  margin: 0;
}

.video-card--compact .video-card__title {
  font-size: 14px;
}

.video-card__title-link:hover .video-card__title {
  color: var(--color-accent);
}

.video-card--f2 .video-card__title {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 700;
}

.video-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.video-card__sep {
  opacity: 0.5;
}
</style>
