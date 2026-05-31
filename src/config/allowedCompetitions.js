const BASE_COMPETITIONS = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Eredivisie',
  'Liga Portugal',
  'Süper Lig',
  'Champions League',
  'UEFA Champions League',
  'Europa League',
  'UEFA Europa League',
  'Conference League',
  'UEFA Europa Conference League',
]

const BRAND_EXTRA = {
  football1: ['Ekstraklasa', 'Slovak Super Liga', 'Super Liga'],
  football2: ['Liga I', 'Czech First League', 'First League'],
}

export function getAllowedCompetitions(brandName) {
  return [...BASE_COMPETITIONS, ...(BRAND_EXTRA[brandName] || [])]
}

export function isAllowedCompetition(competitionName, brandName) {
  if (!competitionName) return false
  const allowed = getAllowedCompetitions(brandName)
  const name = competitionName.toLowerCase()
  return allowed.some(a => name.includes(a.toLowerCase()))
}
