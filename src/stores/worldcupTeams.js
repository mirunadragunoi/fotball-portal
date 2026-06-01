import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchPlayerDetails } from '@/services/apiFootballService'

export const useWorldCupTeamsStore = defineStore('worldcupTeams', () => {
  const teams       = ref([])
  const lastSync    = ref(null)
  const loaded      = ref(false)
  const loading     = ref(false)

  const selectedTeam   = ref(null)
  const selectedPlayer = ref(null)

  // cache: playerId → extended detail object from API-Football
  const playerDetails = ref({})
  const playerDetailLoading = ref(false)

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  // ── Loaders ───────────────────────────────────────────────────────────

  async function loadTeams() {
    if (loaded.value) return
    loading.value = true
    try {
      const res  = await fetch('/data/wc2026-teams.json')
      const json = await res.json()
      teams.value    = json.teams || []
      lastSync.value = json.lastSync || null
      loaded.value   = true
    } catch (e) {
      console.error('Failed to load wc2026-teams.json', e)
      teams.value = []
    } finally {
      loading.value = false
    }
  }

  // lazy-load extended player stats (on modal open)
  async function loadPlayerDetails(playerId) {
    if (playerDetails.value[playerId]) return playerDetails.value[playerId]
    playerDetailLoading.value = true
    try {
      const data = await fetchPlayerDetails(playerId, creds.value)
      if (data) {
        playerDetails.value[playerId] = data
        return data
      }
    } catch (e) {
      console.error('Player details fetch failed', e)
    } finally {
      playerDetailLoading.value = false
    }
    return null
  }

  // ── Selections ────────────────────────────────────────────────────────

  function selectTeam(teamId) {
    selectedTeam.value   = getTeamById.value(teamId) || null
    selectedPlayer.value = null
  }

  function selectPlayer(player, team) {
    selectedPlayer.value = player ? { ...player, team } : null
  }

  function clearSelection() {
    selectedTeam.value   = null
    selectedPlayer.value = null
  }

  // ── Getters ───────────────────────────────────────────────────────────

  const teamsSorted = computed(() =>
    [...teams.value].sort((a, b) => (a.group || 'Z').localeCompare(b.group || 'Z') || a.name.localeCompare(b.name))
  )

  // { 'A': [...], 'B': [...], ... }
  const teamsByGroup = computed(() => {
    const out = {}
    for (const t of teams.value) {
      const g = t.group || '?'
      if (!out[g]) out[g] = []
      out[g].push(t)
    }
    return out
  })

  const groupKeys = computed(() =>
    Object.keys(teamsByGroup.value).sort()
  )

  const getTeamById = computed(() => (id) =>
    teams.value.find((t) => String(t.id) === String(id)) || null
  )

  const getTeamByLsaId = computed(() => (lsaId) => {
    if (!lsaId) return null
    return teams.value.find((t) => t.liveScoreApiId != null && String(t.liveScoreApiId) === String(lsaId)) || null
  })

  const getTeamByName = computed(() => (name) => {
    if (!name) return null

    const DIACRITICS = new RegExp('[̀-ͯ]', 'g')
    function normName(s) {
      return String(s)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(DIACRITICS, '')  // strip diacritics: ü→u, ç→c, Türkiye→Turkiye
        .replace(/\band\b/g, '&') // "Bosnia and Herzegovina" → "Bosnia & Herzegovina"
        .replace(/\s+/g, ' ')
        .trim()
    }

    // Specific aliases: normalized livescore name → normalized wc2026-teams name
    const ALIASES = {
      'turkey':     'turkiye',             // Turkey  → Türkiye
      'dr congo':   'congo dr',            // DR Congo → Congo DR
      'cape verde': 'cape verde islands',  // Cape Verde → Cape Verde Islands
    }

    const q = normName(name)
    const qa = ALIASES[q] || q

    return teams.value.find((t) => {
      const tn = normName(t.name)
      return tn === q || tn === qa
    }) || null
  })

  const totalPlayers = computed(() =>
    teams.value.reduce((sum, t) => sum + (t.players?.length || 0), 0)
  )

  return {
    teams,
    lastSync,
    loaded,
    loading,
    selectedTeam,
    selectedPlayer,
    playerDetails,
    playerDetailLoading,
    teamsSorted,
    teamsByGroup,
    groupKeys,
    getTeamById,
    getTeamByLsaId,
    getTeamByName,
    totalPlayers,
    loadTeams,
    loadPlayerDetails,
    selectTeam,
    selectPlayer,
    clearSelection,
  }
})