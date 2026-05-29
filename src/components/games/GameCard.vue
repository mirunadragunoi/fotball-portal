<script setup>
import { computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import AuthLink from '@/components/shared/AuthLink.vue'
import PlatformBadge from '@/components/shared/PlatformBadge.vue'
import AppIcon from '@/components/shared/AppIcon.vue'

const props = defineProps({
  game: { type: Object, required: true },
})

const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')
</script>

<template>
  <article class="game-card" :class="{ 'game-card--f2': isF2 }">
    <AuthLink
      :to="`/games/${game.id}`"
      class="game-card__thumb-link"
      :aria-label="`View ${game.title}`"
      tabindex="-1"
    >
      <div class="game-card__thumb" :style="{ '--game-color': game.color }">
        <img
          :src="game.thumbnail"
          :alt="`${game.title} game thumbnail`"
          loading="lazy"
          class="game-card__img"
        />
        <div class="game-card__thumb-overlay" aria-hidden="true"></div>

        <!-- Platform badges -->
        <div class="game-card__badges" aria-label="Available on">
          <PlatformBadge v-for="p in game.platform" :key="p" :kind="p" />
        </div>

        <!-- Rating chip -->
        <div class="game-card__rating" aria-label="Rating">
          <AppIcon name="star" :size="11" stroke="var(--color-accent)" />
          {{ game.rating }}
        </div>
      </div>
    </AuthLink>

    <div class="game-card__body">
      <!-- F2: category tag -->
      <div v-if="isF2" class="game-card__f2-meta">
        <span
          class="game-card__cat-tag"
          :style="{ background: `${game.color}22`, color: game.color }"
        >{{ game.category }}</span>
        <span class="game-card__meta-rating">
          <AppIcon name="star" :size="12" stroke="var(--color-accent)" />
          {{ game.rating }}
        </span>
      </div>

      <AuthLink :to="`/games/${game.id}`" class="game-card__title-link">
        <h3 class="game-card__title">{{ game.title }}</h3>
      </AuthLink>

      <!-- F1: category + plays row -->
      <div v-if="!isF2" class="game-card__meta">
        <span class="game-card__category">{{ game.category }}</span>
        <span class="game-card__plays">{{ game.plays }} plays</span>
      </div>

      <!-- F2: plays + play button -->
      <div v-if="isF2" class="game-card__f2-footer">
        <span class="game-card__plays-f2">{{ game.plays }} plays</span>
        <AuthLink
          :to="`/games/${game.id}`"
          class="game-card__play-btn"
          :aria-label="`Play ${game.title}`"
        >
          Play <AppIcon name="play" :size="11" stroke="currentColor" />
        </AuthLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.game-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  overflow: hidden;
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  transition: var(--transition-default);
}

.game-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

/* Thumbnail */
.game-card__thumb-link {
  display: block;
}

.game-card__thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.game-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .game-card__img {
  transform: scale(1.04);
}

.game-card__thumb-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(13, 17, 23, 0.95) 100%);
}

.game-card--f2 .game-card__thumb-overlay {
  background: linear-gradient(135deg, color-mix(in srgb, var(--game-color) 33%, transparent) 0%, transparent 60%);
}

.game-card__badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.game-card__rating {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text);
}

.game-card--f2 .game-card__rating {
  display: none;
}

/* Body */
.game-card__body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.game-card--f2 .game-card__body {
  padding: 16px 18px 18px;
  gap: 10px;
}

.game-card__title-link {
  text-decoration: none;
  display: block;
}

.game-card__title {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: var(--color-text);
  transition: color 0.15s;
}

.game-card__title-link:hover .game-card__title {
  color: var(--color-accent);
}

.game-card--f2 .game-card__title {
  font-size: 17px;
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-heading);
}

.game-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.game-card__category {
  padding: 2px 7px;
  border-radius: 3px;
  background: rgba(230, 237, 243, 0.06);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.game-card__plays {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* F2 specific */
.game-card__f2-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-card__cat-tag {
  padding: 5px 10px;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.game-card__meta-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.game-card__f2-footer {
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--color-line);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.game-card__plays-f2 {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.game-card__play-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  background: var(--color-text);
  color: var(--color-surface);
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition-default);
}

.game-card__play-btn:hover {
  opacity: 0.85;
}
</style>
