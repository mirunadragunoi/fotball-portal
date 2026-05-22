/**
 * Phase 2 — enable sections individually in nav.
 */
export const PHASE2_FEATURES = {
  trivia: true,
  history: false,
  live: false,
}

/** Show live scores widget on home hero (only when Live section is ready). */
export const PHASE2_LIVE_HERO_ENABLED = PHASE2_FEATURES.live

export const PHASE2_NAV_ENABLED = Object.values(PHASE2_FEATURES).some(Boolean)

const BASE_NAV_KEYS = ['home', 'games', 'videos']

export function getVisibleNavKeys() {
  const keys = [...BASE_NAV_KEYS]
  if (PHASE2_FEATURES.trivia) keys.push('trivia')
  if (PHASE2_FEATURES.history) keys.push('history')
  if (PHASE2_FEATURES.live) keys.push('live')
  return keys
}

export function filterVisibleNav(navItems = []) {
  const allowed = new Set(getVisibleNavKeys())
  return navItems.filter((item) => allowed.has(item.key) && !item.comingSoon)
}
