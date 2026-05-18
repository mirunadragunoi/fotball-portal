const BASE = '/images/landing'

/** Odd slots → football1, even slots → football2 (alternate across portals) */
const FILES = Array.from({ length: 19 }, (_, i) => `${BASE}/landing-${String(i + 1).padStart(2, '0')}.png`)

const f1 = (n) => FILES[n - 1]
const f2 = (n) => FILES[n - 1]

export const LANDING_IMAGES = {
  football1: {
    hero: f1(14),
    heroAlt: 'Football stadium at night with floodlights and matchday atmosphere',
    editorial: f1(17),
    editorialAlt: 'Crowded stadium celebration with lights and pyrotechnics',
    trophyBg: null,
    gallery: [
      { src: f1(18), alt: 'Fans celebrating in a packed football stadium' },
      { src: f1(5), alt: 'Supporters watching a live football match' },
      { src: f1(19), alt: 'Wide view of a crowded football stadium' },
    ],
  },
  football2: {
    hero: f2(3),
    heroAlt: 'Football player dribbling on the pitch during a match',
    editorial: f2(10),
    editorialAlt: 'Football on the pitch inside a large stadium on a sunny day',
    trophyBg: f2(6),
    trophyAlt: 'Fans filming a live football match on their phones in the stadium',
    gallery: [
      { src: f2(1), alt: 'Close-up of a football kick on green grass' },
      { src: f2(4), alt: 'Friends playing football together on an outdoor pitch' },
      { src: f2(9), alt: 'Player striking the ball on the football field' },
    ],
  },
}

export function getLandingImages(brandKey) {
  return LANDING_IMAGES[brandKey] || LANDING_IMAGES.football1
}
