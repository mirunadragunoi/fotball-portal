export default {
  key: 'football1',
  name: 'Nation Foot',
  displayName: 'Nation Foot',
  tagline: 'The home of football games, highlights and the matchday rituals.',
  countries: ['UK', 'SK', 'PL'],
  storagePrefix: 'football1',
  featureFlags: {
    brandedOverrides: true,
    liveScores: true,
    leaderboard: true,
    searchBar: true,
  },

  colors: {
    primary: '#1B5E20',
    secondary: '#FF6F00',
    bg: '#0D1117',
    surface: '#161B22',
    surface2: '#1C2129',
    text: '#E6EDF3',
    textSecondary: '#8B949E',
    accent: '#FFD600',
    red: '#E53935',
  },

  fonts: {
    heading: "'Oswald', 'Arial Black', sans-serif",
    body: "'Inter', 'Roboto', system-ui, sans-serif",
  },

  nav: [
    { key: 'home', label: 'Home', path: '/' },
    { key: 'games', label: 'Games', path: '/games' },
    { key: 'videos', label: 'Videos', path: '/videos' },
    { key: 'trivia', label: 'Trivia', path: '/trivia' },
    { key: 'history', label: 'History', path: '/history', comingSoon: true },
    { key: 'live', label: 'Live', path: '/live', comingSoon: true },
  ],

  hero: {
    eyebrow: 'Tournament 2026 · 28 days to kickoff',
    headline: ['Matchday', 'starts here.'],
    headlineAccent: 'starts',
    body: "Play the world's best football mini-games, watch the goals that broke the internet, and live every fixture from kickoff to final whistle.",
    ctaPrimary: 'Play now',
    ctaSecondary: 'Watch highlights',
  },

  footer: {
    tagline:
      "The home of football games, highlights and the matchday rituals you can't watch a game without.",
    columns: [
      { heading: 'Play', links: ['Games', 'Trivia', 'Daily challenge', 'Leaderboards'] },
      { heading: 'Watch', links: ['Highlights', 'Skills', 'Classic moments', 'Tactics'] },
      { heading: 'Explore', links: ['History', 'Records', 'Stadiums', 'Players'] },
      { heading: 'About', links: ['Press', 'Careers', 'Contact', 'Legal'] },
    ],
    copyright:
      '© 2026 Nation Foot. Generic football content — not affiliated with any official competition.',
  },
}