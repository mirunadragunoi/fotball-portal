<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatKickoff } from '@/utils/liveScoreFormat'

const props = defineProps({
  matches: { type: Array,  default: () => [] },
  team1Id: { type: [String, Number], default: null },
  team2Id: { type: [String, Number], default: null },
})

const { t, locale } = useI18n()
function kickoffStr(m) {
  return formatKickoff(m.date || m.match_date, m.time, { locale: locale.value }).dateTime
}

const summary = computed(() => {
  let w1 = 0, w2 = 0, draws = 0, gf1 = 0, gf2 = 0
  for (const m of props.matches) {
    const score = m.score || m.ft_score || ''
    const parts = String(score).split('-').map(Number)
    const h = parts[0] ?? 0
    const a = parts[1] ?? 0
    const isTeam1Home = String(m.home_id || m.home?.id) === String(props.team1Id)
    const g1 = isTeam1Home ? h : a
    const g2 = isTeam1Home ? a : h
    gf1 += g1; gf2 += g2
    if (g1 > g2) w1++
    else if (g2 > g1) w2++
    else draws++
  }
  const total = props.matches.length || 1
  return { w1, w2, draws, gf1, gf2, total,
    pct1:   Math.round((w1   / total) * 100),
    pctD:   Math.round((draws / total) * 100),
    pct2:   Math.round((w2   / total) * 100),
  }
})

function teamName(m, which) {
  return which === 1
    ? (m.home_name || m.home?.name || '—')
    : (m.away_name || m.away?.name || '—')
}
function scoreParts(m) {
  const s = m.score || m.ft_score || '? - ?'
  return String(s).split('-').map(s => s.trim())
}
function resultClass(m) {
  const [h, a] = scoreParts(m).map(Number)
  const isT1Home = String(m.home_id || m.home?.id) === String(props.team1Id)
  const g1 = isT1Home ? h : a
  const g2 = isT1Home ? a : h
  if (g1 > g2) return 'h2h__result--w1'
  if (g2 > g1) return 'h2h__result--w2'
  return 'h2h__result--d'
}
function resultLabel(m) {
  const [h, a] = scoreParts(m).map(Number)
  const isT1Home = String(m.home_id || m.home?.id) === String(props.team1Id)
  const g1 = isT1Home ? h : a
  const g2 = isT1Home ? a : h
  if (g1 > g2) return 'W'
  if (g2 > g1) return 'L'
  return 'D'
}
</script>

<template>
  <div class="h2h">
    <!-- Summary bar -->
    <div class="h2h__summary" v-if="matches.length">
      <div class="h2h__sum-col h2h__sum-col--left">
        <span class="h2h__sum-wins">{{ summary.w1 }}</span>
        <span class="h2h__sum-label">{{ t('live.wins', 'Wins') }}</span>
      </div>
      <div class="h2h__sum-col h2h__sum-col--mid">
        <span class="h2h__sum-draws">{{ summary.draws }}</span>
        <span class="h2h__sum-label">{{ t('live.draws', 'Draws') }}</span>
      </div>
      <div class="h2h__sum-col h2h__sum-col--right">
        <span class="h2h__sum-wins h2h__sum-wins--right">{{ summary.w2 }}</span>
        <span class="h2h__sum-label">{{ t('live.wins', 'Wins') }}</span>
      </div>
    </div>

    <!-- Percentage bar -->
    <div class="h2h__bar" v-if="matches.length" aria-hidden="true">
      <div class="h2h__bar-seg h2h__bar-seg--w1" :style="{ flex: summary.w1 }"></div>
      <div class="h2h__bar-seg h2h__bar-seg--d"  :style="{ flex: summary.draws }"></div>
      <div class="h2h__bar-seg h2h__bar-seg--w2" :style="{ flex: summary.w2 }"></div>
    </div>

    <!-- Goals row -->
    <div class="h2h__goals" v-if="matches.length">
      <span>{{ t('live.goalsScored', 'Goals') }}: <strong>{{ summary.gf1 }}</strong></span>
      <span class="h2h__goals-sep">vs</span>
      <span><strong>{{ summary.gf2 }}</strong></span>
    </div>

    <!-- Match list -->
    <div class="h2h__matches">
      <div
        v-for="(m, i) in matches"
        :key="m.id || i"
        class="h2h__match"
      >
        <span class="h2h__date">{{ kickoffStr(m) }}</span>
        <span class="h2h__home">{{ m.home_name || m.home?.name || '—' }}</span>
        <span class="h2h__score-wrap">
          <span class="h2h__score">{{ scoreParts(m).join(' – ') }}</span>
          <span class="h2h__pill" :class="resultClass(m)">{{ resultLabel(m) }}</span>
        </span>
        <span class="h2h__away">{{ m.away_name || m.away?.name || '—' }}</span>
      </div>

      <div v-if="!matches.length" class="h2h__empty">
        {{ t('live.noH2H', 'No head-to-head data available') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.h2h {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Summary */
.h2h__summary {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  text-align: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-surface);
  border-radius: var(--radius-card);
}

.h2h__sum-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.h2h__sum-wins {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.h2h__sum-wins--right { color: var(--color-accent); }

.h2h__sum-draws {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 800;
  color: var(--color-text-secondary);
  line-height: 1;
}

.h2h__sum-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

/* Bar */
.h2h__bar {
  height: 8px;
  border-radius: 4px;
  display: flex;
  overflow: hidden;
  gap: 2px;
}

.h2h__bar-seg { border-radius: 4px; min-width: 4px; }
.h2h__bar-seg--w1 { background: var(--color-primary); }
.h2h__bar-seg--d  { background: color-mix(in srgb, var(--color-text) 25%, transparent); }
.h2h__bar-seg--w2 { background: var(--color-accent); }

/* Goals */
.h2h__goals {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.h2h__goals-sep {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Match list */
.h2h__matches {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.h2h__match {
  display: grid;
  grid-template-columns: 80px 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 8px;
  background: var(--color-surface);
  font-size: 13px;
}

.h2h__date {
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.h2h__home {
  text-align: right;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h2h__away {
  text-align: left;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.h2h__score-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  flex-shrink: 0;
}

.h2h__score {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 14px;
  min-width: 40px;
  text-align: center;
}

.h2h__pill {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 4px;
  min-width: 20px;
  text-align: center;
}

.h2h__result--w1 { background: var(--color-primary); color: #fff; }
.h2h__result--w2 { background: var(--color-accent);  color: #000; }
.h2h__result--d  { background: color-mix(in srgb, var(--color-text) 20%, transparent); color: var(--color-text); }

.h2h__empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

@media (max-width: 480px) {
  .h2h__match { grid-template-columns: 60px 1fr auto 1fr; font-size: 12px; }
  .h2h__date  { font-size: 10px; }
}
</style>
