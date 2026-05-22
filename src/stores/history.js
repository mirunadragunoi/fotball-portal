import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { HISTORY_PAGE_SIZE, HISTORY_TABS } from '@/config/history'
import {
  fetchHistoryTournaments,
  fetchHistoryTeams,
  fetchHistoryMatches,
  fetchHistoryPlayers,
  fetchHistorySquads,
} from '@/services/historyApi'

export const useHistoryStore = defineStore('history', () => {
  const activeTab = ref('tournaments')
  const loading = ref(false)
  const error = ref(null)

  const tournaments = ref([])
  const teams = ref([])
  const matches = ref([])
  const players = ref([])
  const squads = ref([])

  const playersTotal = ref(0)
  const playersPage = ref(1)

  const teamQuery = ref('')
  const matchTournamentId = ref('')
  const matchStage = ref('')
  const matchQuery = ref('')
  const playerQuery = ref('')
  const squadTournamentId = ref('')
  const squadTeamId = ref('')

  const selectedTournament = ref(null)

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  function setTab(tab) {
    if (HISTORY_TABS.includes(tab)) activeTab.value = tab
  }

  async function loadTournaments() {
    loading.value = true
    error.value = null
    try {
      tournaments.value = await fetchHistoryTournaments(creds.value)
    } catch (e) {
      error.value = e?.message || 'load'
      tournaments.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadTeams() {
    loading.value = true
    error.value = null
    try {
      teams.value = await fetchHistoryTeams(creds.value, { q: teamQuery.value })
    } catch (e) {
      error.value = e?.message || 'load'
      teams.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadMatches() {
    loading.value = true
    error.value = null
    try {
      matches.value = await fetchHistoryMatches(creds.value, {
        tournamentId: matchTournamentId.value,
        stage: matchStage.value,
        q: matchQuery.value,
      })
    } catch (e) {
      error.value = e?.message || 'load'
      matches.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadPlayers() {
    loading.value = true
    error.value = null
    try {
      const { items, total } = await fetchHistoryPlayers(creds.value, {
        q: playerQuery.value,
        page: playersPage.value,
        pageSize: HISTORY_PAGE_SIZE,
      })
      players.value = items
      playersTotal.value = total
    } catch (e) {
      error.value = e?.message || 'load'
      players.value = []
      playersTotal.value = 0
    } finally {
      loading.value = false
    }
  }

  async function loadSquads() {
    if (!squadTournamentId.value || !squadTeamId.value) {
      squads.value = []
      return
    }
    loading.value = true
    error.value = null
    try {
      squads.value = await fetchHistorySquads(creds.value, {
        tournamentId: squadTournamentId.value,
        teamId: squadTeamId.value,
      })
    } catch (e) {
      error.value = e?.message || 'load'
      squads.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadTabData() {
    switch (activeTab.value) {
      case 'tournaments':
        await loadTournaments()
        break
      case 'teams':
        await loadTeams()
        break
      case 'matches':
        await loadMatches()
        break
      case 'players':
        await loadPlayers()
        break
      case 'squads':
        await loadSquads()
        break
      default:
        break
    }
  }

  const matchStages = computed(() => {
    const set = new Set(matches.value.map((m) => m.stageName).filter(Boolean))
    return [...set].sort()
  })

  const mensTournaments = computed(() =>
    tournaments.value.filter((t) => !/women/i.test(t.tournamentName || '')),
  )

  const playersPageCount = computed(() =>
    Math.max(1, Math.ceil(playersTotal.value / HISTORY_PAGE_SIZE)),
  )

  function selectTournament(t) {
    selectedTournament.value = t
    matchTournamentId.value = t?.tournamentId || ''
    squadTournamentId.value = t?.tournamentId || ''
  }

  function openMatchesForTournament(t) {
    selectTournament(t)
    activeTab.value = 'matches'
    loadMatches()
  }

  function openSquadsForTournament(t) {
    selectTournament(t)
    activeTab.value = 'squads'
  }

  return {
    activeTab,
    loading,
    error,
    tournaments,
    teams,
    matches,
    players,
    squads,
    playersTotal,
    playersPage,
    playersPageCount,
    teamQuery,
    matchTournamentId,
    matchStage,
    matchQuery,
    playerQuery,
    squadTournamentId,
    squadTeamId,
    selectedTournament,
    mensTournaments,
    matchStages,
    setTab,
    loadTabData,
    loadTournaments,
    loadTeams,
    loadMatches,
    loadPlayers,
    loadSquads,
    selectTournament,
    openMatchesForTournament,
    openSquadsForTournament,
  }
})
