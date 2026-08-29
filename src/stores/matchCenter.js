import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  fetchApiFootballFixture,
  fetchFixtureEvents,
  fetchFixtureStatistics,
  fetchFixtureLineups,
  fetchFixturePlayers,
  fetchApiFootballH2H,
  fetchPrediction,
} from '@/services/apiFootballService'

// API-Football fixture status buckets.
const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'])
const NOT_STARTED = new Set(['NS', 'TBD', 'PST', 'SUSP', 'CANC', 'AWD', 'WO'])

// Live tabs worth re-polling while a match is in play.
const LIVE_TABS = new Set(['summary', 'stats', 'ratings'])
const POLL_MS = 30_000

export const useMatchCenterStore = defineStore('matchCenter', () => {
  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  const fixtureId = ref(null)
  const fixtureCore = ref(null) // normalized fixture (team ids, status)
  const activeTab = ref('summary')

  const raw = ref({
    events: [], stats: [], lineups: [], players: [], h2h: [], prediction: null,
  })
  const loaded = ref({})
  const loading = ref({})

  let pollTimer = null

  const status = computed(() => fixtureCore.value?.status || null)
  const isLive = computed(() => LIVE_STATUSES.has(status.value))
  const isUpcoming = computed(() => status.value == null || NOT_STARTED.has(status.value))
  const homeTeamId = computed(() => fixtureCore.value?.home?.id ?? null)
  const awayTeamId = computed(() => fixtureCore.value?.away?.id ?? null)

  // Tabs available for this fixture. Prediction only before kickoff; H2H once we
  // know both team ids.
  const availableTabs = computed(() => {
    const tabs = ['summary', 'stats', 'lineups', 'ratings']
    if (homeTeamId.value && awayTeamId.value) tabs.push('h2h')
    if (isUpcoming.value) tabs.push('prediction')
    return tabs
  })

  async function open(id, coreMatch) {
    if (String(fixtureId.value) === String(id) && fixtureCore.value) {
      return // already open for this fixture
    }
    stopPolling()
    fixtureId.value = id
    fixtureCore.value = null
    activeTab.value = 'summary'
    raw.value = { events: [], stats: [], lineups: [], players: [], h2h: [], prediction: null }
    loaded.value = {}
    loading.value = {}

    // Fetch the normalized fixture first (team ids + status drive tabs/polling).
    try {
      fixtureCore.value = await fetchApiFootballFixture(id, creds.value)
    } catch {
      fixtureCore.value = null
    }
    await loadTab('summary')
    startPolling()
  }

  async function setTab(tab) {
    activeTab.value = tab
    await loadTab(tab)
  }

  async function loadTab(tab, force = false) {
    if (!fixtureId.value) return
    if (loaded.value[tab] && !force) return
    loading.value = { ...loading.value, [tab]: true }
    try {
      if (tab === 'summary') {
        raw.value.events = await fetchFixtureEvents(fixtureId.value, creds.value)
      } else if (tab === 'stats') {
        raw.value.stats = await fetchFixtureStatistics(fixtureId.value, creds.value)
      } else if (tab === 'lineups') {
        raw.value.lineups = await fetchFixtureLineups(fixtureId.value, creds.value)
      } else if (tab === 'ratings') {
        raw.value.players = await fetchFixturePlayers(fixtureId.value, creds.value)
      } else if (tab === 'h2h') {
        if (homeTeamId.value && awayTeamId.value) {
          raw.value.h2h = await fetchApiFootballH2H(
            `${homeTeamId.value}-${awayTeamId.value}`, { last: 5 }, creds.value,
          )
        }
      } else if (tab === 'prediction') {
        raw.value.prediction = await fetchPrediction(fixtureId.value, creds.value)
      }
      loaded.value = { ...loaded.value, [tab]: true }
    } catch {
      // Leave the tab empty; the UI shows a graceful empty state.
    } finally {
      loading.value = { ...loading.value, [tab]: false }
    }
  }

  // ─── Polling (live tabs only, visibility-gated) ─────────────────────────────
  function startPolling() {
    stopPolling()
    if (!isLive.value) return
    pollTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (LIVE_TABS.has(activeTab.value)) loadTab(activeTab.value, true)
    }, POLL_MS)
  }

  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }

  function close() {
    stopPolling()
    fixtureId.value = null
    fixtureCore.value = null
  }

  return {
    fixtureId, fixtureCore, activeTab, raw, loaded, loading,
    status, isLive, isUpcoming, homeTeamId, awayTeamId, availableTabs,
    open, setTab, loadTab, startPolling, stopPolling, close,
  }
})
