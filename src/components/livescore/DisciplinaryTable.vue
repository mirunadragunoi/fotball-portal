<script setup>
defineProps({
  players: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

function yellow(p) {
  return p.yellow_cards ?? p.yellowcards ?? p.yellow ?? p.yc ?? '–'
}
function red(p) {
  return p.red_cards ?? p.redcards ?? p.red ?? p.rc ?? '–'
}
</script>

<template>
  <div class="disc">
    <p v-if="loading" class="disc__hint">Loading discipline…</p>
    <p v-else-if="!players.length" class="disc__hint">No disciplinary data yet.</p>
    <div v-else class="disc__wrap">
      <table class="disc__table">
        <thead>
          <tr>
            <th>#</th>
            <th class="disc__col-player">Player</th>
            <th>Team</th>
            <th title="Yellow cards">YC</th>
            <th title="Red cards">RC</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in players" :key="p.player_id || p.id || i">
            <td class="disc__rank">{{ i + 1 }}</td>
            <td class="disc__player">{{ p.player_name || p.name }}</td>
            <td class="disc__team">{{ p.team_name || p.team }}</td>
            <td class="disc__yc">{{ yellow(p) }}</td>
            <td class="disc__rc">{{ red(p) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.disc__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.disc__wrap {
  overflow-x: auto;
}

.disc__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.disc__table th,
.disc__table td {
  padding: 9px 8px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}

.disc__table th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.disc__col-player,
.disc__player {
  text-align: left;
  min-width: 120px;
}

.disc__rank {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.disc__player {
  font-weight: 600;
}

.disc__team {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.disc__yc {
  font-weight: 800;
  color: #eab308;
}

.disc__rc {
  font-weight: 800;
  color: var(--color-red, #e53935);
}
</style>
