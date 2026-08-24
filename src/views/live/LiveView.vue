<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { useLiveScoreStore } from '@/stores/livescore'
import { LIVESCORE_POLL } from '@/config/livescore'
import { EUROPEAN_COMPETITIONS } from '@/config/europeanCompetitions'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import LiveTabs from '@/components/livescore/LiveTabs.vue'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'
import StandingsTable from '@/components/livescore/StandingsTable.vue'

const { t } = useI18n()
const router = useRouter()
const brandStore = useBrandStore()
const store = useLiveScoreStore()

const isF2 = computed(() => brandStore.activeBrand === 'football2')

const errorMessage = computed(() =>
  store.error ? (typeof store.error === 'string' ? store.error : t('live.errorLoad')) : '',
)

const lastUpdatedLabel = computed(() => {
  if (!store.lastUpdated) return ''
  return t('live.updatedAt', {
    time: store.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })
})

onMounted(async () => {
  await Promise.all([
    store.loadTabData(),
    store.loadCompetitions(),
  ])
  store.setupVisibilityPolling(LIVESCORE_POLL.live)
})

onUnmounted(() => {
  store.teardownVisibilityPolling()
  store.clearSelection()
})

watch(() => store.activeTab, () => store.loadTabData())

watch(() => store.fixtureDate, () => {
  if (store.activeTab === 'fixtures') store.loadFixtures()
})

watch(() => store.standingsCompetitionId, () => {
  if (store.activeTab === 'standings') store.loadStandings()
})


function onMatchSelect(match) {
  const id = match.id ?? match.match_id ?? match.fixture_id
  if (id) router.push({ name: 'MatchDetail', params: { matchId: id } })
}

function onCompetitionSelect(competitionId) {
  if (competitionId) router.push({ name: 'CompetitionDetail', params: { competitionId } })
}

// Quick-filter chips for the biggest competitions (client-side; data is already
// loaded via the CSV competition filter).
const QUICK_FILTER_KEYS = ['championsLeague', 'premierLeague', 'laLiga', 'serieA', 'bundesliga', 'ligue1']
const QUICK_LABELS = { championsLeague: 'UCL' }
const quickFilters = QUICK_FILTER_KEYS
  .filter((k) => EUROPEAN_COMPETITIONS[k])
  .map((k) => ({ id: EUROPEAN_COMPETITIONS[k].id, label: QUICK_LABELS[k] || EUROPEAN_COMPETITIONS[k].name }))

function isQuickActive(id) {
  return String(store.liveCompetitionId) === String(id)
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
      <div class="live-page__meta">
        <p v-if="store.activeTab === 'live' && lastUpdatedLabel" class="live-page__updated">
          {{ lastUpdatedLabel }}
          <span v-if="store.liveCount" class="live-page__count">
            · {{ t('live.liveCount', { count: store.liveCount }) }}
          </span>
        </p>
      </div>
    </div>

    <div class="live-page__controls">
      <LiveTabs :active="store.activeTab" :is-f2="isF2" @change="store.setTab" />
      <button
        class="live-page__europe-btn"
        :class="{ 'live-page__europe-btn--active': store.filterEurope }"
        @click="store.toggleEuropeFilter"
        :title="store.filterEurope ? t('live.filterEuropeOff') : t('live.filterEuropeOn')"
      >
        🌍 {{ store.filterEurope ? t('live.filterEuropeOn') : t('live.filterEuropeOff') }}
      </button>
    </div>

    <!-- Competition quick filters (live + fixtures) -->
    <div
      v-if="store.activeTab === 'live' || store.activeTab === 'fixtures'"
      class="live-page__quickfilters"
      role="group"
      :aria-label="t('nav.competitions')"
    >
      <button
        type="button"
        class="live-page__chip"
        :class="{ 'live-page__chip--active': !store.liveCompetitionId }"
        @click="store.setLiveCompetitionFilter('')"
      >
        {{ t('live.quickAll') }}
      </button>
      <button
        v-for="qf in quickFilters"
        :key="qf.id"
        type="button"
        class="live-page__chip"
        :class="{ 'live-page__chip--active': isQuickActive(qf.id) }"
        @click="store.setLiveCompetitionFilter(qf.id)"
      >
        {{ qf.label }}
      </button>
    </div>

    <div v-if="errorMessage" class="live-page__error" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" class="live-page__retry" @click="store.loadTabData()">Retry</button>
    </div>

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
                  @select="onMatchSelect"
                  @select-competition="onCompetitionSelect"
                />
              </div>
            </div>
          </template>
          <template v-else-if="store.filterEurope && !Object.keys(store.matchesByCompetition).length && store.liveMatches.length">
            <p class="live-page__no-europe">{{ t('live.noEuropeMatches') }}</p>
            <button class="live-page__show-all" @click="store.toggleEuropeFilter">
              {{ t('live.showAll') }} →
            </button>
          </template>
          <EmptyState v-else :message="t('live.emptyLiveMessage')" :show-reset="false" />
        </template>

        <template v-else-if="store.activeTab === 'fixtures'">
          <label class="live-page__date">
            <span>{{ t('live.fixtureDate') }}</span>
            <input v-model="store.fixtureDate" type="date" />
          </label>
          <div v-if="store.filteredFixtures.length" class="live-page__list">
            <LiveMatchRow
              v-for="match in store.filteredFixtures"
              :key="match.id || match.fixture_id"
              :match="match"
              @select="onMatchSelect"
              @select-competition="onCompetitionSelect"
            />
          </div>
          <template v-else-if="store.filterEurope && !store.filteredFixtures.length && store.fixtures.length">
            <p class="live-page__no-europe">{{ t('live.noEuropeMatches') }}</p>
            <button class="live-page__show-all" @click="store.toggleEuropeFilter">
              {{ t('live.showAll') }} →
            </button>
          </template>
          <EmptyState v-else :message="t('live.emptyFixturesMessage')" :show-reset="false" />
        </template>

        <template v-else-if="store.activeTab === 'standings'">
          <label class="live-page__select">
            <span>{{ t('live.selectCompetition') }}</span>
            <select v-model="store.standingsCompetitionId">
              <option value="">{{ t('live.selectCompetitionPlaceholder') }}</option>
              <option v-for="c in store.competitions" :key="c.id" :value="String(c.id)">
                {{ c.name }}
              </option>
            </select>
          </label>
          <RouterLink
            v-if="store.standingsCompetitionId"
            :to="`/live/competition/${store.standingsCompetitionId}`"
            class="live-page__view-comp"
          >
            {{ t('live.viewCompetition') }}
          </RouterLink>
          <StandingsTable v-if="store.standings.length" :rows="store.standings" />
          <EmptyState v-else :message="t('live.emptyStandingsMessage')" :show-reset="false" />
        </template>
    </section>
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

.live-page__meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.live-page__updated {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.live-page__count {
  color: var(--color-accent);
  font-weight: 700;
}

.live-page__error {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-accent);
  margin-bottom: 16px;
  font-size: 14px;
}

.live-page__retry {
  padding: 4px 12px;
  border-radius: var(--radius-button);
  border: 1px solid currentColor;
  background: none;
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--transition-default);
}

.live-page__retry:hover {
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
}


.live-page__controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.live-page__controls :deep(.live-tabs) {
  margin-bottom: 0;
  flex: 1;
}

.live-page__europe-btn {
  flex-shrink: 0;
  height: 44px;
  padding: 0 16px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-default);
  white-space: nowrap;
}

.live-page__europe-btn--active {
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.live-page__europe-btn:hover:not(.live-page__europe-btn--active) {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  color: var(--color-text);
}

/* Competition quick-filter chips */
.live-page__quickfilters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.live-page__chip {
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-default);
  white-space: nowrap;
}

.live-page__chip:hover:not(.live-page__chip--active) {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  color: var(--color-text);
}

.live-page__chip--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.live-page--f2 .live-page__chip--active {
  color: #10112a;
}

.live-page__view-comp {
  display: inline-block;
  margin-bottom: 16px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.live-page__view-comp:hover {
  text-decoration: underline;
}

.live-page__no-europe {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
}

.live-page__show-all {
  background: none;
  border: none;
  padding: 0;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
}

.live-page__group + .live-page__group { margin-top: 24px; }

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

.live-page__skeletons { display: grid; gap: 12px; }

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
