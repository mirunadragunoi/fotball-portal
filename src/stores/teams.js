import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  fetchTeams,
  fetchTeamLastMatches,
  fetchTeamEventMinutes,
  fetchH2H,
  fetchSquad,
} from '@/services/livescoreApi'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref([])
  const selectedTeam = ref(null)
  const teamLastMatches = ref([])
  const teamH2H = ref(null)
  const teamEventMinutes = ref(null)
  const teamSquad = ref([])
  const loading = ref(false)
  const error = ref(null)

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  async function loadTeams({ countryId, competitionId, federationId } = {}) {
    try {
      teams.value = await fetchTeams(creds.value, { countryId, competitionId, federationId })
    } catch {
      teams.value = []
    }
  }

  function selectTeam(teamId) {
    selectedTeam.value =
      teams.value.find((t) => String(t.id) === String(teamId)) || { id: teamId }
  }

  async function loadLastMatches(teamId) {
    if (!teamId) return
    loading.value = true
    try {
      teamLastMatches.value = await fetchTeamLastMatches(creds.value, teamId)
    } catch {
      teamLastMatches.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadH2H(team1Id, team2Id) {
    if (!team1Id || !team2Id) return
    loading.value = true
    error.value = null
    try {
      teamH2H.value = await fetchH2H(creds.value, team1Id, team2Id)
    } catch (e) {
      error.value = e?.message || 'load'
      teamH2H.value = null
    } finally {
      loading.value = false
    }
  }

  async function loadEventMinutes(teamId) {
    if (!teamId) return
    try {
      teamEventMinutes.value = await fetchTeamEventMinutes(creds.value, teamId)
    } catch {
      teamEventMinutes.value = null
    }
  }

  async function loadSquad(competitionId, teamId) {
    if (!competitionId || !teamId) return
    loading.value = true
    try {
      teamSquad.value = await fetchSquad(creds.value, competitionId, teamId)
    } catch {
      teamSquad.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    teams,
    selectedTeam,
    teamLastMatches,
    teamH2H,
    teamEventMinutes,
    teamSquad,
    loading,
    error,
    loadTeams,
    selectTeam,
    loadLastMatches,
    loadH2H,
    loadEventMinutes,
    loadSquad,
  }
})
