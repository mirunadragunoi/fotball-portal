<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import GameCard from '@/components/games/GameCard.vue'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { SAMPLE_GAMES } from '@/config/featuredSamples'

const { t } = useI18n()
const store = useGamesStore()
const auth = useAuthStore()

// Anonymous visitors see a static teaser (real product IDs — clicking a
// card sends them through /login and after auth they land on the real
// detail page).
const featured = computed(() =>
  auth.isAuthenticated ? store.featured : SAMPLE_GAMES,
)

onMounted(() => {
  if (auth.isAuthenticated) store.loadGames()
})
</script>

<template>
  <section class="featured-games" aria-labelledby="featured-games-heading">
    <div class="featured-games__inner">
      <SectionHeader
        :eyebrow="t('nav.games')"
        :title="t('home.featuredGames')"
        :link="t('home.allGames')"
        link-to="/games"
        id="featured-games-heading"
      />
      <div class="featured-games__grid">
        <GameCard
          v-for="game in featured.slice(0, 4)"
          :key="game.id"
          :game="game"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.featured-games {
  padding: 80px var(--content-padding) 24px;
}

.featured-games__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.featured-games__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1023px) {
  .featured-games__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .featured-games {
    padding: 48px 16px 16px;
  }
  .featured-games__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
