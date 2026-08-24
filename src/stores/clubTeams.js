import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCompetitionsByTier } from '@/config/europeanCompetitions'

// Club squads (teams + players + photos) for the top-5 leagues, produced by the
// backend scripts/sync_club_squads.py into public/data/leagues/<slug>-<season>.json.
//
// live-score-api (used across live/standings/matches) and api-football (used for
// squads/photos) use DIFFERENT team ids, so we resolve a live-score-api team to
// its api-football squad by NAME — the same approach the World Cup flow uses.
// JSON files are optional: missing/incomplete syncs simply yield no club squad
// and callers fall back gracefully.

// Slugs mirror the sync script's LEAGUES keys (all top-5 tier).
const LEAGUE_SLUGS = {
  2:   'premier-league',
  3:   'la-liga',
  4:   'serie-a',
  1:   'bundesliga',
  5:   'ligue-1',
}

const DIACRITICS = /[̀-ͯ]/g
// Common club-name noise tokens that differ between the two providers.
const NOISE = /\b(fc|cf|afc|sc|ac|ss|us|rc|cd|ud|sd|club|calcio|as|rcd|be)\b/g

function normName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/&/g, 'and')
    .replace(NOISE, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export const useClubTeamsStore = defineStore('clubTeams', () => {
  const teams   = ref([])          // flat list across loaded leagues
  const byName  = ref(new Map())   // normName -> team
  const loaded  = ref(false)
  const loading = ref(false)

  const slugsToLoad = () =>
    getCompetitionsByTier('top5').map((c) => LEAGUE_SLUGS[c.id]).filter(Boolean)

  async function loadAll(season = '2026') {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      const slugs = [...new Set(slugsToLoad())]
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
        for (const t of r.value.teams) {
          all.push({ ...t, league: r.value.league })
        }
      }
      teams.value = all
      const idx = new Map()
      for (const t of all) {
        const key = normName(t.name)
        if (key && !idx.has(key)) idx.set(key, t)
      }
      byName.value = idx
      loaded.value = true
    } catch (e) {
      console.warn('clubTeams: load failed', e?.message)
    } finally {
      loading.value = false
    }
  }

  // Resolve a live-score-api team (by name) to its api-football club squad.
  function getTeamByName(name) {
    const q = normName(name)
    if (!q) return null
    const idx = byName.value
    if (idx.has(q)) return idx.get(q)
    // Tolerant fallback: one normalized name contains the other (e.g.
    // "wolves" vs "wolverhampton wanderers" won't match, but "inter" vs
    // "inter milan" will). Kept conservative to avoid false positives.
    for (const [key, team] of idx) {
      if (key.length >= 4 && (key.includes(q) || q.includes(key))) return team
    }
    return null
  }

  return { teams, loaded, loading, loadAll, getTeamByName }
})
