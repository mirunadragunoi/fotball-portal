export default {
  name: 'football1',
  displayName: 'Pitchside',
  tagline: 'The home of football games, highlights and the matchday rituals.',

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
    { key: 'home',    label: 'Home',    path: '/' },
    { key: 'games',   label: 'Games',   path: '/games' },
    { key: 'videos',  label: 'Videos',  path: '/videos' },
    { key: 'trivia',  label: 'Trivia',  path: '/trivia',  comingSoon: true },
    { key: 'history', label: 'History', path: '/history', comingSoon: true },
    { key: 'live',    label: 'Live',    path: '/live',    comingSoon: true },
  ],

  hero: {
    eyebrow: "Tournament 2026 · 28 days to kickoff",
    headline: ['Matchday', 'starts here.'],
    headlineAccent: 'starts',
    body: "Play the world's best football mini-games, watch the goals that broke the internet, and live every fixture from kickoff to final whistle.",
    ctaPrimary: 'Play now',
    ctaSecondary: 'Watch highlights',
  },

  features: {
    liveScores: true,
    leaderboard: true,
    searchBar: true,
  },

  footer: {
    tagline: "The home of football games, highlights and the matchday rituals you can't watch a game without.",
    columns: [
      { heading: 'Play',    links: ['Games', 'Trivia', 'Daily challenge', 'Leaderboards'] },
      { heading: 'Watch',   links: ['Highlights', 'Skills', 'Classic moments', 'Tactics'] },
      { heading: 'Explore', links: ['History', 'Records', 'Stadiums', 'Players'] },
      { heading: 'About',   links: ['Press', 'Careers', 'Contact', 'Legal'] },
    ],
    copyright: '© 2026 Pitchside. Generic football content — not affiliated with any official competition.',
  },
}
