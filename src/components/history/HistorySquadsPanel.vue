<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import BaseBadge from '@/components/shared/BaseBadge.vue'

const squadTournamentId = defineModel('squadTournamentId', { type: String, default: '' })
const squadTeamId = defineModel('squadTeamId', { type: String, default: '' })

const props = defineProps({
  items: { type: Array, default: () => [] },
  tournaments: { type: Array, default: () => [] },
  teams: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['filter'])
const { t } = useI18n()

const tournamentOptions = computed(() => [
  { value: '', label: t('history.selectTournament') },
  ...props.tournaments.map((tr) => ({
    value: tr.tournamentId,
    label: `${tr.year} — ${tr.hostCountry}`,
  })),
])

const teamOptions = computed(() => [
  { value: '', label: t('history.selectTeam') },
  ...props.teams.map((tm) => ({
    value: tm.sourceTeamId,
    label: tm.teamName,
  })),
])

function playerLabel(row) {
  const name = [row.givenName, row.familyName].filter(Boolean).join(' ').trim()
  return name || '—'
}
</script>

<template>
  <div class="history-panel" :class="{ 'history-panel--f2': isF2 }">
    <p class="history-panel__hint">{{ t('history.squadsHint') }}</p>

    <div class="history-filters history-filters--squads">
      <label class="history-filters__label">
        <span>{{ t('history.filterTournament') }}</span>
        <select
          v-model="squadTournamentId"
          class="history-filters__select"
          @change="emit('filter')"
        >
          <option v-for="opt in tournamentOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
      <label class="history-filters__label">
        <span>{{ t('history.filterTeam') }}</span>
        <select v-model="squadTeamId" class="history-filters__select" @change="emit('filter')">
          <option v-for="opt in teamOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="!squadTournamentId || !squadTeamId" class="history-panel__placeholder">
      <EmptyState
        :title="t('history.squadsPickTitle')"
        :message="t('history.squadsPickMessage')"
      />
    </div>

    <template v-else>
      <p v-if="!loading && items.length" class="history-panel__count">
        {{ t('history.countSquads', { count: items.length }) }}
      </p>

      <div v-if="loading" class="history-list">
        <SkeletonCard v-for="n in 4" :key="n" />
      </div>

      <EmptyState
        v-else-if="!items.length"
        :title="t('history.emptyTitle')"
        :message="t('history.emptySquads')"
      />

      <ul v-else class="history-squad-list" role="list">
        <li v-for="row in items" :key="`${row.playerId}-${row.shirtNumber}`" class="history-squad-row">
          <span class="history-squad-row__num" :class="{ 'history-squad-row__num--na': !row.shirtNumber }">
            {{ row.shirtNumber || '—' }}
          </span>
          <div class="history-squad-row__info">
            <span class="history-squad-row__name">{{ playerLabel(row) }}</span>
          </div>
          <BaseBadge :label="row.positionCode" />
          <span class="history-squad-row__pos">{{ row.positionName }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.history-panel__hint {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.history-filters--squads {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
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
  min-width: 200px;
  padding: 8px 12px;
  border-radius: var(--radius-button);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-text);
}

.history-squad-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-squad-row {
  display: grid;
  grid-template-columns: 48px 1fr auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}

@media (max-width: 640px) {
  .history-squad-row {
    grid-template-columns: 40px 1fr;
    grid-template-rows: auto auto;
  }
  .history-squad-row__pos {
    display: none;
  }
}

.history-squad-row__num {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
}

.history-squad-row__num--na {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.history-squad-row__name {
  display: block;
  font-weight: 600;
}

.history-squad-row__pos {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}
</style>
