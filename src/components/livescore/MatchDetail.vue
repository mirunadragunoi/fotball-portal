<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseScoreString, matchMinuteLabel, isLiveStatus } from '@/utils/liveScoreFormat'
import CommentaryTimeline from './CommentaryTimeline.vue'
import MatchStatsPanel from './MatchStatsPanel.vue'
import LineupList from './LineupList.vue'

const props = defineProps({
  match:       { type: Object, default: null },
  events:      { type: Array,  default: () => [] },
  commentary:  { type: Array,  default: () => [] },
  stats:       { type: Array,  default: () => [] },
  lineups:     { type: Object, default: () => ({}) },
  loading:     { type: Boolean, default: false },
  detailError: { type: String,  default: null },
})

const emit = defineEmits(['close'])
const { t } = useI18n()

const TABS = ['summary', 'commentary', 'stats', 'lineups']

// Commentary, stats, lineups are not available on the free API plan
const PLAN_LIMITED_TABS = new Set(['commentary', 'stats', 'lineups'])
const activeTab = ref('summary')

const score  = computed(() => parseScoreString(props.match?.scores?.score))
const minute = computed(() => matchMinuteLabel(props.match))
const live   = computed(() => isLiveStatus(props.match?.status))

// Key events for summary tab
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
  props.events
    .filter((e) => KEY_EVENTS.has((e.event || e.type || '').toUpperCase()))
    .sort((a, b) => (Number(a.time ?? a.sort ?? 0)) - (Number(b.time ?? b.sort ?? 0))),
)

function tabLabel(tab) {
  const map = {
    summary:    t('live.summary',    'Summary'),
    commentary: t('live.commentary', 'Commentary'),
    stats:      t('live.stats',      'Stats'),
    lineups:    t('live.lineups',    'Lineups'),
  }
  return map[tab] || tab
}

function eventIcon(ev) {
  return EVENT_ICON[(ev.event || ev.type || '').toUpperCase()] || '•'
}

function str(v) { return typeof v === 'string' && v ? v : null }

function playerName(ev) {
  const type = (ev.event || ev.type || '').toUpperCase()
  // Substitutions: outgoing player is the "main" player
  if (type === 'SUBSTITUTION') {
    return ev.player_out?.name
      || str(ev.player_out)
      || ev.player_out_name
      || ev.player?.name
      || ev.player?.full_name
      || str(ev.player)
      || ev.player_name
      || ''
  }
  return ev.player?.name
    || ev.player?.full_name
    || str(ev.player)
    || ev.player_name
    || ev.player1?.name
    || str(ev.player1)
    || ev.scorer?.name
    || str(ev.scorer)
    || ev.home_player
    || ev.away_player
    || ''
}

function secondPlayerName(ev) {
  const type = (ev.event || ev.type || '').toUpperCase()
  if (type === 'SUBSTITUTION') {
    return ev.player_in?.name
      || str(ev.player_in)
      || ev.player_in_name
      || ev.player2?.name
      || str(ev.player2)
      || ''
  }
  // Goals: assist
  return ev.assist?.name
    || ev.assist?.full_name
    || str(ev.assist)
    || ev.assist_name
    || ev.assist_player_name
    || ev.player2?.name
    || str(ev.player2)
    || ev.info?.name
    || str(ev.info)
    || ''
}

function isTruthy(v) {
  return v === true || v === 1 || v === '1' || v === 'true'
}
function isFalsy(v) {
  return v === false || v === 0 || v === '0' || v === 'false'
}

// Resolve which side this event belongs to, trying every API field pattern
function eventSide(ev) {
  if (isTruthy(ev.is_home)) return 'home'
  if (isTruthy(ev.is_away)) return 'away'
  if (isTruthy(ev.home))    return 'home'
  if (isFalsy(ev.home) && ev.home !== undefined && ev.home !== null) return 'away'
  if (ev.team === 'home' || ev.side === 'home') return 'home'
  if (ev.team === 'away' || ev.side === 'away') return 'away'

  // team_id vs match team IDs
  const homeId = props.match?.home?.id ?? props.match?.home_id
  const awayId = props.match?.away?.id ?? props.match?.away_id
  const evTeamId = ev.team_id ?? ev.club_id
  if (evTeamId != null && homeId != null && String(evTeamId) === String(homeId)) return 'home'
  if (evTeamId != null && awayId != null && String(evTeamId) === String(awayId)) return 'away'

  // ev.team / ev.team_name as the actual team name string
  const homeName = (props.match?.home?.name || props.match?.home_name || '').toLowerCase()
  const awayName = (props.match?.away?.name || props.match?.away_name || '').toLowerCase()
  const evTeam = (str(ev.team) || str(ev.team_name) || str(ev.club) || '').toLowerCase()
  if (evTeam && homeName && evTeam === homeName) return 'home'
  if (evTeam && awayName && evTeam === awayName) return 'away'

  return ''
}

function sideClass(ev) {
  const s = eventSide(ev)
  if (s === 'home') return 'match-detail__summary-item--home'
  if (s === 'away') return 'match-detail__summary-item--away'
  return ''
}

function eventTeamName(ev) {
  // First try to get the team name directly from the event
  const direct = str(ev.team_name)
    || (str(ev.team) !== 'home' && str(ev.team) !== 'away' ? str(ev.team) : null)
  if (direct) return direct

  // Fall back to deriving from side
  const s = eventSide(ev)
  if (s === 'home') return props.match?.home?.name || props.match?.home_name || ''
  if (s === 'away') return props.match?.away?.name || props.match?.away_name || ''
  return ''
}
</script>

<template>
  <aside class="match-detail" aria-label="Match detail">
    <!-- Header -->
    <header class="match-detail__header">
      <div class="match-detail__teams">
        <div class="match-detail__team match-detail__team--home">
          <img v-if="match?.home?.logo" :src="match.home.logo" alt="" width="28" height="28" loading="lazy" />
          <span>{{ match?.home?.name }}</span>
        </div>

        <div class="match-detail__score-block" aria-label="Score">
          <span class="match-detail__goals">{{ score.home ?? '–' }}</span>
          <span
            class="match-detail__minute"
            :class="{ 'match-detail__minute--live': live }"
          >{{ minute || '–' }}</span>
          <span class="match-detail__goals">{{ score.away ?? '–' }}</span>
        </div>

        <div class="match-detail__team match-detail__team--away">
          <img v-if="match?.away?.logo" :src="match.away.logo" alt="" width="28" height="28" loading="lazy" />
          <span>{{ match?.away?.name }}</span>
        </div>
      </div>

      <button type="button" class="match-detail__close" @click="emit('close')">✕</button>
    </header>

    <!-- Tabs -->
    <div class="match-detail__tabs" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab"
        type="button"
        role="tab"
        class="match-detail__tab"
        :class="{ 'match-detail__tab--active': activeTab === tab }"
        :aria-selected="activeTab === tab"
        @click="activeTab = tab"
      >
        {{ tabLabel(tab) }}
      </button>
    </div>

    <!-- Error banner -->
    <div v-if="detailError && !loading" class="match-detail__error" role="alert">
      <span v-if="detailError === 'match_id_missing'">Match data unavailable (no ID).</span>
      <span v-else>Could not load match data: {{ detailError }}</span>
    </div>

    <!-- Panel -->
    <div class="match-detail__panel">
      <!-- Summary -->
      <template v-if="activeTab === 'summary'">
        <p v-if="loading" class="match-detail__hint">Loading events…</p>
        <p v-else-if="!summaryEvents.length" class="match-detail__hint">No key events yet.</p>
        <ul v-else class="match-detail__summary-list">
          <li
            v-for="(ev, i) in summaryEvents"
            :key="ev.id || i"
            class="match-detail__summary-item"
            :class="sideClass(ev)"
          >
            <span class="match-detail__ev-min">{{ ev.time ?? ev.minute ?? ev.sort ?? '' }}'</span>
            <span class="match-detail__ev-icon">{{ eventIcon(ev) }}</span>
            <span class="match-detail__ev-body">
              <span class="match-detail__ev-row">
                <span class="match-detail__ev-player">{{ playerName(ev) }}</span>
                <span v-if="eventTeamName(ev)" class="match-detail__ev-team">({{ eventTeamName(ev) }})</span>
              </span>
              <span v-if="secondPlayerName(ev)" class="match-detail__ev-row match-detail__ev-second">
                <span>{{ (ev.event || ev.type || '').toUpperCase() === 'SUBSTITUTION' ? '↑' : 'assist:' }} {{ secondPlayerName(ev) }}</span>
                <span v-if="eventTeamName(ev)" class="match-detail__ev-team">({{ eventTeamName(ev) }})</span>
              </span>
            </span>
          </li>
        </ul>
      </template>

      <!-- Commentary / Stats / Lineups — not available on free API plan -->
      <template v-else-if="PLAN_LIMITED_TABS.has(activeTab)">
        <p class="match-detail__plan-notice">
          {{ tabLabel(activeTab) }} data requires an upgraded API plan.
        </p>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.match-detail {
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.match-detail__header {
  padding: 14px 16px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  position: relative;
}

.match-detail__close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--color-text-secondary);
  display: grid;
  place-items: center;
}

.match-detail__teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  padding-right: 32px;
}

.match-detail__team {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
}

.match-detail__team--home {
  justify-content: flex-start;
}

.match-detail__team--away {
  flex-direction: row-reverse;
  text-align: right;
}

.match-detail__team img {
  flex-shrink: 0;
  object-fit: contain;
}

.match-detail__score-block {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-heading);
}

.match-detail__goals {
  font-size: 22px;
  font-weight: 800;
}

.match-detail__minute {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
  color: var(--color-text-secondary);
}

.match-detail__minute--live {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

/* Error */
.match-detail__error {
  padding: 10px 16px;
  font-size: 12px;
  color: #c62828;
  background: #ffebee;
  border-bottom: 1px solid #ef9a9a;
}

/* Tabs */
.match-detail__tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  overflow-x: auto;
}

.match-detail__tab {
  flex-shrink: 0;
  padding: 10px 14px;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: var(--transition-default);
  min-height: 44px;
}

.match-detail__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

/* Panel */
.match-detail__panel {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  max-height: 440px;
}

.match-detail__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* Summary events */
.match-detail__summary-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.match-detail__plan-notice {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  font-style: italic;
}

.match-detail__summary-item {
  display: grid;
  grid-template-columns: 28px 22px 1fr;
  align-items: start;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
}

.match-detail__ev-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.match-detail__ev-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}

.match-detail__ev-second {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.match-detail__ev-team {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.match-detail__summary-item--home {
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

.match-detail__summary-item--away {
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
  flex-direction: row-reverse;
}

.match-detail__ev-min {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-align: right;
}

.match-detail__ev-icon {
  font-size: 14px;
}

.match-detail__ev-player {
  font-weight: 600;
}

.match-detail__ev-info {
  font-size: 11px;
  color: var(--color-text-secondary);
}
</style>
