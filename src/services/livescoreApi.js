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

export async function fetchMatchCommentary(creds, matchId) {
  if (!matchId) return []
  const data = await apiRequest(LIVESCORE_API.commentary, creds, { match_id: matchId })
  return asArray(data, 'commentary', 'comments', 'comment')
}

export async function fetchMatchStatistics(creds, matchId) {
  if (!matchId) return []
  const data = await apiRequest(LIVESCORE_API.statistics, creds, { match_id: matchId })
  return asArray(data, 'statistics', 'stats', 'stat')
}

export async function fetchMatchLineups(creds, matchId) {
  if (!matchId) return {}
  const data = await apiRequest(LIVESCORE_API.lineups, creds, { match_id: matchId })
  return data || {}
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

export async function fetchSquad(creds, competitionId, teamId) {
  if (!competitionId || !teamId) return []
  const data = await apiRequest(LIVESCORE_API.squad, creds, {
    competition_id: competitionId,
    team_id: teamId,
  })
  return asArray(data, 'participants', 'players', 'squad')
}

export async function fetchRosters(creds, competitionId, season) {
  if (!competitionId) return {}
  const q = { competition_id: competitionId }
  if (season) q.season = season
  const data = await apiRequest(LIVESCORE_API.rosters, creds, q)
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

export async function fetchTeamLastMatches(creds, teamId) {
  if (!teamId) return []
  const data = await apiRequest(LIVESCORE_API.teamLastMatches, creds, { team_id: teamId })
  return asArray(data, 'match', 'matches')
}

export async function fetchTeamEventMinutes(creds, teamId) {
  if (!teamId) return {}
  const data = await apiRequest(LIVESCORE_API.teamEventMinutes, creds, { team_id: teamId })
  return data || {}
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
