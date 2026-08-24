<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompetitionStore } from '@/stores/competition'
import { formatKickoff } from '@/utils/liveScoreFormat'
import { getCompetitionById } from '@/config/europeanCompetitions'
import StandingsTable from '@/components/livescore/StandingsTable.vue'
import GoalscorersTable from '@/components/livescore/GoalscorersTable.vue'
import GroupStageGrid from '@/components/livescore/GroupStageGrid.vue'

const route  = useRoute()
const router = useRouter()
const { t, locale }  = useI18n()
function kickoffStr(m) {
  return formatKickoff(m.date || m.match_date, m.time, { locale: locale.value }).dateTime
}

const compStore = useCompetitionStore()

const competitionId = computed(() => route.params.competitionId)

// Curated competition metadata (name, country, season) — falls back to a
// generic label + no season for any competition not in our config.
const competition = computed(() => getCompetitionById(competitionId.value))
const competitionName = computed(() =>
  competition.value?.name || t('live.competition', 'Competition'),
)

const loading = ref(true)
const standingsLoading = ref(false)
const error   = ref(null)
const tab     = ref('standings')

// ── Season selector ────────────────────────────────────────────────────────
// Only the standings endpoint accepts a season_id (fixtures/goalscorers do not
// at the backend level), so the selector re-loads standings for the chosen
// season while the other tabs stay on the current season.
// live-score-api season_id 57 == 2026/2027 — anchor the label math to that.
const SEASON_ANCHOR_ID = 57
const SEASON_ANCHOR_START = 2026
function seasonLabel(id) {
  const start = SEASON_ANCHOR_START + (Number(id) - SEASON_ANCHOR_ID)
  return `${start}/${start + 1}`
}
const selectedSeasonId = ref(null)
const seasons = computed(() => {
  const cur = competition.value?.seasonId
  if (!cur) return []
  return [0, 1, 2].map((off) => ({ id: cur - off, label: seasonLabel(cur - off) }))
})

async function loadStandingsForSeason() {
  standingsLoading.value = true
  try {
    await compStore.loadStandings(competitionId.value, selectedSeasonId.value || undefined)
  } finally {
    standingsLoading.value = false
  }
}

onMounted(async () => {
  selectedSeasonId.value = competition.value?.seasonId || null
  try {
    await Promise.allSettled([
      compStore.loadStandings(competitionId.value, selectedSeasonId.value || undefined),
      compStore.loadGoalscorers(competitionId.value),
      compStore.loadGroups(competitionId.value),
      compStore.loadFixtures(competitionId.value),
    ])
  } catch (e) {
    error.value = e?.message || 'Failed to load competition data'
  } finally {
    loading.value = false
  }
})

const standings   = computed(() => compStore.standings || [])
const goalscorers = computed(() => compStore.topGoalscorers || [])
const groups      = computed(() => compStore.groups || [])
const fixtures    = computed(() => compStore.fixtures || [])

const tabs = computed(() => [
  { key: 'standings',   label: t('live.standings',   'Standings') },
  { key: 'fixtures',    label: t('live.fixtures',    'Fixtures') },
  { key: 'groups',      label: t('live.groups',      'Groups'),     hide: !groups.value.length },
  { key: 'goalscorers', label: t('live.goalscorers', 'Goalscorers') },
].filter(x => !x.hide))
</script>

<template>
  <main class="comp-view">
    <div class="comp-view__inner">
      <button class="comp-view__back" @click="router.back()">← {{ t('common.back', 'Back') }}</button>

      <div class="comp-view__head">
        <div class="comp-view__title-wrap">
          <h1 class="comp-view__title">{{ competitionName }}</h1>
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
          <label v-if="seasons.length" class="comp-view__season">
            <span>{{ t('competition.season') }}</span>
            <select v-model.number="selectedSeasonId" @change="loadStandingsForSeason">
              <option v-for="s in seasons" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </label>
          <div v-if="standingsLoading" class="comp-view__empty">{{ t('live.loading', 'Loading…') }}</div>
          <StandingsTable v-else-if="standings.length" :rows="standings" :show-goals="true" />
          <div v-else class="comp-view__empty">{{ t('competition.noSeasonData') }}</div>
        </div>

        <div v-show="tab === 'fixtures'" role="tabpanel">
          <div v-if="fixtures.length" class="comp-view__fixtures">
            <RouterLink
              v-for="(m, i) in fixtures"
              :key="m.id || i"
              :to="`/live/match/${m.id}`"
              class="comp-view__fixture"
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
            :live-match-ids="[]"
          />
          <div v-else class="comp-view__empty">{{ t('live.noGroups', 'No group data available') }}</div>
        </div>

        <div v-show="tab === 'goalscorers'" role="tabpanel">
          <GoalscorersTable v-if="goalscorers.length" :rows="goalscorers" />
          <div v-else class="comp-view__empty">{{ t('live.noGoalscorers', 'No goalscorer data available') }}</div>
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

@media (max-width: 600px) {
  .comp-view__fixture { grid-template-columns: 64px 1fr auto 1fr; font-size: 12px; }
  .comp-view__tabs { overflow-x: auto; }
  .comp-view__tab { padding: 10px 12px; white-space: nowrap; }
}
</style>
