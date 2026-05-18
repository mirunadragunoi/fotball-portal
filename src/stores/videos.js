import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PRODUCT_TYPES, isVideoProductType } from '@/config/api'
import * as footballApi from '@/services/footballApi'
import { mapProductToVideo } from '@/utils/productMapper'
import { useAuthStore } from '@/stores/auth'

export const useVideosStore = defineStore('videos', () => {
  const all = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loaded = ref(false)
  const selectedCategory = ref('all')
  const sortBy = ref('newest')
  const selectedVideo = ref(null)

  const categories = computed(() => {
    const cats = [...new Set(all.value.map((v) => v.category).filter(Boolean))]
    return ['all', ...cats]
  })

  const filtered = computed(() => {
    let list = all.value

    if (selectedCategory.value !== 'all') {
      list = list.filter((v) => v.category === selectedCategory.value)
    }

    return [...list].sort((a, b) => {
      if (sortBy.value === 'newest') {
        return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
      }
      if (sortBy.value === 'popular') {
        return parseFloat(String(b.views).replace(/[^\d.]/g, '')) - parseFloat(String(a.views).replace(/[^\d.]/g, ''))
      }
      return 0
    })
  })

  const featured = computed(() => {
    const flagged = all.value.filter((v) => v.featured)
    return (flagged.length ? flagged : all.value).slice(0, 6)
  })

  function getBySlug(slug) {
    return all.value.find((v) => v.slug === slug || v.id === String(slug)) || null
  }

  function getById(id) {
    return all.value.find((v) => v.id === String(id)) || null
  }

  async function loadVideos(force = false) {
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
      const products = await footballApi.fetchProducts({
        accessCode: creds.accessCode,
        portalName: creds.portalName,
        productType: PRODUCT_TYPES.video,
      })
      all.value = products.map(mapProductToVideo)
      loaded.value = true
      return { ok: true }
    } catch (err) {
      error.value = err.message || 'Failed to load videos'
      all.value = []
      return { ok: false }
    } finally {
      loading.value = false
    }
  }

  async function ensureVideo(id) {
    const key = String(id)
    let existing = getById(key)
    if (existing) return existing

    if (!loaded.value) await loadVideos()
    existing = getById(key)
    if (existing) return existing

    const auth = useAuthStore()
    const creds = auth.getAuthQuery()
    if (!creds) return null

    try {
      const product = await footballApi.fetchProductById(key, creds)
      if (!isVideoProductType(product?.type)) return null
      const video = mapProductToVideo(product)
      const idx = all.value.findIndex((v) => v.id === video.id)
      if (idx >= 0) all.value[idx] = video
      else all.value.push(video)
      return video
    } catch {
      return null
    }
  }

  function setFilters({ category, sort }) {
    if (category !== undefined) selectedCategory.value = category
    if (sort !== undefined) sortBy.value = sort
  }

  function resetFilters() {
    selectedCategory.value = 'all'
    sortBy.value = 'newest'
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
    selectedCategory,
    sortBy,
    selectedVideo,
    categories,
    getBySlug,
    getById,
    loadVideos,
    ensureVideo,
    setFilters,
    resetFilters,
    clear,
  }
})
