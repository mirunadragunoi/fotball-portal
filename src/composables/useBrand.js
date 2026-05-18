import { computed } from 'vue'
import { useBrandStore } from '@/stores/brand'
import { getCountryKey, getCountry } from '@/config/brand'

export function useBrand() {
  const store = useBrandStore()

  const brand = computed(() => store.activeBrand)
  const config = computed(() => store.config)
  const isDark = computed(() => store.isDark)
  const countryKey = computed(() => store.countryKey ?? getCountryKey())
  const country = computed(() => store.country ?? getCountry())

  return {
    brand,
    config,
    isDark,
    countryKey,
    country,
    loadBrand: store.loadBrand,
  }
}
