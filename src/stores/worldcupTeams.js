import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchPlayerDetails } from '@/services/apiFootballService'
import { fetchFantasy } from '@/services/livescoreApi'
import { WC_2026_COMPETITION_ID } from '@/config/livescore'

const DIACRITICS = /[̀-ͯ]/g
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/\s+/g, ' ')
}

const FANTASY_METRICS = [
  'goals', 'assists', 'shots',
  'passes', 'tackles', 'duels', 'clearances', 'interceptions',
  'fouls', 'ball_touches',
]

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

  // cache: playerId → aggregated fantasy stats from /football/livescore/fantasy
  const playerFantasy = ref({})
  const playerFantasyLoading = ref(false)

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

  /**
   * Aggregate fantasy stats for a WC player.
   *
   * The fantasy endpoint speaks live-score-api IDs, but WC player IDs come
   * from api-football — they don't match. We fetch fantasy for the team
   * (via team.liveScoreApiId) filtered to WC 2026, then match by player name.
   */
  async function loadPlayerFantasy(player, team) {
    const playerId = player?.id
    const lsaTeamId = team?.liveScoreApiId
    if (!playerId || !lsaTeamId) return null
    if (playerFantasy.value[playerId]) return playerFantasy.value[playerId]

    playerFantasyLoading.value = true
    try {
      const matches = await fetchFantasy(creds.value, {
        teamId: lsaTeamId,
        competitionId: WC_2026_COMPETITION_ID,
      })

      const target = normName(player.name)
      const agg = { matches: 0 }
      FANTASY_METRICS.forEach(k => (agg[k] = 0))

      for (const m of matches) {
        const entry = (m?.stats || []).find(s => normName(s.name) === target)
        if (!entry) continue
        agg.matches++
        for (const k of FANTASY_METRICS) {
          agg[k] += Number(entry[k] || 0)
        }
      }

      if (agg.matches > 0) {
        playerFantasy.value[playerId] = agg
        return agg
      }
    } catch (e) {
      console.warn('Player fantasy fetch failed', e?.message)
    } finally {
      playerFantasyLoading.value = false
    }
    return null
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
    playerFantasy,
    playerFantasyLoading,
    teamsSorted,
    teamsByGroup,
    groupKeys,
    getTeamById,
    getTeamByLsaId,
    getTeamByName,
    totalPlayers,
    loadTeams,
    loadPlayerDetails,
    loadPlayerFantasy,
    selectTeam,
    selectPlayer,
    clearSelection,
  }
})