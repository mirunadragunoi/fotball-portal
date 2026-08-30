import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  fetchPlayerDetails,
  fetchPlayerTransfers,
  fetchPlayerTrophies,
  fetchPlayerSidelined,
} from '@/services/apiFootballService'
import { fetchFantasy } from '@/services/livescoreApi'
import { WC_2026_COMPETITION_ID } from '@/config/livescore'
import { getCompetitionsByTier } from '@/config/europeanCompetitions'
import { useBrandStore } from '@/stores/brand'
import { currentSeason } from '@/utils/season'

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

// ── Club roster helpers (every curated league) ───────────────────────────────
// live-score-api and api-football use different team ids, so club teams are
// resolved by NAME (like the WC flow). Kept separate from the WC name matcher
// so the two never cross-match.

// live-score-api competition id -> the slug scripts/sync_club_squads.py writes.
// Both numbering systems appear in this file; this map is the only bridge, and
// it must stay in step with LEAGUES in that script -- a missing entry does not
// throw, it just leaves that league with no squads at all.
const LEAGUE_SLUGS = {
  // top-5
  2: 'premier-league', 3: 'la-liga', 4: 'serie-a', 1: 'bundesliga', 5: 'ligue-1',
  // secondary
  196: 'eredivisie', 8: 'primeira-liga', 6: 'super-lig',
  // local (brand-scoped in europeanCompetitions.js)
  60: 'ekstraklasa', 63: 'slovak-super-league', 61: 'liga-i', 72: 'czech-first-league',
}

// Which tiers get club squads. UEFA cups are deliberately absent: their squads
// ARE the domestic clubs already loaded here, so syncing them would duplicate
// every team under a second id.
const CLUB_ROSTER_TIERS = ['top5', 'secondary', 'local']

// The two providers name the same club differently, and no normalisation
// bridges an exonym ('Cologne' vs 'Koln') or a founding year ('CFR Cluj' vs
// 'CFR 1907 Cluj'). Keys are the NORMALISED live-score-api name, values the
// NORMALISED api-football one -- both sides have already been through
// normClubName, so they are lowercase, unaccented and stripped of FC/SC/AS.
//
// Every entry below was a team page showing no squad at all, silently. Re-check
// after a season rollover with scripts/check_club_name_matching.py in the
// backend repo: promoted clubs arrive with spellings nobody has seen yet.
const CLUB_ALIASES = {
  // Bundesliga
  'bayern munich': 'bayern munchen',
  'borussia moenchengladbach': 'borussia monchengladbach',
  'sv 07 elversberg': 'sv elversberg',
  'cologne': '1 koln',
  'rasenballsport leipzig': 'rb leipzig',
  // Super Lig
  'corum belediyespor': 'corum fk',
  'erzurum bb': 'erzurumspor fk',
  // Ekstraklasa
  'rks radomiak 1910 sa radom': 'radomiak radom',
  // Liga I
  'cfr cluj': 'cfr 1907 cluj',
  // Czech 1st League
  'slavia prague': 'slavia praha',
  'sparta prague': 'sparta praha',
}
// NFD splits a letter into base + accent, which the DIACRITICS strip then
// removes -- but only for letters that HAVE a base. These do not: they are
// distinct letters, so NFD leaves them whole and the [^a-z0-9] pass turns them
// into spaces. That is how 'Kasimpasa' (with a dotless i) became 'kas mpasa'
// and 'Widzew Lodz' (with a stroked L) became 'widzew odz' -- neither matching
// anything. Map them by hand, before NFD.
const CLUB_LETTERS = { 'ı': 'i', 'ł': 'l', 'đ': 'd', 'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'ß': 'ss', 'þ': 'th', 'ð': 'd' }
const CLUB_LETTERS_RE = new RegExp('[' + Object.keys(CLUB_LETTERS).join('') + ']', 'g')

const CLUB_NOISE = /\b(fc|cf|afc|sc|ac|ss|us|rc|cd|ud|sd|club|calcio|as|rcd|be)\b/g
export function normClubName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(CLUB_LETTERS_RE, (c) => CLUB_LETTERS[c])
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/&/g, 'and')
    .replace(CLUB_NOISE, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Unified rosters store: World Cup national-team squads (wc2026-teams.json) and
 * club squads for every curated league (public/data/leagues/*.json). WC and club rosters are
 * kept in separate collections with separate name matchers; player details,
 * fantasy and selection state are shared. Exported as useRostersStore, with
 * useWorldCupTeamsStore kept as a back-compat alias (see CLAUDE.md branding note).
 */
export const useRostersStore = defineStore('rosters', () => {
  const teams       = ref([])
  const lastSync    = ref(null)
  const loaded      = ref(false)
  const loading     = ref(false)

  // ── Club league rosters ───────────────────────────────────────────────
  const clubTeams      = ref([])
  const clubByName     = ref(new Map())
  const clubLoaded     = ref(false)
  const clubLoading    = ref(false)

  const selectedTeam   = ref(null)
  const selectedPlayer = ref(null)

  // cache: playerId → extended detail object from API-Football
  const playerDetails = ref({})
  const playerDetailLoading = ref(false)
  // Extended profile: transfers / trophies / injury history, cached per player id.
  const playerProfiles = ref({})
  const playerProfileLoading = ref(false)

  // cache: playerId → aggregated fantasy stats from /football/livescore/fantasy
  const playerFantasy = ref({})
  const playerFantasyLoading = ref(false)

  const authStore = useAuthStore()
  const brandStore = useBrandStore()
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

  // lazy-load transfers / trophies / injury history (on modal open, after the
  // core details). Each source degrades independently — a failure just yields [].
  async function loadPlayerProfile(playerId) {
    if (playerProfiles.value[playerId]) return playerProfiles.value[playerId]
    playerProfileLoading.value = true
    try {
      const [transfers, trophies, sidelined] = await Promise.allSettled([
        fetchPlayerTransfers(playerId, creds.value),
        fetchPlayerTrophies(playerId, creds.value),
        fetchPlayerSidelined(playerId, creds.value),
      ])
      const val = (r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [])
      // /transfers nests under response[0].transfers; the others are flat lists.
      const transferRows = val(transfers)[0]?.transfers || []
      const profile = {
        transfers: transferRows,
        trophies: val(trophies),
        sidelined: val(sidelined),
      }
      playerProfiles.value[playerId] = profile
      return profile
    } finally {
      playerProfileLoading.value = false
    }
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

  // ── Club league rosters ─────────────────────────────────────────────────

  // Scoped to the active brand: Nationfoot has no reason to download Liga I,
  // and Goalplaza none to download Ekstraklasa. Shared tiers carry no `brand`
  // key, so they come back for every brand.
  const leagueSlugsToLoad = () =>
    CLUB_ROSTER_TIERS
      .flatMap((tier) => getCompetitionsByTier(tier, brandStore.activeBrand))
      .map((c) => LEAGUE_SLUGS[c.id])
      .filter(Boolean)

  async function loadLeagueRosters(season = currentSeason()) {
    if (clubLoaded.value || clubLoading.value) return
    clubLoading.value = true
    try {
      const slugs = [...new Set(leagueSlugsToLoad())]
      const results = await Promise.allSettled(
        slugs.map(async (slug) => {
          const res = await fetch(`/data/leagues/${slug}-${season}.json`)
          if (!res.ok) return null            // sync not run yet for this league
          return res.json()
        }),
      )
      const all = []
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value?.teams) continue
        for (const t of r.value.teams) all.push({ ...t, league: r.value.league })
      }
      clubTeams.value = all
      const idx = new Map()
      for (const t of all) {
        const key = normClubName(t.name)
        if (key && !idx.has(key)) idx.set(key, t)
      }
      clubByName.value = idx
      clubLoaded.value = true
    } catch (e) {
      console.warn('rosters: club load failed', e?.message)
    } finally {
      clubLoading.value = false
    }
  }

  // Resolve a live-score-api team (by name) to its api-football club squad.
  const getClubTeamById = (id) =>
    clubTeams.value.find((t) => String(t.id) === String(id)) || null

  function getClubTeamByName(name) {
    const raw = normClubName(name)
    if (!raw) return null
    const q = CLUB_ALIASES[raw] || raw
    const idx = clubByName.value
    if (idx.has(q)) return idx.get(q)
    for (const [key, team] of idx) {
      if (key.length >= 4 && (key.includes(q) || q.includes(key))) return team
    }
    return null
  }

  return {
    teams,
    lastSync,
    loaded,
    loading,
    clubTeams,
    clubLoaded,
    clubLoading,
    selectedTeam,
    selectedPlayer,
    playerDetails,
    playerDetailLoading,
    playerProfiles,
    playerProfileLoading,
    playerFantasy,
    playerFantasyLoading,
    teamsSorted,
    teamsByGroup,
    groupKeys,
    getTeamById,
    getTeamByLsaId,
    getTeamByName,
    totalPlayers,
    loadLeagueRosters,
    getClubTeamById,
    getClubTeamByName,
    loadTeams,
    loadPlayerDetails,
    loadPlayerProfile,
    loadPlayerFantasy,
    selectTeam,
    selectPlayer,
    clearSelection,
  }
})

// Back-compat alias — internal 'worldcup' naming is kept intentionally
// (see CLAUDE.md branding note). Both names return the same store.
export const useWorldCupTeamsStore = useRostersStore