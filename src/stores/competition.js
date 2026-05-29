import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  fetchCompetitions,
  fetchStandings,
  fetchLiveStandings,
  fetchGroups,
  fetchGoalscorers,
  fetchDisciplinary,
  fetchFixtures,
  fetchRosters,
} from '@/services/livescoreApi'

export const useCompetitionStore = defineStore('competition', () => {
  const competitions = ref([])
  const selectedCompetition = ref(null)
  const standings = ref([])
  const liveStandings = ref([])
  const groups = ref([])
  const topGoalscorers = ref([])
  const topDisciplinary = ref([])
  const fixtures = ref([])
  const rosters = ref({})
  const loading = ref(false)
  const error = ref(null)

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  async function loadCompetitions({ countryId, federationId } = {}) {
    try {
      competitions.value = await fetchCompetitions(creds.value, { countryId, federationId })
    } catch {
      competitions.value = []
    }
  }

  function selectCompetition(id) {
    selectedCompetition.value =
      competitions.value.find((c) => String(c.id) === String(id)) || null
  }

  async function loadStandings(competitionId, seasonId, groupId) {
    if (!competitionId) return
    loading.value = true
    error.value = null
    try {
      standings.value = await fetchStandings(creds.value, competitionId, { seasonId, groupId })
    } catch (e) {
      error.value = e?.message || 'load'
      standings.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadLiveStandings(competitionId, groupId) {
    if (!competitionId) return
    try {
      liveStandings.value = await fetchLiveStandings(creds.value, competitionId, { groupId })
    } catch {
      liveStandings.value = []
    }
  }

  async function loadGroups(competitionId) {
    if (!competitionId) return
    try {
      groups.value = await fetchGroups(creds.value, competitionId)
    } catch {
      groups.value = []
    }
  }

  async function loadGoalscorers(competitionId) {
    if (!competitionId) return
    try {
      topGoalscorers.value = await fetchGoalscorers(creds.value, competitionId)
    } catch {
      topGoalscorers.value = []
    }
  }

  async function loadDisciplinary(competitionId) {
    if (!competitionId) return
    try {
      topDisciplinary.value = await fetchDisciplinary(creds.value, competitionId)
    } catch {
      topDisciplinary.value = []
    }
  }

  async function loadFixtures(competitionId, { date, groupId, teamId } = {}) {
    loading.value = true
    error.value = null
    try {
      fixtures.value = await fetchFixtures(creds.value, { competitionId, date, groupId, teamId })
    } catch (e) {
      error.value = e?.message || 'load'
      fixtures.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadRosters(competitionId, season) {
    if (!competitionId) return
    try {
      rosters.value = await fetchRosters(creds.value, competitionId, season)
    } catch {
      rosters.value = {}
    }
  }

  return {
    competitions,
    selectedCompetition,
    standings,
    liveStandings,
    groups,
    topGoalscorers,
    topDisciplinary,
    fixtures,
    rosters,
    loading,
    error,
    loadCompetitions,
    selectCompetition,
    loadStandings,
    loadLiveStandings,
    loadGroups,
    loadGoalscorers,
    loadDisciplinary,
    loadFixtures,
    loadRosters,
  }
})
