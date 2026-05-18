/**
 * Country registry. Keys are ISO 3166-1 alpha-2 uppercase EXCEPT 'UK' which is
 * kept legacy (ISO would be 'GB') because the backend uses 'UK' historically.
 *
 * Language codes are lowercase ISO 639-1 except 'cz' which is the project's
 * historical code for Czech (ISO would be 'cs') — kept to match backend.
 */
export const COUNTRIES = {
  UK: { code: 'UK', defaultLanguage: 'en', languages: ['en', 'ro'] },
  CZ: { code: 'CZ', defaultLanguage: 'cz', languages: ['cz'] },
  SK: { code: 'SK', defaultLanguage: 'sk', languages: ['sk'] },
}

/**
 * Subdomain prefix → country code. 'www' and empty (apex) both map to UK.
 */
const SUBDOMAIN_COUNTRY = {
  '': 'UK',
  www: 'UK',
  cz: 'CZ',
  sk: 'SK',
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
