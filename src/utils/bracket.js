// Derive a knockout bracket from a flat fixtures list using each fixture's
// round/stage label. live-score-api round labels vary ("Round of 16",
// "1/8-finals", "Quarter-finals", "Final", …), so we match with tolerant
// regexes. A true bracket tree is unreliable from this data, so we render
// ordered rounds (columns), each holding its matches.

// Order matters: "Semi-finals" contains "final", so semi must be tested first.
const ROUNDS = [
  { key: 'r32',   label: 'Round of 32',    test: (r) => /round of 32|1\/16|play-?off/i.test(r) },
  { key: 'r16',   label: 'Round of 16',    test: (r) => /round of 16|1\/8|eighth/i.test(r) },
  { key: 'qf',    label: 'Quarter-finals', test: (r) => /quarter|1\/4/i.test(r) },
  { key: 'sf',    label: 'Semi-finals',    test: (r) => /semi/i.test(r) },
  { key: 'final', label: 'Final',          test: (r) => /final/i.test(r) },
]

export function roundLabelOf(match) {
  return String(
    match?.round || match?.stage || match?.competition?.round || match?.fixture?.round || '',
  )
}

// Returns the canonical round descriptor for a fixture, or null when the
// fixture is not a knockout match (group stage / unknown).
export function roundFor(match) {
  const r = roundLabelOf(match)
  if (!r) return null
  for (const round of ROUNDS) {
    if (round.test(r)) return round
  }
  return null
}

// Group knockout fixtures into ordered rounds: [{ key, label, matches }].
export function buildBracket(fixtures = []) {
  const buckets = new Map()
  for (const m of fixtures) {
    const round = roundFor(m)
    if (!round) continue
    if (!buckets.has(round.key)) buckets.set(round.key, { ...round, matches: [] })
    buckets.get(round.key).matches.push(m)
  }
  // Emit in canonical ROUNDS order.
  return ROUNDS.map((r) => buckets.get(r.key)).filter(Boolean)
}

export function hasKnockoutFixtures(fixtures = []) {
  return fixtures.some((m) => roundFor(m) !== null)
}
