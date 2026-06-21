# Backend News API — handoff spec

Frontend handoff for moving the news/RSS aggregation from the browser to the
backend. Today the browser fetches RSS through public CORS proxies (flaky,
no caching, exposes our source list publicly). We want **one** endpoint on
`store_webapi` that aggregates and caches everything server-side, so the
frontend just renders.

> Conventions follow `WEBAPI_ROUTES.md` / `FRONTEND_FOOTBALL_API.md`:
> `GET` under `/football/*`, query params, JSON response with
> `treatment / error_code / error_description` envelope.

---

## 1. Endpoint

```
GET /football/news
```

**Public** — no `access_code` required (same posture as `/about` and the
upcoming public `/legals/*` contract).

### Query parameters

| Param | Required | Default | Notes |
|---|---|---|---|
| `portal_name` | yes | — | as on every other route |
| `country` | yes | — | `UK` · `RO` · `CZ` · `SK` · `PL`. Picks which local feeds to include. |
| `language` | no | country default | ISO 639-1 (`en`, `ro`, `cs`, `sk`, `pl`). Reserved for future per-language filtering — not currently used to gate sources. |
| `limit` | no | `20` | items per page, clamp 1–50 |
| `page` | no | `1` | 1-based |
| `source` | no | — | slug filter (e.g. `bbc`, `fanatik`). When set, only that source is returned. |
| `nocache` | no | `0` | `1` bypasses the server-side cache (debugging only) |

### Response

```jsonc
{
  "treatment": 1,
  "error_code": 0,
  "error_description": "",
  "articles": [
    {
      "id":          "bbc_3_a1b2c3d4",        // stable id, used as Vue :key + dedup on loadMore
      "title":       "Manchester City held by …",
      "description": "Pep Guardiola's side …", // plain text, ≤200 chars
      "link":        "https://www.bbc.co.uk/sport/football/articles/...",
      "image":       "https://ichef.bbci.co.uk/.../image.jpg",  // null if feed has none
      "publishedAt": "2026-06-08T14:23:00Z",  // ISO 8601 UTC
      "source": {
        "slug": "bbc",
        "name": "BBC Sport",
        "lang": "en"                          // en · ro · cs · sk · pl
      },
      "local": false                          // true = source is local for the requested country
    }
    // …
  ],
  "total":   124,    // total articles available after dedup
  "page":    1,
  "limit":   20,
  "hasMore": true    // more pages exist
}
```

Error responses follow the platform convention: HTTP 4xx/5xx with
`error_code != 0` and a human-readable `error_description`.

---

## 2. Sources to aggregate

### International feeds (always included, for any country)

| Slug | Name | RSS URL |
|---|---|---|
| `bbc` | BBC Sport | `https://feeds.bbci.co.uk/sport/football/rss.xml` |
| `guardian` | The Guardian | `https://www.theguardian.com/football/rss` |
| `espn` | ESPN FC | `https://www.espn.com/espn/rss/soccer/news` |

### Local feeds, per country (placed ahead of internationals)

| Country | Slug | Name | RSS URL | Language |
|---|---|---|---|---|
| RO | `fanatik` | Fanatik | `https://www.fanatik.ro/fotbal/feed/` | ro |
| RO | `rs-ro` | Realitatea Sportivă | `https://realitateasportiva.net/feed/` | ro |
| CZ | `isport` | iSport | `https://isport.blesk.cz/rss/fotbal/` | cs |
| SK | `aktsk` | Aktuality Sport | `https://sport.aktuality.sk/rss/futbal/` | sk |
| PL | — | — | (no usable public football RSS found) | — |
| UK | — | — | (international feeds only) | — |

If a feed dies in the future, swap or remove it server-side — frontend
needs no change. New sources can be added the same way.

---

## 3. Per-feed parsing rules

Apply identically across all feeds.

### Required fields per `<item>`

- **title** — `<title>` text, HTML stripped.
- **link** — `<link>` text. Drop the item if title or link is missing.
- **description** — `<description>` text, HTML stripped, collapsed whitespace, **truncated to 200 chars** (cut on the last space within the limit, append `…`).
- **publishedAt** — parse `<pubDate>` or `<date>`. ISO 8601 UTC. Fall back to "now" if missing/unparseable.

### Image extraction (first available wins)

1. `<media:thumbnail url="">` attribute (BBC Sport pattern)
2. `<media:content>` — if multiple are present (e.g. The Guardian provides 140/460/700 px), pick the **largest `width`**. Accept only if URL ends with `.jpg|jpeg|png|webp|gif`.
3. `<enclosure url="">` — same image extension filter.
4. First `<img src="">` found inside `<description>`.
5. `null` if none of the above match.

### Stable `id`

`{slug}_{index_in_feed}_{base64(last_20_chars_of_link)}` (strip non-alphanum). The id has to survive across pagination — clients use it as Vue `:key` and to dedup on infinite scroll.

---

## 4. Aggregation, sorting, dedup

1. **Fetch** the chosen feeds in parallel; failures are skipped silently (don't fail the whole response if one feed times out).
2. **Group** articles into `local` (from local feeds for the requested country) and `international`.
3. **Sort each group** by `publishedAt` descending.
4. **Dedup within each group** by a normalised title key:
   `key = lowercase + strip diacritics + remove non-alphanumeric + first 50 chars`.
   First occurrence wins.
5. **Merge**: `[...localDeduped, ...intlDeduped]` — local first.
6. Apply `source` filter (if any), then paginate with `limit` + `page`.
7. Return `articles`, `total` (count after dedup, before pagination), `page`, `limit`, `hasMore`.

---

## 5. Caching

- **Server-side**, 10 minutes per feed-slug. Frontend does **no** client-side cache for news.
- `nocache=1` bypasses the cache for debugging.
- Cache invalidates automatically on TTL — no manual purge endpoint needed for now.

---

## 6. Tone / non-goals (heads up)

- Backend must NOT inject any commercial / sponsored content into the
  feed — frontend assumes everything in `articles` is editorial.
- Don't filter by keyword on the backend — we trust the upstream feed
  curation.
- Tracking parameters (`utm_*`, `at_medium`, etc.) on outbound `link`s
  can be stripped or kept — frontend doesn't care.
- Article HTML in `description` is intentionally stripped to plain text
  — frontend renders only the title + description blurb + thumbnail; the
  user clicks through to the source for the full article.

---

## 7. Frontend impact after rollout

Tracked in `src/services/newsApi.js` — currently ~170 lines of XML
parsing and proxy juggling.

Once this endpoint is live we collapse it to:

```js
export async function getNews(_creds, { limit = 20, page = 1, source } = {}) {
  const data = await request('/football/news', {
    query: {
      portal_name: getPortalName(),
      country:     getCountryKey(),
      language:    getLanguage(),
      limit, page,
      ...(source ? { source } : {}),
    },
  })
  const payload = unwrapData(data)
  return {
    articles: payload?.articles || [],
    total:    payload?.total ?? 0,
    page:     payload?.page ?? 1,
    limit:    payload?.limit ?? limit,
    hasMore:  Boolean(payload?.hasMore),
  }
}
```

The `news` Pinia store (`src/stores/news.js`) keeps its current public
surface (`fetchNews`, `loadMore`, `setSource`, `filteredArticles`,
`featuredArticles`, `sources`) — no view changes needed.

---

_Last updated: 2026-06-08. Owner on frontend side: see `src/services/newsApi.js`._
