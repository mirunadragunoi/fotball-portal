// Current season derived from today's date — no hardcoded year.
// European domestic leagues roll over in July, so from July onward the current
// season's start year is the current calendar year, otherwise the previous one.
export function currentSeasonStartYear(date = new Date()) {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1
}

// Season key as used in api-football / roster JSON filenames (the start year).
export function currentSeason(date = new Date()) {
  return String(currentSeasonStartYear(date))
}
