<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useWorldCupTeamsStore } from '@/stores/rosters'
import { fetchStandings, fetchLiveStandings } from '@/services/livescoreApi'

const props = defineProps({
  groupName:  { type: String, required: true },
  groupId:    { type: [Number, String], required: true },
  competitionId: { type: [Number, String], required: true },
  liveMatchIds:  { type: Array, default: () => [] },
})

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const wcStore = useWorldCupTeamsStore()

const creds = computed(() => authStore.getAuthQuery() || {})
const rows = ref([])
const loading = ref(true)

onMounted(async () => {
  wcStore.loadTeams()
  try {
    rows.value = await fetchStandings(creds.value, props.competitionId, { groupId: props.groupId })
    if (props.liveMatchIds.length && rows.value.length) {
      try {
        const live = await fetchLiveStandings(creds.value, props.competitionId, { groupId: props.groupId })
        if (live?.length) rows.value = live
      } catch {
        // live standings not available on this plan
      }
    }
  } catch {
    rows.value = []
  } finally {
    loading.value = false
  }
})

function findWcTeam(row) {
  const lsaId = row.team_id || row.team?.id
  const byId = lsaId ? wcStore.getTeamByLsaId(lsaId) : null
  if (byId) return byId
  const name = row.name || row.team?.name || row.team?.full_name || row.team_name
  return name ? wcStore.getTeamByName(name) : null
}

function navigateToTeam(row) {
  const wcTeam = findWcTeam(row)
  if (!wcTeam) return
  router.push({ name: 'TournamentTeamSquad', params: { teamId: wcTeam.id } })
}

function teamHasLink(row) {
  return findWcTeam(row) != null
}
</script>

<template>
  <div class="group-card">
    <h3 class="group-card__title">{{ t('worldcup.groupLabel') }} {{ groupName }}</h3>

    <p v-if="loading" class="group-card__hint">{{ t('worldcup.groupLoading') }}</p>
    <p v-else-if="!rows.length" class="group-card__hint">{{ t('worldcup.groupNoData') }}</p>

    <table v-else class="group-card__table">
      <thead>
        <tr>
          <th class="group-card__th-team">{{ t('worldcup.groupColTeam') }}</th>
          <th>P</th>
          <th>W</th>
          <th>D</th>
          <th>L</th>
          <th>{{ t('worldcup.groupColPts') }}</th>
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
              v-if="row.team?.logo || row.team_logo || findWcTeam(row)?.logo"
              :src="row.team?.logo || row.team_logo || findWcTeam(row)?.logo"
              alt=""
              width="16"
              height="16"
              loading="lazy"
            />
            <button
              v-if="teamHasLink(row)"
              class="group-card__team-link"
              @click="navigateToTeam(row)"
            >
              {{ row.team?.name || row.team?.full_name || row.team_name || row.name || '—' }}
            </button>
            <span v-else>
              {{ row.team?.name || row.team?.full_name || row.team_name || row.name || '—' }}
            </span>
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

.group-card__team-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition: color 0.15s ease;
}

.group-card__team-link:hover {
  color: var(--color-primary);
  text-decoration: underline;
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
