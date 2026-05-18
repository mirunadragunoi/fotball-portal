/** Trim access code; preserve alphanumeric characters from API. */
export function sanitizeAccessCodeInput(value) {
  return String(value || '')
    .trim()
    .replace(/\s/g, '')
    .slice(0, 32)
}

export function isValidAccessCode(value) {
  const code = sanitizeAccessCodeInput(value)
  return code.length >= 4
}
