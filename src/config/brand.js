import football1 from './brands/football1'
import football2 from './brands/football2'
import { COUNTRIES, subdomainToCountry, getCountryConfig } from './countries'

const BRAND_MAP = {
  football1,
  football2,
}

const BRAND_KEYS = Object.keys(BRAND_MAP)

export function getBrandKey() {
  const modeBrand = (import.meta.env.MODE || '').toLowerCase()
  if (BRAND_MAP[modeBrand]) return modeBrand
  return 'football1'
}

export function getBrandConfig() {
  return BRAND_MAP[getBrandKey()]
}

export function getBrandConfigByKey(key) {
  return BRAND_MAP[key] || BRAND_MAP.football1
}

export { BRAND_MAP, BRAND_KEYS }

function detectSubdomain() {
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname
  if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return ''
  const parts = host.split('.')
  if (parts.length <= 2) return ''
  return parts[0]
}

function readQueryCountryOverride() {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    const raw = params.get('country')
    return raw ? raw.toUpperCase() : null
  } catch {
    return null
  }
}

/**
 * Resolve country for current request. Priority:
 *   1. ?country= URL param (dev/test override)
 *   2. subdomain prefix (cz./sk./www./apex)
 *   3. brand's first allowed country (fallback)
 *
 * Returns a country code that is ALWAYS in the brand's allow-list.
 */
export function getCountryKey() {
  const brand = getBrandConfig()
  const allowed = brand.countries || ['UK']

  const queryOverride = readQueryCountryOverride()
  if (queryOverride && allowed.includes(queryOverride) && COUNTRIES[queryOverride]) {
    return queryOverride
  }

  const fromSubdomain = subdomainToCountry(detectSubdomain())
  if (fromSubdomain && allowed.includes(fromSubdomain)) {
    return fromSubdomain
  }

  return allowed[0]
}

export function getCountry() {
  return getCountryConfig(getCountryKey())
}
