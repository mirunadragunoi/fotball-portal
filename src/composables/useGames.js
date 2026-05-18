import { computed } from 'vue'
import { useGamesStore } from '@/stores/games'

export function useGames() {
  const store = useGamesStore()

  return {
    games: computed(() => store.filtered),
    featured: computed(() => store.featured),
    all: computed(() => store.all),
    selectedPlatform: computed(() => store.selectedPlatform),
    selectedCategory: computed(() => store.selectedCategory),
    sortBy: computed(() => store.sortBy),
    platforms: store.platforms,
    categories: computed(() => store.categories),
    getBySlug: store.getBySlug,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
  }
}
