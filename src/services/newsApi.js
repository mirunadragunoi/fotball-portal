/**
 * Frontend-only RSS fetching via public CORS proxies, with fallback.
 * Local feeds (per country) are shown first, international feeds follow.
 */

import { getCountryKey } from '@/config/brand'

// Proxy fallback chain — first working one wins per feed. codetabs is last
// because it has been throwing Cloudflare 522 since mid-2026.
const PROXIES = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

const PROXY_TIMEOUT_MS = 8000

async function fetchViaProxy(url) {
  let lastErr = null
  for (const buildProxyUrl of PROXIES) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS)
      const res = await fetch(buildProxyUrl(url), { signal: controller.signal })
      clearTimeout(timer)
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`)
        continue
      }
      const text = await res.text()
      if (!text || text.length < 200) {
        lastErr = new Error('empty response')
        continue
      }
      return text
    } catch (e) {
      lastErr = e
      // try next proxy
    }
  }
  throw lastErr || new Error('all proxies failed')
}

// ── Feed catalogue ─────────────────────────────────────────────────────────

const INTERNATIONAL_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', name: 'BBC Sport',      slug: 'bbc' },
  { url: 'https://www.theguardian.com/football/rss',        name: 'The Guardian',   slug: 'guardian' },
  { url: 'https://www.espn.com/espn/rss/soccer/news',       name: 'ESPN FC',        slug: 'espn' },
]

const LOCAL_FEEDS = {
  RO: [
    { url: 'https://www.fanatik.ro/fotbal/feed/',    name: 'Fanatik',             slug: 'fanatik', lang: 'ro' },
    { url: 'https://realitateasportiva.net/feed/',   name: 'Realitatea Sportivă', slug: 'rs-ro',   lang: 'ro' },
  ],
  CZ: [
    { url: 'https://isport.blesk.cz/rss/fotbal/',   name: 'iSport',              slug: 'isport',  lang: 'cs' },
  ],
  SK: [
    { url: 'https://sport.aktuality.sk/rss/futbal/', name: 'Aktuality Sport',     slug: 'aktsk',   lang: 'sk' },
  ],
  // PL: no accessible RSS found — international feeds only
}

// ── Cache ──────────────────────────────────────────────────────────────────

const _cache = new Map()
const CACHE_TTL = 10 * 60 * 1000 // 10 min

// ── XML helpers ─────────────────────────────────────────────────────────────

function getTagText(el, tag) {
  return el.getElementsByTagName(tag)[0]?.textContent?.trim() || ''
}

function extractImage(item) {
  // media:thumbnail (BBC Sport)
  const mt = item.getElementsByTagName('media:thumbnail')[0]
  if (mt?.getAttribute('url')) return mt.getAttribute('url')

  // media:content — pick the largest width (The Guardian: 140/460/700px)
  const mcAll = [...item.getElementsByTagName('media:content')]
  if (mcAll.length) {
    const best = mcAll.reduce((a, b) =>
      parseInt(b.getAttribute('width') || '0') > parseInt(a.getAttribute('width') || '0') ? b : a
    )
    const u = best.getAttribute('url')
    if (u && /\.(jpg|jpeg|png|webp|gif)/i.test(u)) return u
  }

  // enclosure
  const enc = item.querySelector('enclosure')
  if (enc) {
    const u = enc.getAttribute('url')
    if (u && /\.(jpg|jpeg|png|webp|gif)/i.test(u)) return u
  }

  // <img> in description
  const m = (getTagText(item, 'description')).match(/<img[^>]+src=["']([^"']+)["']/)
  return m ? m[1] : null
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function truncate(text, max) {
  if (!text || text.length <= max) return text
  const cut = text.substring(0, max)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.substring(0, space) : cut) + '…'
}

// ── Fetch one feed ─────────────────────────────────────────────────────────

async function fetchFeed(feed) {
  const cached = _cache.get(feed.slug)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.articles

  const text = await fetchViaProxy(feed.url)
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  const articles = [...doc.getElementsByTagName('item')]
    .map((item, i) => {
      const title = stripHtml(getTagText(item, 'title'))
      const link  = getTagText(item, 'link')
      if (!title || !link) return null
      return {
        id:          `${feed.slug}_${i}_${btoa(link.slice(-20)).replace(/[^a-z0-9]/gi, '')}`,
        title,
        description: truncate(stripHtml(getTagText(item, 'description')), 200),
        link,
        source:      { name: feed.name, slug: feed.slug, lang: feed.lang || 'en' },
        image:       extractImage(item),
        publishedAt: (() => {
          const d = getTagText(item, 'pubDate') || getTagText(item, 'date')
          try { return d ? new Date(d).toISOString() : new Date().toISOString() } catch { return new Date().toISOString() }
        })(),
        local:       !!feed.lang, // true = local-language article
      }
    })
    .filter(Boolean)

  _cache.set(feed.slug, { articles, ts: Date.now() })
  return articles
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getNews(_creds = {}, options = {}) {
  const { limit = 20, page = 1 } = options

  // Country from brand config — determines which local feeds to prepend
  const country = getCountryKey()
  const localFeeds = LOCAL_FEEDS[country] || []
  const allFeeds = [...localFeeds, ...INTERNATIONAL_FEEDS]

  const results = await Promise.allSettled(allFeeds.map(f => fetchFeed(f)))

  // Collect: local articles first, then international
  const localArticles = []
  const intlArticles  = []

  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return
    const isLocal = i < localFeeds.length
    if (isLocal) localArticles.push(...r.value)
    else         intlArticles.push(...r.value)
  })

  // Sort each group by date
  const byDate = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  localArticles.sort(byDate)
  intlArticles.sort(byDate)

  // Deduplicate within each group, then merge (local first)
  function dedupe(arr) {
    const seen = new Set()
    return arr.filter(a => {
      const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const all = [...dedupe(localArticles), ...dedupe(intlArticles)]

  const total = all.length
  const start = (page - 1) * limit
  return {
    articles: all.slice(start, start + limit),
    total,
    page,
    limit,
    hasMore: start + limit < total,
  }
}
