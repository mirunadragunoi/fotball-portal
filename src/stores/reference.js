import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchCountries, fetchFederations, fetchSeasons } from '@/services/livescoreApi'

export const useReferenceStore = defineStore('reference', () => {
  const countries = ref([])
  const federations = ref([])
  const seasons = ref([])
  const dataLoaded = ref(false)

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  async function loadReferenceData() {
    if (dataLoaded.value) return
    try {
      const [c, f, s] = await Promise.all([
        fetchCountries(creds.value),
        fetchFederations(creds.value),
        fetchSeasons(creds.value),
      ])
      countries.value = c
      federations.value = f
      seasons.value = s
      dataLoaded.value = true
    } catch {
      // reference data is optional — app works without it
    }
  }

  function countryById(id) {
    return countries.value.find((c) => String(c.id) === String(id)) || null
  }

  function seasonByName(name) {
    return seasons.value.find((s) => s.name === name) || null
  }

  return {
    countries,
    federations,
    seasons,
    dataLoaded,
    loadReferenceData,
    countryById,
    seasonByName,
  }
})
