<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompetitionStore } from '@/stores/competition'
import { useLiveScoreStore } from '@/stores/livescore'
import { formatKickoff, isLiveStatus } from '@/utils/liveScoreFormat'
import { currentSeasonStartYear } from '@/utils/season'
import { rememberSelectedMatch } from '@/utils/selectedMatch'
import { getCompetitionById, getApiFootballLeagueId, getApiFootballSeason } from '@/config/europeanCompetitions'
import { useAuthStore } from '@/stores/auth'
import {
  fetchTopAssists,
  fetchTopYellowCards,
  fetchTopRedCards,
  fetchInjuries,
  fetchLeagueCoverage,
} from '@/services/apiFootballService'
import StandingsTable from '@/components/livescore/StandingsTable.vue'
import LiveStandingsTable from '@/components/livescore/LiveStandingsTable.vue'
import GoalscorersTable from '@/components/livescore/GoalscorersTable.vue'
import DisciplinaryTable from '@/components/livescore/DisciplinaryTable.vue'
import GroupStageGrid from '@/components/livescore/GroupStageGrid.vue'

const route  = useRoute()
const router = useRouter()
const { t, locale }  = useI18n()
function kickoffStr(m) {
  return formatKickoff(m.date || m.match_date, m.time, { locale: locale.value }).dateTime
}

const compStore = useCompetitionStore()
const liveStore = useLiveScoreStore()

const competitionId = computed(() => route.params.competitionId)

// Curated competition metadata (name, country, season) — falls back to a
// generic label + no season for any competition not in our config.
const competition = computed(() => getCompetitionById(competitionId.value))
const competitionName = computed(() =>
  competition.value?.name || t('live.competition', 'Competition'),
)

// Tier badge (UEFA / Top League / League / Local League / Cup).
const TIER_BADGE_KEY = {
  'european-cup': 'competition.badgeUefa',
  top5:           'competition.badgeTop',
  secondary:      'competition.badgeLeague',
  local:          'competition.badgeLocal',
  bonus:          'competition.badgeCup',
}
const tierBadge = computed(() => {
  const key = TIER_BADGE_KEY[competition.value?.tier]
  return key ? t(key) : ''
})

// Live matches for this competition (used to highlight live games in groups).
const liveMatchesForComp = computed(() =>
  (liveStore.liveMatches || []).filter(
    (m) => String(m?.competition?.id) === String(competitionId.value),
  ),
)

// True when any of this competition's matches is currently in play.
const hasLiveMatches = computed(() =>
  liveMatchesForComp.value.some((m) => isLiveStatus(m?.status)),
)

const loading = ref(true)
const standingsLoading = ref(false)
const error   = ref(null)
const tab     = ref('standings')

// ── Season selector ────────────────────────────────────────────────────────
// Only the standings endpoint accepts a season_id (fixtures/goalscorers do not
// at the backend level), so the selector re-loads standings for the chosen
// season while the other tabs stay on the current season.
//
// Season options + labels come from /livescore/seasons (loaded once, cached in
// the store). No hardcoded "current" year: labels prefer the API's own season
// name, and any fallback anchor is derived from today's date.
const selectedSeasonId = ref(null)

function seasonLabel(id) {
  // Prefer the season's own name from the API.
  const s = compStore.seasons.find((x) => String(x.id) === String(id))
  const name = s?.name || s?.season || s?.year
  if (name) return String(name)
  // Fallback: anchor id↔year on the competition's known current season, itself
  // pinned to today's date (no literal year in code).
  const anchorId = competition.value?.seasonId
  if (anchorId == null) return String(id)
  const start = currentSeasonStartYear() + (Number(id) - Number(anchorId))
  return `${start}/${start + 1}`
}

// Recent selectable seasons for this competition.
const seasons = computed(() => {
  const cur = competition.value?.seasonId
  const apiIds = (compStore.seasons || [])
    .map((s) => Number(s.id))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a)
  let ids
  if (apiIds.length) {
    const set = new Set(apiIds.slice(0, 4))
    if (cur != null) set.add(Number(cur))
    ids = [...set].sort((a, b) => b - a).slice(0, 4)
  } else if (cur != null) {
    ids = [0, 1, 2].map((off) => cur - off)   // offset fallback if the endpoint is unavailable
  } else {
    ids = []
  }
  return ids.map((id) => ({ id, label: seasonLabel(id) }))
})

async function loadStandingsForSeason() {
  standingsLoading.value = true
  try {
    await compStore.loadStandings(competitionId.value, selectedSeasonId.value || undefined)
  } finally {
    standingsLoading.value = false
  }
}

// ── Live standings (real-time during matches) ──────────────────────────────
const LIVE_STANDINGS_POLL = 30_000
const prevLiveRows = ref([])
let liveStandingsTimer = null

const liveStandings = computed(() => compStore.liveStandings || [])
// Use the live table only on the Standings tab, when a match is in play and the
// live endpoint actually returned rows — otherwise fall back to static.
const showLiveStandings = computed(
  () => tab.value === 'standings' && hasLiveMatches.value && liveStandings.value.length > 0,
)

async function refreshLiveStandings() {
  // Snapshot current order for position-change arrows before refreshing.
  prevLiveRows.value = [...(compStore.liveStandings || [])]
  await Promise.allSettled([
    liveStore.loadLive(),
    compStore.loadLiveStandings(competitionId.value),
  ])
}

function startLiveStandingsPolling() {
  stopLiveStandingsPolling()
  if (document.visibilityState !== 'visible') return
  liveStandingsTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (tab.value === 'standings' && hasLiveMatches.value) refreshLiveStandings()
  }, LIVE_STANDINGS_POLL)
}

function stopLiveStandingsPolling() {
  if (liveStandingsTimer) {
    clearInterval(liveStandingsTimer)
    liveStandingsTimer = null
  }
}

// Start/stop polling as the tab or live state changes.
function syncLivePolling() {
  if (tab.value === 'standings' && hasLiveMatches.value) startLiveStandingsPolling()
  else stopLiveStandingsPolling()
}

watch([tab, hasLiveMatches], syncLivePolling)

function onVisibility() {
  if (document.visibilityState === 'visible') syncLivePolling()
  else stopLiveStandingsPolling()
}

onMounted(async () => {
  selectedSeasonId.value = competition.value?.seasonId || null
  try {
    await Promise.allSettled([
      compStore.loadStandings(competitionId.value, selectedSeasonId.value || undefined),
      compStore.loadGoalscorers(competitionId.value),
      compStore.loadDisciplinary(competitionId.value),
      compStore.loadGroups(competitionId.value),
      compStore.loadFixtures(competitionId.value),
      compStore.loadSeasons(),
      liveStore.loadLive(),
    ])
  } catch (e) {
    error.value = e?.message || 'Failed to load competition data'
  } finally {
    loading.value = false
  }

  // If matches are already in play, load live standings and begin polling.
  if (hasLiveMatches.value) {
    await refreshLiveStandings()
    startLiveStandingsPolling()
  }
  document.addEventListener('visibilitychange', onVisibility)
  loadCoverage()
})

onUnmounted(() => {
  stopLiveStandingsPolling()
  document.removeEventListener('visibilitychange', onVisibility)
})

const standings    = computed(() => compStore.standings || [])
const goalscorers  = computed(() => compStore.topGoalscorers || [])
const disciplinary = computed(() => compStore.topDisciplinary || [])
const groups       = computed(() => compStore.groups || [])
const fixtures     = computed(() => compStore.fixtures || [])

// ── API-Football enrichment (top assists / cards / injuries) ───────────────
// Bridged by the config apiFootballLeagueId; each section is coverage-gated and
// lazy-loaded on first tab open. Absent mapping / coverage → the tab is hidden.
const authStore = useAuthStore()
const afCreds = () => authStore.getAuthQuery() || {}
const afLeagueId = computed(() => getApiFootballLeagueId(competitionId.value))
const afSeason = getApiFootballSeason()
const coverage = ref(null)

function coverageAllows(flag) {
  return coverage.value ? coverage.value[flag] !== false : true
}

async function loadCoverage() {
  if (!afLeagueId.value) return
  try { coverage.value = await fetchLeagueCoverage(afLeagueId.value, afSeason, afCreds()) }
  catch { coverage.value = null }
}

const topAssists = ref([]); const topAssistsLoaded = ref(false); const topAssistsLoading = ref(false)
const topCards = ref([]);   const topCardsLoaded = ref(false);   const topCardsLoading = ref(false)
const injuries = ref([]);   const injuriesLoaded = ref(false);   const injuriesLoading = ref(false)

function mapAssist(item) {
  const st = item.statistics?.[0] || {}
  return {
    id: item.player?.id, name: item.player?.name,
    team: st.team?.name, assists: st.goals?.assists ?? 0, apps: st.games?.appearences ?? 0,
  }
}

async function loadAssists() {
  if (topAssistsLoaded.value || !afLeagueId.value) return
  topAssistsLoading.value = true
  try { topAssists.value = (await fetchTopAssists(afLeagueId.value, afSeason, afCreds())).map(mapAssist) }
  catch { /* empty state */ }
  finally { topAssistsLoaded.value = true; topAssistsLoading.value = false }
}

async function loadCards() {
  if (topCardsLoaded.value || !afLeagueId.value) return
  topCardsLoading.value = true
  try {
    const [yellow, red] = await Promise.all([
      fetchTopYellowCards(afLeagueId.value, afSeason, afCreds()),
      fetchTopRedCards(afLeagueId.value, afSeason, afCreds()),
    ])
    const map = new Map()
    const add = (list) => (list || []).forEach((item) => {
      const st = item.statistics?.[0] || {}
      const id = item.player?.id
      const e = map.get(id) || { id, name: item.player?.name, team: st.team?.name, yellow: 0, red: 0 }
      e.yellow = Math.max(e.yellow, st.cards?.yellow ?? 0)
      e.red = Math.max(e.red, st.cards?.red ?? 0)
      map.set(id, e)
    })
    add(yellow); add(red)
    topCards.value = [...map.values()]
      .sort((a, b) => (b.red * 3 + b.yellow) - (a.red * 3 + a.yellow))
      .slice(0, 25)
  } catch { /* empty state */ }
  finally { topCardsLoaded.value = true; topCardsLoading.value = false }
}

async function loadInjuries() {
  if (injuriesLoaded.value || !afLeagueId.value) return
  injuriesLoading.value = true
  try {
    const rows = await fetchInjuries({ league: afLeagueId.value, season: afSeason }, afCreds())
    const seen = new Set(); const out = []
    for (const item of rows || []) {
      const id = item.player?.id
      if (id && seen.has(id)) continue
      if (id) seen.add(id)
      out.push({ id, name: item.player?.name, team: item.team?.name,
                 type: item.player?.type, reason: item.player?.reason })
    }
    injuries.value = out
  } catch { /* empty state */ }
  finally { injuriesLoaded.value = true; injuriesLoading.value = false }
}

// Lazy-load an enrichment tab the first time it's opened.
watch(tab, (key) => {
  if (key === 'assists') loadAssists()
  else if (key === 'cards') loadCards()
  else if (key === 'injuries') loadInjuries()
})

const tabs = computed(() => [
  { key: 'standings',   label: t('live.standings',   'Standings') },
  { key: 'fixtures',    label: t('live.fixtures',    'Fixtures') },
  { key: 'groups',      label: t('live.groups',      'Groups'),     hide: !groups.value.length },
  { key: 'goalscorers', label: t('live.goalscorers', 'Goalscorers') },
  { key: 'assists',     label: t('competition.topAssists'), hide: !afLeagueId.value || !coverageAllows('top_assists') },
  { key: 'cards',       label: t('competition.topCards'),   hide: !afLeagueId.value || !coverageAllows('top_cards') },
  { key: 'injuries',    label: t('competition.injuries'),   hide: !afLeagueId.value || !coverageAllows('injuries') },
  { key: 'disciplinary', label: t('competition.disciplinary', 'Discipline'), hide: !disciplinary.value.length },
].filter(x => !x.hide))
</script>

<template>
  <main class="comp-view">
    <div class="comp-view__inner">
      <button class="comp-view__back" @click="router.back()">← {{ t('common.back', 'Back') }}</button>

      <div class="comp-view__head">
        <div class="comp-view__title-wrap">
          <h1 class="comp-view__title">{{ competitionName }}</h1>
          <span v-if="tierBadge" class="comp-view__badge">{{ tierBadge }}</span>
          <span v-if="competition?.country" class="comp-view__country">{{ competition.country }}</span>
        </div>
        <RouterLink :to="`/live/standings/${competitionId}`" class="comp-view__standings-link">
          {{ t('live.fullStandings', 'Full Standings') }} →
        </RouterLink>
      </div>

      <!-- Tabs -->
      <div class="comp-view__tabs" role="tablist">
        <button
          v-for="tb in tabs"
          :key="tb.key"
          role="tab"
          :aria-selected="tab === tb.key"
          class="comp-view__tab"
          :class="{ 'comp-view__tab--active': tab === tb.key }"
          @click="tab = tb.key"
        >{{ tb.label }}</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="comp-view__loading">
        <div v-for="n in 8" :key="n" class="comp-view__skel"></div>
      </div>

      <div v-else-if="error" class="comp-view__error">{{ error }}</div>

      <template v-else>
        <div v-show="tab === 'standings'" role="tabpanel">
          <label v-if="seasons.length && !showLiveStandings" class="comp-view__season">
            <span>{{ t('competition.season') }}</span>
            <select v-model.number="selectedSeasonId" @change="loadStandingsForSeason">
              <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </label>

          <!-- Live standings while matches are in play -->
          <template v-if="showLiveStandings">
            <div class="comp-view__live-badge">
              <span class="comp-view__live-dot" aria-hidden="true"></span>
              {{ t('competition.liveStandings') }}
            </div>
            <LiveStandingsTable :rows="liveStandings" :prev-rows="prevLiveRows" :live-label="t('standings.live')" />
          </template>

          <div v-else-if="standingsLoading" class="comp-view__empty">{{ t('live.loading', 'Loading…') }}</div>
          <StandingsTable
            v-else-if="standings.length"
            :rows="standings"
            :show-goals="true"
            :show-form="true"
            :form-label="t('competition.form')"
          />
          <div v-else class="comp-view__empty">{{ t('competition.noSeasonData') }}</div>
        </div>

        <div v-show="tab === 'fixtures'" role="tabpanel">
          <div v-if="fixtures.length" class="comp-view__fixtures">
            <RouterLink
              v-for="(m, i) in fixtures"
              :key="m.id || i"
              :to="`/live/match/${m.id}`"
              class="comp-view__fixture"
              @click="rememberSelectedMatch(m)"
            >
              <span class="comp-view__fx-date">{{ kickoffStr(m) }}</span>
              <span class="comp-view__fx-home">{{ m.home_name || m.home?.name || '—' }}</span>
              <span class="comp-view__fx-score">{{ m.score || m.ft_score || m.time || '—' }}</span>
              <span class="comp-view__fx-away">{{ m.away_name || m.away?.name || '—' }}</span>
            </RouterLink>
          </div>
          <div v-else class="comp-view__empty">{{ t('live.noFixtures', 'No fixtures available') }}</div>
        </div>

        <div v-show="tab === 'groups'" role="tabpanel">
          <GroupStageGrid
            v-if="groups.length"
            :groups="groups"
            :competition-id="competitionId"
            :live-matches="liveMatchesForComp"
          />
          <div v-else class="comp-view__empty">{{ t('live.noGroups', 'No group data available') }}</div>
        </div>

        <div v-show="tab === 'goalscorers'" role="tabpanel">
          <GoalscorersTable v-if="goalscorers.length" :scorers="goalscorers" />
          <div v-else class="comp-view__empty">{{ t('live.noGoalscorers', 'No goalscorer data available') }}</div>
        </div>

        <!-- Top Assists (API-Football) -->
        <div v-show="tab === 'assists'" role="tabpanel">
          <p v-if="topAssistsLoading" class="comp-view__empty">{{ t('matchCenter.loading') }}</p>
          <div v-else-if="topAssists.length" class="comp-view__aftable-wrap">
            <table class="comp-view__aftable">
              <thead><tr>
                <th>#</th><th class="comp-view__aftable-l">{{ t('competition.player') }}</th>
                <th>{{ t('competition.team') }}</th><th :title="t('matchCenter.assist')">{{ t('competition.assistsCol') }}</th>
                <th :title="t('competition.appsCol')">{{ t('competition.appsCol') }}</th>
              </tr></thead>
              <tbody>
                <tr v-for="(p, i) in topAssists" :key="p.id || i">
                  <td class="comp-view__afrank">{{ i + 1 }}</td>
                  <td class="comp-view__afname">{{ p.name }}</td>
                  <td class="comp-view__afteam">{{ p.team }}</td>
                  <td class="comp-view__afprimary">{{ p.assists }}</td>
                  <td>{{ p.apps }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="comp-view__empty">{{ t('competition.noAfData') }}</div>
        </div>

        <!-- Top Cards (API-Football) -->
        <div v-show="tab === 'cards'" role="tabpanel">
          <p v-if="topCardsLoading" class="comp-view__empty">{{ t('matchCenter.loading') }}</p>
          <div v-else-if="topCards.length" class="comp-view__aftable-wrap">
            <table class="comp-view__aftable">
              <thead><tr>
                <th>#</th><th class="comp-view__aftable-l">{{ t('competition.player') }}</th>
                <th>{{ t('competition.team') }}</th><th>🟨</th><th>🟥</th>
              </tr></thead>
              <tbody>
                <tr v-for="(p, i) in topCards" :key="p.id || i">
                  <td class="comp-view__afrank">{{ i + 1 }}</td>
                  <td class="comp-view__afname">{{ p.name }}</td>
                  <td class="comp-view__afteam">{{ p.team }}</td>
                  <td class="comp-view__afyellow">{{ p.yellow }}</td>
                  <td class="comp-view__afred">{{ p.red }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="comp-view__empty">{{ t('competition.noAfData') }}</div>
        </div>

        <!-- Injuries (API-Football) -->
        <div v-show="tab === 'injuries'" role="tabpanel">
          <p v-if="injuriesLoading" class="comp-view__empty">{{ t('matchCenter.loading') }}</p>
          <ul v-else-if="injuries.length" class="comp-view__injuries">
            <li v-for="(p, i) in injuries" :key="p.id || i" class="comp-view__injury">
              <span class="comp-view__injury-icon" aria-hidden="true">🩹</span>
              <span class="comp-view__injury-info">
                <span class="comp-view__injury-name">{{ p.name }}</span>
                <span class="comp-view__injury-team">{{ p.team }}</span>
              </span>
              <span class="comp-view__injury-reason">
                <span v-if="p.reason" class="comp-view__injury-why">{{ p.reason }}</span>
                <span v-if="p.type" class="comp-view__injury-type">{{ p.type }}</span>
              </span>
            </li>
          </ul>
          <div v-else class="comp-view__empty">{{ t('competition.noInjuries') }}</div>
        </div>

        <div v-show="tab === 'disciplinary'" role="tabpanel">
          <DisciplinaryTable v-if="disciplinary.length" :players="disciplinary" />
          <div v-else class="comp-view__empty">{{ t('competition.noDisciplinary') }}</div>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.comp-view {
  padding: 32px var(--content-padding);
}

.comp-view__inner {
  max-width: 960px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comp-view__back {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: var(--transition-default);
}

.comp-view__back:hover { color: var(--color-text); }

.comp-view__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.comp-view__title-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.comp-view__title {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
}

.comp-view__badge {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  padding: 3px 8px;
  border-radius: 999px;
}

.comp-view__country {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.comp-view__standings-link {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
  white-space: nowrap;
}

.comp-view__live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
}

.comp-view__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-red, #e53935);
  animation: comp-live-pulse 1.2s ease-in-out infinite;
}

@keyframes comp-live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.comp-view__season {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.comp-view__season select {
  min-height: 40px;
  padding: 6px 12px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
}

.comp-view__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.comp-view__tab {
  padding: 10px 18px;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: var(--transition-default);
  min-height: 44px;
}

.comp-view__tab:hover { color: var(--color-text); }

.comp-view__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.comp-view__fixtures { display: flex; flex-direction: column; gap: 4px; }

.comp-view__fixture {
  display: grid;
  grid-template-columns: 90px 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  font-size: 13px;
  transition: var(--transition-default);
}

.comp-view__fixture:hover {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.comp-view__fx-date {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.comp-view__fx-home {
  text-align: right;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comp-view__fx-away {
  text-align: left;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comp-view__fx-score {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 14px;
  min-width: 52px;
  text-align: center;
  flex-shrink: 0;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  border-radius: 4px;
}

.comp-view__loading { display: flex; flex-direction: column; gap: 6px; }

.comp-view__skel {
  height: 40px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.comp-view__error,
.comp-view__empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border-radius: var(--radius-card);
}

/* API-Football enrichment tables */
.comp-view__aftable-wrap { overflow-x: auto; }
.comp-view__aftable { width: 100%; border-collapse: collapse; font-size: 13px; }
.comp-view__aftable th,
.comp-view__aftable td {
  padding: 9px 8px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}
.comp-view__aftable th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}
.comp-view__aftable-l, .comp-view__afname { text-align: left; min-width: 120px; }
.comp-view__afrank { color: var(--color-text-secondary); font-size: 12px; }
.comp-view__afname { font-weight: 600; }
.comp-view__afteam { font-size: 12px; color: var(--color-text-secondary); }
.comp-view__afprimary { font-weight: 800; color: var(--color-primary); }
.comp-view__afyellow { font-weight: 700; }
.comp-view__afred { font-weight: 700; }

.comp-view__injuries { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.comp-view__injury {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
}
.comp-view__injury-icon { font-size: 16px; }
.comp-view__injury-info { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.comp-view__injury-name { font-weight: 600; font-size: 13px; color: var(--color-text); }
.comp-view__injury-team { font-size: 11px; color: var(--color-text-secondary); }
.comp-view__injury-reason { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; text-align: right; }
.comp-view__injury-why { font-size: 12px; color: var(--color-text); }
.comp-view__injury-type { font-size: 10px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }

@media (max-width: 600px) {
  .comp-view__fixture { grid-template-columns: 64px 1fr auto 1fr; font-size: 12px; }
  .comp-view__tabs { overflow-x: auto; }
  .comp-view__tab { padding: 10px 12px; white-space: nowrap; }
}
</style>
