<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLiveScoreStore } from '@/stores/livescore'
import { LIVESCORE_POLL } from '@/config/livescore'
import { parseScoreString, matchMinuteLabel, isLiveStatus, isFinishedStatus } from '@/utils/liveScoreFormat'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const store  = useLiveScoreStore()

const matchId = computed(() => route.params.matchId)
const match   = computed(() => store.matchById(matchId.value) || store.selectedMatch)

const activeTab = ref('summary')
const TABS = ['summary', 'commentary', 'stats', 'lineups']
const PLAN_LIMITED_TABS = new Set(['commentary', 'stats', 'lineups'])

const score  = computed(() => parseScoreString(match.value?.scores?.score))
const minute = computed(() => matchMinuteLabel(match.value))
const live   = computed(() => isLiveStatus(match.value?.status))
const finished = computed(() => isFinishedStatus(match.value?.status))

// ── Event helpers ────────────────────────────────────────────────────────────

const KEY_EVENTS = new Set([
  'GOAL', 'GOAL_PENALTY', 'OWN_GOAL',
  'YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD',
  'SUBSTITUTION', 'MISSED_PENALTY',
])

const EVENT_ICON = {
  GOAL:            '⚽',
  GOAL_PENALTY:    '⚽ P',
  OWN_GOAL:        '⚽ OG',
  YELLOW_CARD:     '🟨',
  RED_CARD:        '🟥',
  YELLOW_RED_CARD: '🟥',
  SUBSTITUTION:    '🔄',
  MISSED_PENALTY:  '❌',
}

const summaryEvents = computed(() =>
  store.selectedMatchEvents
    .filter(e => KEY_EVENTS.has((e.event || e.type || '').toUpperCase()))
    .sort((a, b) => Number(a.time ?? a.sort ?? 0) - Number(b.time ?? b.sort ?? 0))
)

function str(v) { return typeof v === 'string' && v ? v : null }

function eventIcon(ev) {
  return EVENT_ICON[(ev.event || ev.type || '').toUpperCase()] || '•'
}

function playerName(ev) {
  const type = (ev.event || ev.type || '').toUpperCase()
  if (type === 'SUBSTITUTION') {
    return ev.player_out?.name || str(ev.player_out) || ev.player_out_name
      || ev.player?.name || ev.player?.full_name || str(ev.player) || ev.player_name || ''
  }
  return ev.player?.name || ev.player?.full_name || str(ev.player) || ev.player_name
    || ev.player1?.name || str(ev.player1) || ev.scorer?.name || str(ev.scorer)
    || ev.home_player || ev.away_player || ''
}

function secondPlayerName(ev) {
  const type = (ev.event || ev.type || '').toUpperCase()
  if (type === 'SUBSTITUTION') {
    return ev.player_in?.name || str(ev.player_in) || ev.player_in_name
      || ev.player2?.name || str(ev.player2) || ''
  }
  return ev.assist?.name || ev.assist?.full_name || str(ev.assist) || ev.assist_name
    || ev.assist_player_name || ev.player2?.name || str(ev.player2)
    || ev.info?.name || str(ev.info) || ''
}

function isTruthy(v) { return v === true || v === 1 || v === '1' || v === 'true' }
function isFalsy(v)  { return v === false || v === 0 || v === '0' || v === 'false' }

function eventSide(ev) {
  if (isTruthy(ev.is_home)) return 'home'
  if (isTruthy(ev.is_away)) return 'away'
  if (isTruthy(ev.home))    return 'home'
  if (isFalsy(ev.home) && ev.home !== undefined && ev.home !== null) return 'away'
  if (ev.team === 'home' || ev.side === 'home') return 'home'
  if (ev.team === 'away' || ev.side === 'away') return 'away'
  const homeId  = match.value?.home?.id  ?? match.value?.home_id
  const awayId  = match.value?.away?.id  ?? match.value?.away_id
  const evTeamId = ev.team_id ?? ev.club_id
  if (evTeamId != null && homeId != null && String(evTeamId) === String(homeId)) return 'home'
  if (evTeamId != null && awayId != null && String(evTeamId) === String(awayId)) return 'away'
  const homeName = (match.value?.home?.name || match.value?.home_name || '').toLowerCase()
  const awayName = (match.value?.away?.name || match.value?.away_name || '').toLowerCase()
  const evTeam   = (str(ev.team) || str(ev.team_name) || str(ev.club) || '').toLowerCase()
  if (evTeam && homeName && evTeam === homeName) return 'home'
  if (evTeam && awayName && evTeam === awayName) return 'away'
  return ''
}

function eventTeamName(ev) {
  const direct = str(ev.team_name)
    || (str(ev.team) !== 'home' && str(ev.team) !== 'away' ? str(ev.team) : null)
  if (direct) return direct
  const s = eventSide(ev)
  if (s === 'home') return match.value?.home?.name || match.value?.home_name || ''
  if (s === 'away') return match.value?.away?.name || match.value?.away_name || ''
  return ''
}

function sideClass(ev) {
  const s = eventSide(ev)
  if (s === 'home') return 'event-item--home'
  if (s === 'away') return 'event-item--away'
  return ''
}

function tabLabel(tab) {
  return t(`live.${tab}`, tab)
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await store.loadLive()
  await store.fetchMatchDetail(matchId.value)
  store.setupVisibilityPolling(LIVESCORE_POLL.live)
  store.startDetailPolling()
})

onUnmounted(() => {
  store.teardownVisibilityPolling()
  store.clearSelection()
})

watch(matchId, async (id) => {
  store.stopDetailPolling()
  await store.fetchMatchDetail(id)
  store.startDetailPolling()
})
</script>

<template>
  <main class="match-page">

    <!-- Loading skeleton -->
    <template v-if="store.detailLoading && !match">
      <div class="match-frame match-frame--skeleton" aria-busy="true">
        <div class="match-frame__skeleton-bar"></div>
        <div class="match-frame__skeleton-score"></div>
      </div>
    </template>

    <template v-else>
      <!-- ── Player frame ─────────────────────────────────────────────────── -->
      <div class="match-frame" :class="{ 'match-frame--live': live, 'match-frame--finished': finished }">

        <!-- Top nav row -->
        <div class="match-frame__nav">
          <button class="match-frame__back" type="button" @click="router.push({ name: 'Live' })">
            ← {{ t('live.title') }}
          </button>
          <span class="match-frame__competition">
            {{ match?.competition?.name || '' }}
          </span>
          <div class="match-frame__status-pill" :class="{ 'match-frame__status-pill--live': live }">
            <span v-if="live" class="match-frame__live-dot" aria-hidden="true"></span>
            <span v-if="live">{{ t('live.statusLive') }} · {{ minute }}</span>
            <span v-else-if="finished">{{ t('live.statusFinished') }}</span>
            <span v-else-if="minute">{{ minute }}</span>
            <span v-else>{{ match?.status || '' }}</span>
          </div>
        </div>

        <!-- Scoreboard -->
        <div class="match-frame__scoreboard" role="region" :aria-label="`${match?.home?.name} vs ${match?.away?.name}`">

          <!-- Home team -->
          <div class="match-frame__team match-frame__team--home">
            <div class="match-frame__logo-wrap">
              <img
                v-if="match?.home?.logo"
                :src="match.home.logo"
                :alt="match.home.name"
                class="match-frame__logo"
                width="64"
                height="64"
                loading="eager"
              />
              <div v-else class="match-frame__logo-placeholder" aria-hidden="true">
                {{ (match?.home?.name || '?')[0] }}
              </div>
            </div>
            <span class="match-frame__team-name">{{ match?.home?.name || '—' }}</span>
          </div>

          <!-- Score -->
          <div class="match-frame__score-block" aria-label="Score">
            <span class="match-frame__goal">{{ score.home ?? '–' }}</span>
            <span class="match-frame__colon" aria-hidden="true">:</span>
            <span class="match-frame__goal">{{ score.away ?? '–' }}</span>
          </div>

          <!-- Away team -->
          <div class="match-frame__team match-frame__team--away">
            <div class="match-frame__logo-wrap">
              <img
                v-if="match?.away?.logo"
                :src="match.away.logo"
                :alt="match.away.name"
                class="match-frame__logo"
                width="64"
                height="64"
                loading="eager"
              />
              <div v-else class="match-frame__logo-placeholder" aria-hidden="true">
                {{ (match?.away?.name || '?')[0] }}
              </div>
            </div>
            <span class="match-frame__team-name">{{ match?.away?.name || '—' }}</span>
          </div>
        </div>

        <!-- Frame footer (venue / round info if available) -->
        <div v-if="match?.venue || match?.round" class="match-frame__meta">
          <span v-if="match?.venue">{{ match.venue }}</span>
          <span v-if="match?.venue && match?.round" aria-hidden="true">·</span>
          <span v-if="match?.round">{{ match.round }}</span>
        </div>
      </div>

      <!-- ── Tabs + content ───────────────────────────────────────────────── -->
      <div class="match-page__body">

        <!-- Error banner -->
        <div v-if="store.detailError && !store.detailLoading" class="match-page__error" role="alert">
          <span v-if="store.detailError === 'match_id_missing'">Match data unavailable.</span>
          <span v-else>{{ t('live.errorLoad') }}</span>
        </div>

        <!-- Tab bar -->
        <div class="match-page__tabs" role="tablist" :aria-label="t('live.tabsLabel')">
          <button
            v-for="tab in TABS"
            :key="tab"
            type="button"
            role="tab"
            class="match-page__tab"
            :class="{ 'match-page__tab--active': activeTab === tab }"
            :aria-selected="activeTab === tab"
            @click="activeTab = tab"
          >
            {{ tabLabel(tab) }}
          </button>
        </div>

        <!-- Panel -->
        <div class="match-page__panel" role="tabpanel">

          <!-- Summary -->
          <template v-if="activeTab === 'summary'">
            <p v-if="store.detailLoading" class="match-page__hint">
              {{ t('live.loadingEvents') }}
            </p>
            <p v-else-if="!summaryEvents.length" class="match-page__hint">
              {{ t('live.noEvents') }}
            </p>
            <ul v-else class="event-list" aria-label="Key events">
              <li
                v-for="(ev, i) in summaryEvents"
                :key="ev.id || i"
                class="event-item"
                :class="sideClass(ev)"
              >
                <span class="event-item__min">{{ ev.time ?? ev.minute ?? ev.sort ?? '' }}'</span>
                <span class="event-item__icon" aria-hidden="true">{{ eventIcon(ev) }}</span>
                <span class="event-item__body">
                  <span class="event-item__row">
                    <span class="event-item__player">{{ playerName(ev) }}</span>
                    <span v-if="eventTeamName(ev)" class="event-item__team">({{ eventTeamName(ev) }})</span>
                  </span>
                  <span v-if="secondPlayerName(ev)" class="event-item__row event-item__second">
                    <span>
                      {{ (ev.event || ev.type || '').toUpperCase() === 'SUBSTITUTION' ? '↑' : 'Assist:' }}
                      {{ secondPlayerName(ev) }}
                    </span>
                  </span>
                </span>
              </li>
            </ul>
          </template>

          <!-- Commentary / Stats / Lineups — paid API plan required -->
          <template v-else-if="PLAN_LIMITED_TABS.has(activeTab)">
            <p class="match-page__plan-notice">
              {{ tabLabel(activeTab) }} data requires an upgraded API plan.
            </p>
          </template>

        </div>
      </div>
    </template>
  </main>
</template>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────────────────── */
.match-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

/* ── Player frame ────────────────────────────────────────────────────────── */
.match-frame {
  background: #0a0f14;
  color: #e6edf3;
  padding: 0 0 20px;
  position: relative;
  overflow: hidden;
}

/* Subtle pitch-line watermark */
.match-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 110%, rgba(27, 94, 32, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 120% 40% at 50% 100%, rgba(27, 94, 32, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

/* Loading skeleton variant */
.match-frame--skeleton {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  justify-content: center;
  align-items: center;
}

.match-frame__skeleton-bar {
  width: 260px;
  height: 14px;
  border-radius: 8px;
  background: rgba(255,255,255,0.08);
  animation: frame-pulse 1.4s ease-in-out infinite;
}

.match-frame__skeleton-score {
  width: 200px;
  height: 60px;
  border-radius: 12px;
  background: rgba(255,255,255,0.06);
  animation: frame-pulse 1.4s ease-in-out infinite 0.2s;
}

@keyframes frame-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ── Nav row ─────────────────────────────────────────────────────────────── */
.match-frame__nav {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px 0;
  gap: 12px;
}

.match-frame__back {
  border: none;
  background: none;
  color: rgba(230, 237, 243, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 0;
  white-space: nowrap;
  transition: color 0.15s;
  min-height: 44px;
}

.match-frame__back:hover {
  color: #e6edf3;
}

.match-frame__competition {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(230, 237, 243, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 8px;
}

/* Status pill */
.match-frame__status-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(230, 237, 243, 0.55);
  white-space: nowrap;
}

.match-frame__status-pill--live {
  color: #69f0ae;
}

.match-frame__live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #69f0ae;
  flex-shrink: 0;
  animation: live-pulse 1.2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.85); }
}

/* ── Scoreboard ──────────────────────────────────────────────────────────── */
.match-frame__scoreboard {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 28px 24px 16px;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.match-frame__team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.match-frame__team--home {
  align-items: flex-end;
  text-align: right;
}

.match-frame__team--away {
  align-items: flex-start;
  text-align: left;
}

.match-frame__logo-wrap {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.match-frame__logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.match-frame__logo-placeholder {
  font-size: 26px;
  font-weight: 800;
  color: rgba(230, 237, 243, 0.5);
  font-family: var(--font-heading);
  text-transform: uppercase;
}

.match-frame__team-name {
  font-family: var(--font-heading);
  font-size: clamp(13px, 3.5vw, 18px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #e6edf3;
  line-height: 1.1;
}

/* Score center */
.match-frame__score-block {
  display: flex;
  align-items: center;
  gap: 4px;
}

.match-frame__goal {
  font-family: var(--font-heading);
  font-size: clamp(48px, 10vw, 72px);
  font-weight: 900;
  color: #ffffff;
  line-height: 1;
  letter-spacing: -0.02em;
  min-width: 1ch;
  text-align: center;
}

.match-frame__colon {
  font-family: var(--font-heading);
  font-size: clamp(32px, 7vw, 52px);
  font-weight: 900;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1;
  padding: 0 4px;
}

/* Frame footer */
.match-frame__meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(230, 237, 243, 0.4);
  letter-spacing: 0.06em;
  padding: 4px 20px 0;
}

/* ── Body (tabs + panel) ─────────────────────────────────────────────────── */
.match-page__body {
  flex: 1;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  padding: 0 var(--content-padding, 20px) 64px;
}

.match-page__error {
  margin: 16px 0 0;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: #c62828;
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid rgba(198, 40, 40, 0.2);
}

/* Tabs */
.match-page__tabs {
  display: flex;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  overflow-x: auto;
  scrollbar-width: none;
  margin-top: 4px;
}

.match-page__tabs::-webkit-scrollbar { display: none; }

.match-page__tab {
  flex-shrink: 0;
  padding: 14px 16px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: var(--transition-default);
  min-height: 44px;
}

.match-page__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.match-page__tab:hover:not(.match-page__tab--active) {
  color: var(--color-text);
}

/* Panel */
.match-page__panel {
  padding: 20px 0;
}

.match-page__hint {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.match-page__plan-notice {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  font-style: italic;
}

/* ── Event list ──────────────────────────────────────────────────────────── */
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  display: grid;
  grid-template-columns: 32px 24px 1fr;
  align-items: start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-card, 12px);
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
  transition: var(--transition-default);
}

.event-item:hover {
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
}

.event-item--home {
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
}

.event-item--away {
  background: color-mix(in srgb, var(--color-text) 3%, var(--color-surface));
}

.event-item__min {
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text-secondary);
  text-align: right;
  padding-top: 2px;
  font-variant-numeric: tabular-nums;
}

.event-item__icon {
  font-size: 16px;
  line-height: 1.3;
}

.event-item__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.event-item__row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.event-item__player {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.event-item__team {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.event-item__second {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .match-frame__scoreboard {
    padding: 20px 16px 12px;
    gap: 4px;
  }

  .match-frame__logo-wrap {
    width: 48px;
    height: 48px;
  }

  .match-frame__logo {
    width: 38px;
    height: 38px;
  }
}
</style>
