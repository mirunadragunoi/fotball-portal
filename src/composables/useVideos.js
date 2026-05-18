import { computed } from 'vue'
import { useVideosStore } from '@/stores/videos'

export function useVideos() {
  const store = useVideosStore()

  return {
    videos: computed(() => store.filtered),
    featured: computed(() => store.featured),
    all: computed(() => store.all),
    selectedCategory: computed(() => store.selectedCategory),
    sortBy: computed(() => store.sortBy),
    categories: computed(() => store.categories),
    getBySlug: store.getBySlug,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
  }
}
