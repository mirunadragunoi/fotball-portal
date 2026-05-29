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
})

const emit = defineEmits(['close'])
const { t } = useI18n()

const TABS = ['summary', 'commentary', 'stats', 'lineups']
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

    <!-- Panel -->
    <div class="match-detail__panel">
      <!-- Summary -->
      <template v-if="activeTab === 'summary'">
        <p v-if="loading" class="match-detail__hint">Loading events…</p>
        <p v-else-if="!summaryEvents.length" class="match-detail__hint">
          No key events yet.
        </p>
        <ul v-else class="match-detail__summary-list">
          <li
            v-for="(ev, i) in summaryEvents"
            :key="ev.id || i"
            class="match-detail__summary-item"
            :class="{ 'match-detail__summary-item--home': ev.is_home, 'match-detail__summary-item--away': ev.is_away }"
          >
            <span class="match-detail__ev-min">{{ ev.time ?? ev.sort ?? '' }}'</span>
            <span class="match-detail__ev-icon">{{ eventIcon(ev) }}</span>
            <span class="match-detail__ev-player">{{ ev.player?.name || '' }}</span>
            <span v-if="ev.info?.name" class="match-detail__ev-info">
              {{ ev.event === 'SUBSTITUTION' ? '↑' : '' }} {{ ev.info.name }}
            </span>
          </li>
        </ul>
      </template>

      <!-- Commentary -->
      <CommentaryTimeline
        v-else-if="activeTab === 'commentary'"
        :events="commentary"
        :loading="loading"
      />

      <!-- Stats -->
      <MatchStatsPanel
        v-else-if="activeTab === 'stats'"
        :stats="stats"
        :loading="loading"
      />

      <!-- Lineups -->
      <LineupList
        v-else-if="activeTab === 'lineups'"
        :lineups="lineups"
        :loading="loading"
      />
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

.match-detail__summary-item {
  display: grid;
  grid-template-columns: 28px 22px 1fr;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
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
