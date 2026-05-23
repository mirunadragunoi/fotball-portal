import { getApiBaseUrl } from '@/config/api'
import { LIVESCORE_API } from '@/config/livescore'
import { ApiError, authParams, getLanguage } from '@/services/footballApi'
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

export async function fetchLiveMatches(creds, { competitionId, countryId } = {}) {
  const query = {}
  if (competitionId) query.competition_id = competitionId
  if (countryId) query.country_id = countryId
  const data = await apiRequest(LIVESCORE_API.live, creds, query)
  return asArray(data, 'match', 'matches')
}

export async function fetchFixtures(creds, { competitionId, date } = {}) {
  const query = {}
  if (competitionId) query.competition_id = competitionId
  if (date) query.date = date
  const data = await apiRequest(LIVESCORE_API.fixtures, creds, query)
  return asArray(data, 'fixtures', 'fixture', 'match', 'matches')
}

export async function fetchMatchEvents(creds, matchId) {
  if (!matchId) return []
  const data = await apiRequest(LIVESCORE_API.events, creds, { match_id: matchId })
  return asArray(data, 'event', 'events')
}

export async function fetchStandings(creds, competitionId) {
  if (!competitionId) return []
  const data = await apiRequest(LIVESCORE_API.standings, creds, {
    competition_id: competitionId,
  })
  return asArray(data, 'table', 'standings', 'teams')
}

export async function fetchMatchHistory(
  creds,
  { competitionId, teamId, from, to } = {},
) {
  const query = {}
  if (competitionId) query.competition_id = competitionId
  if (teamId) query.team_id = teamId
  if (from) query.from = from
  if (to) query.to = to
  const data = await apiRequest(LIVESCORE_API.history, creds, query)
  return asArray(data, 'match', 'matches', 'history')
}

export async function fetchCompetitions(creds) {
  const data = await apiRequest(LIVESCORE_API.competitions, creds)
  return asArray(data, 'competition', 'competitions')
}

