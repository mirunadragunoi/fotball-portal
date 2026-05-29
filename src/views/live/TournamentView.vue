<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useLiveScoreStore } from '@/stores/livescore'
import { useCompetitionStore } from '@/stores/competition'
import { WC_2026_COMPETITION_ID, LIVESCORE_POLL } from '@/config/livescore'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'
import GroupStageGrid from '@/components/livescore/GroupStageGrid.vue'
import GoalscorersTable from '@/components/livescore/GoalscorersTable.vue'

const CID = WC_2026_COMPETITION_ID

const liveStore = useLiveScoreStore()
const compStore = useCompetitionStore()

const wcLiveMatches = computed(() =>
  liveStore.liveMatches.filter(
    (m) => String(m.competition?.id) === String(CID),
  ),
)

onMounted(async () => {
  await Promise.all([
    liveStore.loadLive(),
    compStore.loadGroups(CID),
    compStore.loadGoalscorers(CID),
  ])
  liveStore.setupVisibilityPolling(LIVESCORE_POLL.live)
})

onUnmounted(() => {
  liveStore.teardownVisibilityPolling()
})
</script>

<template>
  <main class="tournament-page">
    <div class="tournament-page__header">
      <SectionHeader
        eyebrow="Tournament 2026"
        title="International Football Tournament 2026"
        id="tournament-heading"
      />
    </div>

    <!-- Live matches for this tournament -->
    <section v-if="wcLiveMatches.length" class="tournament-page__section" aria-label="Live matches">
      <h2 class="tournament-page__section-title">
        <span class="tournament-page__live-dot" aria-hidden="true"></span>
        Live now
      </h2>
      <div class="tournament-page__live-list">
        <LiveMatchRow
          v-for="m in wcLiveMatches"
          :key="m.id"
          :match="m"
          @select="liveStore.selectMatch"
        />
      </div>
    </section>

    <!-- Group stage -->
    <section class="tournament-page__section" aria-label="Group stage">
      <h2 class="tournament-page__section-title">Group stage</h2>

      <div v-if="!compStore.groups.length && !liveStore.loading" class="tournament-page__empty">
        <EmptyState message="Group data not available yet." :show-reset="false" />
      </div>

      <div v-else-if="!compStore.groups.length" class="tournament-page__skeletons">
        <SkeletonCard v-for="n in 6" :key="n" />
      </div>

      <GroupStageGrid
        v-else
        :groups="compStore.groups"
        :competition-id="CID"
        :live-matches="wcLiveMatches"
      />
    </section>

    <!-- Top goalscorers -->
    <section class="tournament-page__section tournament-page__section--scorers" aria-label="Top goalscorers">
      <h2 class="tournament-page__section-title">Top goalscorers</h2>
      <GoalscorersTable
        :scorers="compStore.topGoalscorers"
        :loading="!compStore.topGoalscorers.length && compStore.loading"
      />
    </section>
  </main>
</template>

<style scoped>
.tournament-page {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 24px var(--content-padding) 64px;
}

.tournament-page__header {
  margin-bottom: 32px;
}

.tournament-page__section {
  margin-bottom: 40px;
}

.tournament-page__section-title {
  font-family: var(--font-heading);
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tournament-page__live-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.tournament-page__live-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.tournament-page__skeletons {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.tournament-page__section--scorers {
  max-width: 600px;
}

.tournament-page__empty {
  color: var(--color-text-secondary);
}
</style>
