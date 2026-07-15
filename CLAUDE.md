# CLAUDE.md — Football Portal Frontend

## PROJECT CONTEXT

This is a **Vue 3 + Vite + JavaScript** portal for football content. The codebase already exists as a wellness portal with a brand override system. We are adding **two new football brands** (`football1`, `football2`) that override the base design with football-specific theming, layout tweaks, and content structure.

**Branding posture (updated 2026-06-08):**
- "World Cup" / "World Cup 2026" are **FIFA trademarks** — DO NOT use in any user-facing copy. The earlier 2026-06-01 revision allowed them; that was wrong.
- Use the generic **"Tournament 2026"** everywhere users see it: hero copy, navigation labels, page titles, the dedicated route (now `/tournament`, with `/world-cup` redirecting for back-compat).
- Per-locale equivalents (also generic): RO "Turneul 2026", CZ "Turnaj 2026", SK "Turnaj 2026", PL "Turniej 2026".
- Internal identifiers may keep the "worldcup" / "wc" prefix to avoid churn — they aren't visible to users. Examples kept: `useWorldCupTeamsStore`, i18n key prefix `worldcup.*`, `wc2026-teams.json`, CSS class hints. Only USER-VISIBLE strings and URL paths must be neutral.
- Also off-limits in user-facing copy: FIFA, UEFA, CONMEBOL, AFC, and official sponsor logos.
- Competition names returned by external APIs (e.g. "UEFA Champions League" in `src/config/allowedCompetitions.js`) are tolerated as data labels — don't strip them from API payloads, just don't promote them in marketing copy.

---

## RECENT UPDATES (2026-06-08)

Decisions and conventions added in this round of work — keep these in mind when editing.

### Tournament 2026 rebrand
- All visible occurrences of "World Cup" / "World Cup 2026" replaced with **"Tournament 2026"** in copy, headlines, footer, nav, routes (`/world-cup` → `/tournament` with redirects for old links).
- Per-locale equivalents: RO "Turneul 2026" · CZ "Turnaj 2026" · SK "Turnaj 2026" · PL "Turniej 2026".
- Internal identifiers kept on purpose: `useWorldCupTeamsStore`, i18n key prefix `worldcup.*`, `wc2026-teams.json`, `WC_2026_COMPETITION_ID`, `WC_2026_GROUPS`. None are visible to users.

### Subscription via external carrier landings
- New users on supported countries are redirected from the "Sign up" CTA to a carrier landing page (SMS / mix billing) instead of the internal phone form. Mapping in `src/config/landingUrls.js`:
  - Nation Foot × SK / PL → `https://premium.nationfoot.com/<sknatf|plnatf>/click/`
  - Goal Plaza × CZ / RO → `https://premium.goalplaza.com/<czgoal|rogoal>/...`
- Brand × country combos without a mapping (e.g. UK on either brand) fall back to the internal `/signup` route. To add a new country, drop another line into `SUBSCRIBE_LANDING_URLS`.
- `goToSignup()` in `src/composables/useAuth.js` consults this map and does `window.location.href = ...` when matched.

### Legal endpoints — public contract
- `legalContext()` in `src/services/footballApi.js` sends only `portal_name + country + language`. No `access_code`. The backend is being updated to accept anonymous reads on `/about` and `/legals/*`; until that rollout lands, these calls return `400 Missing mandatory parameter <access_code>` and the view shows a generic error.
- The response shape extraction lives in the service per endpoint (FAQ array, contact list join, content string), so the view stays trivial. Don't reintroduce shape parsing in `LegalPageView.vue`.
- Backend response shape sniff: `/about` on some portals wraps in `{data: {content}}`; `/legals/*` returns top-level `{treatment, error_code, error_description, <key>: ...}`. `unwrapData()` handles both.

### Footer — unsubscribe gating
- `unsubscribe` link in the footer is shown **only** when `getCountryKey()` is `CZ` or `SK` (carrier-driven SMS opt-out). On RO / PL / UK it disappears. The `/unsubscribe` route itself remains accessible — only the footer entry is filtered.

### Header behaviour
- Single CTA on both brands: **Sign In** (the old Goal Plaza "Sign Up" CTA is gone — Sign Up flow now lives behind the carrier landing).
- AppHeader is rendered on auth pages too, but only the logo (with link to `/`). Nav, search, live badge, hamburger, mobile menu are all hidden via `v-if="!isAuthPage"`.
- Live-matches badge in the top-right is gated by both `PHASE2_LIVE_HERO_ENABLED` and `liveCount > 0` — so it never renders as an empty bordered chip.
- Mobile menu (hamburger drawer) gained a Sign In (green `#16A34A`) / Sign Out (red `var(--color-red)`) row at the bottom.
- Logo on mobile / tablet: `max-width: calc(100vw - 80px)`, `max-height: 40px`. SVG viewBoxes were tightened to remove empty padding so the wordmark fills the canvas — if the user re-exports a logo, retighten or the icon will look small again.

### Nav order (both brands)
Home · Tournament 2026 · Live · News · History · Trivia · Games · Videos. World Cup 2026 entry is `highlight: true` (accent color in nav).

### Hero copy — Tournament-first
- Headline, body, CTAs in `src/brands/<brand>/components/AppHero.vue` promote Tournament 2026. CTAs point to `/tournament` (primary) and `/live` (secondary). Body line acknowledges the rest of the portal (history / trivia / games / videos).
- Eyebrow is **dynamic** via `src/composables/useTournamentEyebrow.js` — counts down to 2026-06-11, then shows "Live now", then "Tournament closed" after 2026-07-19. Refreshes hourly. Translations: `hero.eyebrow.{kickoff|kickoffToday|kickoffTomorrow|live|concluded}` in all 5 locales.
- Goal Plaza hero stats strip is now i18n-driven (`labelKey` per stat) — values `48 teams · 104 matches · 12 groups`.

### Backend API alignment (see `docs/FRONTEND_FOOTBALL_API.md`)
- New service + endpoint: `LIVESCORE_API.fantasy` → `fetchFantasy({competitionId, matchId, playerId, teamId, opponentTeamId})`. Surfaced on `PlayerDetailModal.vue` as a "Tournament 2026" stats section, filtered by team (`liveScoreApiId`) + competition `362`, matched to the modal's player by **name** (api-football ids ≠ live-score-api ids).
- Commentary now supports `from_second` / `to_second`. The match-detail store polls incrementally every 15s: ask only for events past `max(match_second)`, dedupe by `id`, append fresh entries to existing array.
- `fetchTeamEventMinutes` signature changed (backend breaking): `{ teamIds, eventTypes, number }`. Old single `team_id` is gone.
- `fetchSquad(creds, competitionId, teamId, season)` and `fetchRosters(creds, competitionId, season)` now require `season`. `TeamDetailView` defaults to `'2026'` (URL can override via `?season=`). Future work: pull valid values from `/livescore/seasons` per competition.
- `fetchTeamLastMatches` accepts optional `{ number }` (1-10).

### News — backend relay (2026-06-08 contract — see `docs/FRONTEND_NEWS_API.md`)
- News is now fully server-side. Frontend calls `GET /football/news` once and renders. Endpoint is **public** (no `access_code`), driven by `portal_name + country + language`. Backend handles RSS fan-out (BBC / Guardian / ESPN + per-country local feeds), 10-min cache, dedup, local-first ordering.
- `src/services/newsApi.js` is a ~50-line shim. NO more browser-side XML parsing or CORS-proxy fallback chain — both gone.
- One frontend safety net: `normalize()` runs `decodeHtml` on `image` and `link` URLs because some feeds (iSport/Blesk) ship signed CDN URLs with `&amp;` baked in; raw browsers don't decode entities inside attribute values, so the CDN signature breaks. Backend would ideally fix at source.
- Article images: `<img referrerpolicy="strict-origin-when-cross-origin">` — needed because The Guardian returns 401 when `Referer` is empty.

### Match kickoff in visitor's country timezone
- `formatKickoff(dateStr, timeStr, { locale })` in `src/utils/liveScoreFormat.js` parses live-score-api's UTC `date` ("YYYY-MM-DD") + `time` ("HH:MM:SS") and renders in the country's timezone — `Europe/Bucharest` for `ro.*`, `Europe/Prague` for `cz.*`, etc. (map in same file as `COUNTRY_TZ`).
- Used by `LiveMatchRow`, `CompetitionDetailView`, `TeamDetailView`, `H2HComparison`, and `matchMinuteLabel`. When you add a new view that renders a match date/time, route through this helper instead of `toLocaleDateString` so the visitor doesn't see UTC.
- Returns `{ date, time, dateTime }` so callers pick what they need.

### Polling intervals
- Bumped in `src/config/livescore.js` from the original 15-30s defaults — live data is rarely changing at the original cadence and we were burning API budget. Current values: `live=60s`, `hero=60s`, `detail=120s` (commentary + stats on match page), `liveStandings=60s`. All polling pauses when `document.visibilityState !== 'visible'`. Commentary polling is **incremental** (`from_second = max(seen)+1`, append + dedupe) — small payload per cycle.

### Live page — Tournament 2026 priority
- The Europe filter (`filterEurope: true` by default) now **always includes** Tournament 2026 matches even though the host countries (US/MX/CA) aren't in `EUROPE_COUNTRY_IDS`. The grouping computed (`matchesByCompetition`) inserts the WC group first, then everything else in arrival order. Same applies to `filteredFixtures`.
- `/tournament` match rows navigate to `/live/match/:id` on click (full commentary + stats page). The old inline `MatchDetail` side panel was removed from `WorldCupView`.

### Match detail — stats / lineups shape
- live-score-api returns **statistics as a flat object** like `{ yellow_cards: "1:1", possesion: "54:46", ... }`. Service transforms to `[{ type, home, away, _rawKey }]` array with a curated `STAT_ORDER` and label prettification (incl. fixing backend typos `possesion`/`fauls`).
- **Lineups** come wrapped as `{ lineup: { home: { team, players }, away: { team, players } } }`. Service unwraps and splits players into `starting` / `substitutes` via the `substitution` flag ("0" = starter, "1" = sub).
- The right-side "Key Events" panel renders `summaryEventsDescending` (newest first); `summaryEvents` (ascending) is kept for the scoreboard goal lists.

### Homepage anonymous teaser
- Backend `/football/products` requires `access_code`, so anonymous visitors can't pull the live catalogue. `src/config/featuredSamples.js` holds a static snapshot (4 games + 4 videos pulled from Goalplaza on 2026-06-08). IDs are real and identical on both portals, so a click → `/login?redirect=/games/<id>` → after auth the user lands on the actual product page.
- `FeaturedGames.vue` and `FeaturedVideos.vue` render the samples when `!authStore.isAuthenticated`; the live store is queried only after login.

### DoLogin token format
- `/dologin/:token` accepts either `123456` (raw 6-digit access code) or `AB123456` (2 letters + 6 digits, case-insensitive — the letters are stripped before login). Regex: `^[A-Za-z]{2}\d{6}$`. Anything else passes through to the login API as-is so we don't accidentally reject other token shapes.

### Video player — click-to-load
- `VideoDetailView` shows the thumbnail with a play button overlay until the user clicks. Then it swaps in `<video controls autoplay playsinline>` with `src = video.videoUrl`. Saves bandwidth, avoids autoplay UX issues, and supports browsers that block autoplay-with-sound.

### Android games trigger a download
- Android products from `/football/products?product_type=2` have `url` ending in `.apk`. `GameDetailView` renders an `<a download target="_blank">` for these instead of the play RouterLink. `GamePlayView` redirects to the detail page if you somehow land on `/games/<android-id>/play` directly — APKs aren't playable in an iframe.
- HTML5 iframe (`GamePlayView`) used to have `display: none` (dev placeholder leftover). Removed; sandbox/permissions widened (`allow-popups`, `allow-pointer-lock`, `allow-orientation-lock`, etc.) so real HTML5 games work.

### Subscription via external carrier landings
*(unchanged — see earlier entry above)*

### i18n parity + formatting
- All 6 locales (`en/ro/cz/sk/pl/fr`) are now key-identical (`node` script checks `Object.keys` flat across files). JSON files are auto-formatted: when every value in an object is a primitive, keys are vertically aligned; otherwise one-space-after-colon. Don't fight the formatter — run any merge through it.
- `timeAgo(dateString, { t, locale })` (`src/utils/timeAgo.js`) is fully i18n-driven via `time.justNow / minutesAgo / hoursAgo / yesterday`. The BCP-47 fallback map (`en→en-GB`, `ro→ro-RO`, `cz→cs-CZ`, `sk→sk-SK`, `pl→pl-PL`, `fr→fr-FR`) is used for `toLocaleDateString` on older entries.

### User action logging — backend event log (added 2026-07-15)
- New fire-and-forget helper `logEvent({ event_type, product, page, duration_seconds })` in `src/services/footballApi.js`. POSTs to `/football/logEvent` with `portal_name + country + event_type` (+ optional `access_code` read straight from `localStorage[\`${storagePrefix}_access_code\`]` to avoid a circular import on the Pinia auth store). **Never throws** — any network/parse error is swallowed so logging can't break the UI.
- Event types: **601** login (logged server-side inside `/football/auth/login`, no frontend call), **602** launch, **603** page_view, **604** consumption.
- **603 page_view**: single global `router.afterEach` hook in `src/router/index.js` — fires on every navigation (incl. public/legal pages). Only `GameDetail` / `GamePlay` / `VideoDetail` routes attach `product = to.params.id` (that `:id` IS the product id); other `:id`-like params (matchId, teamId) are intentionally omitted.
- **602 launch**: `GameDetailView.vue` logs on every play/download CTA click (`logLaunch`); `VideoDetailView.vue` logs when native playback starts (`startPlayback`).
- **604 consumption** (`VideoDetailView.vue`, native `<video>` only): sums wall-clock time between play↔pause/ended (seeks/pauses excluded), flushed **once per session** on `ended`, `beforeunload`, or route-param change (component is reused, not unmounted, between videos, so `onBeforeUnmount` won't fire on nav). Min 1s guard; a fresh play after a flush starts a new session.

### French locale + FR market (Goal Plaza) — added 2026-07-14
- Added a 6th locale `fr` (`src/i18n/locales/fr.json` base + `src/brands/football2/i18n/locales/fr.json` Goal Plaza override). Key-identical to `en` (parity check passes).
- Uses the generic **"Tournoi 2026"** for the tournament (no "Coupe du Monde" / FIFA in user-facing copy). Internal `worldcup.*` keys kept as elsewhere.
- New country **FR** (France) in `src/config/countries.js`: `defaultLanguage: 'fr'`, `languages: ['fr']`, subdomain `fr.` → `FR`. Added to `football2.countries` (`UK, RO, CZ, FR`). Not on `football1`.
- `fr` wired into `src/i18n/index.js` (base + brand imports, `LOCALE_LABELS.fr = 'Français'`), plus `fr→fr-FR` / `FR→Europe/Paris` in `src/utils/timeAgo.js` and `src/utils/liveScoreFormat.js` so dates/kickoffs render in French/Paris time.
- **Not yet wired:** no carrier landing for Goal Plaza × FR in `src/config/landingUrls.js`, so the subscribe CTA falls back to the internal `/signup` phone form. Add a `SUBSCRIBE_LANDING_URLS` line when a French carrier is available.

---

## ARCHITECTURE — BRAND OVERRIDE SYSTEM

The project uses a brand folder system under `src/brands/`. Each brand folder can override styles, config, assets, components and i18n strings from the base.

```
src/
├── brands/
│   ├── football1/          ← Nation Foot (dark/stadium theme)
│   │   ├── assets/         ← logos, hero images, icons
│   │   ├── styles/         ← _variables.scss, overrides.scss
│   │   ├── components/     ← brand-specific component overrides (AppHero)
│   │   └── i18n/locales/   ← per-locale overrides merged over base
│   └── football2/          ← Goal Plaza (vibrant light theme)
│       └── … same shape …
├── components/             ← shared components (games, videos, layout, livescore, history, trivia, news, shared)
├── composables/            ← useAuth, useCatalog, useGames, useVideos, useLiveScores, useTournamentEyebrow, …
├── config/                 ← brands/*.js, api.js, brand.js, navigation.js, livescore.js, landingUrls.js, …
├── i18n/                   ← base locales (en/ro/cz/sk/pl) + merge logic in index.js
├── legal/                  ← LegalPageView (about/contact/faq/terms/privacy/cookies/unsubscribe)
├── router/                 ← vue-router setup + auth guard
├── services/               ← footballApi, livescoreApi, apiFootballService, newsApi, triviaApi, historyApi
├── stores/                 ← Pinia stores (see STORES below)
├── styles/                 ← base/_variables.css, _reset.css, main.scss
├── utils/                  ← cookies, decodeHtml, liveScoreFormat, productMapper, accessCode
├── views/                  ← page-level views
├── App.vue
└── main.js
```

### How brands work

- Brand is selected at Vite build time via `--mode football1|football2`. `vite.config.js` aliases `@brand` to `src/brands/<key>`.
- Brand `src/config/brands/<key>.js` exports: key, displayName, colors, fonts, nav items, hero copy, footer config, feature flags, allowed countries.
- Brand `styles/overrides.scss` reassigns the CSS custom properties defined in `src/styles/base/_variables.css`.
- Brand `components/AppHero.vue` is the only per-brand component (loaded dynamically in `HomeView.vue`).
- Brand `assets/` holds `logo.svg`, `logo-footer.svg`, brand-specific icons.
- Brand `i18n/locales/<lang>.json` is recursively merged over the base locale at app boot (`src/i18n/index.js`).

### Shared components must remain brand-agnostic

Use CSS variables, brand-config values, and i18n keys — no hardcoded colors, fonts, copy or brand names in shared components.

---

## PHASE 2 — BUILT (as of 2026-06-01)

These sections were placeholders in the original spec but are now fully implemented. Treat them as production features, not stubs.

- `/trivia` — Sports trivia powered by **Open Trivia DB** (category 21). See `src/services/triviaApi.js`, `src/config/trivia.js`, `src/views/trivia/TriviaView.vue`. Dev hits `opentdb.com` via Vite proxy `/opentdb`; prod uses `VITE_OPENTDB_URL` or backend relay.
- `/history` — Tournament history backed by own backend at `/football/history/*`. Tabs: tournaments, teams, matches, players, squads. See `src/services/historyApi.js`, `src/views/history/HistoryView.vue`, components under `src/components/history/`.
- `/live` — Live scores, fixtures, standings, lineups, H2H, commentary, group stages. Powered by **live-score-api** through own backend `/football/livescore/*` (24 endpoints, see `src/config/livescore.js`). Polling: live=30s, hero=60s, detail=15s. Main view `src/views/live/LiveView.vue`; sub-views for match detail, H2H, team detail, standings, competition detail, tournament, team squad.
- `/tournament` (renamed from `/world-cup` on 2026-06-08 for trademark reasons) — dedicated Tournament 2026 section. Competition ID `362`; group IDs (A–L) hardcoded as `WC_2026_GROUPS` in `src/config/livescore.js`. View at `src/views/WorldCupView.vue`, store `src/stores/worldcupTeams.js`, sync output `public/data/wc2026-teams.json` (gitignored — populated by `scripts/sync_apifootball.py`). Legacy paths `/world-cup` and `/world-cup/team/:id` redirect to `/tournament*` for compat. Internal identifiers keep the `wc` / `worldcup` prefix — they aren't user-visible.
- `/news` — RSS aggregator. Local feeds per country + international feeds, fetched through a public CORS-proxy fallback chain (`corsproxy.io` → `allorigins.win` → `codetabs`). See `src/services/newsApi.js`. Each feed has a 10-minute in-memory cache and an 8s per-proxy timeout.

Other live integrations:
- **api-football** for team/player photos (`src/services/apiFootballService.js`).
- Legal pages (about, contact, faq, terms, privacy, cookies, unsubscribe) all served by `src/legal/LegalPageView.vue`.
- i18n covers 5 locales (en/ro/cz/sk/pl) with a recursive base-plus-brand-override merge (`src/i18n/index.js`). Per-brand overrides live in `src/brands/<brand>/i18n/locales/`.

---

## DATA SOURCES

All catalogue data comes from the own backend, not from static JSON files.

| Section | Endpoint(s) | Mapper |
|---|---|---|
| Games | `/football/products?product_type=1` (HTML5) and `?product_type=2` (Android) | `utils/productMapper.js` → `mapProductToGame` |
| Videos | `/football/products?product_type=5` | `mapProductToVideo` |
| Favorites | `/football/favorites` | `mapFavoriteItem` |
| Tournament teams | `public/data/wc2026-teams.json` (gitignored, populated by `scripts/sync_apifootball.py`) | consumed by `worldcupTeams` store |
| News | RSS feeds via CORS proxy (see `services/newsApi.js`) | inline in service |
| Trivia | Open Trivia DB (category 21) | inline in service |
| Live / history | live-score-api proxied via own backend `/football/livescore/*` and `/football/history/*` | inline in services |
| Legal / about | `/football/legals/*` and `/football/about` (public, country + language driven) | per-endpoint extraction in `getLegal*` |

Product types are env-overridable via `VITE_PRODUCT_TYPE_HTML/ANDROID/VIDEO`.

---

## DESIGN SPECIFICATIONS

### Brand `football1` — "Stadium Nights" (Dark Theme)

- **Vibe**: premium, immersive, like watching a match in a dark stadium
- **Primary**: `#1B5E20` (deep green — pitch green)
- **Secondary**: `#FF6F00` (amber/orange — energy, action)
- **Background**: `#0D1117` (near-black)
- **Surface**: `#161B22` (dark card surfaces)
- **Text primary**: `#E6EDF3` (light gray)
- **Text secondary**: `#8B949E` (muted gray)
- **Accent**: `#FFD600` (golden yellow — trophy/winner feel)
- **Typography**: bold, sporty — use `'Oswald', 'Arial Black', sans-serif` for headings, `'Inter', 'Roboto', sans-serif` for body
- **Cards**: subtle border glow on hover, dark glass-morphism feel
- **Hero**: full-width dark image with gradient overlay, big bold headline

### Brand `football2` — "Matchday Energy" (Vibrant Light Theme)

- **Vibe**: energetic, young, social-media-native, like a sports app
- **Primary**: `#00C853` (vivid green)
- **Secondary**: `#2979FF` (electric blue)
- **Background**: `#F5F5F5` (light gray)
- **Surface**: `#FFFFFF` (white cards)
- **Text primary**: `#1A1A2E` (near-black)
- **Text secondary**: `#5F6368` (medium gray)
- **Accent**: `#FF1744` (red — passion, action CTA)
- **Typography**: `'Poppins', 'Nunito', sans-serif` for headings, `'Inter', sans-serif` for body
- **Cards**: white with shadow, colorful category tags, rounded corners
- **Hero**: colorful gradient or bright photo, playful typography

### Shared Design Rules (both brands):

- Mobile-first responsive
- Cards must have hover states (scale, shadow, or glow depending on brand)
- Navigation sticky on scroll
- Smooth page transitions (Vue Router transitions)
- Loading skeletons for async content
- Empty states for filtered results with no matches
- All images must have alt text
- Minimum touch target 44px on mobile
- Use CSS custom properties (variables) for all brand colors — base defines the property names, brands override the values
- Grid layouts: CSS Grid, not flexbox hacks

---

## CSS VARIABLE SYSTEM

Base styles define CSS custom properties. Brand overrides reassign them.

```css
/* src/styles/base/_variables.css — defaults */
:root {
  --color-primary: #1b5e20;
  --color-secondary: #ff6f00;
  --color-bg: #0d1117;
  --color-surface: #161b22;
  --color-text: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-accent: #ffd600;
  --font-heading: "Oswald", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-card: 12px;
  --radius-button: 8px;
  --shadow-card: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 8px 25px rgba(0, 0, 0, 0.5);
  --transition-default: all 0.2s ease;
  --header-height: 64px;
  --max-content-width: 1280px;
}
```

```css
/* src/brands/football2/styles/_overrides.css — brand 2 overrides */
:root {
  --color-primary: #00c853;
  --color-secondary: #2979ff;
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-text: #1a1a2e;
  --color-text-secondary: #5f6368;
  --color-accent: #ff1744;
  --font-heading: "Poppins", sans-serif;
  --font-body: "Inter", sans-serif;
  --radius-card: 16px;
  --radius-button: 24px;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

---

## COMPONENT NAMING & STRUCTURE

`components/` is organised by feature folder (`layout/`, `games/`, `videos/`, `home/`, `livescore/`, `history/`, `trivia/`, `news/`, `shared/`). New components go into the folder that matches their feature; reusable, brand-agnostic ones go into `shared/`. Folder list is illustrative — check the tree before assuming what exists.

### Component rules

- Every component uses `<script setup>` syntax.
- Props validated with `defineProps` and proper types/defaults.
- Emit events with `defineEmits`.
- Scoped styles using `<style scoped>` — reference CSS variables only.
- No hardcoded colors, fonts, or brand names in component styles.
- Composables under `src/composables/` for shared logic (`useAuth`, `useCatalog`, `useLiveScores`, `useTournamentEyebrow`, `useLandingImages`, `useFilters`, …).

---

## ROUTING

Authoritative source: `src/router/index.js`. Snapshot as of 2026-06-08:

| Path | Name | Notes |
|---|---|---|
| `/` | Home | public |
| `/login` | Login | public, hides AppFooter (logo-only AppHeader) |
| `/signup` | Signup | public, internal phone form — **bypassed** when the active brand × country has an external landing in `src/config/landingUrls.js` |
| `/dologin/:token` | DoLogin | public, magic-link login (token = access code) |
| `/games`, `/games/:id`, `/games/:id/play` | Games / GameDetail / GamePlay | gated |
| `/videos`, `/videos/:id` | Videos / VideoDetail | gated |
| `/tournament`, `/tournament/team/:teamId` | Tournament / TournamentTeamSquad | gated; legacy `/world-cup*` paths redirect here |
| `/news` | News | gated |
| `/trivia` | Trivia | gated |
| `/history` | History | gated |
| `/live`, `/live/match/:id`, `/live/h2h/:a/:b`, `/live/standings/:cid`, `/live/competition/:cid`, `/live/team/:id` | Live + sub-views | gated |
| `/about`, `/contact`, `/faq`, `/terms`, `/privacy`, `/cookies`, `/unsubscribe` | LegalPageView | public, single shared view driven by `meta.legalKey` |

"Gated" = router guard redirects to `/login` if not authenticated.

---

## STORES (Pinia)

`src/stores/`:
- `brand` — active brand config, theme, country resolution
- `auth` — access code + portal session, localStorage persistence, login/signup/logout, hydration
- `games`, `videos`, `favorites` — catalogue from `/football/products` and `/football/favorites`
- `livescore` — live matches + match detail (events/commentary/stats/lineups), polling
- `teams`, `competition`, `reference` — livescore reference data (countries, federations, seasons)
- `history`, `trivia`, `news`, `worldcupTeams` — feature stores for their respective pages

Cross-cutting: `src/composables/useCatalog.js` calls `loadGames` + `loadVideos` + `loadLive` after authentication so the live-match badge in the header is populated before the user navigates to `/live`.

---

## IMPORTANT TECHNICAL NOTES

1. **No npm additions without asking** — use only libraries already in `package.json`. If something new is needed, raise it before installing.
2. **i18n** — all user-facing strings go through `vue-i18n`. Hardcoded copy in templates is a regression to fix.
3. **Accessibility** — semantic HTML, ARIA labels on interactive elements, keyboard navigable, WCAG AA contrast.
4. **Performance** — lazy-load route views (`() => import(...)` in router), lazy-load images with `loading="lazy"`, keep bundle size in mind.
5. **Brand isolation** — never hardcode brand-specific colors, fonts, or copy in shared components. Use CSS variables + brand config + i18n.
6. **Internal vs visible** — `worldcup` / `wc` prefixes are kept in internal identifiers (stores, i18n keys, JSON files, constants) but never appear in user-visible copy. See branding posture above.
