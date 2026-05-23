<script setup>
defineProps({
  rows: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="standings-wrap">
    <table class="standings">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Team</th>
          <th scope="col">P</th>
          <th scope="col">W</th>
          <th scope="col">D</th>
          <th scope="col">L</th>
          <th scope="col">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.team_id || row.id || i">
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

.standings__team {
  text-align: left;
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
</style>
