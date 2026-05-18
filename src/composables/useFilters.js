import { computed } from 'vue'

export function useFilters(store, filterKey) {
  const activeFilter = computed({
    get: () => store[filterKey],
    set: (val) => store.setFilters({ [filterKey]: val }),
  })

  function setFilter(val) {
    store.setFilters({ [filterKey]: val })
  }

  return { activeFilter, setFilter }
}
