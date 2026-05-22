import { getApiBaseUrl } from '@/config/api'
import { HISTORY_API } from '@/config/history'
import { ApiError, authParams, getLanguage } from '@/services/footballApi'

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
  const query = {
    ...authParams(creds.accessCode, creds.portalName),
    language: creds.language || getLanguage(),
    ...extraQuery,
  }
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
  if (!res.ok) {
    throw new ApiError(
      payload?.error || payload?.message || `Request failed (${res.status})`,
      payload,
      res.status,
    )
  }
  return payload?.data !== undefined ? payload.data : payload
}

function asList(data) {
  if (Array.isArray(data)) return data
  if (data?.items && Array.isArray(data.items)) return data.items
  if (data?.results && Array.isArray(data.results)) return data.results
  return []
}

async function apiGetList(path, creds, extraQuery = {}) {
  const data = await apiRequest(path, creds, extraQuery)
  return asList(data)
}

export async function fetchHistoryTournaments(creds) {
  const list = await apiGetList(HISTORY_API.tournaments, creds)
  return [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
}

export async function fetchHistoryTeams(creds, { q = '' } = {}) {
  return apiGetList(HISTORY_API.teams, creds, { q })
}

export async function fetchHistoryMatches(
  creds,
  { tournamentId = '', stage = '', q = '' } = {},
) {
  return apiGetList(HISTORY_API.matches, creds, {
    tournament_id: tournamentId,
    stage,
    q,
  })
}

/** Returns page of players; supports { items, total } or plain array from backend. */
export async function fetchHistoryPlayers(creds, { q = '', page = 1, pageSize = 24 } = {}) {
  const data = await apiRequest(HISTORY_API.players, creds, {
    q,
    page,
    page_size: pageSize,
  })
  if (Array.isArray(data)) {
    return { items: data, total: data.length }
  }
  const items = asList(data)
  const total = data?.total ?? data?.count ?? items.length
  return { items, total }
}

export async function fetchHistorySquads(
  creds,
  { tournamentId = '', teamId = '' } = {},
) {
  return apiGetList(HISTORY_API.squads, creds, {
    tournament_id: tournamentId,
    team_id: teamId,
  })
}
