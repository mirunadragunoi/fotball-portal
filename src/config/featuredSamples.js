/**
 * Static teaser content shown on the homepage Featured sections when the
 * visitor is NOT authenticated. The backend gates /football/products with
 * access_code, so anonymous users can't pull the live catalogue — this is
 * the fallback so the homepage doesn't look empty.
 *
 * Snapshot taken from Goalplaza on 2026-06-08 (still real, navigable IDs:
 * after login the user lands on the actual product page). When the
 * catalogue changes, refresh this list manually.
 */

const GAME_COLORS = ['#00C853', '#FF6F00', '#2979FF', '#7C4DFF']

export const SAMPLE_GAMES = [
  {
    id: '257',
    slug: 'football-io',
    title: 'Football.io',
    description: 'Addictive arcade game on the soccer field — collect yellow balls and avoid white ones.',
    thumbnail: 'https://media.rvdhub.com/games/Lny0fU9Vm_icon.png',
    platform: ['html5'],
    rating: 5,
    plays: '25',
    category: 'HTML5',
    color: GAME_COLORS[0],
    productType: 1,
  },
  {
    id: '1287',
    slug: 'football-champs',
    title: 'Football Champs',
    description: 'Perform precise kicks and score as many goals as possible.',
    thumbnail: 'https://media.dnaperf.com/gameshtml5/zy9ZSJGR/marketing/title/footballchamps-html5_480x480.png',
    platform: ['html5'],
    rating: 4.8,
    plays: '12',
    category: 'HTML5',
    color: GAME_COLORS[1],
    productType: 1,
  },
  {
    id: '1288',
    slug: 'football-brawl',
    title: 'Football Brawl',
    description: 'Fast-paced one-button football brawl.',
    thumbnail: 'https://media.dnaperf.com/gameshtml5/zjWF7iG3/marketing/title/footballbrawl-html5_480x480.png',
    platform: ['html5'],
    rating: 4.7,
    plays: '9',
    category: 'HTML5',
    color: GAME_COLORS[2],
    productType: 1,
  },
  {
    id: '350',
    slug: 'football-championship-2023',
    title: 'Football Championship',
    description: 'Choose a team, claim the trophies, finish the tournament.',
    thumbnail: 'https://media.rvdhub.com/applications/images/NOV4X3pTP_icon.png',
    platform: ['android'],
    rating: 4.6,
    plays: '32',
    category: 'Android',
    color: GAME_COLORS[3],
    productType: 2,
  },
]

const VIDEO_TONES = ['dark', 'pitch', 'warm', 'cool']

export const SAMPLE_VIDEOS = [
  {
    id: '1090',
    slug: 'amazing-penalty-saves',
    title: 'Amazing Penalty Saves',
    thumbnail: 'https://media.rvdhub.com/videos/images783/Amazing+Penalty+Saves.JPG',
    category: 'Highlights',
    duration: '',
    views: '12K',
    publishedAt: '',
    tone: VIDEO_TONES[0],
    productType: 5,
  },
  {
    id: '1091',
    slug: 'artist-defenders',
    title: 'Artist Defenders',
    thumbnail: 'https://media.rvdhub.com/videos/images783/Artist+Defenders.JPG',
    category: 'Skills',
    duration: '',
    views: '9K',
    publishedAt: '',
    tone: VIDEO_TONES[1],
    productType: 5,
  },
  {
    id: '1092',
    slug: 'awful-misses-premier-league',
    title: 'Awful Misses',
    thumbnail: 'https://media.rvdhub.com/videos/images783/Awful+Misses+Premier+League.JPG',
    category: 'Funny',
    duration: '',
    views: '8K',
    publishedAt: '',
    tone: VIDEO_TONES[2],
    productType: 5,
  },
  {
    id: '1093',
    slug: 'beautiful-moments-of-respect',
    title: 'Beautiful Moments Of Respect',
    thumbnail: 'https://media.rvdhub.com/videos/images783/Beautiful+Moments+Of+Respect.JPG',
    category: 'Classic',
    duration: '',
    views: '6K',
    publishedAt: '',
    tone: VIDEO_TONES[3],
    productType: 5,
  },
]
