<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLiveScoreStore } from '@/stores/livescore'
import { useCompetitionStore } from '@/stores/competition'
import { WC_2026_COMPETITION_ID, LIVESCORE_POLL } from '@/config/livescore'
import { useBrandStore } from '@/stores/brand'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'
import MatchDetail from '@/components/livescore/MatchDetail.vue'
import GroupStageGrid from '@/components/livescore/GroupStageGrid.vue'
import GoalscorersTable from '@/components/livescore/GoalscorersTable.vue'

const { t } = useI18n()
const CID = WC_2026_COMPETITION_ID

const liveStore  = useLiveScoreStore()
const compStore  = useCompetitionStore()
const brandStore = useBrandStore()

const isF2      = computed(() => brandStore.activeBrand === 'football2')
const activeTab = ref('groups')

const wcLiveMatches = computed(() =>
  liveStore.liveMatches.filter(m => String(m.competition?.id) === String(CID))
)

const fixtureDate = ref(todayIso())

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

async function loadFixtures() {
  await compStore.loadFixtures(CID, { date: fixtureDate.value })
}

watch(fixtureDate, loadFixtures)

watch(activeTab, async (tab) => {
  if (tab === 'matches') await loadFixtures()
})

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
  liveStore.clearSelection()
})
</script>

<template>
  <main class="tournament-page" :class="{ 'tournament-page--f2': isF2 }">
    <div class="tournament-page__header">
      <SectionHeader
        eyebrow="Championship 2026"
        title="International Football Championship 2026"
        id="tournament-heading"
      />
    </div>

    <!-- Sub-tabs -->
    <div class="tournament-page__tabs" role="tablist" aria-label="Championship sections">
      <button
        type="button"
        role="tab"
        class="tournament-page__tab"
        :class="{ 'tournament-page__tab--active': activeTab === 'groups' }"
        :aria-selected="activeTab === 'groups'"
        @click="activeTab = 'groups'"
      >
        Groups
      </button>
      <button
        type="button"
        role="tab"
        class="tournament-page__tab"
        :class="{ 'tournament-page__tab--active': activeTab === 'matches' }"
        :aria-selected="activeTab === 'matches'"
        @click="activeTab = 'matches'"
      >
        Matches
      </button>
    </div>

    <!-- ── GROUPS TAB ── -->
    <template v-if="activeTab === 'groups'">
      <section class="tournament-page__section" aria-label="Group stage">
        <div v-if="!compStore.groups.length && compStore.loading" class="tournament-page__skeletons">
          <SkeletonCard v-for="n in 6" :key="n" />
        </div>
        <EmptyState
          v-else-if="!compStore.groups.length"
          message="Group data not available yet."
          :show-reset="false"
        />
        <GroupStageGrid
          v-else
          :groups="compStore.groups"
          :competition-id="CID"
          :live-matches="wcLiveMatches"
        />
      </section>

      <section class="tournament-page__section tournament-page__section--scorers" aria-label="Top goalscorers">
        <h2 class="tournament-page__section-title">Top goalscorers</h2>
        <GoalscorersTable
          :scorers="compStore.topGoalscorers"
          :loading="!compStore.topGoalscorers.length && compStore.loading"
        />
      </section>
    </template>

    <!-- ── MATCHES TAB ── -->
    <template v-else-if="activeTab === 'matches'">
      <div class="tournament-page__matches-layout">
        <section class="tournament-page__main">

          <!-- Live now -->
          <template v-if="wcLiveMatches.length">
            <h2 class="tournament-page__section-title">
              <span class="tournament-page__live-dot" aria-hidden="true"></span>
              Live now
            </h2>
            <div class="tournament-page__list">
              <LiveMatchRow
                v-for="m in wcLiveMatches"
                :key="m.id"
                :match="m"
                :selected="liveStore.selectedMatch?.id === m.id"
                @select="liveStore.selectMatch"
              />
            </div>
          </template>

          <!-- Fixtures -->
          <h2 class="tournament-page__section-title" :class="{ 'tournament-page__section-title--mt': wcLiveMatches.length }">
            Fixtures
          </h2>

          <label class="tournament-page__date-label">
            <span>Date</span>
            <input v-model="fixtureDate" type="date" class="tournament-page__date-input" />
          </label>

          <div v-if="compStore.loading" class="tournament-page__skeletons tournament-page__skeletons--list">
            <SkeletonCard v-for="n in 3" :key="n" />
          </div>
          <div v-else-if="compStore.fixtures.length" class="tournament-page__list">
            <LiveMatchRow
              v-for="m in compStore.fixtures"
              :key="m.id || m.fixture_id"
              :match="m"
              :selected="liveStore.selectedMatch?.id === (m.id || m.fixture_id)"
              @select="liveStore.selectMatch"
            />
          </div>
          <EmptyState
            v-else
            message="No matches scheduled for this date."
            :show-reset="false"
          />
        </section>

        <!-- Match detail panel -->
        <MatchDetail
          v-if="liveStore.selectedMatch"
          class="tournament-page__detail"
          :match="liveStore.selectedMatch"
          :events="liveStore.selectedMatchEvents"
          :commentary="liveStore.selectedMatchCommentary"
          :stats="liveStore.selectedMatchStats"
          :lineups="liveStore.selectedMatchLineups"
          :loading="liveStore.detailLoading"
          :detail-error="liveStore.detailError"
          @close="liveStore.clearSelection()"
        />
      </div>
    </template>
  </main>
</template>

<style scoped>
.tournament-page {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 24px var(--content-padding) 64px;
}

.tournament-page__header {
  margin-bottom: 24px;
}

/* Sub-tabs */
.tournament-page__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.tournament-page__tab {
  min-height: 44px;
  padding: 10px 20px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: var(--transition-default);
}

.tournament-page__tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.tournament-page--f2 .tournament-page__tab {
  border-radius: 999px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 14px;
}

.tournament-page--f2 .tournament-page__tab--active {
  color: #10112a;
}

/* Sections */
.tournament-page__section {
  margin-bottom: 40px;
}

.tournament-page__section--scorers {
  max-width: 600px;
}

.tournament-page__section-title {
  font-family: var(--font-heading);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
}

.tournament-page__section-title--mt {
  margin-top: 28px;
}

.tournament-page--f2 .tournament-page__section-title {
  text-transform: none;
  letter-spacing: 0;
}

.tournament-page__live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

.tournament-page__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 4px;
}

.tournament-page__skeletons {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.tournament-page__skeletons--list {
  grid-template-columns: 1fr;
}

/* Date picker */
.tournament-page__date-label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  max-width: 200px;
}

.tournament-page__date-input {
  min-height: 40px;
  padding: 7px 10px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
}

/* Matches layout — 2 col on desktop for detail panel */
.tournament-page__matches-layout {
  display: grid;
  gap: 20px;
}

@media (min-width: 1024px) {
  .tournament-page__matches-layout {
    grid-template-columns: 1fr minmax(320px, 400px);
    align-items: start;
  }
}

.tournament-page__detail {
  position: sticky;
  top: calc(var(--header-height) + 16px);
}
</style>
