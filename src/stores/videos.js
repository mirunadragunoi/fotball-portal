import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import videosData from '@/data/videos.json'

export const useVideosStore = defineStore('videos', () => {
  const all = ref(videosData)
  const selectedCategory = ref('all')
  const sortBy = ref('newest')
  const selectedVideo = ref(null)

  const categories = computed(() => {
    const cats = [...new Set(all.value.map(v => v.category))]
    return ['all', ...cats]
  })

  const filtered = computed(() => {
    let list = all.value

    if (selectedCategory.value !== 'all') {
      list = list.filter(v => v.category === selectedCategory.value)
    }

    return [...list].sort((a, b) => {
      if (sortBy.value === 'newest') {
        return new Date(b.publishedAt) - new Date(a.publishedAt)
      }
      if (sortBy.value === 'popular') {
        return parseFloat(b.views) - parseFloat(a.views)
      }
      return 0
    })
  })

  const featured = computed(() => all.value.filter(v => v.featured).slice(0, 6))

  function getBySlug(slug) {
    return all.value.find(v => v.slug === slug) || null
  }

  function setFilters({ category, sort }) {
    if (category !== undefined) selectedCategory.value = category
    if (sort !== undefined) sortBy.value = sort
  }

  function resetFilters() {
    selectedCategory.value = 'all'
    sortBy.value = 'newest'
  }

  return {
    all, filtered, featured, selectedCategory, sortBy,
    selectedVideo, categories,
    getBySlug, setFilters, resetFilters,
  }
})
