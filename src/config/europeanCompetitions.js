// src/config/europeanCompetitions.js
//
// Master reference for the European competitions the portal surfaces.
// IDs are confirmed against live-score-api.com (competitions/list.json).
// The live/history/standings service + stores are all parameterised by
// competition_id, so this file is the single source of truth for WHICH
// competitions we curate. It is static config — no API call needed.
//
// `seasonId` is the current season on live-score-api at the time of writing
// (domestic leagues → 2026/2027 = 57; UEFA club cups → 2025/2026 = 56).
// The World Cup keeps its own id (WC_2026_COMPETITION_ID = 362) in
// src/config/livescore.js and is intentionally NOT part of this map.

import { currentSeasonStartYear } from '@/utils/season'

// `apiFootballLeagueId` bridges each live-score-api competition to its
// API-Football league id (a different id namespace) so the competition/team/
// match surfaces can pull API-Football's richer data. The domestic + UEFA-cup
// ids below are the stable, well-known API-Football league ids. The two bonus
// one-offs are left null (enrichment gates off gracefully) — set them once
// verified via `/football/apifootball/leagues?search=`.
export const EUROPEAN_COMPETITIONS = {
  // ─── UEFA CLUB CUPS ───
  championsLeague:   { id: 244, name: 'Champions League',   country: null,          countryId: null, isCup: true,  isLeague: false, hasGroups: true,  tier: 'european-cup', seasonId: 56, apiFootballLeagueId: 2 },
  europaLeague:      { id: 245, name: 'Europa League',      country: null,          countryId: null, isCup: true,  isLeague: false, hasGroups: true,  tier: 'european-cup', seasonId: 56, apiFootballLeagueId: 3 },
  conferenceLeague:  { id: 446, name: 'Conference League',  country: null,          countryId: null, isCup: true,  isLeague: false, hasGroups: true,  tier: 'european-cup', seasonId: 56, apiFootballLeagueId: 848 },

  // ─── TOP 5 DOMESTIC LEAGUES ───
  premierLeague:     { id: 2,   name: 'Premier League',     country: 'England',     countryId: 19,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'top5',         seasonId: 57, apiFootballLeagueId: 39 },
  laLiga:            { id: 3,   name: 'La Liga',            country: 'Spain',       countryId: 43,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'top5',         seasonId: 57, apiFootballLeagueId: 140 },
  serieA:            { id: 4,   name: 'Serie A',            country: 'Italy',       countryId: 47,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'top5',         seasonId: 57, apiFootballLeagueId: 135 },
  bundesliga:        { id: 1,   name: 'Bundesliga',         country: 'Germany',     countryId: 1,   isCup: false, isLeague: true,  hasGroups: true,  tier: 'top5',         seasonId: 57, apiFootballLeagueId: 78 },
  ligue1:            { id: 5,   name: 'Ligue 1',            country: 'France',      countryId: 21,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'top5',         seasonId: 57, apiFootballLeagueId: 61 },

  // ─── SECONDARY EUROPEAN LEAGUES ───
  eredivisie:        { id: 196, name: 'Eredivisie',         country: 'Netherlands', countryId: 42,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'secondary',    seasonId: 57, apiFootballLeagueId: 88 },
  primeiraLiga:      { id: 8,   name: 'Primeira Liga',      country: 'Portugal',    countryId: 32,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'secondary',    seasonId: 57, apiFootballLeagueId: 94 },
  superLig:          { id: 6,   name: 'Süper Lig',          country: 'Turkey',      countryId: 48,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'secondary',    seasonId: 57, apiFootballLeagueId: 203 },

  // ─── LOCAL LEAGUES: NATIONFOOT (football1: UK, PL, SK, CZ) ───
  ekstraklasa:       { id: 60,  name: 'Ekstraklasa',        country: 'Poland',      countryId: 14,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'local',        seasonId: 57, brand: 'football1', apiFootballLeagueId: 106 },
  slovakSuperLeague: { id: 63,  name: 'Super League',       country: 'Slovakia',    countryId: 53,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'local',        seasonId: 57, brand: 'football1', apiFootballLeagueId: 332 },

  // ─── LOCAL LEAGUES: GOALPLAZA (football2: UK, RO, CZ, FR) ───
  // (the Czech 1st League is sold on both portals, hence the brand array)
  ligaI:             { id: 61,  name: 'Liga I',             country: 'Romania',     countryId: 36,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'local',        seasonId: 57, brand: 'football2', apiFootballLeagueId: 283 },
  czechFirstLeague:  { id: 72,  name: '1st League',         country: 'Czech Rep',   countryId: 11,  isCup: false, isLeague: true,  hasGroups: true,  tier: 'local',        seasonId: 57, brand: ['football1', 'football2'], apiFootballLeagueId: 345 },

  // ─── BONUS ───
  // TODO verify API-Football league ids (Super Cup ~531, Club World Cup ~15) — left null until confirmed.
  uefaSuperCup:      { id: 349, name: 'UEFA Super Cup',     country: null,          countryId: null, isCup: true,  isLeague: false, hasGroups: false, tier: 'bonus',        seasonId: 56, apiFootballLeagueId: null },
  clubWorldCup:      { id: 372, name: 'FIFA Club World Cup', country: null,         countryId: null, isCup: true,  isLeague: false, hasGroups: true,  tier: 'bonus',        seasonId: null, apiFootballLeagueId: null },
}

// Order in which tiers render on the Competitions hub.
export const COMPETITION_TIER_ORDER = ['european-cup', 'top5', 'secondary', 'local', 'bonus']

// Every curated competition id as a Set<number> — used by the live store to
// always keep curated matches visible even when the country-based Europe
// filter is on (UEFA cups have no European country id and would otherwise
// be dropped).
export const ALL_COMPETITION_ID_SET = new Set(
  Object.values(EUROPEAN_COMPETITIONS).map((c) => c.id),
)

// ─── HELPER GETTERS ───

// Get competitions for a specific brand (shared + brand-specific).
// `brand` on an entry is either omitted (shown on every brand), a single brand
// key, or an array of brand keys (a local league whose market both portals sell in).
export function getCompetitionsForBrand(brand) {
  return Object.values(EUROPEAN_COMPETITIONS).filter((c) => {
    if (!c.brand) return true
    return Array.isArray(c.brand) ? c.brand.includes(brand) : c.brand === brand
  })
}

// Get competitions filtered by tier (respecting brand scope when passed).
export function getCompetitionsByTier(tier, brand = null) {
  return getCompetitionsForBrand(brand).filter((c) => c.tier === tier)
}

// Find competition by numeric id.
export function getCompetitionById(id) {
  return Object.values(EUROPEAN_COMPETITIONS).find((c) => c.id === Number(id)) || null
}

// Map a live-score-api competition id → its API-Football league id (or null when
// unmapped / a bonus one-off). Used to gate + drive the API-Football enrichment
// on the competition and team pages.
export function getApiFootballLeagueId(competitionId) {
  const comp = getCompetitionById(competitionId)
  return comp?.apiFootballLeagueId ?? null
}

// API-Football season year for a competition, derived from today's date (e.g.
// 2026 for the 2026/2027 season). Season is the starting year in API-Football.
export function getApiFootballSeason(date = new Date()) {
  return currentSeasonStartYear(date)
}

// All ids as CSV for multi-competition live/fixtures calls (brand-scoped).
// The backend accepts a CSV competition_id on /live and /fixtures.
export function getCompetitionIdsCsv(brand = null) {
  return getCompetitionsForBrand(brand)
    .map((c) => c.id)
    .join(',')
}

// A "tournament" competition has a group phase + knockout bracket (UCL, UEL,
// UECL, Club World Cup) and gets the rich TournamentView. Pure leagues (and
// one-off finals like the Super Cup) use the simpler CompetitionDetailView.
export function isTournamentCompetition(comp) {
  return Boolean(comp && comp.isCup && comp.hasGroups)
}

// Router target for a competition object. Cup+groups -> TournamentView,
// everything else -> CompetitionDetail. Data-driven; no hardcoded id lists.
export function getCompetitionRoute(comp) {
  if (!comp) return { name: 'Competitions' }
  return isTournamentCompetition(comp)
    ? { name: 'TournamentView', params: { competitionId: comp.id } }
    : { name: 'CompetitionDetail', params: { competitionId: comp.id } }
}

// Router target resolved from a bare competition id (e.g. from a match row).
// Falls back to CompetitionDetail for uncurated ids; the World Cup (362) has
// its own dedicated /tournament page.
export function getCompetitionRouteById(id, { worldCupId } = {}) {
  if (worldCupId != null && String(id) === String(worldCupId)) {
    return { name: 'Tournament' }
  }
  const comp = getCompetitionById(id)
  if (comp) return getCompetitionRoute(comp)
  return { name: 'CompetitionDetail', params: { competitionId: id } }
}

// Backwards-compatible alias.
export function getAllCompetitionIds(brand = null) {
  return getCompetitionIdsCsv(brand)
}
