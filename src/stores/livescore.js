import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { LIVESCORE_TABS, LIVESCORE_POLL } from '@/config/livescore'
import { getCompetitionFilterForCountry } from '@/utils/liveScoreFormat'
import {
  fetchLiveMatches,
  fetchFixtures,
  fetchMatchEvents,
  fetchMatchCommentary,
  fetchMatchStatistics,
  fetchMatchLineups,
  fetchStandings,
  fetchCompetitions,
} from '@/services/livescoreApi'

export const useLiveScoreStore = defineStore('livescore', () => {
  // ─── Tab state ────────────────────────────────────────────────────────────
  const activeTab = ref('live')

  // ─── Loading / error ──────────────────────────────────────────────────────
  const loading = ref(false)
  const detailLoading = ref(false)
  const error = ref(null)

  // ─── Live matches ─────────────────────────────────────────────────────────
  const liveMatches = ref([])
  const fixtures = ref([])
  const standings = ref([])
  const competitions = ref([])
  const lastUpdated = ref(null)

  // ─── Selected match detail ────────────────────────────────────────────────
  const selectedMatch = ref(null)
  const selectedMatchEvents = ref([])
  const selectedMatchCommentary = ref([])
  const selectedMatchStats = ref([])
  const selectedMatchLineups = ref({})

  // ─── Fixture date / standings competition ─────────────────────────────────
  const fixtureDate = ref(todayIso())
  const standingsCompetitionId = ref('')

  // ─── Poll timers ──────────────────────────────────────────────────────────
  let livePollTimer = null
  let detailPollTimer = null

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})
  const competitionFilter = computed(() => getCompetitionFilterForCountry())

  // ─── Getters ──────────────────────────────────────────────────────────────
  const matchesByCompetition = computed(() => {
    const grouped = {}
    for (const m of liveMatches.value) {
      const name = m?.competition?.name || 'Other'
      if (!grouped[name]) grouped[name] = []
      grouped[name].push(m)
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

  function matchById(id) {
    return liveMatches.value.find((m) => String(m.id) === String(id)) || null
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function todayIso() {
    return new Date().toISOString().slice(0, 10)
  }

  function setTab(tab) {
    if (LIVESCORE_TABS.includes(tab)) activeTab.value = tab
  }

  // ─── Data loaders ─────────────────────────────────────────────────────────
  async function loadLive() {
    loading.value = true
    error.value = null
    try {
      liveMatches.value = await fetchLiveMatches(creds.value, {
        competitionId: competitionFilter.value || undefined,
      })
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
      standings.value = await fetchStandings(creds.value, standingsCompetitionId.value)
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

  async function loadTabData() {
    switch (activeTab.value) {
      case 'live':     return loadLive()
      case 'fixtures': return loadFixtures()
      case 'standings': return loadStandings()
    }
  }

  // ─── Match detail ─────────────────────────────────────────────────────────
  async function selectMatch(match) {
    selectedMatch.value = match
    await fetchMatchDetail(match?.id)
  }

  async function fetchMatchDetail(matchId) {
    if (!matchId) return
    detailLoading.value = true
    try {
      const [events, commentary, stats, lineups] = await Promise.allSettled([
        fetchMatchEvents(creds.value, matchId),
        fetchMatchCommentary(creds.value, matchId),
        fetchMatchStatistics(creds.value, matchId),
        fetchMatchLineups(creds.value, matchId),
      ])
      selectedMatchEvents.value    = events.status === 'fulfilled'    ? events.value    : []
      selectedMatchCommentary.value = commentary.status === 'fulfilled' ? commentary.value : []
      selectedMatchStats.value     = stats.status === 'fulfilled'     ? stats.value     : []
      selectedMatchLineups.value   = lineups.status === 'fulfilled'   ? lineups.value   : {}
    } finally {
      detailLoading.value = false
    }
  }

  async function refreshMatchDetail() {
    const matchId = selectedMatch.value?.id
    if (!matchId) return
    try {
      const [commentary, stats] = await Promise.all([
        fetchMatchCommentary(creds.value, matchId),
        fetchMatchStatistics(creds.value, matchId),
      ])
      selectedMatchCommentary.value = commentary
      selectedMatchStats.value = stats
    } catch {
      // silent — keep stale data
    }
  }

  function clearSelection() {
    selectedMatch.value = null
    selectedMatchEvents.value = []
    selectedMatchCommentary.value = []
    selectedMatchStats.value = []
    selectedMatchLineups.value = {}
    stopDetailPolling()
  }

  // ─── Polling ──────────────────────────────────────────────────────────────
  function startLivePolling(intervalMs = LIVESCORE_POLL.live) {
    stopLivePolling()
    livePollTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (activeTab.value === 'live') loadLive()
    }, intervalMs)
  }

  function stopLivePolling() {
    if (livePollTimer) {
      clearInterval(livePollTimer)
      livePollTimer = null
    }
  }

  function startDetailPolling() {
    stopDetailPolling()
    if (!selectedMatch.value) return
    detailPollTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      refreshMatchDetail()
    }, LIVESCORE_POLL.detail)
  }

  function stopDetailPolling() {
    if (detailPollTimer) {
      clearInterval(detailPollTimer)
      detailPollTimer = null
    }
  }

  // Visibility API — call setupVisibilityPolling from the view
  function _onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      loadLive()
      startLivePolling()
      if (selectedMatch.value) startDetailPolling()
    } else {
      stopLivePolling()
      stopDetailPolling()
    }
  }

  function setupVisibilityPolling(intervalMs = LIVESCORE_POLL.live) {
    document.addEventListener('visibilitychange', _onVisibilityChange)
    startLivePolling(intervalMs)
  }

  function teardownVisibilityPolling() {
    document.removeEventListener('visibilitychange', _onVisibilityChange)
    stopLivePolling()
    stopDetailPolling()
  }

  // ─── Legacy aliases kept for widget / hero ─────────────────────────────────
  function startLivePoll(ms) { setupVisibilityPolling(ms) }
  function stopLivePoll() { teardownVisibilityPolling() }

  return {
    activeTab,
    loading,
    detailLoading,
    error,
    liveMatches,
    fixtures,
    standings,
    competitions,
    lastUpdated,
    selectedMatch,
    selectedMatchEvents,
    selectedMatchCommentary,
    selectedMatchStats,
    selectedMatchLineups,
    fixtureDate,
    standingsCompetitionId,
    matchesByCompetition,
    liveCount,
    inPlayMatches,
    matchById,
    setTab,
    loadLive,
    loadFixtures,
    loadStandings,
    loadCompetitions,
    loadTabData,
    selectMatch,
    fetchMatchDetail,
    clearSelection,
    startLivePolling,
    stopLivePolling,
    startDetailPolling,
    stopDetailPolling,
    setupVisibilityPolling,
    teardownVisibilityPolling,
    // legacy
    startLivePoll,
    stopLivePoll,
    clearSelectedMatch: clearSelection,
    loadMatchEvents: (match) => selectMatch(match),
    eventsLoading: detailLoading,
    selectedMatchEvents,
  }
})
