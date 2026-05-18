<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterBar from '@/components/shared/FilterBar.vue'
import { useVideosStore } from '@/stores/videos'

const { t } = useI18n()
const store = useVideosStore()

const categoryColors = {
  Highlights: '#FF1744',
  Skills:     '#00C853',
  Funny:      '#FFC400',
  Classic:    '#2979FF',
  Tactics:    '#7C4DFF',
}

const categoryOptions = computed(() =>
  store.categories.map(c => ({
    value: c,
    label: c === 'all' ? t('videos.filterAll') : c,
    color: c === 'all' ? null : categoryColors[c] || null,
  }))
)

const sortOptions = [
  { value: 'newest',  label: t('videos.sortNewest') },
  { value: 'popular', label: t('videos.sortPopular') },
]

function handleCategory(val) { store.setFilters({ category: val }) }
function handleSort(val)     { store.setFilters({ sort: val }) }
</script>

<template>
  <div class="video-filters">
    <FilterBar
      :category-options="categoryOptions"
      :sort-options="sortOptions"
      :active-category="store.selectedCategory"
      :active-sort="store.sortBy"
      @category="handleCategory"
      @sort="handleSort"
    />
  </div>
</template>

<style scoped>
.video-filters {
  position: sticky;
  top: var(--header-height);
  z-index: 40;
  padding: 20px var(--content-padding);
  background: color-mix(in srgb, var(--color-bg) 85%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--color-line);
}

@media (max-width: 767px) {
  .video-filters {
    padding: 12px 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
