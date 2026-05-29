<script setup>
defineProps({
  rows:        { type: Array,   default: () => [] },
  showGoals:   { type: Boolean, default: true },
  highlightId: { type: [String, Number], default: null },
})
</script>

<template>
  <div class="standings-wrap">
    <table class="standings">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col" class="standings__th-team">Team</th>
          <th scope="col" title="Played">P</th>
          <th scope="col" title="Won">W</th>
          <th scope="col" title="Drawn">D</th>
          <th scope="col" title="Lost">L</th>
          <template v-if="showGoals">
            <th scope="col" title="Goals For">GF</th>
            <th scope="col" title="Goals Against">GA</th>
            <th scope="col" title="Goal Difference">GD</th>
          </template>
          <th scope="col" title="Points">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.team_id || row.id || i"
          :class="{ 'standings__tr--highlight': highlightId != null && String(row.team_id || row.id) === String(highlightId) }"
        >
          <td>{{ row.rank ?? row.position ?? i + 1 }}</td>
          <td class="standings__team">
            <img
              v-if="row.team_logo || row.logo"
              :src="row.team_logo || row.logo"
              alt=""
              width="20"
              height="20"
              loading="lazy"
            />
            {{ row.team_name || row.name }}
          </td>
          <td>{{ row.played ?? row.matches ?? '–' }}</td>
          <td>{{ row.won ?? '–' }}</td>
          <td>{{ row.draw ?? row.draws ?? '–' }}</td>
          <td>{{ row.lost ?? '–' }}</td>
          <template v-if="showGoals">
            <td>{{ row.goals_scored ?? row.gf ?? '–' }}</td>
            <td>{{ row.goals_conceded ?? row.ga ?? '–' }}</td>
            <td>{{ row.goal_diff != null ? (row.goal_diff > 0 ? '+' : '') + row.goal_diff : (row.gd != null ? (row.gd > 0 ? '+' : '') + row.gd : '–') }}</td>
          </template>
          <td class="standings__pts">{{ row.points ?? row.pts ?? '–' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.standings-wrap {
  overflow-x: auto;
}

.standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.standings th,
.standings td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.standings th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.standings__th-team,
.standings__team {
  text-align: left;
}

.standings__team {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  min-width: 140px;
}

.standings__pts {
  font-weight: 800;
  color: var(--color-primary);
}

.standings__tr--highlight {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  font-weight: 700;
}
</style>
