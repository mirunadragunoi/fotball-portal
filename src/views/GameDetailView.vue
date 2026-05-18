<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGamesStore } from '@/stores/games'
import { useBrandStore } from '@/stores/brand'
import PlatformBadge from '@/components/shared/PlatformBadge.vue'
import AppIcon from '@/components/shared/AppIcon.vue'
import GameCard from '@/components/games/GameCard.vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useGamesStore()
const brandStore = useBrandStore()

const game = computed(() => store.getBySlug(route.params.slug))
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const related = computed(() =>
  store.all.filter(g => g.id !== game.value?.id && g.category === game.value?.category).slice(0, 4)
)

onMounted(() => {
  if (!game.value) router.replace('/games')
})

const leaderboard = [
  { rank: '1', user: 'stadiumKing',   score: 9840 },
  { rank: '2', user: 'boot.boot',     score: 8920 },
  { rank: '3', user: 'vermillion_7',  score: 8410 },
  { rank: '4', user: 'northport_kk',  score: 7905 },
  { rank: '5', user: 'you',           score: 7120, isYou: true },
]
</script>

<template>
  <main v-if="game">
    <!-- Hero section -->
    <section class="gd-hero" aria-labelledby="game-title">
      <div class="gd-hero__inner">
        <!-- Breadcrumb -->
        <nav class="gd-breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/games">{{ t('nav.games') }}</RouterLink>
          <span aria-hidden="true">/</span>
          <span>{{ game.category }}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{{ game.title }}</span>
        </nav>

        <div class="gd-hero__layout">
          <!-- Screenshot area -->
          <div class="gd-hero__screenshot" :class="{ 'gd-hero__screenshot--f2': isF2 }">
            <img
              :src="game.thumbnail"
              :alt="`${game.title} gameplay screenshot`"
              class="gd-hero__screenshot-img"
            />
            <div class="gd-hero__screenshot-overlay" aria-hidden="true"></div>

            <!-- Play button -->
            <RouterLink
              :to="`/games/${game.slug}/play`"
              class="gd-hero__play-btn"
              :aria-label="`Play ${game.title}`"
            >
              <AppIcon name="play" :size="28" :stroke="isF2 ? 'var(--color-text)' : '#1a1500'" />
            </RouterLink>

            <!-- Bottom bar -->
            <div class="gd-hero__screenshot-bottom" aria-hidden="true">
              <div class="gd-hero__trending">
                <AppIcon name="fire" :size="14" stroke="var(--color-secondary)" />
                <span>Trending #1 today</span>
              </div>
            </div>
          </div>

          <!-- Info sidebar -->
          <div class="gd-hero__info">
            <div class="gd-hero__eyebrow">
              <span class="gd-hero__eyebrow-bar" aria-hidden="true" v-if="!isF2"></span>
              {{ game.category }} · Single player
            </div>

            <h1 id="game-title" class="gd-hero__title">{{ game.title }}</h1>

            <div class="gd-hero__stats" aria-label="Game statistics">
              <div class="gd-hero__stat">
                <div class="gd-hero__stat-label">{{ t('games.rating') }}</div>
                <div class="gd-hero__stat-value">
                  <AppIcon name="star" :size="14" stroke="var(--color-accent)" />
                  {{ game.rating }}
                </div>
              </div>
              <div class="gd-hero__stat">
                <div class="gd-hero__stat-label">{{ t('games.plays') }}</div>
                <div class="gd-hero__stat-value">{{ game.plays }}</div>
              </div>
              <div class="gd-hero__stat">
                <div class="gd-hero__stat-label">{{ t('games.avgSession') }}</div>
                <div class="gd-hero__stat-value">{{ game.duration }}</div>
              </div>
              <div class="gd-hero__stat">
                <div class="gd-hero__stat-label">{{ t('games.released') }}</div>
                <div class="gd-hero__stat-value">{{ new Date(game.releaseDate).toLocaleDateString('en', { month: 'short', year: 'numeric' }) }}</div>
              </div>
            </div>

            <div class="gd-hero__platforms" :aria-label="t('games.platform')">
              <PlatformBadge v-for="p in game.platform" :key="p" :kind="p" />
            </div>

            <p class="gd-hero__description">{{ game.description }}</p>

            <div class="gd-hero__actions">
              <RouterLink
                :to="`/games/${game.slug}/play`"
                class="gd-hero__cta-play"
              >
                <AppIcon name="play" :size="18" :stroke="isF2 ? 'var(--color-text)' : '#1a1500'" />
                {{ t('games.playInBrowser') }}
              </RouterLink>
              <button class="gd-hero__action-icon" :aria-label="`Save ${game.title} to favourites`">
                <AppIcon name="heart" :size="20" />
              </button>
              <button class="gd-hero__action-icon" :aria-label="`Share ${game.title}`">
                <AppIcon name="share" :size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About + sidebar -->
    <section class="gd-about" aria-label="Game information">
      <div class="gd-about__inner">
        <div class="gd-about__main">
          <h2 class="gd-about__heading">{{ t('games.about') }}</h2>
          <p class="gd-about__body">{{ game.description }} Long Range Legends is the spiritual successor to every garden-fence rebound shot you tried as a kid. Step up across increasing levels of difficulty — defensive walls, wind, and a goalkeeper who learns from every shot you take.</p>

          <h3 class="gd-about__sub-heading">{{ t('games.howToPlay') }}</h3>
          <ul class="gd-about__controls" aria-label="Game controls">
            <li>
              <kbd class="gd-about__kbd">← / →</kbd>
              <span>Move along the shooting line</span>
            </li>
            <li>
              <kbd class="gd-about__kbd">🖱 Drag</kbd>
              <span>Set power and curve</span>
            </li>
            <li>
              <kbd class="gd-about__kbd">Space</kbd>
              <span>Strike — or hold for finesse</span>
            </li>
          </ul>
        </div>

        <aside class="gd-aside" aria-label="Leaderboard">
          <div class="gd-aside__heading">Leaderboard · Today</div>
          <ol class="gd-leaderboard">
            <li
              v-for="entry in leaderboard"
              :key="entry.rank"
              class="gd-leaderboard__row"
              :class="{ 'gd-leaderboard__row--you': entry.isYou }"
              :aria-label="`Rank ${entry.rank}: ${entry.user}, ${entry.score.toLocaleString()} points`"
            >
              <span class="gd-leaderboard__rank">{{ entry.rank }}</span>
              <span class="gd-leaderboard__user">{{ entry.user }}{{ entry.isYou ? ' (you)' : '' }}</span>
              <span class="gd-leaderboard__score">{{ entry.score.toLocaleString() }}</span>
            </li>
          </ol>
        </aside>
      </div>
    </section>

    <!-- Related games -->
    <section v-if="related.length" class="gd-related" aria-labelledby="related-games-heading">
      <div class="gd-related__inner">
        <SectionHeader
          eyebrow="More to play"
          :title="t('games.relatedGames')"
          link="See all"
          link-to="/games"
          id="related-games-heading"
        />
        <div class="gd-related__grid">
          <GameCard v-for="g in related" :key="g.id" :game="g" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Hero section */
.gd-hero {
  padding: 56px var(--content-padding) 40px;
  border-bottom: 1px solid var(--color-line);
}

.gd-hero__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.gd-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.gd-breadcrumb a {
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: color 0.15s;
}

.gd-breadcrumb a:hover {
  color: var(--color-text);
}

.gd-hero__layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 48px;
  align-items: start;
}

.gd-hero__screenshot {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-line);
  aspect-ratio: 16 / 10;
  position: relative;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
}

.gd-hero__screenshot--f2 {
  box-shadow: var(--shadow-card);
}

.gd-hero__screenshot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gd-hero__screenshot-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.6) 100%);
}

.gd-hero__play-btn {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.gd-hero__play-btn > * {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--color-accent);
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 15%, transparent),
              0 18px 48px color-mix(in srgb, var(--color-accent) 40%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  text-decoration: none;
}

.gd-hero__screenshot--f2 .gd-hero__play-btn > * {
  background: var(--color-surface);
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
}

.gd-hero__play-btn:hover > * {
  transform: scale(1.06);
}

.gd-hero__screenshot-bottom {
  position: absolute;
  left: 16px;
  bottom: 16px;
  right: 16px;
}

.gd-hero__trending {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(13, 17, 23, 0.7);
  backdrop-filter: blur(8px);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text);
}

/* Info */
.gd-hero__eyebrow {
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

:root[data-brand="football2"] .gd-hero__eyebrow {
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
  gap: 8px;
}

.gd-hero__eyebrow-bar {
  display: inline-block;
  width: 24px;
  height: 1.5px;
  background: var(--color-accent);
}

.gd-hero__title {
  margin: 16px 0 0;
  font-family: var(--font-heading);
  font-size: clamp(36px, 5vw, 64px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-text);
}

:root[data-brand="football2"] .gd-hero__title {
  text-transform: none;
  letter-spacing: -0.02em;
  line-height: 1;
}

.gd-hero__stats {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 16px 0;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.gd-hero__stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.gd-hero__stat-value {
  margin-top: 4px;
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.gd-hero__platforms {
  margin-top: 20px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.gd-hero__description {
  margin-top: 24px;
  color: color-mix(in srgb, var(--color-text) 80%, transparent);
  font-size: 16px;
  line-height: 1.6;
}

.gd-hero__actions {
  margin-top: 28px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.gd-hero__cta-play {
  height: 56px;
  flex: 1;
  min-width: 140px;
  padding: 0 26px;
  border-radius: var(--radius-button);
  border: none;
  background: var(--color-accent);
  color: #1a1500;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 28px color-mix(in srgb, var(--color-accent) 27%, transparent);
  transition: var(--transition-default);
  min-height: 44px;
}

:root[data-brand="football2"] .gd-hero__cta-play {
  background: var(--color-text);
  color: var(--color-surface);
  border-radius: 28px;
  text-transform: none;
  box-shadow: none;
}

.gd-hero__cta-play:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.gd-hero__action-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-button);
  border: 1px solid var(--color-line-strong);
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  color: var(--color-text);
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: var(--transition-default);
  min-height: 44px;
}

.gd-hero__action-icon:hover {
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}

/* About section */
.gd-about {
  padding: 56px var(--content-padding);
}

.gd-about__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 56px;
  align-items: start;
}

.gd-about__heading {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: var(--color-text);
  margin: 0;
}

:root[data-brand="football2"] .gd-about__heading {
  text-transform: none;
}

.gd-about__body {
  margin-top: 16px;
  color: color-mix(in srgb, var(--color-text) 80%, transparent);
  font-size: 16px;
  line-height: 1.65;
  max-width: 720px;
}

.gd-about__sub-heading {
  margin-top: 40px;
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: var(--color-text);
}

:root[data-brand="football2"] .gd-about__sub-heading {
  text-transform: none;
}

.gd-about__controls {
  margin-top: 16px;
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: color-mix(in srgb, var(--color-text) 85%, transparent);
  font-size: 15px;
}

.gd-about__controls li {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 18px;
  align-items: center;
}

.gd-about__kbd {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-accent);
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
}

/* Aside / leaderboard */
.gd-aside {
  background: var(--color-surface);
  border-radius: 14px;
  border: 1px solid var(--color-line);
  padding: 24px;
}

.gd-aside__heading {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 16px;
}

.gd-leaderboard {
  list-style: none;
  padding: 0;
  margin: 0;
}

.gd-leaderboard__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-text);
  gap: 12px;
}

.gd-leaderboard__row:last-child {
  border-bottom: none;
}

.gd-leaderboard__row--you {
  color: var(--color-accent);
}

.gd-leaderboard__rank {
  width: 22px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.gd-leaderboard__user {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
}

.gd-leaderboard__score {
  font-family: ui-monospace, monospace;
  font-size: 14px;
  font-weight: 700;
}

/* Related */
.gd-related {
  padding: 16px var(--content-padding) 80px;
}

.gd-related__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.gd-related__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1023px) {
  .gd-hero__layout { grid-template-columns: 1fr; }
  .gd-about__inner { grid-template-columns: 1fr; }
  .gd-related__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .gd-hero { padding: 32px 16px 24px; }
  .gd-about { padding: 32px 16px; }
  .gd-related { padding: 16px 16px 48px; }
  .gd-about__controls li { grid-template-columns: 1fr; gap: 6px; }
  .gd-related__grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
