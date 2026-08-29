<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLiveScoreStore } from '@/stores/livescore'
import { useCompetitionStore } from '@/stores/competition'
import { useBrandStore } from '@/stores/brand'
import { WC_2026_COMPETITION_ID, LIVESCORE_POLL } from '@/config/livescore'
import { rememberSelectedMatch } from '@/utils/selectedMatch'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'
import GroupStageGrid from '@/components/livescore/GroupStageGrid.vue'
import GoalscorersTable from '@/components/livescore/GoalscorersTable.vue'
import QualifiedTeamsSection from '@/components/livescore/QualifiedTeamsSection.vue'

const CID = WC_2026_COMPETITION_ID

const route  = useRoute()
const router = useRouter()
const liveStore  = useLiveScoreStore()
const compStore  = useCompetitionStore()
const brandStore = useBrandStore()

const { t } = useI18n()
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const TABS = computed(() => [
  { key: 'groups',   label: t('worldcup.tabsGroups') },
  { key: 'fixtures', label: t('worldcup.tabsFixtures') },
  { key: 'teams',    label: t('worldcup.tabsTeams') },
  { key: 'scorers',  label: t('worldcup.tabsScorers') },
])

const activeTab = ref(route.query.tab || 'groups')

function setTab(key) {
  activeTab.value = key
  router.replace({ query: { tab: key } })
}

// Click on a match row navigates to the dedicated match page with full
// commentary, stats and lineups. The inline `MatchDetail` panel that this
// view used to render is no longer needed.
function onMatchClick(m) {
  const id = m?.id ?? m?.match_id ?? m?.fixture_id
  if (!id) return
  rememberSelectedMatch(m)
  router.push({ name: 'MatchDetail', params: { matchId: id } })
}

// ── Per-tab loading states (compStore.loading only covers loadFixtures) ──
const liveLoading    = ref(false)
const groupsLoading  = ref(false)
const scorersLoading = ref(false)

const wcLiveMatches = computed(() =>
  liveStore.liveMatches.filter(m => String(m.competition?.id) === String(CID))
)

// ── All Fixtures — grouped by round ───────────────────────────────────────
const allFixtures = computed(() => compStore.fixtures || [])

function getMatchRound(m) {
  return m.round || m.stage || m.competition?.round || m.fixture?.round || 'Other'
}

function matchSortKey(m) {
  const status = (m.status || m.match_status || '').toLowerCase()
  if (['in progress', 'live', 'playing', '1h', '2h', 'et', 'p', 'ht', 'bt'].some(s => status.includes(s))) return 0
  const today = new Date().toISOString().slice(0, 10)
  const date = m.date || m.match_date || m.fixture?.date || ''
  if (date === today) return 1
  if (date > today) return 2
  return 3
}

const fixturesByRound = computed(() => {
  const sorted = [...allFixtures.value].sort((a, b) => {
    const sk = matchSortKey(a) - matchSortKey(b)
    if (sk !== 0) return sk
    const da = a.date || a.match_date || a.fixture?.date || ''
    const db = b.date || b.match_date || b.fixture?.date || ''
    return da.localeCompare(db)
  })

  const groups = {}
  for (const m of sorted) {
    const round = getMatchRound(m)
    if (!groups[round]) groups[round] = []
    groups[round].push(m)
  }
  return groups
})

// ── Load data ─────────────────────────────────────────────────────────────
async function loadFixtures() {
  await compStore.loadFixtures(CID, {})
}

watch(activeTab, async (tab) => {
  if (tab === 'fixtures' && !allFixtures.value.length) await loadFixtures()
  if (tab === 'scorers' && !compStore.topGoalscorers.length) {
    scorersLoading.value = true
    await compStore.loadGoalscorers(CID)
    scorersLoading.value = false
  }
})

onMounted(async () => {
  liveLoading.value = true
  groupsLoading.value = true
  scorersLoading.value = true

  await Promise.all([
    liveStore.loadLive().finally(() => { liveLoading.value = false }),
    compStore.loadGroups(CID).finally(() => { groupsLoading.value = false }),
    compStore.loadGoalscorers(CID).finally(() => { scorersLoading.value = false }),
  ])

  if (activeTab.value === 'fixtures') await loadFixtures()
  liveStore.setupVisibilityPolling(LIVESCORE_POLL.live)
})

onUnmounted(() => {
  liveStore.teardownVisibilityPolling()
  liveStore.clearSelection()
})
</script>

<template>
  <main class="wc-page" :class="{ 'wc-page--f2': isF2 }">

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="wc-hero" :aria-label="t('worldcup.title')">
      <div class="wc-hero__inner">
        <p class="wc-hero__eyebrow">{{ t('worldcup.eyebrow') }}</p>
        <h1 class="wc-hero__title">{{ t('worldcup.title') }}</h1>
        <p class="wc-hero__subtitle">{{ t('worldcup.subtitle') }}</p>
        <div class="wc-hero__stats">
          <span class="wc-hero__stat">{{ t('worldcup.statTeams') }}</span>
          <span class="wc-hero__sep" aria-hidden="true">·</span>
          <span class="wc-hero__stat">{{ t('worldcup.statMatches') }}</span>
          <span class="wc-hero__sep" aria-hidden="true">·</span>
          <span class="wc-hero__stat">{{ t('worldcup.statStadiums') }}</span>
        </div>
      </div>
    </section>

    <!-- ── Live matches banner ───────────────────────────────────────────── -->
    <section class="wc-live-section" :aria-label="t('worldcup.ariaLive')">
      <template v-if="liveLoading">
        <div class="wc-skeletons wc-skeletons--live">
          <SkeletonCard v-for="n in 2" :key="n" />
        </div>
      </template>
      <template v-else-if="wcLiveMatches.length">
        <h2 class="wc-section-title">
          <span class="wc-live-dot" aria-hidden="true"></span>
          {{ t('worldcup.liveNow') }}
        </h2>
        <div class="wc-matches-list">
          <LiveMatchRow
            v-for="m in wcLiveMatches"
            :key="m.id"
            :match="m"
            :selected="liveStore.selectedMatch?.id === m.id"
            @select="onMatchClick"
          />
        </div>
      </template>
      <p v-else class="wc-no-live">{{ t('worldcup.noLive') }}</p>
    </section>

    <!-- ── Tab navigation ────────────────────────────────────────────────── -->
    <div class="wc-tabs" role="tablist" :aria-label="t('worldcup.ariaTabs')">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        role="tab"
        class="wc-tab"
        :class="{ 'wc-tab--active': activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="setTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- ── Tab: GROUPS ────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'groups'">
      <section class="wc-section" :aria-label="t('worldcup.ariaGroups')">
        <div v-if="groupsLoading" class="wc-skeletons">
          <SkeletonCard v-for="n in 12" :key="n" />
        </div>
        <EmptyState
          v-else-if="!compStore.groups.length"
          :message="t('worldcup.emptyGroups')"
          :show-reset="false"
        />
        <GroupStageGrid
          v-else
          :groups="compStore.groups"
          :competition-id="CID"
          :live-matches="wcLiveMatches"
        />
      </section>
    </template>

    <!-- ── Tab: ALL FIXTURES ──────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'fixtures'">
      <section class="wc-section" :aria-label="t('worldcup.ariaFixtures')">
        <div v-if="compStore.loading && !allFixtures.length" class="wc-skeletons wc-skeletons--list">
          <SkeletonCard v-for="n in 6" :key="n" />
        </div>
        <EmptyState
          v-else-if="!allFixtures.length && !compStore.loading"
          :message="t('worldcup.emptyFixtures')"
          :show-reset="false"
        />
        <div v-else class="wc-fixtures-layout">
          <div class="wc-fixtures-main">
            <template v-for="(matches, round) in fixturesByRound" :key="round">
              <h3 class="wc-round-title">{{ round }}</h3>
              <div class="wc-matches-list">
                <LiveMatchRow
                  v-for="m in matches"
                  :key="m.id || m.fixture_id"
                  :match="m"
                  :selected="liveStore.selectedMatch?.id === (m.id || m.fixture_id)"
                  @select="onMatchClick"
                />
              </div>
            </template>
          </div>
        </div>
      </section>
    </template>

    <!-- ── Tab: TEAMS ─────────────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'teams'">
      <section class="wc-section" :aria-label="t('worldcup.ariaTeams')">
        <QualifiedTeamsSection />
      </section>
    </template>

    <!-- ── Tab: TOP SCORERS ───────────────────────────────────────────────── -->
    <template v-else-if="activeTab === 'scorers'">
      <section class="wc-section wc-section--scorers" :aria-label="t('worldcup.ariaScorers')">
        <GoalscorersTable
          :scorers="compStore.topGoalscorers"
          :loading="scorersLoading"
        />
        <EmptyState
          v-if="!compStore.topGoalscorers.length && !scorersLoading"
          :message="t('worldcup.emptyScorers')"
          :show-reset="false"
        />
      </section>
    </template>

  </main>
</template>

<style scoped>
.wc-page {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 0 var(--content-padding) 64px;
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
.wc-hero {
  margin-inline: calc(var(--content-padding) * -1);
  padding: 56px var(--content-padding) 48px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 18%, var(--color-bg)) 0%,
    var(--color-bg) 60%
  );
  border-bottom: 1px solid var(--color-line);
  margin-bottom: 28px;
}

.wc-page--f2 .wc-hero {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 12%, var(--color-bg)) 0%,
    var(--color-bg) 70%
  );
}

.wc-hero__inner {
  max-width: var(--max-content-width);
}

.wc-hero__eyebrow {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.wc-hero__title {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.05;
  color: var(--color-text);
  text-transform: uppercase;
}

.wc-page--f2 .wc-hero__title {
  text-transform: none;
  letter-spacing: -0.03em;
}

.wc-hero__subtitle {
  margin: 0 0 20px;
  font-size: 18px;
  color: var(--color-text-secondary);
}

.wc-hero__stats {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.wc-hero__stat {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  border: 1px solid var(--color-line);
  border-radius: 6px;
  padding: 4px 12px;
}

.wc-hero__sep {
  color: var(--color-text-secondary);
  font-size: 12px;
}

/* ── Live section ─────────────────────────────────────────────────────── */
.wc-live-section {
  margin-bottom: 24px;
}

.wc-section-title {
  margin: 0 0 12px;
  font-family: var(--font-heading);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.wc-page--f2 .wc-section-title {
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-body);
}

.wc-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e53935;
  flex-shrink: 0;
  animation: wc-pulse 1.2s ease-in-out infinite;
}

@keyframes wc-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.wc-no-live {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */
.wc-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  flex-wrap: wrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.wc-tabs::-webkit-scrollbar { display: none; }

.wc-tab {
  flex-shrink: 0;
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
  white-space: nowrap;
}

.wc-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.wc-tab:hover:not(.wc-tab--active) {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  color: var(--color-text);
}

.wc-page--f2 .wc-tab {
  border-radius: 999px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 14px;
}

.wc-page--f2 .wc-tab--active {
  color: #10112a;
}

/* ── Sections ─────────────────────────────────────────────────────────── */
.wc-section {
  margin-bottom: 40px;
}

.wc-section--scorers {
  max-width: 680px;
}

.wc-skeletons {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.wc-skeletons--list {
  grid-template-columns: 1fr;
}

.wc-skeletons--live {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  margin-bottom: 20px;
}

/* ── All Fixtures ─────────────────────────────────────────────────────── */
.wc-fixtures-layout {
  display: grid;
  gap: 20px;
}

@media (min-width: 1024px) {
  .wc-fixtures-layout {
    grid-template-columns: 1fr minmax(320px, 400px);
    align-items: start;
  }
}

.wc-fixtures-detail {
  position: sticky;
  top: calc(var(--header-height) + 16px);
}

.wc-round-title {
  margin: 24px 0 10px;
  font-family: var(--font-heading);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-line);
}

.wc-round-title:first-child {
  margin-top: 0;
}

.wc-page--f2 .wc-round-title {
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-body);
}

.wc-matches-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 4px;
}

@media (max-width: 767px) {
  .wc-hero {
    padding: 36px 16px 32px;
    margin-inline: -16px;
  }
}
</style>
