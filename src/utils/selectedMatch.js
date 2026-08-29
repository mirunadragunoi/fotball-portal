// Selected-match carry-through.
//
// The match-detail page (`/live/match/:id`) renders its scoreboard (team names,
// logos, score, status, competition) from the match object itself — live-score-api
// has no single-match-by-id endpoint that returns the scoreboard, and the live
// feed only ever contains *in-play* matches. So when the user clicks a match row
// anywhere in the app we stash the full match object here; the detail page reads
// it back (falling through to the live feed when the match is still in play).
//
// A compact snapshot is mirrored into sessionStorage so an in-session reload or
// direct navigation to the detail URL still recovers the scoreboard instead of
// showing a blank header.

const SELECTED_MATCH_KEY = 'ls_selected_match'

export function matchIdOf(match) {
  return match?.id ?? match?.match_id ?? match?.fixture_id ?? null
}

export function rememberSelectedMatch(match) {
  const id = matchIdOf(match)
  if (!id) return
  try {
    sessionStorage.setItem(SELECTED_MATCH_KEY, JSON.stringify({ id, match }))
  } catch {
    // sessionStorage unavailable (private mode / quota) — in-session navigation
    // still works via the store's in-memory ref; only cold reload degrades.
  }
}

// Returns the stored match, or null. When `id` is given, only returns it if the
// snapshot is for that same match.
export function readSelectedSnapshot(id) {
  try {
    const raw = sessionStorage.getItem(SELECTED_MATCH_KEY)
    if (!raw) return null
    const snap = JSON.parse(raw)
    if (!snap || !snap.match) return null
    if (id != null && String(snap.id) !== String(id)) return null
    return snap.match
  } catch {
    return null
  }
}
