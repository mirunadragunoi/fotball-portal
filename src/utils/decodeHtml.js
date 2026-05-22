/** Decode HTML entities from Open Trivia DB (e.g. &quot; &#039; &amp;). */
export function decodeHtml(text) {
  if (text == null || text === '') return ''
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea')
    el.innerHTML = text
    return el.value
  }
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
}
