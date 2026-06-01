export function timeAgo(dateString, locale) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  if (isNaN(date)) return ''
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60)  return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 172800) return 'Yesterday'

  return date.toLocaleDateString(locale || 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
