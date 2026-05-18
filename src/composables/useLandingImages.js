import { computed } from 'vue'
import { getLandingImages } from '@/config/landingImages'
import { useBrandStore } from '@/stores/brand'

export function useLandingImages() {
  const brandStore = useBrandStore()
  const images = computed(() => getLandingImages(brandStore.activeBrand))
  return { images }
}
