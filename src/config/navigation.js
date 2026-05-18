/**
 * Phase 2 sections (Trivia, History, Live) — routes stay in the router;
 * set to true when ready to show in nav and home promos.
 */
export const PHASE2_NAV_ENABLED = false

export const VISIBLE_NAV_KEYS = ['home', 'games', 'videos']

export function filterVisibleNav(navItems = []) {
  if (PHASE2_NAV_ENABLED) return navItems
  return navItems.filter((item) => VISIBLE_NAV_KEYS.includes(item.key))
}
