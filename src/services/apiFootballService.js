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