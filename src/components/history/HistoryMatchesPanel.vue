<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HistorySearchBar from './HistorySearchBar.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import BaseBadge from '@/components/shared/BaseBadge.vue'

const matchQuery = defineModel('matchQuery', { type: String, default: '' })
const matchTournamentId = defineModel('matchTournamentId', { type: String, default: '' })
const matchStage = defineModel('matchStage', { type: String, default: '' })

const props = defineProps({
  items: { type: Array, default: () => [] },
  tournaments: { type: Array, default: () => [] },
  stages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['search', 'filter'])
const { t } = useI18n()

const tournamentOptions = computed(() => [
  { value: '', label: t('history.allTournaments') },
  ...props.tournaments.map((tr) => ({
    value: tr.tournamentId,
    label: String(tr.year),
  })),
])

const stageOptions = computed(() => [
  { value: '', label: t('history.allStages') },
  ...props.stages.map((s) => ({ value: s, label: s })),
])
</script>

<template>
  <div class="history-panel" :class="{ 'history-panel--f2': isF2 }">
    <div class="history-panel__toolbar history-panel__toolbar--stack">
      <div class="history-filters">
        <label class="history-filters__label">
          <span>{{ t('history.filterTournament') }}</span>
          <select
            v-model="matchTournamentId"
            class="history-filters__select"
            @change="emit('filter')"
          >
            <option v-for="opt in tournamentOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="history-filters__label">
          <span>{{ t('history.filterStage') }}</span>
          <select v-model="matchStage" class="history-filters__select" @change="emit('filter')">
            <option v-for="opt in stageOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>
      </div>
      <HistorySearchBar
        v-model="matchQuery"
        :placeholder="t('history.searchMatches')"
        id="history-match-search"
        @search="emit('search')"
      />
    </div>

    <p v-if="!loading && items.length" class="history-panel__count">
      {{ t('history.countMatches', { count: items.length }) }}
    </p>

    <div v-if="loading" class="history-list">
      <SkeletonCard v-for="n in 5" :key="n" />
    </div>

    <EmptyState
      v-else-if="!items.length"
      :title="t('history.emptyTitle')"
      :message="t('history.emptyMatches')"
    />

    <ul v-else class="history-list" role="list">
      <li v-for="item in items" :key="item.matchId" class="history-match">
        <div class="history-match__date">
          <time :datetime="item.matchDate">{{ item.matchDate }}</time>
        </div>
        <div class="history-match__body">
          <p class="history-match__name">{{ item.matchName }}</p>
          <div class="history-match__score" aria-label="Score">
            <span class="history-match__team">{{ item.homeTeamName }}</span>
            <strong class="history-match__result">{{ item.score }}</strong>
            <span class="history-match__team">{{ item.awayTeamName }}</span>
          </div>
          <p class="history-match__venue">{{ item.stadiumName }}, {{ item.cityName }}</p>
          <div class="history-match__tags">
            <BaseBadge :label="item.stageName" />
            <BaseBadge
              v-if="item.groupName && item.groupName !== 'not applicable'"
              :label="item.groupName"
              color="var(--color-secondary)"
            />
            <BaseBadge :label="item.winner" color="var(--color-accent)" />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history-panel__toolbar--stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.history-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.history-filters__label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.history-filters__select {
  min-height: 44px;
  min-width: 160px;
  padding: 8px 12px;
  border-radius: var(--radius-button);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-body);
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-match {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 16px;
  padding: 16px 18px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

@media (max-width: 600px) {
  .history-match {
    grid-template-columns: 1fr;
  }
}

.history-match__date {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
}

.history-match__name {
  margin: 0 0 8px;
  font-weight: 600;
  color: var(--color-text);
}

.history-match__score {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-family: var(--font-heading);
}

.history-match__result {
  font-size: 1.25rem;
  color: var(--color-accent);
}

.history-match__venue {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.history-match__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
