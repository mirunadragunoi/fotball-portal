/**
 * News aggregation is fully server-side as of 2026-06-08
 * (see docs/FRONTEND_NEWS_API.md). The backend fans out to BBC / Guardian
 * / ESPN + per-country local feeds, dedupes, caches for 10 minutes, and
 * returns the merged list paginated. The frontend just calls one route.
 *
 * Public — no access_code. Country drives which local feeds are included.
 */

import { getPortalName } from '@/config/api'
import { getCountryKey } from '@/config/brand'
import { request, getLanguage, unwrapData } from '@/services/footballApi'
import { decodeHtml } from '@/utils/decodeHtml'

// Some RSS feeds (e.g. iSport/Blesk) ship image/link URLs with HTML entities
// already baked in (`?v=0&amp;st=...`). Browsers don't decode entities in URL
// strings, so the query params get mangled (`&st=` becomes `&amp;st=` and the
// CDN signature fails). Decode on the way out so consumers always get clean URLs.
function cleanUrl(url) {
  if (!url) return url
  return decodeHtml(url)
}

function normalize(article) {
  return {
    ...article,
    image: cleanUrl(article.image),
    link:  cleanUrl(article.link),
  }
}

export async function getNews(_creds, { limit = 20, page = 1, source, langs } = {}) {
  const query = {
    portal_name: getPortalName(),
    country:     getCountryKey(),
    language:    getLanguage(),
    limit,
    page,
  }
  if (source) query.source = source
  // `langs` (CSV of feed languages, e.g. "en,pl,sk") filters server-side and
  // also pulls the matching local feeds; omit for the default (all) view.
  if (langs) query.langs = langs

  const data = await request('/football/news', { query })
  const payload = unwrapData(data)
  return {
    articles: (payload?.articles || []).map(normalize),
    total:    payload?.total ?? 0,
    page:     payload?.page ?? page,
    limit:    payload?.limit ?? limit,
    hasMore:  Boolean(payload?.hasMore),
  }
}
