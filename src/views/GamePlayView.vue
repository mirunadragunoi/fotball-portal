<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGamesStore } from '@/stores/games'
import { useBrandStore } from '@/stores/brand'
import AppIcon from '@/components/shared/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const store = useGamesStore()
const brandStore = useBrandStore()

const game = computed(() => store.getById(route.params.id))
const isF2 = computed(() => brandStore.activeBrand === 'football2')
const isFullscreen = ref(false)
const isMuted = ref(false)

onMounted(async () => {
  await store.ensureGame(route.params.id)
  if (!store.getById(route.params.id)) router.replace('/games')
})

function goBack() {
  router.push(`/games/${route.params.id}`)
}
</script>

<template>
  <div v-if="game" class="game-play" :class="{ 'game-play--fs': isFullscreen, 'game-play--f2': isF2 }">
    <!-- HUD top bar -->
    <div class="game-play__hud">
      <button class="game-play__back" @click="goBack" :aria-label="`Back to ${game.title} details`">
        <AppIcon name="chev-l" :size="16" />
        Back
      </button>

      <div class="game-play__title-wrap">
        <span class="game-play__title">{{ game.title }}</span>
        <div class="game-play__badges">
          <span
            v-for="p in game.platform"
            :key="p"
            class="game-play__badge"
          >{{ p === 'html5' ? 'HTML5' : 'Android' }}</span>
        </div>
      </div>

      <div class="game-play__hud-actions">
        <button
          class="game-play__hud-btn"
          @click="isMuted = !isMuted"
          :aria-label="isMuted ? 'Unmute' : 'Mute'"
          :aria-pressed="isMuted"
        >
          <AppIcon :name="isMuted ? 'x' : 'volume'" :size="16" />
        </button>
        <button
          class="game-play__hud-btn"
          @click="isFullscreen = !isFullscreen"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :aria-pressed="isFullscreen"
        >
          <AppIcon name="fs" :size="16" />
        </button>
        <button class="game-play__hud-btn" aria-label="Share this game">
          <AppIcon name="share" :size="16" />
        </button>
      </div>
    </div>

    <!-- Game iframe -->
    <div class="game-play__frame-wrap" role="region" aria-label="Game canvas">
      <iframe
        :src="game.playUrl"
        :title="`Play ${game.title}`"
        class="game-play__iframe"
        allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-forms"
      ></iframe>

      <!-- Placeholder overlay (shown when iframe can't load external content in dev) -->
      <div class="game-play__placeholder" aria-hidden="true">
        <img :src="game.thumbnail" :alt="game.title" class="game-play__placeholder-img" />
        <div class="game-play__placeholder-overlay"></div>
        <div class="game-play__placeholder-content">
          <div class="game-play__launch-icon">
            <AppIcon name="play" :size="32" :stroke="isF2 ? 'var(--color-text)' : '#1a1500'" />
          </div>
          <p class="game-play__launch-text">Game launches in full build</p>
          <p class="game-play__launch-sub">{{ game.playUrl }}</p>
        </div>
      </div>
    </div>

    <!-- HUD bottom bar -->
    <div class="game-play__hud game-play__hud--bottom">
      <div class="game-play__stats" aria-label="Game stats">
        <span><AppIcon name="star" :size="13" stroke="var(--color-accent)" /> {{ game.rating }}</span>
        <span>{{ game.plays }} plays</span>
        <span v-if="game.duration !== '—'">
          <AppIcon name="clock" :size="13" /> {{ game.duration }}
        </span>
      </div>
      <div class="game-play__hud-actions">
        <button class="game-play__hud-btn" aria-label="Save to favourites">
          <AppIcon name="heart" :size="16" />
        </button>
        <RouterLink :to="`/games/${game.id}`" class="game-play__hud-btn" aria-label="View game details">
          <AppIcon name="settings" :size="16" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-play {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #000;
  color: var(--color-text);
}

.game-play--f2 {
  background: var(--color-bg);
}

.game-play--fs {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

/* HUD */
.game-play__hud {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 var(--content-padding);
  height: 56px;
  background: rgba(13, 17, 23, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-line);
  flex-shrink: 0;
}

.game-play--f2 .game-play__hud {
  background: var(--color-surface);
  border-color: var(--color-line);
}

.game-play__hud--bottom {
  border-top: 1px solid var(--color-line);
  border-bottom: none;
  margin-top: auto;
}

.game-play__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border-radius: var(--radius-button);
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  border: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-default);
  flex-shrink: 0;
}

.game-play__back:hover {
  color: var(--color-text);
}

.game-play__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.game-play__title {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-play--f2 .game-play__title {
  text-transform: none;
  font-family: var(--font-heading);
}

.game-play__badges {
  display: flex;
  gap: 6px;
}

.game-play__badge {
  padding: 2px 8px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.game-play__hud-actions {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.game-play__hud-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-button);
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  border: 1px solid var(--color-line);
  color: var(--color-text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: var(--transition-default);
  text-decoration: none;
}

.game-play__hud-btn:hover {
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}

.game-play__stats {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 600;
}

.game-play__stats span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* Frame */
.game-play__frame-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: stretch;
}

.game-play__iframe {
  flex: 1;
  border: none;
  width: 100%;
  min-height: 400px;
  display: none; /* hidden in dev since playUrl is a placeholder */
}

.game-play__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-play__placeholder-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.4;
}

.game-play__placeholder-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.game-play__placeholder-content {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.game-play__launch-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--color-accent);
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 15%, transparent);
}

.game-play--f2 .game-play__launch-icon {
  background: var(--color-surface);
}

.game-play__launch-text {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
}

.game-play--f2 .game-play__launch-text {
  text-transform: none;
}

.game-play__launch-sub {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-family: ui-monospace, monospace;
  word-break: break-all;
  max-width: 400px;
}

@media (max-width: 767px) {
  .game-play__hud {
    padding: 0 16px;
    height: 52px;
  }
  .game-play__badges { display: none; }
}
</style>
