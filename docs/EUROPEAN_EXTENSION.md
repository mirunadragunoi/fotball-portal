# European Competitions Extension — Consolidated Documentation

**Generated:** 2026-08-25
**Frontend repo/branch:** `fotball_portal` @ `feature/european-competitions-extension`
**Backend repo/branch:** `RVDPlatform` @ `feature/football-news-club-sync`
**Portals affected:** Nation Foot (`football1`) · Goal Plaza (`football2`)

> This is a standalone review document consolidating the whole European-extension phase (four rounds). It does not replace `CLAUDE.md`. It is written to be read by a non-technical owner **and** verified against the code by another Claude Code instance — every path, route, ID and commit hash below is pulled from the repo.

---

## 1. Executive Summary

The portals began as a **World-Cup-centric microsite**: a single tournament section (competition_id 362) plus games, videos, news, trivia and history. This phase shifted them into a **general European football hub** covering the UEFA club cups (Champions League, Europa League, Conference League) and the major European leagues, while keeping the World Cup section fully working.

At a high level we added: a central config that is the single source of truth for which competitions the portal shows; a **Competitions hub** page and generic **competition** and **tournament** pages that render any competition from its ID; live-score enhancements (competition filtering, quick filters, clickable competitions/teams); homepage additions (Top Competitions, a Live Now widget); club **team squad pages with player photos**; **local-language news** (Romanian/Polish/Czech/Slovak) with a language filter; and a de-emphasis of the World Cup in navigation and the hero copy. A later cleanup round consolidated duplicated stores/views and removed hardcoded season assumptions.

The design is **config-driven**: a single `competitionId` flows through the service → store → view layers, so the same pages work for any competition. Adding a new competition is normally a one-line edit to `src/config/europeanCompetitions.js`.

**Current status.** All frontend code builds clean for both brands and all six locales are key-identical (437 keys each). The features are implemented and statically verified. What still needs **runtime testing against a live backend** is listed in §10 — chiefly: the multi-day club-squad sync must run before club photos appear; the `/livescore/seasons` payload shape; and anything needing a live in-play match (live standings arrows, commentary).

**Two backend changes** (local RSS feeds and the club-squad sync script) live in a **separate repository** (`RVDPlatform`) on a separate branch — see §7 and §8.

---

## 2. Scope & Goals

**In scope (delivered):**
- UEFA club cups: Champions League, Europa League, Conference League.
- Top-5 leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1.
- Secondary leagues: Eredivisie, Primeira Liga, Süper Lig.
- Per-brand local leagues: Ekstraklasa + Slovak Super League (Nation Foot); Liga I (Goal Plaza); Czech 1st League (both portals).
- Bonus cups: UEFA Super Cup, FIFA Club World Cup.
- The World Cup section (`/tournament`, competition_id 362) preserved and still fully functional.

**Non-goals / deferred (see §11):**
- **Favorite Competitions** (user-pinned competitions) — intentionally not built.
- Renaming `teams.js` → `liveScoreTeams.js`, a one-pass line-ending renormalization, and deriving per-competition season IDs from the API — all deferred.

**Constraints respected:**
- No FIFA/UEFA trademark issues in user-facing copy (the World Cup is still shown as generic "Tournament 2026"; competition names returned by the API — e.g. "Champions League" — are tolerated as data labels).
- Brand-agnostic shared components (CSS variables + brand config + i18n).
- Six locales (`en/ro/cz/sk/pl/fr`) kept key-identical.
- No backend architecture changes; the only backend edits are additive (RSS feed list + a new sync script).

---

## 3. Competitions Covered

All 17 curated competitions, from `src/config/europeanCompetitions.js` (live-score-api IDs). The World Cup (362) is separate, in `src/config/livescore.js` as `WC_2026_COMPETITION_ID`.

| Competition | ID | Type | Groups | Tier | Brand scope | Routes to |
|---|---:|---|:--:|---|---|---|
| Champions League | 244 | Cup | ✓ | european-cup | both | TournamentView |
| Europa League | 245 | Cup | ✓ | european-cup | both | TournamentView |
| Conference League | 446 | Cup | ✓ | european-cup | both | TournamentView |
| Premier League | 2 | League | — | top5 | both | CompetitionDetail |
| La Liga | 3 | League | — | top5 | both | CompetitionDetail |
| Serie A | 4 | League | — | top5 | both | CompetitionDetail |
| Bundesliga | 1 | League | — | top5 | both | CompetitionDetail |
| Ligue 1 | 5 | League | — | top5 | both | CompetitionDetail |
| Eredivisie | 196 | League | — | secondary | both | CompetitionDetail |
| Primeira Liga | 8 | League | — | secondary | both | CompetitionDetail |
| Süper Lig | 6 | League | — | secondary | both | CompetitionDetail |
| Ekstraklasa | 60 | League | — | local | football1 | CompetitionDetail |
| Super League (SK) | 63 | League | — | local | football1 | CompetitionDetail |
| Liga I | 61 | League | — | local | football2 | CompetitionDetail |
| 1st League (CZ) | 72 | League | — | local | both | CompetitionDetail |
| UEFA Super Cup | 349 | Cup | — | bonus | both | CompetitionDetail |
| FIFA Club World Cup | 372 | Cup | ✓ | bonus | both | TournamentView |
| *World Cup 2026* | *362* | *Cup* | ✓ | *(separate)* | both | `/tournament` (WorldCupView) |

Notes:
- **Routing rule** (`isTournamentCompetition` = `isCup && hasGroups`): cups **with** a group phase (UCL, UEL, UECL, Club World Cup) go to the rich **TournamentView**; everything else (all leagues + the group-less UEFA Super Cup) goes to **CompetitionDetailView**.
- **Season IDs** in config: domestic leagues `57` (2026/2027), UEFA cups `56` (2025/2026), Club World Cup `null`. These are the default season for standings; the selector now loads the full list dynamically (see §4, Dynamic seasons).
- The local-league entries carry a `brand` field (a string, or an array when a league is sold on both portals — e.g. the Czech 1st League); all others (no `brand`) show on both portals.

---

## 4. What Was Built — Feature by Feature

### Central competition config — `src/config/europeanCompetitions.js`
Single source of truth for which competitions the portal surfaces. Exports:
`EUROPEAN_COMPETITIONS`, `COMPETITION_TIER_ORDER`, `ALL_COMPETITION_ID_SET`, and helpers `getCompetitionsForBrand`, `getCompetitionsByTier`, `getCompetitionById`, `getCompetitionIdsCsv`, `getAllCompetitionIds`, `isTournamentCompetition`, `getCompetitionRoute`, `getCompetitionRouteById`.
To add/remove a competition, edit this file only (see §12).

### Competitions Hub — route `/competitions`
`src/views/CompetitionsHubView.vue` + `src/components/shared/CompetitionCard.vue`. Brand-scoped cards grouped by tier (UEFA cups → top5 → secondary → local → bonus); each links to the right page via `getCompetitionRoute`. Pure config, no API call.

### Generic Competition page — route `/live/competition/:competitionId`
`src/views/live/CompetitionDetailView.vue`. Tabs (auto-shown by data): **Standings, Fixtures, Groups, Goalscorers, Disciplinary**. Includes: real competition **name + country + tier badge** header; a **team-form** column (last-5 W/D/L) on the standings table; a **season selector** (dynamic, see below); **live standings** with position-change arrows during in-play matches; and live-match highlighting in groups. Data via the `competition` Pinia store. Components: `StandingsTable`, `LiveStandingsTable`, `GoalscorersTable`, `DisciplinaryTable`, `GroupStageGrid`.

### Generic Tournament view — route `/tournament/:competitionId(\d+)`
`src/views/live/TournamentView.vue` + `src/components/livescore/TournamentBracket.vue` + `src/utils/bracket.js`. Tabs: **Groups, Knockout (bracket), Fixtures, Teams, Top Scorers** (auto-shown by data). The knockout bracket derives rounds from fixture round labels. The **World Cup remains its own dedicated page** (`WorldCupView.vue` at `/tournament`); `/tournament/362` redirects there.

### Live page enhancements — route `/live`
`src/views/live/LiveView.vue` + `src/stores/livescore.js`. The live/fixtures calls now send a **CSV of curated competition IDs** (`getCompetitionIdsCsv` + WC) so only our competitions appear; **quick-filter chips** (`All / UCL / PL / La Liga / Serie A / Bundesliga / Ligue 1`) narrow client-side; **competition names are clickable** (route to the correct competition/tournament page); **team names are clickable** (route to the team page).

### Homepage additions — route `/`
- **Top Competitions** section — `src/components/home/TopCompetitions.vue` (UEFA cups + top5 + the brand's local league(s), reusing `CompetitionCard`).
- **Live Now widget** — `src/components/home/LiveNowWidget.vue`: up to 3 in-play curated matches, or the next 2 upcoming with a "Starts in Xh Ym" countdown. Self-contained polling (30s), paused when the tab is hidden.
- **Generic hero** — the brand hero copy (`hero.f1.*` / `hero.f2.*`) is European-football messaging; the eyebrow is a static generic string (the World-Cup countdown composable was removed).

### Team & squad pages
- **Unified rosters store** — `src/stores/rosters.js` (`useRostersStore`, with `useWorldCupTeamsStore` kept as a back-compat alias). Holds WC national-team rosters (`wc2026-teams.json`) and top-5 club rosters (`public/data/leagues/*.json`) in separate collections with separate name matchers; shares player-details / fantasy / selection.
- **Unified squad view** — `src/views/live/TeamSquadView.vue`: two render modes — WC/tournament (Panini grid + `TeamBanner`) and club/generic (header + recent matches + Panini squad + fallback). Serves `/tournament/team/:teamId`, `/tournament/:cid/team/:teamId`, and `/live/team/:teamId`.
- **Player cards/modal** — `PlayerPaniniCard.vue`, `PlayerPositionGroup.vue`, `PlayerDetailModal.vue` (lazy player detail via `/football/apifootball/players/:id`).
- **Club squad support** — club team names (live-score-api) are matched **by name** to the api-football club roster (photos), because the two providers use different team IDs.

### News — route `/news`
`src/views/NewsView.vue` + `src/stores/news.js` + `src/services/newsApi.js`. A **language filter** (brand-scoped: football1 = en/pl/sk/cs, football2 = en/ro/cs) drives the backend `langs` param; each card shows a source name + language tag. Backend adds local-language RSS feeds (see §7).

### Live commentary
Confirmed **generic** — loaded by `match_id` on `MatchDetailView.vue` for every competition (no World-Cup gating). All match-click paths converge on `/live/match/:matchId`.

### World Cup de-emphasis
Removed: the nav highlight on the Tournament entry, the WC live banner on the Live page, and the dynamic WC countdown eyebrow (replaced by a generic string). Preserved: `/tournament` still renders the full `WorldCupView.vue` exactly as before, including group stage, fixtures, teams and top scorers.

---

## 5. Architecture & Data Flow

```
Vue frontend  ──►  Backend proxy (/football/*)  ──►  live-score-api.com  (scores, standings, fixtures, commentary, seasons)
(fotball_portal)   (RVDPlatform)                 ──►  api-football        (player/squad photos)
                                                 ──►  RSS feeds           (news)
```

- **The frontend never holds API keys.** All external calls go through the backend under `/football/*`.
- **Competition-id abstraction:** every livescore service function takes a `competitionId`; the `competition`/`livescore` stores pass it through; the views read it from the route param. This is what makes one component serve every competition.
- **Two team-ID namespaces:** live-score-api (used by live/standings/matches) and api-football (used by squads/photos) number teams differently. The frontend bridges them by **normalized name matching** in the rosters store (`getClubTeamByName`), mirroring the World Cup flow.
- **Backend caching (TTL profiles):** realtime 15s (live, commentary, live standings), live_event 20s (events, stats), medium 5min (fixtures, standings, lineups), slow 30min (history, h2h, goalscorers), static 24h (competitions, teams, countries, seasons). Plus per-request coalescing.
- **Backend components touched (separate repo `RVDPlatform`):** `libraries/RssFeedManager.py` (local feeds + `langs` filter) and `scripts/sync_club_squads.py` (club squad sync) — see §7.

---

## 6. Routes Reference

Phase-relevant routes (from `src/router/index.js`). "Gated" = the router guard redirects to `/login` when unauthenticated.

| Path | Name | Component | Purpose | Auth |
|---|---|---|---|---|
| `/competitions` | `Competitions` | `CompetitionsHubView.vue` | Competitions catalogue (hub) | gated |
| `/live` | `Live` | `live/LiveView.vue` | Live scores + fixtures + standings, CSV filter, quick chips | gated |
| `/live/match/:matchId` | `MatchDetail` | `live/MatchDetailView.vue` | Match detail + commentary (all competitions) | gated |
| `/live/competition/:competitionId` | `CompetitionDetail` | `live/CompetitionDetailView.vue` | Generic league page (standings/fixtures/groups/scorers/discipline) | gated |
| `/live/standings/:competitionId` | `Standings` | `live/StandingsView.vue` | Full standings for a competition | gated |
| `/live/team/:teamId` | `TeamDetail` | `live/TeamSquadView.vue` | Team page (club mode) | gated |
| `/live/h2h/:team1Id/:team2Id` | `H2H` | `live/H2HView.vue` | Head-to-head | gated |
| `/tournament` | `Tournament` | `WorldCupView.vue` | World Cup (dedicated, unchanged) | gated |
| `/tournament/team/:teamId` | `TournamentTeamSquad` | `live/TeamSquadView.vue` | WC team squad (WC mode) | gated |
| `/tournament/:competitionId(\d+)` | `TournamentView` | `live/TournamentView.vue` | Generic tournament (UCL/UEL/UECL/Club WC); `362`→`/tournament` | gated |
| `/tournament/:competitionId(\d+)/team/:teamId` | `TournamentViewTeamSquad` | `live/TeamSquadView.vue` | Cup team squad | gated |
| `/news` | `News` | `NewsView.vue` | News + language filter | gated |
| `/world-cup`, `/world-cup/team/:teamId` | — | redirect | Legacy → `/tournament*` | — |
| `/live/tournament/:competitionId`, `/live/tournament/team/:teamId` | — | redirect | Legacy → tournament routes | — |

Nav (both brands): a **Competitions** entry was added after Live; the **Tournament** entry lost its accent highlight.

---

## 7. Backend Dependencies & Data Pipeline (repo `RVDPlatform`, branch `feature/football-news-club-sync`)

### Club-squad sync — `scripts/sync_club_squads.py`
- **What it does:** fetches teams + squads + player/team photos for the top-5 leagues from api-football and writes one JSON per league to the frontend's `public/data/leagues/<slug>-<season>.json`, reusing the World-Cup image layout (`/images/players|teams|venues/{id}.png`).
- **api-football league IDs used** (different numbering from live-score-api): Premier League 39, La Liga 140, Serie A 135, Bundesliga 78, Ligue 1 61.
- **Rate-limit reality:** api-football free tier = **100 requests/day**. A full 5-league sync is ~5 team-list + ~100 squad calls = **~105 requests → about 2 days**. The script is **resumable** (a manifest `scripts/.sync_club_progress.json` records completed teams, keyed by league+season), caps a run with `--max-requests` (default 90), and supports `--league` (one at a time) and `--season` (date-derived default).
- **How to run:** `py scripts/sync_club_squads.py --league premier-league` (repeat per league across days). Key is read from `--key` / `API_FOOTBALL_KEY` / the prod conf `[api_football]` — never hardcoded.
- **Recommendation:** the free tier can populate a snapshot over ~2 days but cannot sustain daily freshness across all five leagues alongside the app's on-demand player-detail calls. If daily freshness is wanted, a modest **paid api-football tier** is worth it.
- **WC sync** (`scripts/sync_apifootball.py`) is unchanged in behavior; it gained `--league/--season` args defaulting to the WC's fixed 1/2026.

### Roster JSON outputs (consumed by the frontend)
- World Cup: `public/data/wc2026-teams.json` (national teams) — gitignored, produced by `sync_apifootball.py`.
- Clubs: `public/data/leagues/<slug>-<season>.json` (e.g. `premier-league-2026.json`) — produced by `sync_club_squads.py`. The frontend `rosters` store fetches these; **missing files degrade gracefully** (no club squad shown).

### Local-language RSS news — `libraries/RssFeedManager.py`
- Added feeds (all URLs verified live at build time): **RO** Fanatik, Realitatea Sportivă, Digi Sport, ProSport · **PL** Sportowe Fakty, Przegląd Sportowy, Weszło · **CZ** iSport, Sport.cz · **SK** Aktuality Šport, Sportnet · plus international BBC / Guardian / ESPN.
- `get_news` gained a `langs` filter (CSV) that also pulls the matching local feeds; `/football/news?langs=…`. Existing 10-min per-feed cache + dedup preserved.

---

## 8. Implementation Timeline (rounds & commits)

**Frontend** (`fotball_portal` @ `feature/european-competitions-extension`):

| Round | Commit | Description |
|---|---|---|
| 1 — base extension | `6ce730e` | feat: extend portals to European competitions & leagues |
| 2 — quick wins + medium | `230cd55` | feat(hero): generic European football hero copy |
| | `e80f9fa` | chore: remove dead code (eyebrow composable, WC banner CSS) |
| | `6c92659` | feat(home): Top Competitions section |
| | `2fac6c1` | feat(match): competition name links to competition page |
| | `6269b44` | feat(home): Live Now widget |
| | `7817f30` | fix(commentary): works for all competitions |
| | `85f96a6` | feat(competition): season selector |
| | `e8371d3` | feat(competition): disciplinary + team form + richer header + group live highlight |
| | `7210c81` | feat(competition): real-time live standings + position arrows |
| | `c0fbd61` | docs: CLAUDE.md round-2 changelog |
| 3 — large improvements | `e094ad7` | feat(tournament): generic TournamentView + knockout bracket |
| | `182cfb9` | fix(commentary): wired into generic match detail post-refactor |
| | `e4b8906` | feat(news): language filter |
| | `8038edf` | feat(teams): club team pages + name-mapped squads |
| | `6b37d35` | docs: CLAUDE.md round-3 changelog |
| 4 — technical cleanup | `4de8f4a` | refactor(stores): unify worldcupTeams + clubTeams → rosters |
| | `3d8c6c6` | refactor(teams): generalize TeamSquadView (WC/cup/club) |
| | `ac8a4ad` | refactor(competition): dynamic seasons (no hardcoded 2026) |
| | `32dfe1d` | chore: add .gitattributes |
| | `345b1a0` | docs: CLAUDE.md round-4 changelog |

**Backend** (`RVDPlatform` @ `feature/football-news-club-sync`):

| Round | Commit | Description |
|---|---|---|
| 3 | `53a1944` | feat(news): local-language RSS feeds + langs filter |
| 3 | `6ce8be0` | feat(backend): resumable rate-limited club-squad sync |
| 4 | `15a8259` | refactor(backend): parameterize sync season (dynamic default) |
| 4 | `d7b2139` | chore: add .gitattributes |

**New files added this phase (frontend):** `src/config/europeanCompetitions.js`, `src/utils/bracket.js`, `src/utils/season.js`, `src/views/CompetitionsHubView.vue`, `src/components/shared/CompetitionCard.vue`, `src/components/home/TopCompetitions.vue`, `src/components/home/LiveNowWidget.vue`, `src/components/livescore/TournamentBracket.vue`, `src/components/livescore/DisciplinaryTable.vue`, `.gitattributes`.
**Renamed:** `src/stores/worldcupTeams.js` → `src/stores/rosters.js`.
**Deleted:** `src/composables/useTournamentEyebrow.js`, `src/components/livescore/LiveScoreWidget.vue`, `src/components/livescore/MatchDetail.vue`, `src/components/livescore/CommentaryTimeline.vue`, `src/components/livescore/CommentaryEvent.vue`, `src/views/live/TeamDetailView.vue`, `src/stores/clubTeams.js`.

---

## 9. Verification Checklist

Concrete, checkable items for the reviewer (or their Claude Code) to run against the code.

**Config & routing**
- [ ] `src/config/europeanCompetitions.js` exists and `EUROPEAN_COMPETITIONS` contains 17 entries with the IDs in §3 (UCL 244, UEL 245, UECL 446, PL 2, La Liga 3, Serie A 4, Bundesliga 1, Ligue 1 5, Eredivisie 196, Primeira 8, Süper Lig 6, Ekstraklasa 60, SK Super League 63, Liga I 61, CZ 1st League 72, Super Cup 349, Club WC 372).
- [ ] It exports helpers: `getCompetitionsForBrand`, `getCompetitionsByTier`, `getCompetitionById`, `getCompetitionIdsCsv`, `getAllCompetitionIds`, `isTournamentCompetition`, `getCompetitionRoute`, `getCompetitionRouteById`, and consts `COMPETITION_TIER_ORDER`, `ALL_COMPETITION_ID_SET`.
- [ ] Router has: `/competitions`→`CompetitionsHubView`, `/live/competition/:competitionId`→`CompetitionDetailView`, `/tournament/:competitionId(\d+)`→`TournamentView` (with `362`→`/tournament` redirect), `/live/team/:teamId`→`TeamSquadView`.
- [ ] Nav includes a **Competitions** entry; the Tournament entry has **no** `highlight`.

**Stores & views**
- [ ] `src/stores/rosters.js` exists; `src/stores/worldcupTeams.js` and `src/stores/clubTeams.js` are **gone** (WC name kept only as an alias export in `rosters.js`).
- [ ] `src/views/live/TeamSquadView.vue` exists and `src/views/live/TeamDetailView.vue` is **gone**.
- [ ] New components exist: `CompetitionsHubView.vue`, `CompetitionCard.vue`, `TopCompetitions.vue`, `LiveNowWidget.vue`, `TournamentBracket.vue`, `DisciplinaryTable.vue`; utils `bracket.js`, `season.js`.
- [ ] Deleted: `useTournamentEyebrow.js`, `LiveScoreWidget.vue`, `MatchDetail.vue`, `CommentaryTimeline.vue`, `CommentaryEvent.vue`.

**Behavior (needs the app running)**
- [ ] `/live/competition/2` shows Premier League (standings / fixtures / goalscorers / disciplinary).
- [ ] `/tournament/244` shows Champions League with Groups + Knockout bracket + Top Scorers.
- [ ] Live page requests send a CSV `competition_id` and show only curated competitions.
- [ ] Season selector on a competition page loads options dynamically (no literal `2026` as "current" in `CompetitionDetailView.vue`).

**Build & i18n (commands)**
- [ ] Both brands build clean:
  ```bash
  npm run build -- --mode football1
  npm run build -- --mode football2
  ```
- [ ] All 6 locales key-identical at **437** keys each:
  ```bash
  cd src/i18n/locales && python3 -c "import json,glob
  def f(o,p=''):
   s=set()
   for k,v in o.items():
    nk=f'{p}.{k}' if p else k
    s|=f(v,nk) if isinstance(v,dict) else {nk}
   return s
  b=None
  for fp in sorted(glob.glob('*.json')):
   ks=f(json.load(open(fp,encoding='utf-8')))
   if b is None: b=ks
   print(fp, len(ks), 'OK' if ks==b else 'DIFF')"
  ```
- [ ] `.gitattributes` present at the frontend repo root (and in `RVDPlatform`).
- [ ] No `2026` literal used as "current season" in `src/views/live/CompetitionDetailView.vue`:
  ```bash
  grep -n "2026" src/views/live/CompetitionDetailView.vue   # expect: no matches
  ```

---

## 10. Known Limitations & Needs Runtime Testing

Honest list of what has **not** been verified against a live backend:

- **Club squad photos depend on the sync having run.** Until `sync_club_squads.py` populates `public/data/leagues/*.json` (a multi-day job on the free tier), club team pages show recent matches + a graceful fallback (no photos). *To confirm with a run.*
- **`/livescore/seasons` payload shape** — the season selector is coded flexibly (`id` + `name`/`season`/`year`) with a date-derived fallback; the real shape should be confirmed with the backend running. *To confirm.*
- **Live standings arrows & live commentary** — need a live in-play match in a curated competition to fully verify (position-change arrows, incremental commentary). *To confirm.*
- **Local RSS feeds** — URLs were verified live (HTTP 200 + RSS), but per-feed article parsing (images, dates, dedup) should be confirmed with the backend running. *To confirm.*
- **Team-name matching edge cases** — abbreviations like "Wolves" vs "Wolverhampton Wanderers" won't name-match the club roster and fall through gracefully (team info + matches, no squad). *Known.*
- **`/tournament/:cid/team/:id` (cup team squad)** is reachable but not currently linked from the UI (the TournamentView Teams tab links to `/live/team/:id`). *Known.*

---

## 11. Deferred / Future Enhancements

- **Favorite Competitions** — user-pinned competitions; intentionally skipped this phase.
- **Rename `teams.js` → `liveScoreTeams.js`** — to disambiguate from `rosters.js` (kept as-is this round to avoid churn).
- **`git add --renormalize .`** — a deliberate one-pass line-ending normalization now that `.gitattributes` exists (intentionally not run, to avoid a massive diff).
- **Per-competition season IDs from the API** — currently the default season is the config `seasonId`; could be derived from the seasons endpoint per competition.
- **Club-squad refresh cadence / paid api-football tier** — decide whether daily freshness across five leagues warrants a paid plan.

---

## 12. How to Extend Further

**To add another competition:** add one entry to `EUROPEAN_COMPETITIONS` in `src/config/europeanCompetitions.js`:

```js
newLeague: { id: <live-score-api id>, name: '<Name>', country: '<Country>', countryId: <id>,
             isCup: false, isLeague: true, hasGroups: true, tier: 'secondary', seasonId: 57,
             /* brand: 'football1' | 'football2'  ← omit for both */ },
```

Nothing else needs touching — the hub, live filter, competition/tournament routing and CSV all read from this config. Cups with `hasGroups: true` automatically route to the rich TournamentView; leagues to CompetitionDetailView.

**To find a competition's live-score-api ID:** call the backend reference endpoint `GET /football/livescore/competitions` (proxied to live-score-api's `competitions/list.json`) and match by name/country. Competition names can repeat across confederations, so disambiguate by the `countries`/`federations` field in the response.

---

*End of document.*
