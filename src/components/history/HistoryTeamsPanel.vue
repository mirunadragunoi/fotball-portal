<script setup>
import { useI18n } from 'vue-i18n'
import HistorySearchBar from './HistorySearchBar.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import BaseBadge from '@/components/shared/BaseBadge.vue'

const teamQuery = defineModel('teamQuery', { type: String, default: '' })

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['search'])
const { t } = useI18n()
</script>

<template>
  <div class="history-panel" :class="{ 'history-panel--f2': isF2 }">
    <div class="history-panel__toolbar">
      <HistorySearchBar
        v-model="teamQuery"
        :placeholder="t('history.searchTeams')"
        id="history-team-search"
        @search="emit('search')"
      />
    </div>

    <p v-if="!loading && items.length" class="history-panel__count">
      {{ t('history.countTeams', { count: items.length }) }}
    </p>

    <div v-if="loading" class="history-grid history-grid--teams">
      <SkeletonCard v-for="n in 8" :key="n" />
    </div>

    <EmptyState
      v-else-if="!items.length"
      :title="t('history.emptyTitle')"
      :message="t('history.emptyTeams')"
    />

    <div v-else class="history-grid history-grid--teams">
      <article
        v-for="item in items"
        :key="item.sourceTeamId"
        class="history-card history-card--team"
      >
        <div class="history-card__code">{{ item.teamCode }}</div>
        <h3 class="history-card__title">{{ item.teamName }}</h3>
        <p class="history-card__meta">{{ item.federationName }}</p>
        <div class="history-card__footer">
          <BaseBadge :label="item.regionName" />
          <BaseBadge :label="item.confederationName" color="var(--color-secondary)" />
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.history-panel__toolbar {
  margin-bottom: 20px;
}

.history-panel__count {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.history-grid--teams {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.history-card--team .history-card__code {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.history-card {
  padding: 18px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.history-card__title {
  margin: 0 0 6px;
  font-family: var(--font-heading);
  font-size: 1.05rem;
}

.history-card__meta {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.history-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
