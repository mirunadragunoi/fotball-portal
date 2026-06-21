# Frontend handoff — News API + public About

Confirmare contract pentru echipa de frontend: endpoint-ul de **news** cerut în
[BACKEND_NEWS_API_SPEC.md](BACKEND_NEWS_API_SPEC.md) este **implementat live** pe
`store_webapi`, iar rutele **About** au devenit **publice**. Mai jos: cum se apelează.

> Convenții generale ca în [FRONTEND_FOOTBALL_API.md](FRONTEND_FOOTBALL_API.md):
> `GET` sub `/football/*` (și `/wellness/*`), parametri în query, JSON.

---

## 1. News — `GET /football/news`  (NOU, public)

**Public — fără `access_code`.** Agregarea + caching-ul se fac integral pe backend;
frontend-ul doar randează. Nu mai apela RSS prin proxy CORS din browser.

### Parametri

| Param | Oblig. | Default | Note |
|---|---|---|---|
| `portal_name` | **da** | — | ca pe orice rută |
| `country` | **da** | — | `UK` · `RO` · `CZ` · `SK` · `PL` — alege ce feed-uri locale se includ |
| `language` | nu | — | ISO 639-1 (`en`,`ro`,`cs`,`sk`,`pl`) — rezervat, momentan nu filtrează sursele |
| `limit` | nu | `20` | articole per pagină, clamp 1–50 |
| `page` | nu | `1` | 1-based |
| `source` | nu | — | filtru pe slug (`bbc`, `guardian`, `espn`, `fanatik`, `rs-ro`, `isport`, `aktsk`) |
| `nocache` | nu | `0` | `1` = bypass cache server (doar debug) |

### Răspuns

```jsonc
{
  "treatment": 1,
  "error_code": 0,
  "error_description": "",
  "articles": [
    {
      "id":          "bbc_3_cnRpY2xlcy9hYmNk",   // stabil — folosește ca :key + dedup la loadMore
      "title":       "Manchester City held by …",
      "description": "Pep Guardiola's side …",    // plain text, ≤200 char
      "link":        "https://www.bbc.co.uk/sport/football/articles/...",
      "image":       "https://ichef.bbci.co.uk/.../image.jpg",  // null dacă feed-ul n-are
      "publishedAt": "2026-06-08T14:23:00Z",       // ISO 8601 UTC
      "source": { "slug": "bbc", "name": "BBC Sport", "lang": "en" },
      "local":  false                              // true = sursă locală pt. country-ul cerut
    }
  ],
  "total":   124,    // total după dedup, înainte de paginare
  "page":    1,
  "limit":   20,
  "hasMore": true
}
```

### Comportament de reținut
- **Local-first**: pentru `country` cu feed-uri locale (RO/CZ/SK), articolele locale apar **înaintea** celor internaționale (BBC/Guardian/ESPN). UK/PL = doar internaționale.
- **Dedup** pe titlu normalizat (fără diacritice) — un singur exemplar per știre.
- **Imagine** poate fi `null` — tratează fallback-ul vizual pe client.
- **Cache**: backend-ul cache-uiește 10 min per sursă. **Frontend-ul NU mai face cache** pentru news (Pinia store păstrează doar starea de paginare/UI).
- `source` filtrează **după** dedup — dacă o sursă a fost dedup-uită în favoarea alteia, poate întoarce mai puține rezultate (e normal).

### Exemplu apel (`src/services/newsApi.js`)

```js
export async function getNews(_creds, { limit = 20, page = 1, source } = {}) {
  const data = await request('/football/news', {
    query: {
      portal_name: getPortalName(),
      country:     getCountryKey(),   // 'UK' | 'RO' | 'CZ' | 'SK' | 'PL'
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

> Se poate șterge toată logica veche de parsare XML + juggling de proxy CORS
> (~170 linii). Store-ul `news` (`fetchNews`/`loadMore`/`setSource`/`filteredArticles`/
> `featuredArticles`/`sources`) rămâne neschimbat ca interfață.

---

## 2. About — `GET /football/about` și `GET /wellness/about`  (BREAKING)

About a devenit **pagină publică**. Două schimbări față de înainte:

| | Înainte | Acum |
|---|---|---|
| Auth | cerea `access_code` | **fără `access_code`** |
| Țară | derivată din `access_code` (portal_access) | **`country` obligatoriu** în query |
| Envelope | `{ data: { content, label, language } }` | **flat**: `{ content, label, language }` (fără `data`) |

### Apel
```
GET /football/about?portal_name=Goalplaza&country=RO&language=ro
GET /wellness/about?portal_name=Calmasoul&country=RO&language=ro
```

### Răspuns
```jsonc
{
  "content":  "…text About…",
  "label":    "GP",
  "language": "RO"
}
```

> ⚠️ Frontend-ul trebuie: (1) să trimită `&country=XX` (nu mai trimite access_code),
> (2) să citească `content`/`label`/`language` **direct** (nu mai despacheta `data`).
> Dacă `unwrapData` despacheta `data` pentru about, scoate acel unwrap pentru ruta about.

---

## 3. Erori (toate rutele)

| HTTP | semnificație |
|---|---|
| `400` | parametru obligatoriu lipsă / invalid (ex. `country` lipsă) |
| `404` | conținut negăsit (ex. About fără date pentru portal+țară) |
| `500` | eroare upstream (feed/DB) |

Verificați mereu `error_code` în payload (`0` = OK) acolo unde envelope-ul `treatment`
e prezent (news, legals). About întoarce direct conținutul (sau eroare 4xx/5xx).

---

_Last updated: 2026-06-08. Sursă de adevăr backend: `libraries/RssFeedManager.py`,
`libraries/store/FootballWorker.py`, `libraries/store/WellnessWorker.py`,
`webservices/{dev,prod}/store_webapi.py`._
