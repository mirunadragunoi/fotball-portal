import { getApiBaseUrl } from '@/config/api'
import { LIVESCORE_API } from '@/config/livescore'
import { ApiError, authParams } from '@/services/footballApi'
import { getLiveScoreLang } from '@/utils/liveScoreFormat'

function buildUrl(path, query = {}) {
  const base = getApiBaseUrl()
  const url = new URL(`${base}${path}`)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

async function apiRequest(path, creds = {}, extraQuery = {}) {
  const lang = getLiveScoreLang()
  const query = {
    ...authParams(creds.accessCode, creds.portalName),
    ...extraQuery,
  }
  if (lang) query.lang = lang

  const res = await fetch(buildUrl(path, query), {
    headers: { Accept: 'application/json' },
  })
  const text = await res.text()
  let payload = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { message: text }
  }

  if (!res.ok || payload?.success === false) {
    throw new ApiError(
      payload?.error || payload?.message || `Request failed (${res.status})`,
      payload,
      res.status,
    )
  }

  if (payload?.data !== undefined) return payload.data
  return payload
}

function asArray(data, ...keys) {
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key]
  }
  return []
}

// ─── Live ────────────────────────────────────────────────────────────────────

export async function fetchLiveMatches(creds, { competitionId, countryId, teamId } = {}) {
  const q = {}
  if (competitionId) q.competition_id = competitionId
  if (countryId) q.country_id = countryId
  if (teamId) q.team_id = teamId
  const data = await apiRequest(LIVESCORE_API.live, creds, q)
  return asArray(data, 'match', 'matches')
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

export async function fetchFixtures(creds, { competitionId, teamId, date, groupId } = {}) {
  const q = {}
  if (competitionId) q.competition_id = competitionId
  if (teamId) q.team_id = teamId
  if (date) q.date = date
  if (groupId) q.group_id = groupId
  const data = await apiRequest(LIVESCORE_API.fixtures, creds, q)
  return asArray(data, 'fixtures', 'fixture', 'match', 'matches')
}

// ─── Match detail ─────────────────────────────────────────────────────────────

export async function fetchMatchEvents(creds, matchId) {
  if (!matchId) return []
  const data = await apiRequest(LIVESCORE_API.events, creds, { match_id: matchId })
  return asArray(data, 'event', 'events')
}

export async function fetchMatchCommentary(creds, matchId, { fromSecond, toSecond } = {}) {
  if (!matchId) return []
  const q = { match_id: matchId }
  if (fromSecond != null) q.from_second = fromSecond
  if (toSecond != null) q.to_second = toSecond
  const data = await apiRequest(LIVESCORE_API.commentary, creds, q)
  return asArray(data, 'commentary', 'comments', 'comment')
}

// Order used to render the stat bars top-to-bottom. Anything not listed goes
// to the end. Both spellings of the buggy backend keys ("possesion"/"fauls")
// are included so a future backend fix doesn't break the order.
const STAT_ORDER = [
  'possesion', 'possession',
  'shots_on_target', 'shots_off_target', 'shots_blocked', 'attempts_on_goal',
  'saves',
  'corners', 'offsides',
  'free_kicks', 'goal_kicks', 'throw_ins',
  'fauls', 'fouls',
  'yellow_cards', 'red_cards', 'substitutions',
  'attacks', 'dangerous_attacks',
  'penalties', 'treatments',
]
const STAT_ORDER_IDX = new Map(STAT_ORDER.map((k, i) => [k, i]))

const STAT_LABEL_FIX = {
  possesion: 'Possession',  // backend typo
  fauls: 'Fouls',           // backend typo
}

function prettifyStat(key) {
  if (STAT_LABEL_FIX[key]) return STAT_LABEL_FIX[key]
  return String(key).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

export async function fetchMatchStatistics(creds, matchId) {
  if (!matchId) return []
  const data = await apiRequest(LIVESCORE_API.statistics, creds, { match_id: matchId })
  if (!data) return []
  // Some endpoints/versions return an array directly — preserve that path.
  if (Array.isArray(data)) return data
  if (Array.isArray(data.stats) || Array.isArray(data.statistics) || Array.isArray(data.stat)) {
    return asArray(data, 'statistics', 'stats', 'stat')
  }
  // Live-score-api flat shape: { yellow_cards: "1:1", possesion: "54:46", ... }.
  return Object.entries(data)
    .reduce((out, [key, value]) => {
      if (value == null || typeof value !== 'string' || !value.includes(':')) return out
      const [home, away] = value.split(':').map((s) => s.trim())
      if (home === '' || away === undefined) return out
      out.push({ type: prettifyStat(key), home, away, _rawKey: key })
      return out
    }, [])
    .sort((a, b) => {
      const ai = STAT_ORDER_IDX.has(a._rawKey) ? STAT_ORDER_IDX.get(a._rawKey) : 999
      const bi = STAT_ORDER_IDX.has(b._rawKey) ? STAT_ORDER_IDX.get(b._rawKey) : 999
      return ai - bi
    })
}

function normalizeLineupSide(side) {
  if (!side || typeof side !== 'object') return null
  const team = side.team || {}
  const players = Array.isArray(side.players) ? side.players : []
  const starting = []
  const substitutes = []
  for (const p of players) {
    // Live-score-api flag: "0" = starter, "1" = substitute.
    if (String(p.substitution) === '1') substitutes.push(p)
    else starting.push(p)
  }
  return {
    name: team.name || side.name || '',
    formation: side.formation || team.formation || '',
    starting,
    substitutes,
    team,
  }
}

export async function fetchMatchLineups(creds, matchId) {
  if (!matchId) return {}
  const data = await apiRequest(LIVESCORE_API.lineups, creds, { match_id: matchId })
  if (!data) return {}
  // Backend wraps as { lineup: { home: { team, players }, away: { team, players } } }.
  const lineup = data.lineup || data
  return {
    home: normalizeLineupSide(lineup?.home),
    away: normalizeLineupSide(lineup?.away),
  }
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function fetchMatchHistory(creds, { competitionId, teamId, from, to, page } = {}) {
  const q = {}
  if (competitionId) q.competition_id = competitionId
  if (teamId) q.team_id = teamId
  if (from) q.from = from
  if (to) q.to = to
  if (page) q.page = page
  const data = await apiRequest(LIVESCORE_API.history, creds, q)
  return asArray(data, 'match', 'matches', 'history')
}

// ─── Head to Head ─────────────────────────────────────────────────────────────

export async function fetchH2H(creds, team1Id, team2Id) {
  const data = await apiRequest(LIVESCORE_API.h2h, creds, {
    team1_id: team1Id,
    team2_id: team2Id,
  })
  return data || {}
}

// ─── Standings ───────────────────────────────────────────────────────────────

export async function fetchStandings(creds, competitionId, { seasonId, groupId } = {}) {
  if (!competitionId) return []
  const q = { competition_id: competitionId }
  if (seasonId) q.season_id = seasonId
  if (groupId) q.group_id = groupId
  const data = await apiRequest(LIVESCORE_API.standings, creds, q)
  return asArray(data, 'table', 'standings', 'teams')
}

export async function fetchLiveStandings(creds, competitionId, { groupId } = {}) {
  if (!competitionId) return []
  const q = { competition_id: competitionId }
  if (groupId) q.group_id = groupId
  const data = await apiRequest(LIVESCORE_API.standingsLive, creds, q)
  return asArray(data, 'table', 'standings', 'teams')
}

// ─── Competition data ─────────────────────────────────────────────────────────

export async function fetchGroups(creds, competitionId) {
  if (!competitionId) return []
  const data = await apiRequest(LIVESCORE_API.groups, creds, {
    competition_id: competitionId,
  })
  return asArray(data, 'groups', 'group')
}

export async function fetchGoalscorers(creds, competitionId) {
  if (!competitionId) return []
  const data = await apiRequest(LIVESCORE_API.goalscorers, creds, {
    competition_id: competitionId,
  })
  return asArray(data, 'scorers', 'goalscorers', 'players')
}

export async function fetchDisciplinary(creds, competitionId) {
  if (!competitionId) return []
  const data = await apiRequest(LIVESCORE_API.disciplinary, creds, {
    competition_id: competitionId,
  })
  return asArray(data, 'players', 'disciplinary')
}

export async function fetchSquad(creds, competitionId, teamId, season) {
  // Backend now REQUIRES season (e.g. 2024). Without it → 400.
  if (!competitionId || !teamId || !season) return []
  const data = await apiRequest(LIVESCORE_API.squad, creds, {
    competition_id: competitionId,
    team_id: teamId,
    season,
  })
  return asArray(data, 'participants', 'players', 'squad')
}

export async function fetchRosters(creds, competitionId, season) {
  // Backend now REQUIRES season. Without it → 400.
  if (!competitionId || !season) return {}
  const data = await apiRequest(LIVESCORE_API.rosters, creds, {
    competition_id: competitionId,
    season,
  })
  return data || {}
}

// ─── Competitions / Teams / Reference ────────────────────────────────────────

export async function fetchCompetitions(creds, { countryId, federationId } = {}) {
  const q = {}
  if (countryId) q.country_id = countryId
  if (federationId) q.federation_id = federationId
  const data = await apiRequest(LIVESCORE_API.competitions, creds, q)
  return asArray(data, 'competition', 'competitions')
}

export async function fetchTeams(creds, { countryId, competitionId, federationId } = {}) {
  const q = {}
  if (countryId) q.country_id = countryId
  if (competitionId) q.competition_id = competitionId
  if (federationId) q.federation_id = federationId
  const data = await apiRequest(LIVESCORE_API.teams, creds, q)
  return asArray(data, 'team', 'teams')
}

export async function fetchTeamLastMatches(creds, teamId, { number } = {}) {
  if (!teamId) return []
  const q = { team_id: teamId }
  if (number != null) q.number = number
  const data = await apiRequest(LIVESCORE_API.teamLastMatches, creds, q)
  return asArray(data, 'match', 'matches')
}

/**
 * Team event minutes — NEW signature (2026-06-07).
 * Old `team_id` is gone; backend now requires CSV `team_ids` + CSV `event_types`.
 * `teamIds` / `eventTypes` may be passed as arrays or already-joined strings.
 */
export async function fetchTeamEventMinutes(creds, { teamIds, eventTypes, number } = {}) {
  if (!teamIds || !eventTypes) return {}
  const q = {
    team_ids: Array.isArray(teamIds) ? teamIds.join(',') : teamIds,
    event_types: Array.isArray(eventTypes) ? eventTypes.join(',') : eventTypes,
  }
  if (number != null) q.number = number
  const data = await apiRequest(LIVESCORE_API.teamEventMinutes, creds, q)
  return data || {}
}

/**
 * Fantasy player statistics.
 * At least one of `competitionId` / `matchId` / `playerId` / `teamId` should be passed
 * to avoid pulling huge result sets. `opponentTeamId` only works combined with
 * `playerId` OR `teamId`.
 */
export async function fetchFantasy(creds, { competitionId, matchId, playerId, teamId, opponentTeamId } = {}) {
  const q = {}
  if (competitionId)    q.competition_id    = competitionId
  if (matchId)          q.match_id          = matchId
  if (playerId)         q.player_id         = playerId
  if (teamId)           q.team_id           = teamId
  if (opponentTeamId)   q.opponent_team_id  = opponentTeamId
  const data = await apiRequest(LIVESCORE_API.fantasy, creds, q)
  return asArray(data, 'matches', 'data', 'fantasy')
}

export async function fetchCountries(creds) {
  const data = await apiRequest(LIVESCORE_API.countries, creds)
  const list = asArray(data, 'country', 'countries')
  return list.filter((c) => c.is_real === 1 || c.is_real === true)
}

export async function fetchFlag(creds, teamId) {
  if (!teamId) return null
  const data = await apiRequest(LIVESCORE_API.flag, creds, { team_id: teamId })
  return data || null
}

export async function fetchFederations(creds) {
  const data = await apiRequest(LIVESCORE_API.federations, creds)
  return asArray(data, 'federation', 'federations')
}

export async function fetchSeasons(creds) {
  const data = await apiRequest(LIVESCORE_API.seasons, creds)
  return asArray(data, 'season', 'seasons')
}
