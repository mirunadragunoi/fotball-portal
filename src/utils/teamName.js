// Club team-name normalizer — lowercase, unaccented, stripped of common club
// affixes (FC/SC/AS/…) and punctuation — so the same club matches across the two
// data providers (live-score-api ↔ API-Football), which spell names differently
// and use different ids. Mirrors the matcher in `stores/rosters.js` (kept in
// sync intentionally); shared here so the fixture/team-id resolvers can reuse it.

const DIACRITICS = /[̀-ͯ]/g
const CLUB_LETTERS = { 'ı': 'i', 'ł': 'l', 'đ': 'd', 'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'ß': 'ss', 'þ': 'th', 'ð': 'd' }
const CLUB_LETTERS_RE = new RegExp('[' + Object.keys(CLUB_LETTERS).join('') + ']', 'g')
const CLUB_NOISE = /\b(fc|cf|afc|sc|ac|ss|us|rc|cd|ud|sd|club|calcio|as|rcd|be)\b/g

// Short forms the two providers use that neither normalization nor the
// containment rule below can bridge ("Man City" is not a substring of
// "Manchester City", "Spurs" shares nothing with "Tottenham"). Keys and values
// are already NORMALIZED (lowercase, unaccented, affix-stripped). Both the short
// form and, where the long form isn't the natural normalized spelling, the long
// form map to one canonical string, so a match works whichever spelling each
// provider returns. Kept deliberately small and unambiguous — a wrong entry can
// only ever fail to match (the resolver also requires the OTHER team, the league
// and the date to line up), never cross a match to a different club.
const CLUB_ALIASES = {
  'man city': 'manchester city',
  'man utd': 'manchester united',
  'man united': 'manchester united',
  'spurs': 'tottenham hotspur',
  'wolves': 'wolverhampton wanderers',
  'nott m forest': 'nottingham forest',
  'nottm forest': 'nottingham forest',
  'sheffield utd': 'sheffield united',
  'sheff utd': 'sheffield united',
  'inter': 'internazionale',
}

export function normClubName(s) {
  const base = String(s || '')
    .toLowerCase()
    .replace(CLUB_LETTERS_RE, (c) => CLUB_LETTERS[c])
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(/&/g, 'and')
    .replace(CLUB_NOISE, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
  return CLUB_ALIASES[base] || base
}

// True when two team names refer to the same club: exact normalized match, or
// one normalized name contains the other (handles "Wolverhampton" vs
// "Wolverhampton Wanderers"). Empty strings never match.
export function teamNamesMatch(a, b) {
  const na = normClubName(a)
  const nb = normClubName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const longer = na.length >= nb.length ? na : nb
  const shorter = na.length >= nb.length ? nb : na
  // Require the shorter to be a whole-word prefix/suffix-ish containment of a
  // meaningful length, to avoid "as"/"real" style false positives.
  return shorter.length >= 4 && longer.includes(shorter)
}
