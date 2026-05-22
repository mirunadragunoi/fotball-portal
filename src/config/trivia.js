/** Open Trivia DB — category 21 = Sports */
export const TRIVIA_CATEGORY_SPORTS = 21

export const TRIVIA_DEFAULT_AMOUNT = Number(import.meta.env.VITE_TRIVIA_AMOUNT) || 10

/**
 * Portal locale → Open Trivia DB `lang` param (ISO 639-1).
 * Project uses `cz`; OpenTDB expects `cs` for Czech.
 */
export const OPEN_TDB_LANG_MAP = {
  en: 'en',
  ro: 'ro',
  cz: 'cs',
  sk: 'sk',
  pl: 'pl',
}

export function localeToOpenTdbLang(locale) {
  const key = String(locale || 'en').toLowerCase()
  return OPEN_TDB_LANG_MAP[key] || key
}
