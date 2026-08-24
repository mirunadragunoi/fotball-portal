<script setup>
import { computed } from 'vue'

const props = defineProps({
  rows:       { type: Array, default: () => [] },
  prevRows:   { type: Array, default: () => [] }, // previous snapshot for arrows
  liveLabel:  { type: String, default: 'Live' },
})

function posChange(row, i) {
  if (!props.prevRows.length) return null
  const prev = props.prevRows.findIndex(
    (r) => String(r.team?.id) === String(row.team?.id),
  )
  if (prev === -1) return null
  if (prev > i) return 'up'
  if (prev < i) return 'down'
  return null
}
</script>

<template>
  <div class="live-standings-wrap">
    <table class="live-standings">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col" class="live-standings__th-team">Team</th>
          <th scope="col" title="Played">P</th>
          <th scope="col" title="Won">W</th>
          <th scope="col" title="Drawn">D</th>
          <th scope="col" title="Lost">L</th>
          <th scope="col" title="Goals For">GF</th>
          <th scope="col" title="Goals Against">GA</th>
          <th scope="col" title="Goal Difference">GD</th>
          <th scope="col" title="Points">Pts</th>
          <th scope="col" :title="liveLabel">{{ liveLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.team?.id || i"
          :class="{ 'live-standings__tr--live': row.live?.score }"
        >
          <td class="live-standings__rank">
            <span>{{ row.rank ?? i + 1 }}</span>
            <span v-if="posChange(row, i) === 'up'"   class="live-standings__arrow live-standings__arrow--up">▲</span>
            <span v-if="posChange(row, i) === 'down'" class="live-standings__arrow live-standings__arrow--down">▼</span>
          </td>
          <td class="live-standings__team">
            <img
              v-if="row.team?.logo"
              :src="row.team.logo"
              alt=""
              width="18"
              height="18"
              loading="lazy"
            />
            {{ row.team?.name || row.team_name || '—' }}
          </td>
          <td>{{ row.matches ?? '–' }}</td>
          <td>{{ row.won ?? '–' }}</td>
          <td>{{ row.drawn ?? row.draw ?? '–' }}</td>
          <td>{{ row.lost ?? '–' }}</td>
          <td>{{ row.goals_scored ?? '–' }}</td>
          <td>{{ row.goals_conceded ?? '–' }}</td>
          <td>{{ row.goal_diff != null ? (row.goal_diff > 0 ? '+' : '') + row.goal_diff : '–' }}</td>
          <td class="live-standings__pts">{{ row.points ?? '–' }}</td>
          <td class="live-standings__live-score">
            <span v-if="row.live?.score" class="live-standings__chip">
              {{ row.live.score }}
              <span class="live-standings__form" :class="`live-standings__form--${row.live.form?.toLowerCase()}`">
                {{ row.live.form }}
              </span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.live-standings-wrap {
  overflow-x: auto;
}

.live-standings {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.live-standings th,
.live-standings td {
  padding: 9px 6px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
}

.live-standings th {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.live-standings__th-team,
.live-standings__team {
  text-align: left;
  min-width: 150px;
}

.live-standings__team {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.live-standings__rank {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.live-standings__arrow {
  font-size: 8px;
}

.live-standings__arrow--up   { color: #00c853; }
.live-standings__arrow--down { color: #e53935; }

.live-standings__pts {
  font-weight: 800;
  color: var(--color-primary);
}

.live-standings__tr--live {
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.live-standings__live-score {
  min-width: 80px;
}

.live-standings__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.live-standings__form {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 800;
}

.live-standings__form--w { background: #00c853; color: #fff; }
.live-standings__form--d { background: #ffd600; color: #1a1a1a; }
.live-standings__form--l { background: #e53935; color: #fff; }
</style>
