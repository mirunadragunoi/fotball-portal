/**
 * Relative time string ("just now", "5m ago", "Yesterday") or an absolute
 * date for older entries, all localized via the i18n `t` function.
 *
 * Callers pass `{ t, locale }` from their component's `useI18n()`. If `t`
 * isn't provided, English fallbacks are used so callers can opt out.
 */

const LOCALE_BCP47 = {
  en: 'en-GB',
  ro: 'ro-RO',
  cz: 'cs-CZ',
  sk: 'sk-SK',
  pl: 'pl-PL',
}

const EN_FALLBACK = {
  'time.justNow':    () => 'Just now',
  'time.minutesAgo': (p) => `${p?.n}m ago`,
  'time.hoursAgo':   (p) => `${p?.n}h ago`,
  'time.yesterday':  () => 'Yesterday',
}

function fallback(key, params) {
  const f = EN_FALLBACK[key]
  return f ? f(params) : ''
}

export function timeAgo(dateString, { t, locale } = {}) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  if (isNaN(date)) return ''
  const seconds = Math.floor((now - date) / 1000)

  const tx = typeof t === 'function' ? t : fallback

  if (seconds < 60)     return tx('time.justNow')
  if (seconds < 3600)   return tx('time.minutesAgo', { n: Math.floor(seconds / 60) })
  if (seconds < 86400)  return tx('time.hoursAgo',   { n: Math.floor(seconds / 3600) })
  if (seconds < 172800) return tx('time.yesterday')

  const bcp47 = LOCALE_BCP47[String(locale || 'en').toLowerCase()] || 'en-GB'
  return date.toLocaleDateString(bcp47, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
