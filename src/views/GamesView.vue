<script setup>
import { useI18n } from 'vue-i18n'
import GameFilters from '@/components/games/GameFilters.vue'
import GameGrid from '@/components/games/GameGrid.vue'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import AppIcon from '@/components/shared/AppIcon.vue'
import { useGamesStore } from '@/stores/games'
import { computed, onMounted } from 'vue'
import { useBrandStore } from '@/stores/brand'

const { t } = useI18n()
const store = useGamesStore()
const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')
const totalGames = computed(() => store.all.length)

onMounted(() => {
  store.loadGames()
})
</script>

<template>
  <main>
    <!-- Page header -->
    <section class="games-page-header" aria-labelledby="games-heading">
      <div class="games-page-header__inner">
        <div v-if="!isF2" class="games-page-header__eyebrow">
          <span class="games-page-header__eyebrow-bar" aria-hidden="true"></span>
          {{ t('home.eyebrowGames', { count: totalGames }) }}
        </div>
        <div v-if="isF2" class="games-page-header__eyebrow-f2">
          <span class="games-page-header__eyebrow-dot" aria-hidden="true"></span>
          {{ t('home.eyebrowGamesF2', { count: totalGames }) }}
        </div>

        <h1 id="games-heading" class="games-page-header__title">
          {{ t('games.title') }}
        </h1>
        <p class="games-page-header__subtitle">{{ t('games.subtitle') }}</p>
      </div>
    </section>

    <GameFilters />

    <!-- Grid section -->
    <section class="games-grid-section">
      <div class="games-grid-section__inner">
        <GameGrid
          :games="store.filtered"
          :loading="store.loading"
          @reset="store.resetFilters"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.games-page-header {
  padding: 56px var(--content-padding) 32px;
  border-bottom: 1px solid var(--color-line);
}

.games-page-header__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.games-page-header__eyebrow {
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

.games-page-header__eyebrow-bar {
  display: inline-block;
  width: 24px;
  height: 1.5px;
  background: var(--color-accent);
}

.games-page-header__eyebrow-f2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.games-page-header__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

.games-page-header__title {
  margin: 16px 0 0;
  font-family: var(--font-heading);
  font-size: clamp(56px, 8vw, 88px);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  color: var(--color-text);
}

:root[data-brand="football2"] .games-page-header__title {
  font-size: clamp(40px, 6vw, 64px);
  text-transform: none;
  letter-spacing: -0.02em;
  line-height: 1;
}

.games-page-header__subtitle {
  margin-top: 18px;
  max-width: 560px;
  color: var(--color-text-secondary);
  font-size: 17px;
  line-height: 1.55;
}

.games-grid-section {
  padding: 32px var(--content-padding) 80px;
}

.games-grid-section__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 40px;
}


@media (max-width: 767px) {
  .games-page-header {
    padding: 40px 16px 24px;
  }
  .games-grid-section {
    padding: 24px 16px 48px;
  }
}
</style>
