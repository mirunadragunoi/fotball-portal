<script setup>
import { useI18n } from 'vue-i18n'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import BaseBadge from '@/components/shared/BaseBadge.vue'

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'viewMatches'])
const { t } = useI18n()
</script>

<template>
  <div class="history-panel" :class="{ 'history-panel--f2': isF2 }">
    <p v-if="!loading && items.length" class="history-panel__count">
      {{ t('history.countTournaments', { count: items.length }) }}
    </p>

    <div v-if="loading" class="history-grid history-grid--tournaments">
      <SkeletonCard v-for="n in 6" :key="n" />
    </div>

    <EmptyState
      v-else-if="!items.length"
      :title="t('history.emptyTitle')"
      :message="t('history.emptyTournaments')"
    />

    <div v-else class="history-grid history-grid--tournaments">
      <article
        v-for="item in items"
        :key="item.tournamentId"
        class="history-card history-card--tournament"
        tabindex="0"
        @click="emit('select', item)"
        @keydown.enter="emit('select', item)"
      >
        <div class="history-card__year">{{ item.year }}</div>
        <h3 class="history-card__title">{{ item.year }} · {{ item.hostCountry }}</h3>
        <p class="history-card__meta">
          <span>{{ item.startDate }} — {{ item.endDate }}</span>
        </p>
        <div class="history-card__footer">
          <BaseBadge :label="`${t('history.winner')}: ${item.winner}`" color="var(--color-accent)" />
          <BaseBadge v-if="item.hostWon" :label="t('history.hostWon')" />
        </div>
        <button
          type="button"
          class="history-card__link"
          @click.stop="emit('viewMatches', item)"
        >
          {{ t('history.viewMatches') }}
        </button>
      </article>
    </div>
  </div>
</template>

<style scoped>
.history-panel__count {
  margin: 0 0 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.history-grid {
  display: grid;
  gap: 16px;
}

.history-grid--tournaments {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.history-card {
  padding: 20px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: var(--transition-default);
}

.history-card:hover {
  box-shadow: var(--shadow-card-hover);
  border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-line));
  transform: translateY(-2px);
}

.history-card__year {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 8px;
}

.history-card__title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  color: var(--color-text);
}

.history-card__meta {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.history-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.history-card__link {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.history-panel--f2 .history-card {
  border-radius: 16px;
}
</style>
