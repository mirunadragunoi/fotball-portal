export const LIVESCORE_API = {
  live:             '/football/livescore/live',
  fixtures:         '/football/livescore/fixtures',
  events:           '/football/livescore/events',
  commentary:       '/football/livescore/commentary',
  statistics:       '/football/livescore/statistics',
  lineups:          '/football/livescore/lineups',
  history:          '/football/livescore/history',
  h2h:              '/football/livescore/h2h',
  standings:        '/football/livescore/standings',
  standingsLive:    '/football/livescore/standings-live',
  groups:           '/football/livescore/groups',
  goalscorers:      '/football/livescore/goalscorers',
  disciplinary:     '/football/livescore/disciplinary',
  squad:            '/football/livescore/squad',
  rosters:          '/football/livescore/rosters',
  competitions:     '/football/livescore/competitions',
  teams:            '/football/livescore/teams',
  teamLastMatches:  '/football/livescore/team-last-matches',
  teamEventMinutes: '/football/livescore/team-event-minutes',
  countries:        '/football/livescore/countries',
  flag:             '/football/livescore/flag',
  federations:      '/football/livescore/federations',
  seasons:          '/football/livescore/seasons',
  verify:           '/football/livescore/verify',
}

export const LIVESCORE_POLL = {
  live:          30_000,
  hero:          60_000,
  detail:        15_000,
  liveStandings: 30_000,
}

export const LIVESCORE_TABS = ['live', 'fixtures', 'standings']

export const LIVESCORE_COMPETITION_IDS = {
  football1: { UK: '', PL: '', SK: '' },
  football2: { UK: '', RO: '', CZ: '' },
}

export const LIVESCORE_LANG_MAP = {
  en: null, pl: 'pl', sk: 'sk', ro: 'ro', cz: 'cs',
}

export const WC_2026_COMPETITION_ID = 362
export const CHAMPIONSHIP_2026_COMPETITION_ID = 0

export const WC_2026_GROUPS = {
  A: 4286, B: 4287, C: 4288, D: 4289,
  E: 4290, F: 4291, G: 4292, H: 4293,
  I: 4297, J: 4296, K: 4295, L: 4294,
}
