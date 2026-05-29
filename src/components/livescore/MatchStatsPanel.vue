<script setup>
import MatchStatsBar from './MatchStatsBar.vue'

defineProps({
  stats: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="stats-panel">
    <p v-if="loading" class="stats-panel__hint">Loading stats…</p>
    <p v-else-if="!stats.length" class="stats-panel__hint">No stats available yet.</p>
    <div v-else class="stats-panel__list">
      <MatchStatsBar
        v-for="stat in stats"
        :key="stat.type"
        :label="stat.label || stat.type"
        :home="stat.home"
        :away="stat.away"
      />
    </div>
  </div>
</template>

<style scoped>
.stats-panel__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0;
}

.stats-panel__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
