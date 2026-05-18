import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import gamesData from '@/data/games.json'

export const useGamesStore = defineStore('games', () => {
  const all = ref(gamesData)
  const selectedPlatform = ref('all')
  const selectedCategory = ref('all')
  const sortBy = ref('plays')
  const selectedGame = ref(null)

  const platforms = ['all', 'html5', 'android']

  const categories = computed(() => {
    const cats = [...new Set(all.value.map(g => g.category))]
    return ['all', ...cats]
  })

  const filtered = computed(() => {
    let list = all.value

    if (selectedPlatform.value !== 'all') {
      list = list.filter(g => g.platform.includes(selectedPlatform.value))
    }

    if (selectedCategory.value !== 'all') {
      list = list.filter(g => g.category === selectedCategory.value)
    }

    return [...list].sort((a, b) => {
      if (sortBy.value === 'plays') {
        return parseFloat(b.plays) - parseFloat(a.plays)
      }
      if (sortBy.value === 'rating') {
        return b.rating - a.rating
      }
      if (sortBy.value === 'alpha') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy.value === 'newest') {
        return new Date(b.releaseDate) - new Date(a.releaseDate)
      }
      return 0
    })
  })

  const featured = computed(() => all.value.filter(g => g.featured).slice(0, 6))

  function getBySlug(slug) {
    return all.value.find(g => g.slug === slug) || null
  }

  function setFilters({ platform, category, sort }) {
    if (platform !== undefined) selectedPlatform.value = platform
    if (category !== undefined) selectedCategory.value = category
    if (sort !== undefined) sortBy.value = sort
  }

  function resetFilters() {
    selectedPlatform.value = 'all'
    selectedCategory.value = 'all'
    sortBy.value = 'plays'
  }

  return {
    all, filtered, featured, selectedPlatform, selectedCategory, sortBy,
    selectedGame, platforms, categories,
    getBySlug, setFilters, resetFilters,
  }
})
