import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { LIVESCORE_TABS } from '@/config/livescore'
import { getCompetitionFilterForCountry } from '@/utils/liveScoreFormat'
import {
  fetchLiveMatches,
  fetchFixtures,
  fetchMatchEvents,
  fetchStandings,
  fetchCompetitions,
} from '@/services/livescoreApi'

export const useLiveScoreStore = defineStore('livescore', () => {
  const activeTab = ref('live')
  const loading = ref(false)
  const eventsLoading = ref(false)
  const error = ref(null)

  const liveMatches = ref([])
  const fixtures = ref([])
  const standings = ref([])
  const competitions = ref([])
  const selectedMatch = ref(null)
  const selectedMatchEvents = ref([])

  const fixtureDate = ref(todayIso())
  const standingsCompetitionId = ref('')

  const lastUpdated = ref(null)
  let livePollTimer = null

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  const competitionFilter = computed(() => getCompetitionFilterForCountry())

  const matchesByCompetition = computed(() => {
    const grouped = {}
    for (const match of liveMatches.value) {
      const name = match?.competition?.name || 'Other'
      if (!grouped[name]) grouped[name] = []
      grouped[name].push(match)
    }
    return grouped
  })

  const liveCount = computed(
    () =>
      liveMatches.value.filter((m) =>
        ['IN PLAY', 'HALF TIME BREAK', 'ADDED TIME'].includes(
          (m?.status || '').toUpperCase(),
        ),
      ).length,
  )

  const inPlayMatches = computed(() =>
    liveMatches.value.filter((m) =>
      ['IN PLAY', 'HALF TIME BREAK', 'ADDED TIME'].includes(
        (m?.status || '').toUpperCase(),
      ),
    ),
  )

  function todayIso() {
    return new Date().toISOString().slice(0, 10)
  }

  function setTab(tab) {
    if (LIVESCORE_TABS.includes(tab)) activeTab.value = tab
  }

  async function loadLive() {
    loading.value = true
    error.value = null
    try {
      const list = await fetchLiveMatches(creds.value, {
        competitionId: competitionFilter.value || undefined,
      })
      liveMatches.value = list
      lastUpdated.value = new Date()
    } catch (e) {
      error.value = e?.message || 'load'
      liveMatches.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadFixtures() {
    loading.value = true
    error.value = null
    try {
      fixtures.value = await fetchFixtures(creds.value, {
        competitionId: competitionFilter.value || undefined,
        date: fixtureDate.value,
      })
    } catch (e) {
      error.value = e?.message || 'load'
      fixtures.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadStandings() {
    if (!standingsCompetitionId.value) {
      standings.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      standings.value = await fetchStandings(
        creds.value,
        standingsCompetitionId.value,
      )
    } catch (e) {
      error.value = e?.message || 'load'
      standings.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadCompetitions() {
    try {
      competitions.value = await fetchCompetitions(creds.value)
      if (!standingsCompetitionId.value && competitions.value[0]?.id) {
        standingsCompetitionId.value = String(competitions.value[0].id)
      }
    } catch {
      competitions.value = []
    }
  }

  async function loadMatchEvents(match) {
    if (!match?.id) return
    selectedMatch.value = match
    eventsLoading.value = true
    try {
      selectedMatchEvents.value = await fetchMatchEvents(creds.value, match.id)
    } catch {
      selectedMatchEvents.value = []
    } finally {
      eventsLoading.value = false
    }
  }

  function clearSelectedMatch() {
    selectedMatch.value = null
    selectedMatchEvents.value = []
  }

  async function loadTabData() {
    switch (activeTab.value) {
      case 'live':
        await loadLive()
        break
      case 'fixtures':
        await loadFixtures()
        break
      case 'standings':
        await loadStandings()
        break
      default:
        break
    }
  }

  function startLivePolling(intervalMs) {
    stopLivePolling()
    livePollTimer = setInterval(() => {
      if (activeTab.value === 'live') loadLive()
    }, intervalMs)
  }

  function stopLivePolling() {
    if (livePollTimer) {
      clearInterval(livePollTimer)
      livePollTimer = null
    }
  }

  return {
    activeTab,
    loading,
    eventsLoading,
    error,
    liveMatches,
    fixtures,
    standings,
    competitions,
    selectedMatch,
    selectedMatchEvents,
    fixtureDate,
    standingsCompetitionId,
    lastUpdated,
    matchesByCompetition,
    liveCount,
    inPlayMatches,
    setTab,
    loadLive,
    loadFixtures,
    loadStandings,
    loadCompetitions,
    loadMatchEvents,
    clearSelectedMatch,
    loadTabData,
    startLivePolling,
    stopLivePolling,
  }
})
