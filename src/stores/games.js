import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PRODUCT_TYPES, GAME_PRODUCT_TYPES, isGameProductType } from '@/config/api'
import * as footballApi from '@/services/footballApi'
import { mapProductToGame } from '@/utils/productMapper'
import { useAuthStore } from '@/stores/auth'

export const useGamesStore = defineStore('games', () => {
  const all = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loaded = ref(false)
  const selectedPlatform = ref('all')
  const selectedCategory = ref('all')
  const sortBy = ref('plays')
  const selectedGame = ref(null)

  const platforms = ['all', 'html5', 'android']

  const categories = computed(() => {
    const cats = [...new Set(all.value.map((g) => g.category).filter(Boolean))]
    return ['all', ...cats]
  })

  const filtered = computed(() => {
    let list = all.value

    if (selectedPlatform.value === 'html5') {
      list = list.filter((g) => g.productType === PRODUCT_TYPES.html)
    } else if (selectedPlatform.value === 'android') {
      list = list.filter((g) => g.productType === PRODUCT_TYPES.android)
    }

    if (selectedCategory.value !== 'all') {
      list = list.filter((g) => g.category === selectedCategory.value)
    }

    return [...list].sort((a, b) => {
      if (sortBy.value === 'plays') {
        return parseFloat(String(b.plays).replace(/[^\d.]/g, '')) - parseFloat(String(a.plays).replace(/[^\d.]/g, ''))
      }
      if (sortBy.value === 'rating') {
        return b.rating - a.rating
      }
      if (sortBy.value === 'alpha') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy.value === 'newest') {
        return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0)
      }
      return 0
    })
  })

  const featured = computed(() => {
    const flagged = all.value.filter((g) => g.featured)
    return (flagged.length ? flagged : all.value).slice(0, 6)
  })

  function getBySlug(slug) {
    return all.value.find((g) => g.slug === slug || g.id === String(slug)) || null
  }

  function getById(id) {
    return all.value.find((g) => g.id === String(id)) || null
  }

  async function loadGames(force = false) {
    if (loaded.value && !force) return { ok: true }
    const auth = useAuthStore()
    auth.hydrate()
    const creds = auth.getAuthQuery()
    if (!creds) {
      error.value = 'Not authenticated'
      return { ok: false }
    }

    loading.value = true
    error.value = null
    try {
      const results = await Promise.all(
        GAME_PRODUCT_TYPES.map((productType) =>
          footballApi.fetchProducts({
            accessCode: creds.accessCode,
            portalName: creds.portalName,
            productType,
          })
        )
      )
      const products = results.flat()
      all.value = products.map(mapProductToGame)
      loaded.value = true
      return { ok: true }
    } catch (err) {
      error.value = err.message || 'Failed to load games'
      all.value = []
      return { ok: false }
    } finally {
      loading.value = false
    }
  }

  async function ensureGame(id) {
    const key = String(id)
    let existing = getById(key)
    if (existing) return existing

    if (!loaded.value) await loadGames()
    existing = getById(key)
    if (existing) return existing

    const auth = useAuthStore()
    const creds = auth.getAuthQuery()
    if (!creds) return null

    try {
      const product = await footballApi.fetchProductById(key, creds)
      if (!isGameProductType(product?.type)) return null
      const game = mapProductToGame(product)
      const idx = all.value.findIndex((g) => g.id === game.id)
      if (idx >= 0) all.value[idx] = game
      else all.value.push(game)
      return game
    } catch {
      return null
    }
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

  function clear() {
    all.value = []
    loaded.value = false
    error.value = null
  }

  return {
    all,
    filtered,
    featured,
    loading,
    error,
    loaded,
    selectedPlatform,
    selectedCategory,
    sortBy,
    selectedGame,
    platforms,
    categories,
    getBySlug,
    getById,
    loadGames,
    ensureGame,
    setFilters,
    resetFilters,
    clear,
  }
})
