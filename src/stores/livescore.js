import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { LIVESCORE_TABS, LIVESCORE_POLL, EUROPE_COUNTRY_IDS } from '@/config/livescore'
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
  const detailError = ref(null)

  // ─── Fixture date / standings competition ─────────────────────────────────
  const fixtureDate = ref(todayIso())
  const standingsCompetitionId = ref('')
  const filterEurope = ref(true)

  // ─── Poll timers ──────────────────────────────────────────────────────────
  let livePollTimer = null
  let detailPollTimer = null

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})
  const competitionFilter = computed(() => getCompetitionFilterForCountry())

  // ─── Europe filter helpers ────────────────────────────────────────────────
  function isEuropean(m) {
    const cid = Number(m?.country?.id)
    return !isNaN(cid) && EUROPE_COUNTRY_IDS.has(cid)
  }

  function toggleEuropeFilter() {
    filterEurope.value = !filterEurope.value
  }

  // ─── Getters ──────────────────────────────────────────────────────────────
  const filteredLiveMatches = computed(() =>
    filterEurope.value ? liveMatches.value.filter(isEuropean) : liveMatches.value
  )

  const filteredFixtures = computed(() =>
    filterEurope.value ? fixtures.value.filter(isEuropean) : fixtures.value
  )

  const matchesByCompetition = computed(() => {
    const grouped = {}
    for (const m of filteredLiveMatches.value) {
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

  // Strip season patterns so "Premier League 2025/26" == "Premier League 2024/25"
  function normCompName(name) {
    return (name || '').toLowerCase()
      .replace(/\d{4}[/-]\d{2,4}/g, '')
      .replace(/\b(20|19)\d{2}\b/g, '')
      .replace(/\bseason\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  async function loadCompetitions() {
    try {
      const raw = await fetchCompetitions(creds.value)
      // Deduplicate by normalised name, keep highest ID (most recent season)
      const byName = new Map()
      for (const c of raw) {
        const key = normCompName(c.name)
        if (!key) continue
        const existing = byName.get(key)
        if (!existing || Number(c.id) > Number(existing.id)) byName.set(key, c)
      }
      competitions.value = [...byName.values()].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      )

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
  function resolveMatchId(match) {
    const id = match?.id ?? match?.match_id ?? match?.fixture_id ?? null
    if (!id) console.warn('[livescore] selectMatch: could not resolve match ID', match)
    return id
  }

  async function selectMatch(match) {
    selectedMatch.value = match
    await fetchMatchDetail(resolveMatchId(match))
  }

  async function fetchMatchDetail(matchId) {
    if (!matchId) {
      detailError.value = 'match_id_missing'
      return
    }
    detailLoading.value = true
    detailError.value = null
    try {
      const [events, commentary, stats, lineups] = await Promise.allSettled([
        fetchMatchEvents(creds.value, matchId),
        fetchMatchCommentary(creds.value, matchId),
        fetchMatchStatistics(creds.value, matchId),
        fetchMatchLineups(creds.value, matchId),
      ])
      selectedMatchEvents.value = events.status === 'fulfilled' ? events.value : []
      selectedMatchCommentary.value = commentary.status === 'fulfilled' ? commentary.value : []
      selectedMatchStats.value      = stats.status     === 'fulfilled' ? stats.value     : []
      selectedMatchLineups.value    = lineups.status   === 'fulfilled' ? lineups.value   : {}


      const failures = [events, commentary, stats, lineups].filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        console.warn('[livescore] fetchMatchDetail partial failures:', failures.map(f => f.reason?.message))
      }
      if (failures.length === 4) {
        detailError.value = failures[0].reason?.message || 'api_error'
      }
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
    detailError.value = null
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
    detailError,
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
    filterEurope,
    filteredLiveMatches,
    filteredFixtures,
    toggleEuropeFilter,
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
