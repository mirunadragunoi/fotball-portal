<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useLiveScoreStore } from '@/stores/livescore'
import { LIVESCORE_POLL } from '@/config/livescore'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import LiveTabs from '@/components/livescore/LiveTabs.vue'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'
import MatchEventsPanel from '@/components/livescore/MatchEventsPanel.vue'
import StandingsTable from '@/components/livescore/StandingsTable.vue'

const { t } = useI18n()
const brandStore = useBrandStore()
const store = useLiveScoreStore()

const isF2 = computed(() => brandStore.activeBrand === 'football2')

const errorMessage = computed(() => {
  if (!store.error) return ''
  return typeof store.error === 'string' ? store.error : t('live.errorLoad')
})

const lastUpdatedLabel = computed(() => {
  if (!store.lastUpdated) return ''
  return t('live.updatedAt', {
    time: store.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })
})

onMounted(async () => {
  await store.loadCompetitions()
  await store.loadTabData()
  store.startLivePolling(LIVESCORE_POLL.live)
})

onUnmounted(() => {
  store.stopLivePolling()
  store.clearSelectedMatch()
})

watch(
  () => store.activeTab,
  () => store.loadTabData(),
)

watch(
  () => store.fixtureDate,
  () => {
    if (store.activeTab === 'fixtures') store.loadFixtures()
  },
)

watch(
  () => store.standingsCompetitionId,
  () => {
    if (store.activeTab === 'standings') store.loadStandings()
  },
)

function onTabChange(tab) {
  store.setTab(tab)
}

async function onMatchSelect(match) {
  await store.loadMatchEvents(match)
}
</script>

<template>
  <main class="live-page" :class="{ 'live-page--f2': isF2 }">
    <div class="live-page__header">
      <SectionHeader
        :eyebrow="t('live.eyebrow')"
        :title="t('live.title')"
        id="live-heading"
      />
      <p class="live-page__subtitle">{{ t('live.subtitle') }}</p>
      <p v-if="store.activeTab === 'live' && lastUpdatedLabel" class="live-page__updated">
        {{ lastUpdatedLabel }}
        <span v-if="store.liveCount" class="live-page__count">
          · {{ t('live.liveCount', { count: store.liveCount }) }}
        </span>
      </p>
    </div>

    <LiveTabs :active="store.activeTab" :is-f2="isF2" @change="onTabChange" />

    <p v-if="errorMessage" class="live-page__error" role="alert">{{ errorMessage }}</p>

    <div class="live-page__layout">
      <section class="live-page__main" aria-labelledby="live-heading">
        <div v-if="store.loading" class="live-page__skeletons">
          <SkeletonCard v-for="n in 4" :key="n" />
        </div>

        <template v-else-if="store.activeTab === 'live'">
          <template v-if="Object.keys(store.matchesByCompetition).length">
            <div
              v-for="(groupMatches, compName) in store.matchesByCompetition"
              :key="compName"
              class="live-page__group"
            >
              <h2 class="live-page__group-title">{{ compName }}</h2>
              <div class="live-page__list">
                <LiveMatchRow
                  v-for="match in groupMatches"
                  :key="match.id"
                  :match="match"
                  :selected="store.selectedMatch?.id === match.id"
                  @select="onMatchSelect"
                />
              </div>
            </div>
          </template>
          <EmptyState v-else :message="t('live.emptyLiveMessage')" :show-reset="false" />
        </template>

        <template v-else-if="store.activeTab === 'fixtures'">
          <label class="live-page__date">
            <span>{{ t('live.fixtureDate') }}</span>
            <input v-model="store.fixtureDate" type="date" />
          </label>
          <div v-if="store.fixtures.length" class="live-page__list">
            <LiveMatchRow
              v-for="match in store.fixtures"
              :key="match.id || match.fixture_id"
              :match="match"
              :selected="store.selectedMatch?.id === match.id"
              @select="onMatchSelect"
            />
          </div>
          <EmptyState v-else :message="t('live.emptyFixturesMessage')" :show-reset="false" />
        </template>

        <template v-else-if="store.activeTab === 'standings'">
          <label class="live-page__select">
            <span>{{ t('live.selectCompetition') }}</span>
            <select v-model="store.standingsCompetitionId">
              <option value="">{{ t('live.selectCompetitionPlaceholder') }}</option>
              <option
                v-for="c in store.competitions"
                :key="c.id"
                :value="String(c.id)"
              >
                {{ c.name }}
              </option>
            </select>
          </label>
          <StandingsTable v-if="store.standings.length" :rows="store.standings" />
          <EmptyState v-else :message="t('live.emptyStandingsMessage')" :show-reset="false" />
        </template>
      </section>

      <MatchEventsPanel
        v-if="store.selectedMatch"
        class="live-page__events"
        :match="store.selectedMatch"
        :events="store.selectedMatchEvents"
        :loading="store.eventsLoading"
        @close="store.clearSelectedMatch()"
      />
    </div>
  </main>
</template>

<style scoped>
.live-page {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 24px var(--content-padding) 64px;
}

.live-page__header {
  margin-bottom: 20px;
}

.live-page__subtitle {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1.5;
  max-width: 640px;
}

.live-page__updated {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.live-page__count {
  color: var(--color-accent);
  font-weight: 700;
}

.live-page__error {
  color: var(--color-accent);
  margin-bottom: 16px;
}

.live-page__layout {
  display: grid;
  gap: 20px;
}

@media (min-width: 1024px) {
  .live-page__layout {
    grid-template-columns: 1fr minmax(280px, 360px);
    align-items: start;
  }
}

.live-page__group + .live-page__group {
  margin-top: 24px;
}

.live-page__group-title {
  margin: 0 0 12px;
  font-family: var(--font-heading);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

.live-page__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.live-page__skeletons {
  display: grid;
  gap: 12px;
}

.live-page__date,
.live-page__select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.live-page__date input,
.live-page__select select {
  min-height: 44px;
  padding: 8px 12px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
}

.live-page--f2 .live-page__group-title {
  text-transform: none;
  letter-spacing: 0;
}
</style>
