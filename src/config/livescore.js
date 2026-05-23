/**
 * Live-score API (proxied via store_webapi).
 * Competition IDs: call GET /football/livescore/competitions once and fill LIVESCORE_COMPETITION_IDS.
 */

export const LIVESCORE_API = {
  live: '/football/livescore/live',
  fixtures: '/football/livescore/fixtures',
  events: '/football/livescore/events',
  standings: '/football/livescore/standings',
  history: '/football/livescore/history',
  competitions: '/football/livescore/competitions',
}

/** Poll intervals (ms). Use 60s on trial to stay under 1.500 req/day. */
export const LIVESCORE_POLL = {
  live: 60_000,
  hero: 60_000,
  events: 30_000,
}

export const LIVESCORE_TABS = ['live', 'fixtures', 'standings']

/**
 * Optional filter per brand + country (comma-separated IDs for API).
 * Leave empty to show all competitions returned by the API.
 */
export const LIVESCORE_COMPETITION_IDS = {
  football1: {
    UK: '',
    PL: '',
    SK: '',
  },
  football2: {
    UK: '',
    RO: '',
    CZ: '',
  },
}

/** Portal UI language → live-score-api `lang` param (ISO 639-1). */
export const LIVESCORE_LANG_MAP = {
  en: null,
  pl: 'pl',
  sk: 'sk',
  ro: 'ro',
  cz: 'cs',
}
