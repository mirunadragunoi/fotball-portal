<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMatchCenterStore } from '@/stores/matchCenter'
import MatchStatsPanel from '@/components/livescore/MatchStatsPanel.vue'
import LineupList from '@/components/livescore/LineupList.vue'
import H2HComparison from '@/components/livescore/H2HComparison.vue'

const props = defineProps({
  fixtureId: { type: [Number, String], required: true },
  match:     { type: Object, default: null },
})

const { t } = useI18n()
const mc = useMatchCenterStore()

const TAB_LABEL = {
  summary:    'matchCenter.summary',
  stats:      'matchCenter.stats',
  lineups:    'matchCenter.lineups',
  ratings:    'matchCenter.ratings',
  h2h:        'matchCenter.h2h',
  prediction: 'matchCenter.prediction',
}

onMounted(() => mc.open(props.fixtureId, props.match))
watch(() => props.fixtureId, (id) => mc.open(id, props.match))
onUnmounted(() => mc.close())

const active = computed(() => mc.activeTab)
const loadingActive = computed(() => !!mc.loading[active.value])

// ── Events (summary) ──────────────────────────────────────────────────────────
const EVENT_ICON = { Goal: '⚽', subst: '🔄', Var: '📺' }
function eventIcon(ev) {
  if (ev.type === 'Card') return (ev.detail || '').includes('Red') ? '🟥' : '🟨'
  return EVENT_ICON[ev.type] || '•'
}
const keyEvents = computed(() =>
  (mc.raw.events || [])
    .filter((e) => ['Goal', 'Card', 'subst'].includes(e.type))
    .map((e) => ({
      minute: e.time?.elapsed != null
        ? `${e.time.elapsed}${e.time.extra ? '+' + e.time.extra : ''}'`
        : '',
      icon: eventIcon(e),
      team: e.team?.name || '',
      player: e.player?.name || '',
      detail: e.type === 'subst'
        ? (e.assist?.name ? `↑ ${e.assist.name}` : '')
        : (e.type === 'Goal' && e.assist?.name ? `${t('matchCenter.assist')}: ${e.assist.name}` : e.detail || ''),
    })),
)

// ── Stats ─────────────────────────────────────────────────────────────────────
function sideEntry(list, teamId, fallbackIdx) {
  const arr = list || []
  return arr.find((x) => String(x.team?.id) === String(teamId)) || arr[fallbackIdx] || null
}
const statRows = computed(() => {
  const raw = mc.raw.stats || []
  const home = sideEntry(raw, mc.homeTeamId, 0)
  const away = sideEntry(raw, mc.awayTeamId, 1)
  if (!home && !away) return []
  const byType = new Map()
  for (const s of home?.statistics || []) byType.set(s.type, { type: s.type, home: s.value, away: null })
  for (const s of away?.statistics || []) {
    const row = byType.get(s.type) || { type: s.type, home: null, away: null }
    row.away = s.value
    byType.set(s.type, row)
  }
  // Coerce "52%"/null to display-friendly values MatchStatsBar can size.
  return [...byType.values()].map((r) => ({
    type: r.type,
    home: r.home ?? 0,
    away: r.away ?? 0,
  }))
})

// ── Lineups ───────────────────────────────────────────────────────────────────
function mapSide(entry) {
  if (!entry) return null
  const players = (arr) => (arr || []).map((p) => ({
    id: p.player?.id,
    name: p.player?.name,
    number: p.player?.number,
    position: p.player?.pos,
  }))
  return {
    name: entry.team?.name || '',
    formation: entry.formation || '',
    starting_eleven: players(entry.startXI),
    substitutes: players(entry.substitutes),
    coach: entry.coach?.name || '',
  }
}
const lineupsObj = computed(() => {
  const raw = mc.raw.lineups || []
  const home = sideEntry(raw, mc.homeTeamId, 0)
  const away = sideEntry(raw, mc.awayTeamId, 1)
  return { home: mapSide(home), away: mapSide(away) }
})
const hasLineups = computed(() => !!(lineupsObj.value.home || lineupsObj.value.away))
const coaches = computed(() => ({
  home: lineupsObj.value.home?.coach || '',
  away: lineupsObj.value.away?.coach || '',
}))

// ── Player ratings ──────────────────────────────────────────────────────────
const ratingRows = computed(() => {
  const rows = []
  for (const teamBlock of mc.raw.players || []) {
    const teamName = teamBlock.team?.name || ''
    for (const p of teamBlock.players || []) {
      const st = p.statistics?.[0] || {}
      const rating = parseFloat(st.games?.rating)
      rows.push({
        id: p.player?.id,
        name: p.player?.name || '',
        team: teamName,
        number: st.games?.number,
        position: st.games?.position,
        rating: isNaN(rating) ? null : rating,
        goals: st.goals?.total || 0,
        assists: st.goals?.assists || 0,
        minutes: st.games?.minutes ?? 0,
      })
    }
  }
  return rows
    .filter((r) => r.rating != null || r.minutes > 0)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
})
function ratingClass(r) {
  if (r == null) return ''
  if (r >= 7.5) return 'mc-rating--hi'
  if (r >= 6.5) return 'mc-rating--mid'
  return 'mc-rating--lo'
}

// ── H2H (adapt API-Football fixtures to H2HComparison's shape) ─────────────────
const h2hMatches = computed(() =>
  (mc.raw.h2h || []).map((f) => ({
    home_id: f.teams?.home?.id,
    away_id: f.teams?.away?.id,
    home_name: f.teams?.home?.name,
    away_name: f.teams?.away?.name,
    score: `${f.goals?.home ?? '?'}-${f.goals?.away ?? '?'}`,
    date: (f.fixture?.date || '').slice(0, 10),
    time: '',
  })),
)

// ── Prediction ────────────────────────────────────────────────────────────────
const prediction = computed(() => mc.raw.prediction || null)
const predPercent = computed(() => prediction.value?.predictions?.percent || null)
</script>

<template>
  <div class="mc">
    <!-- Tab bar -->
    <div class="mc__tabs" role="tablist">
      <button
        v-for="tab in mc.availableTabs"
        :key="tab"
        class="mc__tab"
        :class="{ 'mc__tab--active': active === tab }"
        role="tab"
        :aria-selected="active === tab"
        @click="mc.setTab(tab)"
      >{{ t(TAB_LABEL[tab]) }}</button>
    </div>

    <div class="mc__panel" role="tabpanel">
      <p v-if="loadingActive" class="mc__hint">{{ t('matchCenter.loading') }}</p>

      <!-- Summary: key events -->
      <template v-else-if="active === 'summary'">
        <ul v-if="keyEvents.length" class="mc__events">
          <li v-for="(ev, i) in keyEvents" :key="i" class="mc__event">
            <span class="mc__event-min">{{ ev.minute }}</span>
            <span class="mc__event-icon" aria-hidden="true">{{ ev.icon }}</span>
            <span class="mc__event-body">
              <span class="mc__event-player">{{ ev.player }}</span>
              <span v-if="ev.team" class="mc__event-team">{{ ev.team }}</span>
              <span v-if="ev.detail" class="mc__event-detail">{{ ev.detail }}</span>
            </span>
          </li>
        </ul>
        <p v-else class="mc__hint">{{ t('matchCenter.noEvents') }}</p>
      </template>

      <!-- Stats -->
      <template v-else-if="active === 'stats'">
        <MatchStatsPanel :stats="statRows" />
      </template>

      <!-- Lineups -->
      <template v-else-if="active === 'lineups'">
        <LineupList v-if="hasLineups" :lineups="lineupsObj" />
        <p v-else class="mc__hint">{{ t('matchCenter.noLineups') }}</p>
        <p v-if="coaches.home || coaches.away" class="mc__coaches">
          <span v-if="coaches.home">{{ t('matchCenter.coach') }}: {{ coaches.home }}</span>
          <span v-if="coaches.away">{{ t('matchCenter.coach') }}: {{ coaches.away }}</span>
        </p>
      </template>

      <!-- Player ratings -->
      <template v-else-if="active === 'ratings'">
        <ul v-if="ratingRows.length" class="mc__ratings">
          <li
            v-for="(r, i) in ratingRows"
            :key="r.id || i"
            class="mc__rating-row"
            :class="{ 'mc__rating-row--top': i === 0 && r.rating != null }"
          >
            <span class="mc__rating-name">
              {{ r.name }}
              <span v-if="i === 0 && r.rating != null" class="mc__rating-badge">★ {{ t('matchCenter.topPlayer') }}</span>
              <span class="mc__rating-meta">{{ r.team }} · {{ r.minutes }}′<template v-if="r.goals"> · {{ r.goals }}⚽</template><template v-if="r.assists"> · {{ r.assists }}🅰</template></span>
            </span>
            <span v-if="r.rating != null" class="mc__rating-val" :class="ratingClass(r.rating)">{{ r.rating.toFixed(1) }}</span>
            <span v-else class="mc__rating-val mc__rating-val--na">—</span>
          </li>
        </ul>
        <p v-else class="mc__hint">{{ t('matchCenter.noRatings') }}</p>
      </template>

      <!-- H2H -->
      <template v-else-if="active === 'h2h'">
        <H2HComparison
          v-if="h2hMatches.length"
          :matches="h2hMatches"
          :team1-id="mc.homeTeamId"
          :team2-id="mc.awayTeamId"
        />
        <p v-else class="mc__hint">{{ t('matchCenter.noH2H') }}</p>
      </template>

      <!-- Prediction -->
      <template v-else-if="active === 'prediction'">
        <div v-if="prediction" class="mc__pred">
          <div v-if="predPercent" class="mc__pred-bars">
            <div class="mc__pred-bar">
              <span class="mc__pred-lbl">{{ prediction.teams?.home?.name || t('matchCenter.home') }}</span>
              <div class="mc__pred-track"><div class="mc__pred-fill" :style="{ width: predPercent.home }"></div></div>
              <span class="mc__pred-pct">{{ predPercent.home }}</span>
            </div>
            <div class="mc__pred-bar">
              <span class="mc__pred-lbl">{{ t('matchCenter.draw') }}</span>
              <div class="mc__pred-track"><div class="mc__pred-fill mc__pred-fill--draw" :style="{ width: predPercent.draw }"></div></div>
              <span class="mc__pred-pct">{{ predPercent.draw }}</span>
            </div>
            <div class="mc__pred-bar">
              <span class="mc__pred-lbl">{{ prediction.teams?.away?.name || t('matchCenter.away') }}</span>
              <div class="mc__pred-track"><div class="mc__pred-fill" :style="{ width: predPercent.away }"></div></div>
              <span class="mc__pred-pct">{{ predPercent.away }}</span>
            </div>
          </div>
          <p v-if="prediction.predictions?.advice" class="mc__pred-advice">
            <strong>{{ t('matchCenter.advice') }}:</strong> {{ prediction.predictions.advice }}
          </p>
          <p v-if="prediction.predictions?.under_over" class="mc__pred-meta">
            {{ t('matchCenter.goalsLine') }}: {{ prediction.predictions.under_over }}
          </p>
        </div>
        <p v-else class="mc__hint">{{ t('matchCenter.noPrediction') }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mc { display: flex; flex-direction: column; }

.mc__tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  scrollbar-width: none;
}
.mc__tabs::-webkit-scrollbar { display: none; }

.mc__tab {
  flex-shrink: 0;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  min-height: 44px;
  transition: color 0.15s, border-color 0.15s;
}
.mc__tab:hover { color: var(--color-text); }
.mc__tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.mc__panel { padding: 14px 0; }

.mc__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-style: italic;
  margin: 0;
  padding: 8px 0;
}

/* Events */
.mc__events { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.mc__event {
  display: grid;
  grid-template-columns: 34px 20px 1fr;
  align-items: start;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 7px;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
}
.mc__event-min { font-size: 11px; font-weight: 800; color: var(--color-text-secondary); text-align: right; font-variant-numeric: tabular-nums; }
.mc__event-icon { font-size: 14px; line-height: 1.4; }
.mc__event-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.mc__event-player { font-size: 13px; font-weight: 700; color: var(--color-text); }
.mc__event-team { font-size: 11px; color: var(--color-text-secondary); }
.mc__event-detail { font-size: 11px; color: var(--color-text-secondary); }

/* Ratings */
.mc__ratings { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.mc__rating-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
}
.mc__rating-row--top { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)); }
.mc__rating-name { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; font-size: 13px; font-weight: 600; color: var(--color-text); }
.mc__rating-meta { font-size: 11px; font-weight: 500; color: var(--color-text-secondary); }
.mc__rating-badge { font-size: 10px; font-weight: 800; color: var(--color-primary); margin-left: 6px; }
.mc__rating-val {
  flex-shrink: 0;
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 800;
  min-width: 42px;
  text-align: center;
  padding: 3px 0;
  border-radius: 6px;
}
.mc-rating--hi  { color: #fff; background: #16a34a; }
.mc-rating--mid { color: var(--color-text); background: color-mix(in srgb, var(--color-text) 10%, transparent); }
.mc-rating--lo  { color: #fff; background: #dc2626; }
.mc__rating-val--na { color: var(--color-text-secondary); background: none; }

/* Coaches */
.mc__coaches { display: flex; justify-content: space-between; gap: 12px; margin: 12px 0 0; font-size: 11px; color: var(--color-text-secondary); }

/* Prediction */
.mc__pred { display: flex; flex-direction: column; gap: 12px; }
.mc__pred-bars { display: flex; flex-direction: column; gap: 8px; }
.mc__pred-bar { display: grid; grid-template-columns: 1fr 2fr auto; align-items: center; gap: 8px; }
.mc__pred-lbl { font-size: 12px; font-weight: 600; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc__pred-track { height: 8px; border-radius: 8px; background: color-mix(in srgb, var(--color-text) 10%, transparent); overflow: hidden; }
.mc__pred-fill { height: 100%; background: var(--color-primary); border-radius: 8px; }
.mc__pred-fill--draw { background: var(--color-text-secondary); }
.mc__pred-pct { font-size: 12px; font-weight: 800; color: var(--color-text); min-width: 40px; text-align: right; font-variant-numeric: tabular-nums; }
.mc__pred-advice { font-size: 13px; color: var(--color-text); margin: 0; padding: 8px 10px; border-radius: 7px; background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
.mc__pred-meta { font-size: 12px; color: var(--color-text-secondary); margin: 0; }
</style>
