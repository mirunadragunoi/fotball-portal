import { computed } from 'vue'
import { useBrandStore } from '@/stores/brand'

export function useBrand() {
  const store = useBrandStore()

  const brand = computed(() => store.activeBrand)
  const config = computed(() => store.config)
  const isDark = computed(() => store.isDark)

  return { brand, config, isDark, loadBrand: store.loadBrand }
}
