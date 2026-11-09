/**
 * Country registry. Keys are ISO 3166-1 alpha-2 uppercase. The United Kingdom
 * is 'GB' (billing.country id 1 was renamed from the legacy 'UK' on 2026-11-09;
 * the backend matches on this code, so 'UK' no longer resolves).
 *
 * Language codes are lowercase ISO 639-1 except 'cz' which is the project's
 * historical code for Czech (ISO would be 'cs') — kept to match backend.
 */
export const COUNTRIES = {
  GB: { code: 'GB', defaultLanguage: 'en', languages: ['en', 'ro'] },
  RO: { code: 'RO', defaultLanguage: 'ro', languages: ['ro'] },
  CZ: { code: 'CZ', defaultLanguage: 'cz', languages: ['cz'] },
  SK: { code: 'SK', defaultLanguage: 'sk', languages: ['sk'] },
  PL: { code: 'PL', defaultLanguage: 'pl', languages: ['pl'] },
  FR: { code: 'FR', defaultLanguage: 'fr', languages: ['fr'] },
}

/**
 * Subdomain prefix → country code. 'www', empty (apex), 'gb' and the legacy
 * 'uk' all map to GB.
 */
const SUBDOMAIN_COUNTRY = {
  '':    'GB',
  www:   'GB',
  gb:    'GB',
  uk:    'GB',
  ro:    'RO',
  cz:    'CZ',
  sk:    'SK',
  pl:    'PL',
  fr:    'FR',
}

export function subdomainToCountry(subdomain) {
  const key = (subdomain || '').toLowerCase()
  return SUBDOMAIN_COUNTRY[key] || null
}

export function getCountryConfig(code) {
  return COUNTRIES[code] || null
}

export function isLanguageAvailable(countryCode, language) {
  const country = COUNTRIES[countryCode]
  if (!country) return false
  return country.languages.includes(language)
}
