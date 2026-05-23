import { getLanguage } from '@/services/footballApi'
import { getBrandKey, getCountryKey } from '@/config/brand'
import { LIVESCORE_COMPETITION_IDS, LIVESCORE_LANG_MAP } from '@/config/livescore'

export function getLiveScoreLang() {
  const lang = getLanguage()
  return LIVESCORE_LANG_MAP[lang] ?? null
}

export function getCompetitionFilterForCountry() {
  const brand = getBrandKey()
  const country = getCountryKey()
  return LIVESCORE_COMPETITION_IDS[brand]?.[country] || ''
}

/** Parse API score string "2 - 1" into { home: 2, away: 1 }. */
export function parseScoreString(scoreStr) {
  if (!scoreStr || typeof scoreStr !== 'string') {
    return { home: null, away: null }
  }
  const parts = scoreStr.split(/\s*-\s*/)
  if (parts.length !== 2) return { home: null, away: null }
  const home = Number.parseInt(parts[0], 10)
  const away = Number.parseInt(parts[1], 10)
  return {
    home: Number.isNaN(home) ? null : home,
    away: Number.isNaN(away) ? null : away,
  }
}

export function matchMinuteLabel(match) {
  const time = match?.time
  if (!time) return ''
  if (['HT', 'FT', 'AET', 'AP'].includes(time)) return time
  return `${time}'`
}

export function isLiveStatus(status) {
  const s = (status || '').toUpperCase()
  return ['IN PLAY', 'HALF TIME BREAK', 'ADDED TIME'].includes(s)
}

export function isFinishedStatus(status) {
  return (status || '').toUpperCase() === 'FINISHED'
}

/** Map API match to hero widget row shape. */
export function toHeroMatchRow(match) {
  const { home, away } = parseScoreString(match?.scores?.score)
  return {
    id: match?.id,
    home: match?.home?.name || '—',
    away: match?.away?.name || '—',
    h: home ?? '–',
    a: away ?? '–',
    min: matchMinuteLabel(match),
    stage: match?.competition?.name || '',
    status: match?.status,
  }
}

const EVENT_TYPE_LABELS = {
  goal: 'Goal',
  yellowcard: 'Yellow card',
  redcard: 'Red card',
  subst: 'Substitution',
  penalty: 'Penalty',
  var: 'VAR',
}

/**
 * Short narrative line from a match event (trial-friendly alternative to paid commentary).
 */
export function formatEventNarrative(event, match) {
  const minute = event?.minute || event?.time || '?'
  const player = event?.player_name || event?.player || ''
  const team = event?.team_name || event?.team || ''
  const type = (event?.type || event?.event || '').toLowerCase()
  const label = EVENT_TYPE_LABELS[type] || event?.type || 'Event'
  const score = match?.scores?.score

  if (type === 'goal' && score) {
    return `${minute}' — ${label}! ${player}${team ? ` (${team})` : ''}. Score: ${score}.`
  }
  if (player) {
    return `${minute}' — ${label}: ${player}${team ? ` · ${team}` : ''}.`
  }
  return `${minute}' — ${label}${team ? ` · ${team}` : ''}.`
}
