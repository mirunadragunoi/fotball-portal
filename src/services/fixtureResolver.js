// Fixture-id bridge: live-score-api match  →  API-Football fixture id.
//
// The two providers use different id namespaces, so the match center resolves
// the API-Football fixture id from the match object the frontend already holds
// (home/away names + competition + kickoff date), by league + date + team-name
// match. The mapping is cached (memory + sessionStorage) so it resolves once per
// match, not on every tab switch. A confidence guard (both team names match AND
// the date aligns within ±1 day) prevents ever showing the wrong match's data;
// when nothing matches we return null and the caller keeps the core scoreboard.

import { fetchApiFootballFixtures } from '@/services/apiFootballService'
import { getApiFootballLeagueId, getApiFootballSeason } from '@/config/europeanCompetitions'
import { teamNamesMatch } from '@/utils/teamName'

const CACHE_KEY = 'af_fixture_map'
const memo = new Map() // liveScoreMatchId -> fixtureId | null (null = resolved-but-none)

function loadPersisted() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      for (const [k, v] of Object.entries(JSON.parse(raw) || {})) memo.set(k, v)
    }
  } catch { /* ignore */ }
}
loadPersisted()

function persist() {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(memo)))
  } catch { /* ignore */ }
}

function matchIdOf(m) {
  return m?.id ?? m?.match_id ?? m?.fixture_id ?? null
}

function teamName(m, side) {
  const nested = m?.[side] || {}
  return nested.name || m?.[`${side}_name`] || ''
}

// Extract a YYYY-MM-DD date from the various shapes live-score-api / our carried
// match objects use.
function matchDate(m) {
  const raw = m?.date || m?.match_date || m?.scheduled || m?.datetime || m?.kickoff
  if (!raw) return null
  const s = String(raw)
  const iso = s.match(/\d{4}-\d{2}-\d{2}/)
  if (iso) return iso[0]
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function shiftDate(ymd, days) {
  const d = new Date(ymd + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// Find the fixture in a response list whose home+away names both match ours.
function pickFixture(list, home, away) {
  for (const item of list || []) {
    const h = item?.teams?.home?.name
    const a = item?.teams?.away?.name
    if (teamNamesMatch(h, home) && teamNamesMatch(a, away)) return item
    // Providers occasionally flip home/away — accept the swapped orientation too.
    if (teamNamesMatch(h, away) && teamNamesMatch(a, home)) return item
  }
  return null
}

/**
 * Resolve the API-Football fixture id for a live-score-api match.
 * Returns the fixture id (number) or null when it can't be resolved confidently.
 */
export async function resolveFixtureId(match, creds = {}) {
  const lsId = matchIdOf(match)
  if (lsId == null) return null
  const cacheKey = String(lsId)
  if (memo.has(cacheKey)) return memo.get(cacheKey)

  const leagueId = getApiFootballLeagueId(match?.competition?.id ?? match?.competition_id)
  const home = teamName(match, 'home')
  const away = teamName(match, 'away')
  const date = matchDate(match)

  // Need a league mapping, both team names, and a date to match confidently.
  if (!leagueId || !home || !away || !date) {
    memo.set(cacheKey, null)
    return null
  }

  const season = getApiFootballSeason()
  const dates = [date, shiftDate(date, -1), shiftDate(date, 1)]
  try {
    for (const d of dates) {
      const list = await fetchApiFootballFixtures(
        { league: leagueId, season, date: d }, creds,
      )
      const found = pickFixture(list, home, away)
      if (found?.fixture?.id) {
        memo.set(cacheKey, found.fixture.id)
        persist()
        return found.fixture.id
      }
    }
  } catch {
    // Network / API error — don't cache a null (allow a later retry).
    return null
  }

  memo.set(cacheKey, null)
  persist()
  return null
}
