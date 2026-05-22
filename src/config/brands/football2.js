export default {
  key: 'football2',
  name: 'Goal Plaza',
  displayName: 'Goal Plaza',
  tagline: 'Football, but make it fun.',
  countries: ['UK', 'RO', 'CZ'],
  storagePrefix: 'football2',
  featureFlags: {
    brandedOverrides: true,
    liveScores: false,
    leaderboard: true,
    searchBar: true,
  },

  colors: {
    primary: '#00C853',
    primaryDk: '#00A847',
    blue: '#2979FF',
    blueDk: '#1565C0',
    bg: '#F4F5F8',
    bgSoft: '#EDEEF2',
    surface: '#FFFFFF',
    text: '#10112A',
    textSecondary: '#5F6577',
    accent: '#FFC400',
    red: '#FF1744',
    yellow: '#FFC400',
  },

  fonts: {
    heading: "'Poppins', 'Nunito', 'Inter', sans-serif",
    body: "'Inter', system-ui, sans-serif",
  },

  nav: [
    { key: 'home', label: 'Home', path: '/' },
    { key: 'games', label: 'Games', path: '/games' },
    { key: 'videos', label: 'Videos', path: '/videos' },
    { key: 'trivia', label: 'Trivia', path: '/trivia' },
    { key: 'history', label: 'History', path: '/history' },
    { key: 'live', label: 'Live', path: '/live', comingSoon: true },
  ],

  hero: {
    eyebrow: "Tournament '26 · 28 days",
    headline: ['Game on,', 'every day.'],
    headlineAccent: 'every day.',
    body: "Score goals in the lobby. Watch the matchday's wildest moments. Settle the debates in trivia. All in one app.",
    ctaPrimary: 'Start playing',
    ctaSecondary: 'How it works',
    stats: [
      { value: '2.4M', label: 'daily players' },
      { value: '124', label: 'games' },
      { value: '4.8★', label: 'app rating' },
    ],
  },

  footer: {
    tagline: 'Football, but make it fun. Games, highlights, trivia and the matchday energy you scroll for.',
    columns: [
      { heading: 'Play', links: ['Games', 'Trivia', 'Daily challenge', 'Leaderboards'] },
      { heading: 'Watch', links: ['Highlights', 'Skills', 'Funny', 'Classic'] },
      { heading: 'About', links: ["Tournament '26", 'History', 'Records', 'Players'] },
      { heading: 'Company', links: ['Press', 'Careers', 'Contact', 'Legal'] },
    ],
    copyright: '© 2026 Goal Plaza — generic football, no official affiliations.',
  },
}