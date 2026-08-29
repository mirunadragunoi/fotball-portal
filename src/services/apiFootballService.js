import { getApiBaseUrl } from '@/config/api'
import { ApiError, authParams } from '@/services/footballApi'

function buildUrl(path, query = {}) {
  const base = getApiBaseUrl()
  const url  = new URL(`${base}${path}`)
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })
  return url.toString()
}

async function apiGet(path, creds = {}, extraQuery = {}) {
  const query = { ...authParams(creds.accessCode, creds.portalName), ...extraQuery }
  const res   = await fetch(buildUrl(path, query), { headers: { Accept: 'application/json' } })
  const text  = await res.text()
  let payload = {}
  try { payload = text ? JSON.parse(text) : {} } catch { payload = { message: text } }

  if (!res.ok || payload?.success === false) {
    throw new ApiError(
      payload?.error || payload?.message || `Request failed (${res.status})`,
      payload,
      res.status,
    )
  }
  return payload
}

/**
 * On-demand: extended player profile + club stats.
 * Called only when the user opens the player detail modal.
 * Response is the raw API-Football /players endpoint JSON (cached 24h by backend).
 *
 * Returns the first item in response[] or null.
 */
export async function fetchPlayerDetails(playerId, creds = {}, season) {
  const extra = season ? { season } : {}
  const data  = await apiGet(`/football/apifootball/players/${playerId}`, creds, extra)
  const response = data?.response || []
  return response[0] || null
}

/**
 * Pre-download all WC teams (used by sync script flow, not normally by frontend).
 * Frontend uses the static JSON instead.
 */
export async function fetchWcTeams(creds = {}) {
  const data = await apiGet('/football/apifootball/teams', creds)
  return data?.response || []
}

/**
 * Squad for one team (used by sync script flow).
 */
export async function fetchSquad(teamId, creds = {}) {
  const data = await apiGet(`/football/apifootball/squads/${teamId}`, creds)
  const response = data?.response || []
  return response[0]?.players || []
}

// ─── Match-center & league data (API-Football proxy, Phase 1/2) ───────────────
// Every function proxies through the backend (key injected server-side) and
// returns the api-football `response` array, unless noted. Errors bubble up as
// ApiError; callers decide how to degrade.

async function apiResponse(path, creds = {}, query = {}) {
  const data = await apiGet(path, creds, query)
  return data?.response || []
}

/**
 * Normalized single fixture for the match-detail page (Phase 0 contract).
 * Returns { id, status, minute, kickoff, competition, home, away, score } or null.
 */
export async function fetchApiFootballFixture(fixtureId, creds = {}) {
  const data = await apiGet(`/football/apifootball/fixture/${fixtureId}`, creds)
  return data?.data || null
}

export function fetchApiFootballFixtures(params = {}, creds = {}) {
  return apiResponse('/football/apifootball/fixtures', creds, params)
}

export function fetchFixtureEvents(fixtureId, creds = {}) {
  return apiResponse(`/football/apifootball/fixtures/${fixtureId}/events`, creds)
}

export function fetchFixtureStatistics(fixtureId, creds = {}) {
  return apiResponse(`/football/apifootball/fixtures/${fixtureId}/statistics`, creds)
}

export function fetchFixtureLineups(fixtureId, creds = {}) {
  return apiResponse(`/football/apifootball/fixtures/${fixtureId}/lineups`, creds)
}

export function fetchFixturePlayers(fixtureId, creds = {}) {
  return apiResponse(`/football/apifootball/fixtures/${fixtureId}/players`, creds)
}

export function fetchApiFootballH2H(h2h, { last, league, season } = {}, creds = {}) {
  return apiResponse('/football/apifootball/fixtures/headtohead', creds,
    { h2h, last, league, season })
}

export function fetchApiFootballStandings(league, season, creds = {}) {
  return apiResponse('/football/apifootball/standings', creds, { league, season })
}

export function fetchTeamStatistics(teamId, league, season, creds = {}) {
  return apiResponse('/football/apifootball/teams/' + teamId + '/statistics', creds,
    { league, season })
}

export function fetchTopScorers(league, season, creds = {}) {
  return apiResponse('/football/apifootball/topscorers', creds, { league, season })
}

export function fetchTopAssists(league, season, creds = {}) {
  return apiResponse('/football/apifootball/topassists', creds, { league, season })
}

export function fetchTopYellowCards(league, season, creds = {}) {
  return apiResponse('/football/apifootball/topcards/yellow', creds, { league, season })
}

export function fetchTopRedCards(league, season, creds = {}) {
  return apiResponse('/football/apifootball/topcards/red', creds, { league, season })
}

export function fetchInjuries(params = {}, creds = {}) {
  return apiResponse('/football/apifootball/injuries', creds, params)
}

export function fetchPlayerTransfers(playerId, creds = {}) {
  return apiResponse(`/football/apifootball/players/${playerId}/transfers`, creds)
}

export function fetchPlayerTrophies(playerId, creds = {}) {
  return apiResponse(`/football/apifootball/players/${playerId}/trophies`, creds)
}

export function fetchPlayerSidelined(playerId, creds = {}) {
  return apiResponse(`/football/apifootball/players/${playerId}/sidelined`, creds)
}

/**
 * Prediction for an upcoming fixture. Returns response[0] or null.
 */
export async function fetchPrediction(fixtureId, creds = {}) {
  const list = await apiResponse(`/football/apifootball/predictions/${fixtureId}`, creds)
  return list[0] || null
}

export function fetchLeagues(params = {}, creds = {}) {
  return apiResponse('/football/apifootball/leagues', creds, params)
}

/**
 * Coverage flags for one league-season (from /leagues). Returns the season's
 * `coverage` object (predictions/injuries/odds/…) or null — use it to gate
 * per-competition features before calling downstream endpoints.
 */
export async function fetchLeagueCoverage(leagueId, season, creds = {}) {
  const list = await fetchLeagues({ id: leagueId, season }, creds)
  const seasons = list[0]?.seasons || []
  const match = seasons.find((s) => String(s.year) === String(season)) || seasons[0]
  return match?.coverage || null
}