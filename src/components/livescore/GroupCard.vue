<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { fetchStandings, fetchLiveStandings } from '@/services/livescoreApi'

const props = defineProps({
  groupName:  { type: String, required: true },   // "A", "B", …
  groupId:    { type: [Number, String], required: true },
  competitionId: { type: [Number, String], required: true },
  liveMatchIds:  { type: Array, default: () => [] }, // match IDs currently live for this group
})

const authStore = useAuthStore()
const creds = computed(() => authStore.getAuthQuery() || {})

const rows = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Always load regular standings first (available on free plan)
    rows.value = await fetchStandings(creds.value, props.competitionId, { groupId: props.groupId })

    // If live matches are active, try to enhance with live standings
    if (props.liveMatchIds.length && rows.value.length) {
      try {
        const live = await fetchLiveStandings(creds.value, props.competitionId, { groupId: props.groupId })
        if (live?.length) rows.value = live
      } catch {
        // live standings not available on this plan — keep regular standings
      }
    }
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="group-card">
    <h3 class="group-card__title">Group {{ groupName }}</h3>

    <p v-if="loading" class="group-card__hint">Loading…</p>
    <p v-else-if="!rows.length" class="group-card__hint">No data yet.</p>

    <table v-else class="group-card__table">
      <thead>
        <tr>
          <th class="group-card__th-team">Team</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="row.team?.id || i"
          :class="{ 'group-card__tr--live': row.live?.score }"
        >
          <td class="group-card__team">
            <img
              v-if="row.team?.logo || row.team_logo"
              :src="row.team?.logo || row.team_logo"
              alt=""
              width="16"
              height="16"
              loading="lazy"
            />
            <span>{{ row.team?.name || row.team?.full_name || row.team_name || row.name || '—' }}</span>
            <span v-if="row.live?.score" class="group-card__live-score">
              {{ row.live.score }}
            </span>
          </td>
          <td>{{ row.matches ?? '–' }}</td>
          <td>{{ row.won ?? '–' }}</td>
          <td>{{ row.drawn ?? row.draw ?? '–' }}</td>
          <td>{{ row.lost ?? '–' }}</td>
          <td class="group-card__pts">{{ row.points ?? '–' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.group-card {
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  border-radius: var(--radius-card);
  padding: 14px 16px;
}

.group-card__title {
  font-family: var(--font-heading);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 10px;
  color: var(--color-primary);
}

.group-card__hint {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
}

.group-card__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.group-card__table th,
.group-card__table td {
  padding: 6px 4px;
  text-align: center;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
}

.group-card__table th {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.group-card__th-team,
.group-card__team {
  text-align: left;
}

.group-card__team {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.group-card__live-score {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  padding: 1px 6px;
  border-radius: 4px;
}

.group-card__tr--live {
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
}

.group-card__pts {
  font-weight: 800;
  color: var(--color-primary);
}
</style>
