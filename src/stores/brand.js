import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  BRAND_MAP,
  getBrandKey,
  getBrandConfig,
  getBrandConfigByKey,
  getCountryKey,
  getCountry,
} from '@/config/brand'

export const useBrandStore = defineStore('brand', () => {
  const activeBrand = ref(getBrandKey())
  const config = ref(getBrandConfig())

  function loadBrand(brandName) {
    const key = BRAND_MAP[brandName] ? brandName : getBrandKey()
    config.value = getBrandConfigByKey(key)
    activeBrand.value = key
    document.documentElement.setAttribute('data-brand', key)
    document.title = config.value.portalName || config.value.displayName || 'Football Portal'
  }

  const countryKey = computed(() => getCountryKey())
  const country = computed(() => getCountry())

  const isFootball = computed(
    () => activeBrand.value === 'football1' || activeBrand.value === 'football2'
  )

  const isDark = computed(() => activeBrand.value === 'football1')

  return {
    activeBrand,
    config,
    countryKey,
    country,
    loadBrand,
    isFootball,
    isDark,
  }
})
