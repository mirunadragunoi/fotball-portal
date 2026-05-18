import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const brandModules = import.meta.glob('../brands/*/config.js', { eager: false })

export const useBrandStore = defineStore('brand', () => {
  const activeBrand = ref(
    typeof __DEFAULT_BRAND__ !== 'undefined' ? __DEFAULT_BRAND__ : 'football1'
  )
  const config = ref(null)
  const loading = ref(false)

  async function loadBrand(brandName) {
    loading.value = true
    try {
      const key = `../brands/${brandName}/config.js`
      if (!brandModules[key]) {
        console.warn(`Brand "${brandName}" not found, falling back to football1`)
        brandName = 'football1'
      }
      const mod = await brandModules[`../brands/${brandName}/config.js`]()
      config.value = mod.default
      activeBrand.value = brandName
      document.documentElement.setAttribute('data-brand', brandName)
    } finally {
      loading.value = false
    }
  }

  const isFootball = computed(() =>
    activeBrand.value === 'football1' || activeBrand.value === 'football2'
  )

  const isDark = computed(() => activeBrand.value === 'football1')

  return { activeBrand, config, loading, loadBrand, isFootball, isDark }
})
