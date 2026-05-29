<script setup>
defineProps({
  scorers: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="scorers">
    <p v-if="loading" class="scorers__hint">Loading top scorers…</p>
    <p v-else-if="!scorers.length" class="scorers__hint">No scorer data yet.</p>
    <div v-else class="scorers__wrap">
      <table class="scorers__table">
        <thead>
          <tr>
            <th>#</th>
            <th class="scorers__col-player">Player</th>
            <th>Team</th>
            <th title="Goals">G</th>
            <th title="Appearances">A</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in scorers" :key="s.player_id || s.id || i">
            <td class="scorers__rank">{{ i + 1 }}</td>
            <td class="scorers__player">{{ s.player_name || s.name }}</td>
            <td class="scorers__team">{{ s.team_name || s.team }}</td>
            <td class="scorers__goals">{{ s.goals ?? s.goal_count ?? '–' }}</td>
            <td class="scorers__apps">{{ s.appearances ?? s.matches ?? '–' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.scorers__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.scorers__wrap {
  overflow-x: auto;
}

.scorers__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.scorers__table th,
.scorers__table td {
  padding: 9px 8px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}

.scorers__table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.scorers__col-player,
.scorers__player {
  text-align: left;
  min-width: 120px;
}

.scorers__rank {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.scorers__player {
  font-weight: 600;
}

.scorers__team {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.scorers__goals {
  font-weight: 800;
  color: var(--color-primary);
}
</style>
