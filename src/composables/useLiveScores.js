import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { LIVESCORE_POLL } from '@/config/livescore'
import { fetchLiveMatches } from '@/services/livescoreApi'
import { getCompetitionFilterForCountry, toHeroMatchRow } from '@/utils/liveScoreFormat'

/**
 * Lightweight live-score polling for widgets (hero). Uses on-demand creds from auth store.
 */
export function useLiveScores(options = {}) {
  const {
    limit = 3,
    pollMs = LIVESCORE_POLL.hero,
    autoStart = true,
    inPlayOnly = true,
  } = options

  const matches = ref([])
  const loading = ref(false)
  const error = ref(null)
  let intervalId = null

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery())

  const heroRows = computed(() => {
    let list = matches.value
    if (inPlayOnly) {
      list = list.filter((m) =>
        ['IN PLAY', 'HALF TIME BREAK', 'ADDED TIME'].includes(
          (m?.status || '').toUpperCase(),
        ),
      )
    }
    if (!list.length) list = matches.value
    return list.slice(0, limit).map(toHeroMatchRow)
  })

  async function refresh() {
    if (!creds.value?.accessCode) return
    loading.value = true
    error.value = null
    try {
      const filter = getCompetitionFilterForCountry()
      matches.value = await fetchLiveMatches(creds.value, {
        competitionId: filter || undefined,
      })
    } catch (e) {
      error.value = e?.message || 'load'
      matches.value = []
    } finally {
      loading.value = false
    }
  }

  function startPolling(ms = pollMs) {
    stopPolling()
    refresh()
    intervalId = setInterval(refresh, ms)
  }

  function stopPolling() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(() => {
    if (autoStart) startPolling()
  })

  onUnmounted(stopPolling)

  return {
    matches,
    heroRows,
    loading,
    error,
    refresh,
    startPolling,
    stopPolling,
  }
}
