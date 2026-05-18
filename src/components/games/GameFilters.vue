<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterBar from '@/components/shared/FilterBar.vue'
import { useGamesStore } from '@/stores/games'
import { PRODUCT_TYPES } from '@/config/api'

const { t } = useI18n()
const store = useGamesStore()

const categoryColors = {
  Action:   '#E53935',
  Skill:    '#2979FF',
  Strategy: '#00C853',
  Arcade:   '#FFC400',
  Card:     '#7C4DFF',
}

const platformOptions = computed(() => [
  { value: 'all',     label: t('games.filterAll'),    count: store.all.length },
  { value: 'html5',   label: t('games.filterHtml5'),  count: store.all.filter(g => g.productType === PRODUCT_TYPES.html).length },
  { value: 'android', label: t('games.filterAndroid'), count: store.all.filter(g => g.productType === PRODUCT_TYPES.android).length },
])

const categoryOptions = computed(() =>
  store.categories.map(c => ({
    value: c,
    label: c === 'all' ? t('games.filterAll') : c,
    color: c === 'all' ? null : categoryColors[c] || null,
  }))
)

const sortOptions = [
  { value: 'plays',   label: t('games.sortPlays') },
  { value: 'rating',  label: t('games.sortRating') },
  { value: 'alpha',   label: t('games.sortAlpha') },
  { value: 'newest',  label: t('games.sortNewest') },
]

function handlePlatform(val) { store.setFilters({ platform: val }) }
function handleCategory(val) { store.setFilters({ category: val }) }
function handleSort(val)     { store.setFilters({ sort: val }) }
</script>

<template>
  <div class="game-filters">
    <FilterBar
      :platform-options="platformOptions"
      :category-options="categoryOptions"
      :sort-options="sortOptions"
      :active-platform="store.selectedPlatform"
      :active-category="store.selectedCategory"
      :active-sort="store.sortBy"
      @platform="handlePlatform"
      @category="handleCategory"
      @sort="handleSort"
    />
  </div>
</template>

<style scoped>
.game-filters {
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
  .game-filters {
    padding: 12px 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
