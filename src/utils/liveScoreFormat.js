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

// ─── Match kickoff in visitor's country timezone ────────────────────────────
// live-score-api returns date/time as UTC. We render in the timezone of the
// subdomain country (ro.goalplaza.com → Europe/Bucharest, etc.).

const COUNTRY_TZ = {
  UK: 'Europe/London',
  RO: 'Europe/Bucharest',
  CZ: 'Europe/Prague',
  SK: 'Europe/Bratislava',
  PL: 'Europe/Warsaw',
  FR: 'Europe/Paris',
}

const LOCALE_BCP47 = { en: 'en-GB', ro: 'ro-RO', cz: 'cs-CZ', sk: 'sk-SK', pl: 'pl-PL', fr: 'fr-FR' }

export function getCountryTimezone() {
  return COUNTRY_TZ[getCountryKey()] || 'UTC'
}

/**
 * Format a match kickoff in the visitor's country timezone.
 * Input:  dateStr "YYYY-MM-DD"  (required) + optional timeStr "HH:MM" or "HH:MM:SS"
 *         assumed UTC; pass {locale} to localize the day/month name.
 * Output: { date: "10 Jun", time: "12:30", dateTime: "10 Jun · 12:30" } (or '' if invalid)
 */
export function formatKickoff(dateStr, timeStr, { locale } = {}) {
  if (!dateStr) return { date: '', time: '', dateTime: '' }

  let timeNorm = ''
  if (timeStr && /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(timeStr))) {
    const t = String(timeStr)
    timeNorm = t.length === 5 ? `${t}:00` : t
  }
  const iso = timeNorm ? `${dateStr}T${timeNorm}Z` : `${dateStr}T00:00:00Z`
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '', dateTime: '' }

  const tz = getCountryTimezone()
  const bcp = LOCALE_BCP47[String(locale || 'en').toLowerCase()] || 'en-GB'

  const dateOut = new Intl.DateTimeFormat(bcp, {
    timeZone: tz, day: 'numeric', month: 'short',
  }).format(d)
  if (!timeNorm) return { date: dateOut, time: '', dateTime: dateOut }

  const timeOut = new Intl.DateTimeFormat(bcp, {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
  return { date: dateOut, time: timeOut, dateTime: `${dateOut} · ${timeOut}` }
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
  // Scheduled kickoff — convert UTC clock to the visitor's country timezone
  // when we have the date; otherwise fall back to the raw HH:MM(:SS) string.
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(String(time))) {
    const date = match?.date || match?.match_date
    if (date) {
      const { time: localTime } = formatKickoff(date, time)
      if (localTime) return localTime
    }
    return String(time).slice(0, 5)
  }
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
