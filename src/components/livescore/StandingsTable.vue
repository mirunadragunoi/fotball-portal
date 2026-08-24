<script setup>
defineProps({
  rows:        { type: Array,   default: () => [] },
  showGoals:   { type: Boolean, default: true },
  showForm:    { type: Boolean, default: false },
  formLabel:   { type: String,  default: 'Form' },
  highlightId: { type: [String, Number], default: null },
})

// Last 5 results (W/D/L) from whatever field the API provides. Returns [] when
// the standings response carries no form data (column then renders empty).
function formList(row) {
  const f = row.form ?? row.recent_form ?? row.last_5 ?? ''
  const arr = Array.isArray(f)
    ? f
    : String(f).replace(/[^WDLwdl]/g, '').split('')
  return arr.map((c) => String(c).toUpperCase()).slice(-5)
}
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
          <th v-if="showForm" scope="col" class="standings__th-form">{{ formLabel }}</th>
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
          <td v-if="showForm" class="standings__form">
            <span
              v-for="(r, fi) in formList(row)"
              :key="fi"
              class="standings__form-dot"
              :class="`standings__form-dot--${r.toLowerCase()}`"
              :title="r"
            >{{ r }}</span>
          </td>
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

.standings__form {
  white-space: nowrap;
}

.standings__form-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin: 0 1px;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 800;
  color: #fff;
  vertical-align: middle;
}

.standings__form-dot--w { background: #16a34a; }
.standings__form-dot--d { background: #9ca3af; }
.standings__form-dot--l { background: var(--color-red, #e53935); }

</style>
