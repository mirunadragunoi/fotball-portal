# Football Livescore API — ghid frontend

Document de handoff pentru echipa de frontend, cu endpoint-urile livescore noi/modificate
din `store_webapi` (proxy peste [live-score-api.com](https://live-score-api.com)).

> Pentru lista completă a tuturor rutelor `/football/*` (auth, products, history, news,
> apifootball etc.) vezi [WEBAPI_ROUTES.md](WEBAPI_ROUTES.md). Documentul de față acoperă
> doar modificările recente pe partea de livescore + breaking changes.

## Bază comună

- Toate rutele sunt sub `store_webapi`, prefix **`/football/livescore/*`**, method **GET**.
- Toate cer mereu **`access_code`** + **`portal_name`** (autentificare portal). Fără ele → `400`.
- Câmpul `success: true/false` din payload vine din live-score-api. Verificați-l mereu.
- `lang` (cod ISO 2 litere, ex. `ro`, `en`, `fr`) e opțional pe endpoint-urile care întorc
  text descriptiv (commentary, events, standings etc.).
- Id-urile (`competition_id`, `team_id`, `match_id`, `season`) se iau din endpoint-urile de
  referință (`competitions`, `teams`, `seasons`) — **nu se hardcodează**.

---

## 🆕 1. Fantasy Player Statistics (NOU)

```
GET /football/livescore/fantasy
```

| Param | Oblig. | Notă |
|---|---|---|
| `access_code`, `portal_name` | da | auth |
| `competition_id` | nu | filtrează pe o competiție |
| `match_id` | nu | statistici pentru un meci anume |
| `player_id` | nu | doar un jucător |
| `team_id` | nu | meciurile unei echipe |
| `opponent_team_id` | nu | **funcționează DOAR combinat cu `player_id` SAU `team_id`** |
| `lang` | nu | cod ISO 2 litere |

**Răspuns** (`data` = array de meciuri):

```jsonc
{
  "success": true,
  "data": [
    {
      "match":       { "score": "...", "status": "...", "stadium": "..." /* teams, location */ },
      "competition": { "id": 337, "name": "..." },
      "stats": [
        {
          "id": 123, "name": "...", "photo": "https://...", "team_id": 7,
          "passes": 0, "tackles": 0, "duels": 0, "shots": 0,
          "goals": 0, "assists": 0, "clearances": 0, "interceptions": 0,
          "fouls": 0, "ball_touches": 0
          /* + metrici de portar pentru portari */
        }
      ]
    }
  ]
}
```

> Ideal pentru fișa detaliată de jucător. Trimiteți cel puțin unul dintre
> `match_id`/`player_id`/`team_id`/`competition_id` ca să filtrați (altfel întoarce volum mare).

---

## ♻️ 2. Match Commentary (parametri noi)

```
GET /football/livescore/commentary?match_id=<id>
```

Nou: `from_second` și `to_second` (opționale) — filtrează evenimentele pe un interval de
secunde de la start.

| Param | Oblig. |
|---|---|
| `match_id` | **da** |
| `lang`, `from_second`, `to_second` | nu |

**Răspuns:**

```jsonc
{
  "success": true,
  "data": {
    "match": { "home": "...", "away": "...", "score": "0 - 2", "ht_score": "0 - 1", "time": "FT" },
    "commentary": [
      {
        "id": 0, "match_id": 0, "event_type": "...",
        "minute": 58, "second": 0, "match_second": 0,
        "text": "descriere lizibilă în limba aleasă",
        "comment": "note VAR/clarificări",
        "pos_x": 0, "pos_y": 0,            // poziție pe teren în % (0-100)
        "side": "h",                        // "h" = home, "a" = away
        "team": { /* team object */ },
        "player": { /* ... */ }, "player_2": { /* ... */ }
      }
    ]
  }
}
```

> ⚠️ `commentary: []` gol pe competiții minore e **normal** — datele de comentariu există doar
> la competiții majore (World Cup, Euro, Copa). Nu e eroare.

---

## 🔴 3. BREAKING — Team Event Minutes

```
GET /football/livescore/team-event-minutes
```

**Semnătura s-a schimbat complet.** Vechiul `team_id` **nu mai e valid**.

| Param | Oblig. | Exemplu |
|---|---|---|
| `team_ids` | **da** | `7,19` (CSV de id-uri) |
| `event_types` | **da** | `GOAL,GOAL_PENALTY` (CSV) |
| `number` | nu | `10` (1-10, default 10) — câte meciuri recente |

**Răspuns:**

```jsonc
{
  "success": true,
  "data": {
    "teams": [
      {
        "team_id": 7,
        "matches": [
          { "match_id": 714383, "events": [ { "event_type": "GOAL", "minute": 58 } ] }
        ]
      }
    ]
  }
}
```

---

## 🔴 4. BREAKING — Squad & Rosters (acum cer `season`)

```
GET /football/livescore/squad?competition_id=<id>&team_id=<id>&season=<season>
GET /football/livescore/rosters?competition_id=<id>&season=<season>
```

`season` (ex. `2024`) este acum **obligatoriu** la ambele — fără el → `400`.

> Atenție la format: `2024` merge; `2024/2025` întoarce „competiția nu are ediție pentru
> sezonul X" dacă ediția nu există. Luați valorile valide din `/football/livescore/seasons`.

---

## 🟡 5. Team Last Matches (param nou opțional)

```
GET /football/livescore/team-last-matches?team_id=<id>&number=<1-10>
```

`number` (1-10, default 10) — acum suportat. Frontend-ul poate să nu-l trimită (default 10),
dar dacă vrea mai puține meciuri îl poate seta.

---

## Note transversale

1. **Caching pe backend** — răspunsurile sunt deja cache-uite în platformă (TTL 15s–24h în
   funcție de endpoint). Nu e nevoie de cache agresiv pe client. Pentru date live
   (`live`, `commentary`, `standings-live`, `fantasy`) TTL e ~15-20s. Pentru date proaspete
   forțat, trimiteți `nocache=1`.
2. **Coduri de eroare:** `400` = parametru lipsă/invalid · `401` = `access_code`/`portal_name`
   greșit sau inactiv · `404` = resursă negăsită · `500` = eroare API upstream.
3. Pentru date populate de commentary, folosiți un `match_id` dintr-o **competiție majoră**.

---

_Ultima actualizare: 2026-06-07. Sursă de adevăr pentru rute: `webservices/{dev,prod}/store_webapi.py`
+ `libraries/store/FootballWorker.py` + `libraries/LiveScoreManager.py`._
