/**
 * Backend base URL — set in .env.football1 / .env.football2 (no trailing slash).
 */
export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv != null) {
    const trimmed = String(fromEnv).trim()
    return trimmed ? trimmed.replace(/\/$/, '') : ''
  }
  return ''
}

/** Portal name for API — fixed per build via VITE_PORTAL_NAME. */
export function getPortalName() {
  const fromEnv = import.meta.env.VITE_PORTAL_NAME
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim()
  return ''
}

/**
 * store.product.type — override in .env.football* if DB values differ.
 * 1 = HTML5 games, 2 = Android games, 5 = videos (MP3).
 */
export const PRODUCT_TYPES = {
  html: Number(import.meta.env.VITE_PRODUCT_TYPE_HTML) || 1,
  android: Number(import.meta.env.VITE_PRODUCT_TYPE_ANDROID) || 2,
  video: Number(import.meta.env.VITE_PRODUCT_TYPE_VIDEO) || 5,
}

/** All product types shown on the Games page. */
export const GAME_PRODUCT_TYPES = [PRODUCT_TYPES.html, PRODUCT_TYPES.android]

export function platformFromProductType(type) {
  const n = Number(type)
  if (n === PRODUCT_TYPES.android) return 'android'
  if (n === PRODUCT_TYPES.html) return 'html5'
  return null
}

export function isGameProductType(type) {
  const n = Number(type)
  return n === PRODUCT_TYPES.html || n === PRODUCT_TYPES.android
}

export function isVideoProductType(type) {
  return Number(type) === PRODUCT_TYPES.video
}
