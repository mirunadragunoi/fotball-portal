<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWorldCupTeamsStore } from '@/stores/rosters'
import TeamBanner from '@/components/livescore/TeamBanner.vue'
import PlayerPositionGroup from '@/components/livescore/PlayerPositionGroup.vue'
import PlayerDetailModal from '@/components/livescore/PlayerDetailModal.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const { t } = useI18n()
const route  = useRoute()
const router = useRouter()
const store  = useWorldCupTeamsStore()

onMounted(() => store.loadTeams())

const teamId = computed(() => route.params.teamId)

const team = computed(() => store.getTeamById(teamId.value))

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']
const POSITION_LABELS = computed(() => ({
  Goalkeeper: t('worldcup.posGoalkeepers'),
  Defender:   t('worldcup.posDefenders'),
  Midfielder: t('worldcup.posMidfielders'),
  Attacker:   t('worldcup.posAttackers'),
}))

const playersByPosition = computed(() => {
  if (!team.value?.players?.length) return []
  const map = {}
  for (const p of team.value.players) {
    const pos = p.position || 'Other'
    if (!map[pos]) map[pos] = []
    map[pos].push(p)
  }
  // Sort by number within each position
  for (const pos in map) {
    map[pos].sort((a, b) => (a.number || 99) - (b.number || 99))
  }
  return POSITION_ORDER
    .filter((pos) => map[pos]?.length)
    .map((pos) => ({
      position: pos,
      label:    POSITION_LABELS.value[pos] || pos,
      players:  map[pos],
    }))
    .concat(
      // any unlisted positions (e.g. 'Other') appended at the end
      Object.entries(map)
        .filter(([pos]) => !POSITION_ORDER.includes(pos))
        .map(([pos, players]) => ({ position: pos, label: pos, players }))
    )
})

// Player detail modal
const activePlayer = ref(null)

function openPlayer(player) {
  activePlayer.value = player
}

function closePlayer() {
  activePlayer.value = null
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'Tournament', query: { tab: 'teams' } })
  }
}
</script>

<template>
  <main class="tsv">
    <button class="tsv__back" @click="goBack" :aria-label="t('worldcup.backToTeams')">
      {{ t('worldcup.backToTeams') }}
    </button>

    <!-- loading -->
    <div v-if="store.loading" class="tsv__skeletons">
      <SkeletonCard v-for="n in 4" :key="n" />
    </div>

    <!-- not found -->
    <EmptyState
      v-else-if="!team"
      :message="t('worldcup.teamNotFound')"
      :show-reset="false"
    />

    <template v-else>
      <TeamBanner :team="team" />

      <div class="tsv__summary">
        <span class="tsv__player-count">{{ t('worldcup.playerCount', { count: team.players?.length || 0 }) }}</span>
        <span v-if="!team.players?.length" class="tsv__no-squad">
          {{ t('worldcup.noSquad') }}
        </span>
      </div>

      <PlayerPositionGroup
        v-for="group in playersByPosition"
        :key="group.position"
        :position-label="group.label"
        :players="group.players"
        :team="team"
        @select-player="openPlayer"
      />
    </template>

    <!-- Player detail modal -->
    <PlayerDetailModal
      :player="activePlayer"
      :team="team"
      @close="closePlayer"
    />
  </main>
</template>

<style scoped>
.tsv {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 20px var(--content-padding) 64px;
}

.tsv__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  padding: 8px 14px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-default);
}

.tsv__back:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.tsv__skeletons {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.tsv__summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.tsv__player-count {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  padding: 4px 10px;
  border-radius: 99px;
}

.tsv__no-squad {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-style: italic;
}
</style>