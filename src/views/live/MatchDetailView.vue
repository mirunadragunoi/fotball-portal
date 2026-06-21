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

const isPlaying = ref(true)

const score    = computed(() => parseScoreString(match.value?.scores?.score))
const minute   = computed(() => matchMinuteLabel(match.value))
const live     = computed(() => isLiveStatus(match.value?.status))
const finished = computed(() => isFinishedStatus(match.value?.status))

const KEY_EVENTS = new Set([
  'GOAL', 'GOAL_PENALTY', 'OWN_GOAL',
  'YELLOW_CARD', 'RED_CARD', 'YELLOW_RED_CARD',
  'SUBSTITUTION', 'MISSED_PENALTY',
])

const GOAL_TYPES = new Set(['GOAL', 'GOAL_PENALTY', 'OWN_GOAL'])

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

// Same list, newest first — used by the right-side summary panel. The
// ascending `summaryEvents` is kept for the scoreboard goal lists, which
// read more naturally in chronological order.
const summaryEventsDescending = computed(() => [...summaryEvents.value].reverse())

const homeGoals = computed(() =>
  summaryEvents.value.filter(e =>
    GOAL_TYPES.has((e.event || e.type || '').toUpperCase()) && eventSide(e) === 'home'
  )
)

const awayGoals = computed(() =>
  summaryEvents.value.filter(e =>
    GOAL_TYPES.has((e.event || e.type || '').toUpperCase()) && eventSide(e) === 'away'
  )
)

// All goals regardless of side — used as fallback when eventSide can't determine home/away
const allGoals = computed(() =>
  summaryEvents.value.filter(e =>
    GOAL_TYPES.has((e.event || e.type || '').toUpperCase())
  )
)

// True when we have side-attributed goals; false means API didn't return side info
const hasSidedGoals = computed(() => homeGoals.value.length > 0 || awayGoals.value.length > 0)

const commentaryDescending = computed(() =>
  [...store.selectedMatchCommentary].sort((a, b) => {
    const ta = Number(a.minute ?? a.time ?? a.sort ?? 0)
    const tb = Number(b.minute ?? b.time ?? b.sort ?? 0)
    return tb - ta
  })
)

const statsNormalized = computed(() =>
  store.selectedMatchStats
    .map(stat => {
      const hv = parseFloat(stat.home_value ?? stat.home ?? 0) || 0
      const av = parseFloat(stat.away_value ?? stat.away ?? 0) || 0
      const total = hv + av
      return {
        type: stat.type || stat.name || stat.stat_name || '',
        homeVal: String(stat.home ?? hv),
        awayVal: String(stat.away ?? av),
        homePercent: total > 0 ? Math.round((hv / total) * 100) : 50,
      }
    })
    .filter(s => s.type)
)

function asArr(v) { return Array.isArray(v) ? v : [] }

const lineups = computed(() => {
  const raw = store.selectedMatchLineups
  if (!raw || typeof raw !== 'object') return null
  const normalize = (side) => {
    const s = raw[side] || {}
    return {
      name: s.name || s.team_name || (side === 'home' ? match.value?.home?.name : match.value?.away?.name) || '',
      formation: s.formation || '',
      starting: asArr(s.starting_xi || s.starting || s.starters || []),
      substitutes: asArr(s.substitutes || s.subs || []),
    }
  }
  const home = normalize('home')
  const away = normalize('away')
  if (!home.starting.length && !away.starting.length) return null
  return { home, away }
})

const progressPercent = computed(() => Math.min(100, ((parseInt(minute.value) || 0) / 90) * 100))

const matchTimeDisplay = computed(() => {
  const min = parseInt(minute.value) || 0
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}:00`
})

// ── Event helpers ─────────────────────────────────────────────────────────────

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
  const homeId   = match.value?.home?.id  ?? match.value?.home_id
  const awayId   = match.value?.away?.id  ?? match.value?.away_id
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

function commentaryText(c) {
  return c.comment || c.text || c.description || c.commentary || c.entry || ''
}

function commentaryMinute(c) {
  const m = c.minute ?? c.time ?? c.sort
  return m != null ? `${m}'` : ''
}

function lineupsPlayerName(p) {
  return p?.name || p?.full_name || p?.player_name || str(p) || ''
}

function lineupsPlayerNumber(p) {
  return p?.number ?? p?.shirt_number ?? p?.jersey_number ?? ''
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

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

    <!-- ── Loading skeleton ──────────────────────────────────────────────────── -->
    <template v-if="store.detailLoading && !match">
      <div class="skel-layout" aria-busy="true">
        <div class="skel-player">
          <div class="skel-bar skel-bar--lg"></div>
          <div class="skel-score-row">
            <div class="skel-circle"></div>
            <div class="skel-score-nums"></div>
            <div class="skel-circle"></div>
          </div>
          <div class="skel-stream">
            <div class="skel-entry" v-for="n in 8" :key="n"></div>
          </div>
          <div class="skel-controls"></div>
        </div>
        <div class="skel-sections">
          <div class="skel-section" v-for="n in 3" :key="n">
            <div class="skel-bar skel-bar--sm"></div>
            <div class="skel-entry" v-for="m in 4" :key="m"></div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>

      <!--
        ════════════════════════════════════════════════════════════════════
        MAIN LAYOUT
        Desktop : player-col (left, sticky) + details-col (right, scrollable)
        Mobile  : player-col only (full width, looks like a video player)
        ════════════════════════════════════════════════════════════════════
      -->
      <div class="page-layout">

        <!-- ═══════════════════════════════════════════════════════════════
             VIDEO PLAYER COLUMN
             This is the "fake video player": score at top, commentary
             stream as the "video content", fake controls at the bottom.
             ═══════════════════════════════════════════════════════════════ -->
        <div class="player-col">
          <div class="vplayer" :class="{ 'vplayer--live': live, 'vplayer--finished': finished }">

            <!-- Pitch glow backdrop (CSS ::before) -->

            <!-- ── Nav bar ─────────────────────────────────────────────── -->
            <div class="vplayer__nav">
              <button
                class="vplayer__back"
                type="button"
                @click="router.push({ name: 'Live' })"
                aria-label="Back to live matches"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                <span>{{ t('live.title') }}</span>
              </button>
              <div class="vplayer__status" :class="{ 'vplayer__status--live': live }">
                <span v-if="live" class="vplayer__live-dot" aria-hidden="true"></span>
                <span v-if="live">LIVE · {{ minute }}'</span>
                <span v-else-if="finished">FINAL</span>
                <span v-else>{{ match?.status || '' }}</span>
              </div>
            </div>

            <!-- ── Compact scoreboard ─────────────────────────────────── -->
            <div
              class="vplayer__board"
              role="region"
              :aria-label="`${match?.home?.name} vs ${match?.away?.name}`"
            >
              <!-- Home side -->
              <div class="vplayer__side vplayer__side--home">
                <div class="vplayer__logo-wrap">
                  <img
                    v-if="match?.home?.logo"
                    :src="match.home.logo"
                    :alt="match.home.name"
                    class="vplayer__logo"
                    width="64"
                    height="64"
                    loading="eager"
                  />
                  <div v-else class="vplayer__logo-ph" aria-hidden="true">
                    {{ (match?.home?.name || '?')[0] }}
                  </div>
                </div>
                <span class="vplayer__team-name">{{ match?.home?.name || '—' }}</span>
                <!-- Show home goals only when we can attribute by side -->
                <ul v-if="hasSidedGoals && homeGoals.length" class="vplayer__goals" aria-label="Home goals">
                  <li v-for="(g, i) in homeGoals" :key="g.id || i" class="vplayer__goal">
                    <span aria-hidden="true">⚽</span>
                    <span class="vplayer__goal-name">{{ playerName(g) }}</span>
                    <span class="vplayer__goal-min">{{ g.time ?? g.minute ?? g.sort ?? '' }}'</span>
                  </li>
                </ul>
              </div>

              <!-- Score -->
              <div class="vplayer__score-wrap">
                <div class="vplayer__score" aria-label="Score">
                  <span class="vplayer__score-num">{{ score.home ?? '–' }}</span>
                  <span class="vplayer__score-sep" aria-hidden="true">:</span>
                  <span class="vplayer__score-num">{{ score.away ?? '–' }}</span>
                </div>
                <!-- Fallback: all goals in center when side is unknown -->
                <ul v-if="!hasSidedGoals && allGoals.length" class="vplayer__goals vplayer__goals--center" aria-label="Goals">
                  <li v-for="(g, i) in allGoals" :key="g.id || i" class="vplayer__goal vplayer__goal--center">
                    <span aria-hidden="true">⚽</span>
                    <span class="vplayer__goal-min">{{ g.time ?? g.minute ?? g.sort ?? '' }}'</span>
                    <span class="vplayer__goal-name">{{ playerName(g) }}</span>
                    <span v-if="eventTeamName(g)" class="vplayer__goal-team">({{ eventTeamName(g) }})</span>
                  </li>
                </ul>
              </div>

              <!-- Away side -->
              <div class="vplayer__side vplayer__side--away">
                <div class="vplayer__logo-wrap">
                  <img
                    v-if="match?.away?.logo"
                    :src="match.away.logo"
                    :alt="match.away.name"
                    class="vplayer__logo"
                    width="64"
                    height="64"
                    loading="eager"
                  />
                  <div v-else class="vplayer__logo-ph" aria-hidden="true">
                    {{ (match?.away?.name || '?')[0] }}
                  </div>
                </div>
                <span class="vplayer__team-name">{{ match?.away?.name || '—' }}</span>
                <!-- Show away goals only when we can attribute by side -->
                <ul v-if="hasSidedGoals && awayGoals.length" class="vplayer__goals vplayer__goals--away" aria-label="Away goals">
                  <li v-for="(g, i) in awayGoals" :key="g.id || i" class="vplayer__goal">
                    <span aria-hidden="true">⚽</span>
                    <span class="vplayer__goal-name">{{ playerName(g) }}</span>
                    <span class="vplayer__goal-min">{{ g.time ?? g.minute ?? g.sort ?? '' }}'</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- ── Commentary stream ("the video") ───────────────────── -->
            <div class="vplayer__stream-wrap">
              <div class="vplayer__stream-label" aria-hidden="true">
                <span v-if="live" class="vplayer__stream-dot"></span>
                <span>{{ live ? 'Live Commentary' : 'Match Commentary' }}</span>
              </div>

              <div
                class="vplayer__stream"
                role="log"
                aria-live="polite"
                aria-label="Live commentary stream"
              >
                <template v-if="commentaryDescending.length">
                  <div
                    v-for="(c, i) in commentaryDescending"
                    :key="c.id || i"
                    class="vplayer__entry"
                    :class="{ 'vplayer__entry--latest': i === 0 }"
                  >
                    <span v-if="commentaryMinute(c)" class="vplayer__entry-min">{{ commentaryMinute(c) }}</span>
                    <span class="vplayer__entry-text">{{ commentaryText(c) }}</span>
                  </div>
                </template>
                <div v-else class="vplayer__stream-empty">
                  <span>Commentary will appear here during the match</span>
                </div>
              </div>

              <!-- Gradient fade into controls -->
              <div class="vplayer__stream-fade" aria-hidden="true"></div>
            </div>

            <!-- ── Fake video controls ────────────────────────────────── -->
            <div class="vplayer__controls" aria-label="Player controls">

              <!-- Competition / venue line -->
              <div v-if="match?.competition?.name" class="vplayer__meta-line">
                <span>{{ match.competition.name }}</span>
                <span v-if="match?.venue">· {{ match.venue }}</span>
                <span v-if="match?.round">· {{ match.round }}</span>
              </div>

              <!-- Timeline progress bar -->
              <div
                class="vplayer__timeline"
                role="progressbar"
                :aria-valuenow="progressPercent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  class="vplayer__timeline-fill"
                  :style="{ width: progressPercent + '%' }"
                >
                  <div class="vplayer__timeline-thumb" aria-hidden="true"></div>
                </div>
              </div>

              <!-- Controls row -->
              <div class="vplayer__ctrls">
                <div class="vplayer__ctrls-left">
                  <!-- Play / Pause -->
                  <button
                    class="vplayer__btn vplayer__btn--play"
                    type="button"
                    :aria-label="isPlaying ? 'Pause' : 'Play'"
                    @click="isPlaying = !isPlaying"
                  >
                    <!-- Pause icon -->
                    <svg v-if="isPlaying" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="4" width="4" height="16" rx="1"/>
                      <rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                    <!-- Play icon -->
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5,3 19,12 5,21"/>
                    </svg>
                  </button>

                  <!-- Next -->
                  <button class="vplayer__btn" type="button" aria-label="Skip forward">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="5,4 15,12 5,20"/>
                      <rect x="15" y="4" width="4" height="16" rx="1"/>
                    </svg>
                  </button>

                  <!-- Volume -->
                  <button class="vplayer__btn" type="button" aria-label="Volume">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  </button>

                  <!-- Time -->
                  <span class="vplayer__time">{{ matchTimeDisplay }}</span>
                </div>

                <div class="vplayer__ctrls-right">
                  <!-- Settings -->
                  <button class="vplayer__btn" type="button" aria-label="Settings">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </button>

                  <!-- Picture-in-picture / quality -->
                  <button class="vplayer__btn" type="button" aria-label="Quality">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </button>

                  <!-- Fullscreen -->
                  <button class="vplayer__btn" type="button" aria-label="Fullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="15 3 21 3 21 9"/>
                      <polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/>
                      <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  </button>
                </div>
              </div>

            </div><!-- /vplayer__controls -->

          </div><!-- /vplayer -->
        </div><!-- /player-col -->


        <!-- ═══════════════════════════════════════════════════════════════
             DETAILS COLUMN  (desktop only)
             All sections visible at once — no tabs.
             ═══════════════════════════════════════════════════════════════ -->
        <div class="details-col">

          <div v-if="store.detailError && !store.detailLoading" class="details-col__error" role="alert">
            <span v-if="store.detailError === 'match_id_missing'">Match data unavailable.</span>
            <span v-else>{{ t('live.errorLoad') }}</span>
          </div>

          <!-- ── Key Events ────────────────────────────────────────────── -->
          <section class="ds">
            <div class="ds__hd">
              <span class="ds__icon" aria-hidden="true">📋</span>
              <h2 class="ds__title">{{ t('live.summary', 'Key Events') }}</h2>
            </div>
            <div class="ds__body">
              <p v-if="store.detailLoading" class="ds__hint">{{ t('live.loadingEvents') }}</p>
              <p v-else-if="!summaryEventsDescending.length" class="ds__hint">{{ t('live.noEvents') }}</p>
              <ul v-else class="event-list" aria-label="Key events">
                <li
                  v-for="(ev, i) in summaryEventsDescending"
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
                      {{ (ev.event || ev.type || '').toUpperCase() === 'SUBSTITUTION' ? '↑' : 'Assist:' }}
                      {{ secondPlayerName(ev) }}
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <!-- ── Statistics ────────────────────────────────────────────── -->
          <section class="ds">
            <div class="ds__hd">
              <span class="ds__icon" aria-hidden="true">📊</span>
              <h2 class="ds__title">{{ t('live.stats', 'Statistics') }}</h2>
            </div>
            <div class="ds__body">
              <p v-if="!statsNormalized.length" class="ds__hint">{{ t('live.noStats', 'Statistics not available.') }}</p>
              <div v-else class="stats-grid">
                <div class="stats-grid__teams">
                  <span>{{ match?.home?.name }}</span>
                  <span>{{ match?.away?.name }}</span>
                </div>
                <div v-for="s in statsNormalized" :key="s.type" class="stat-row">
                  <span class="stat-row__val">{{ s.homeVal }}</span>
                  <div class="stat-row__track" :aria-label="`${s.type}: home ${s.homeVal}, away ${s.awayVal}`">
                    <div class="stat-row__fill stat-row__fill--home" :style="{ width: s.homePercent + '%' }"></div>
                    <div class="stat-row__fill stat-row__fill--away" :style="{ width: (100 - s.homePercent) + '%' }"></div>
                  </div>
                  <span class="stat-row__val stat-row__val--r">{{ s.awayVal }}</span>
                  <span class="stat-row__label">{{ s.type }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Lineups ────────────────────────────────────────────────── -->
          <section class="ds ds--last">
            <div class="ds__hd">
              <span class="ds__icon" aria-hidden="true">👕</span>
              <h2 class="ds__title">{{ t('live.lineups', 'Lineups') }}</h2>
            </div>
            <div class="ds__body">
              <p v-if="!lineups" class="ds__hint">{{ t('live.noLineups', 'Lineups not available.') }}</p>
              <div v-else class="lineups">
                <div class="lineups__col" v-for="side in ['home', 'away']" :key="side">
                  <div class="lineups__hd">
                    <span class="lineups__name">{{ lineups[side].name }}</span>
                    <span v-if="lineups[side].formation" class="lineups__formation">{{ lineups[side].formation }}</span>
                  </div>
                  <ul class="lineup-list" :aria-label="`${lineups[side].name} starting XI`">
                    <li v-for="(p, i) in lineups[side].starting" :key="p.id || i" class="lineup-item">
                      <span class="lineup-item__num">{{ lineupsPlayerNumber(p) || (i + 1) }}</span>
                      <span class="lineup-item__name">{{ lineupsPlayerName(p) }}</span>
                    </li>
                  </ul>
                  <template v-if="lineups[side].substitutes.length">
                    <div class="lineups__subs-label">Substitutes</div>
                    <ul class="lineup-list lineup-list--subs" :aria-label="`${lineups[side].name} substitutes`">
                      <li v-for="(p, i) in lineups[side].substitutes" :key="p.id || i" class="lineup-item lineup-item--sub">
                        <span class="lineup-item__num">{{ lineupsPlayerNumber(p) }}</span>
                        <span class="lineup-item__name">{{ lineupsPlayerName(p) }}</span>
                      </li>
                    </ul>
                  </template>
                </div>
              </div>
            </div>
          </section>

        </div><!-- /details-col -->
      </div><!-- /page-layout -->

    </template>
  </main>
</template>

<style scoped>
/* ── Page ────────────────────────────────────────────────────────────────── */
.match-page {
  min-height: 100dvh;
  background: var(--color-bg);
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */
.skel-layout {
  display: grid;
  grid-template-columns: 1fr minmax(300px, 380px);
  min-height: calc(100dvh - var(--header-height, 64px));
}

@media (max-width: 900px) {
  .skel-layout { grid-template-columns: 1fr; }
}

.skel-player {
  background: #0a0f14;
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 16px;
}

.skel-sections {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.skel-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skel-score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.skel-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  animation: sk 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

.skel-score-nums {
  flex: 1;
  height: 40px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  animation: sk 1.4s ease-in-out infinite 0.2s;
}

.skel-stream {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skel-controls {
  height: 68px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  animation: sk 1.4s ease-in-out infinite;
  flex-shrink: 0;
}

.skel-bar {
  border-radius: 6px;
  background: rgba(255,255,255,0.07);
  animation: sk 1.4s ease-in-out infinite;
}

.skel-bar--lg { width: 60%; height: 12px; }
.skel-bar--sm { width: 100px; height: 14px; background: color-mix(in srgb, var(--color-text) 6%, transparent); }

.skel-entry {
  height: 36px;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
  animation: sk 1.4s ease-in-out infinite;
}

@keyframes sk {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE LAYOUT
   Player col: left, dominant (1fr).  Details col: right, narrow (fixed).
   ══════════════════════════════════════════════════════════════════════════ */
.page-layout {
  display: grid;
  grid-template-columns: 1fr minmax(300px, 380px);
  min-height: calc(100dvh - var(--header-height, 64px));
  align-items: start;
}

@media (max-width: 900px) {
  .page-layout {
    grid-template-columns: 1fr;
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   VIDEO PLAYER  (.vplayer)
   ══════════════════════════════════════════════════════════════════════════ */
.player-col {
  position: sticky;
  top: var(--header-height, 64px);
  height: calc(100dvh - var(--header-height, 64px));
  overflow: hidden;
  order: 1;
}

@media (max-width: 900px) {
  .player-col {
    position: static;
    height: 75vh;
    order: 1;
  }
}

/* The player box */
.vplayer {
  position: relative;
  width: 100%;
  height: 100%;
  background: #080d11;
  color: #e6edf3;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Green pitch glow from the bottom */
.vplayer::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 100% 55% at 50% 105%, rgba(27, 94, 32, 0.3) 0%, transparent 65%),
    radial-gradient(ellipse 70% 30% at 50% 0%,   rgba(0, 0, 0, 0.5) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}

/* ── Nav ─────────────────────────────────────────────────────────────────── */
.vplayer__nav {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 6px;
  gap: 10px;
  flex-shrink: 0;
}

.vplayer__back {
  display: flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  color: rgba(230, 237, 243, 0.55);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
  min-height: 44px;
}

.vplayer__back:hover { color: #e6edf3; }

.vplayer__status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: rgba(230, 237, 243, 0.4);
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  white-space: nowrap;
}

.vplayer__status--live {
  color: #69f0ae;
  background: rgba(105, 240, 174, 0.1);
}

.vplayer__live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #69f0ae;
  flex-shrink: 0;
  animation: live-pulse 1.2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.35; transform: scale(0.8); }
}

/* ── Compact scoreboard ──────────────────────────────────────────────────── */
.vplayer__board {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 8px;
  padding: 14px 20px 16px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.vplayer__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.vplayer__side--home { align-items: flex-end; text-align: right; }
.vplayer__side--away { align-items: flex-start; text-align: left; }

.vplayer__logo-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.vplayer__logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.vplayer__logo-ph {
  font-size: 26px;
  font-weight: 800;
  color: rgba(255,255,255,0.35);
  font-family: var(--font-heading);
  text-transform: uppercase;
}

.vplayer__team-name {
  font-family: var(--font-heading);
  font-size: clamp(14px, 2vw, 20px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(230, 237, 243, 0.9);
  line-height: 1.1;
}

/* Score in the middle */
.vplayer__score {
  display: flex;
  align-items: center;
  gap: 0;
  padding-top: 4px;
}

.vplayer__score-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.vplayer__score-num {
  font-family: var(--font-heading);
  font-size: clamp(52px, 6vw, 84px);
  font-weight: 900;
  color: #fff;
  line-height: 1;
  letter-spacing: -0.02em;
  min-width: 1ch;
  text-align: center;
}

.vplayer__score-sep {
  font-family: var(--font-heading);
  font-size: clamp(34px, 4vw, 56px);
  font-weight: 900;
  color: rgba(255,255,255,0.22);
  line-height: 1;
  padding: 0 8px;
}

/* Goal scorers under team name */
.vplayer__goals {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.vplayer__goal {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: rgba(255,255,255,0.72);
  line-height: 1.45;
  white-space: nowrap;
}

.vplayer__goals--away .vplayer__goal { flex-direction: row-reverse; }

.vplayer__goals--center {
  margin-top: 4px;
  align-items: center;
}

.vplayer__goal--center {
  justify-content: center;
  max-width: 200px;
}

.vplayer__goal-name {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.vplayer__goal-team {
  font-size: 10px;
  color: rgba(255,255,255,0.25);
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70px;
}

.vplayer__goal-min {
  font-size: 12px;
  color: rgba(255,255,255,0.38);
  flex-shrink: 0;
}

/* ── Commentary stream (the "video content") ─────────────────────────────── */
.vplayer__stream-wrap {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  z-index: 2;
}

.vplayer__stream-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px 6px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.25);
  flex-shrink: 0;
}

.vplayer__stream-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #69f0ae;
  animation: live-pulse 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

/* Scrollable feed */
.vplayer__stream {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 60px;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
}

.vplayer__stream::-webkit-scrollbar { display: none; }

.vplayer__entry {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 9px 0;
  border-bottom: 1px solid rgba(255,255,255,0.055);
  font-size: 13.5px;
  color: rgba(230, 237, 243, 0.45);
  line-height: 1.55;
  transition: background 0.12s;
}

.vplayer__entry:last-child { border-bottom: none; }

/* Most recent entry is brighter */
.vplayer__entry--latest {
  color: rgba(230, 237, 243, 0.92);
  font-weight: 600;
}

.vplayer__entry-min {
  font-size: 10px;
  font-weight: 800;
  color: var(--color-primary, #69f0ae);
  min-width: 30px;
  flex-shrink: 0;
  text-align: right;
  padding-top: 1px;
  font-variant-numeric: tabular-nums;
}

.vplayer__entry-text {
  flex: 1;
  min-width: 0;
}

.vplayer__stream-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(255,255,255,0.2);
  text-align: center;
  padding: 20px;
}

/* Fade from stream into controls */
.vplayer__stream-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(to bottom, transparent, #080d11 80%);
  pointer-events: none;
}

/* ── Fake video controls ─────────────────────────────────────────────────── */
.vplayer__controls {
  position: relative;
  z-index: 3;
  background: rgba(4, 8, 12, 0.92);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  padding: 6px 14px 10px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

/* Tiny competition / venue line */
.vplayer__meta-line {
  font-size: 10px;
  color: rgba(255,255,255,0.2);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
  display: flex;
  gap: 4px;
}

/* Timeline */
.vplayer__timeline {
  height: 3px;
  background: rgba(255,255,255,0.12);
  border-radius: 3px;
  margin-bottom: 9px;
  cursor: pointer;
  position: relative;
}

.vplayer__timeline-fill {
  height: 100%;
  background: var(--color-primary, #69f0ae);
  border-radius: 3px;
  position: relative;
  transition: width 1s linear;
}

.vplayer__timeline-thumb {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 6px rgba(0,0,0,0.6);
  transition: transform 0.1s;
}

.vplayer__timeline:hover .vplayer__timeline-thumb {
  transform: translateY(-50%) scale(1.3);
}

/* Controls row */
.vplayer__ctrls {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vplayer__ctrls-left,
.vplayer__ctrls-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.vplayer__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: none;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.12s, background 0.12s;
}

.vplayer__btn:hover {
  color: #fff;
  background: rgba(255,255,255,0.07);
}

.vplayer__btn--play {
  color: #fff;
}

.vplayer__time {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.65);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  padding: 0 4px;
  white-space: nowrap;
}

/* ══════════════════════════════════════════════════════════════════════════
   DETAILS COLUMN  (right on desktop, stacked below player on mobile)
   ══════════════════════════════════════════════════════════════════════════ */
.details-col {
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh - var(--header-height, 64px));
  background: var(--color-bg);
  border-left: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  order: 2;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .details-col {
    order: 2;
    border-left: none;
    border-top: 2px solid color-mix(in srgb, var(--color-text) 10%, transparent);
    min-height: unset;
    overflow-y: visible;
  }
}

.details-col__error {
  margin: 14px 18px 0;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: #c62828;
  background: rgba(198, 40, 40, 0.08);
  border: 1px solid rgba(198, 40, 40, 0.2);
}

/* ── Detail section ──────────────────────────────────────────────────────── */
.ds {
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 7%, transparent);
}

.ds--last { border-bottom: none; }

.ds__hd {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 8px;
  background: color-mix(in srgb, var(--color-text) 2%, var(--color-bg));
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 5%, transparent);
  position: sticky;
  top: 0;
  z-index: 1;
}

.ds__icon { font-size: 14px; line-height: 1; }

.ds__title {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--color-text);
}

.ds__body { padding: 12px 16px; }

.ds__hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* ── Event list ──────────────────────────────────────────────────────────── */
.event-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.event-item {
  display: grid;
  grid-template-columns: 26px 18px 1fr;
  align-items: start;
  gap: 5px;
  padding: 6px 8px;
  border-radius: 7px;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
  transition: var(--transition-default);
}

.event-item:hover {
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface));
}

.event-item--home {
  background: color-mix(in srgb, var(--color-primary) 7%, var(--color-surface));
}

.event-item--away {
  background: color-mix(in srgb, var(--color-text) 3%, var(--color-surface));
}

.event-item__min {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-text-secondary);
  text-align: right;
  padding-top: 2px;
  font-variant-numeric: tabular-nums;
}

.event-item__icon { font-size: 14px; line-height: 1.4; }

.event-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.event-item__row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}

.event-item__player {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.event-item__team {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.event-item__second {
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* ── Statistics ──────────────────────────────────────────────────────────── */
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.stats-grid__teams {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}

.stat-row {
  display: grid;
  grid-template-columns: 38px 1fr 38px;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 3px 8px;
}

.stat-row__val {
  font-size: 13px;
  font-weight: 800;
  color: var(--color-text);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.stat-row__val--r { text-align: left; }

.stat-row__track {
  display: flex;
  height: 4px;
  border-radius: 4px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.stat-row__fill {
  height: 100%;
  transition: width 0.5s ease;
}

.stat-row__fill--home {
  background: var(--color-primary);
  border-radius: 4px 0 0 4px;
}

.stat-row__fill--away {
  background: var(--color-secondary);
  border-radius: 0 4px 4px 0;
}

.stat-row__label {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 10px;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  margin-top: -1px;
}

/* ── Lineups ─────────────────────────────────────────────────────────────── */
.lineups {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

@media (max-width: 1100px) {
  .lineups { grid-template-columns: 1fr; gap: 10px; }
}

.lineups__col {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lineups__hd {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 7px;
  margin-bottom: 6px;
  border-bottom: 2px solid var(--color-primary);
}

.lineups__name {
  flex: 1;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lineups__formation {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  padding: 2px 7px;
  border-radius: 20px;
}

.lineups__subs-label {
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin: 9px 0 3px;
}

.lineup-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lineup-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 6px;
  border-radius: 5px;
  transition: background 0.1s;
}

.lineup-item:hover {
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
}

.lineup-item--sub { opacity: 0.58; }

.lineup-item__num {
  font-size: 11px;
  font-weight: 800;
  color: var(--color-text-secondary);
  min-width: 20px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.lineup-item__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
</style>
