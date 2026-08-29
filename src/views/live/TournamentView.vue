<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLiveScoreStore } from '@/stores/livescore'
import { useCompetitionStore } from '@/stores/competition'
import { useBrandStore } from '@/stores/brand'
import { LIVESCORE_POLL } from '@/config/livescore'
import { getCompetitionById } from '@/config/europeanCompetitions'
import { hasKnockoutFixtures } from '@/utils/bracket'
import { rememberSelectedMatch } from '@/utils/selectedMatch'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'
import GroupStageGrid from '@/components/livescore/GroupStageGrid.vue'
import GoalscorersTable from '@/components/livescore/GoalscorersTable.vue'
import TournamentBracket from '@/components/livescore/TournamentBracket.vue'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()

const liveStore  = useLiveScoreStore()
const compStore  = useCompetitionStore()
const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const competitionId = computed(() => route.params.competitionId)
const competition = computed(() => getCompetitionById(competitionId.value))
const competitionName = computed(() => competition.value?.name || t('live.competition', 'Competition'))

const TIER_BADGE_KEY = {
  'european-cup': 'competition.badgeUefa',
  bonus:          'competition.badgeCup',
}
const tierBadge = computed(() => {
  const key = TIER_BADGE_KEY[competition.value?.tier]
  return key ? t(key) : ''
})

// ── Loading flags ──────────────────────────────────────────────────────────
const groupsLoading  = ref(false)
const scorersLoading = ref(false)
const fixturesLoading = ref(false)

// ── Derived data ───────────────────────────────────────────────────────────
const liveMatches = computed(() =>
  liveStore.liveMatches.filter((m) => String(m?.competition?.id) === String(competitionId.value)),
)

const allFixtures = computed(() => compStore.fixtures || [])
const showBracket = computed(() => hasKnockoutFixtures(allFixtures.value))

function getRound(m) {
  return m.round || m.stage || m.competition?.round || m.fixture?.round || t('live.fixtures', 'Fixtures')
}
const fixturesByRound = computed(() => {
  const groups = {}
  for (const m of allFixtures.value) {
    const r = getRound(m)
    if (!groups[r]) groups[r] = []
    groups[r].push(m)
  }
  return groups
})

// Teams derived from the fixtures list (home/away), deduped.
const teams = computed(() => {
  const map = new Map()
  for (const m of allFixtures.value) {
    for (const side of ['home', 'away']) {
      const tm = m[side] || {}
      const id = tm.id ?? m[`${side}_id`]
      const name = tm.name ?? m[`${side}_name`]
      if (id && !map.has(String(id))) {
        map.set(String(id), { id, name: name || '—', logo: tm.logo || m[`${side}_logo`] || null })
      }
    }
  }
  return [...map.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

// ── Tabs ───────────────────────────────────────────────────────────────────
const tabs = computed(() =>
  [
    { key: 'groups',  label: t('worldcup.tabsGroups'),   hide: !competition.value?.hasGroups },
    { key: 'bracket', label: t('tournament.tabsBracket'), hide: !showBracket.value },
    { key: 'fixtures', label: t('worldcup.tabsFixtures') },
    { key: 'teams',   label: t('worldcup.tabsTeams'),    hide: !teams.value.length },
    { key: 'scorers', label: t('worldcup.tabsScorers') },
  ].filter((x) => !x.hide),
)

const activeTab = ref(route.query.tab || null)
const currentTab = computed(() => {
  const keys = tabs.value.map((t) => t.key)
  if (activeTab.value && keys.includes(activeTab.value)) return activeTab.value
  return keys[0] || 'fixtures'
})
function setTab(key) {
  activeTab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

// ── Navigation ─────────────────────────────────────────────────────────────
function onMatchClick(m) {
  const id = m?.id ?? m?.match_id ?? m?.fixture_id
  if (!id) return
  rememberSelectedMatch(m)
  router.push({ name: 'MatchDetail', params: { matchId: id } })
}

// ── Load ───────────────────────────────────────────────────────────────────
async function loadAll() {
  groupsLoading.value = scorersLoading.value = fixturesLoading.value = true
  await Promise.all([
    liveStore.loadLive(),
    compStore.loadGroups(competitionId.value).finally(() => { groupsLoading.value = false }),
    compStore.loadGoalscorers(competitionId.value).finally(() => { scorersLoading.value = false }),
    compStore.loadFixtures(competitionId.value).finally(() => { fixturesLoading.value = false }),
  ])
}

onMounted(async () => {
  await loadAll()
  liveStore.setupVisibilityPolling(LIVESCORE_POLL.live)
})

onUnmounted(() => {
  liveStore.teardownVisibilityPolling()
  liveStore.clearSelection()
})

// Reload when navigating between competitions without unmounting.
watch(competitionId, () => {
  activeTab.value = null
  loadAll()
})
</script>

<template>
  <main class="tv" :class="{ 'tv--f2': isF2 }">
    <!-- Hero -->
    <section class="tv-hero" :aria-label="competitionName">
      <div class="tv-hero__inner">
        <RouterLink :to="{ name: 'Competitions' }" class="tv-hero__back">← {{ t('nav.competitions') }}</RouterLink>
        <div class="tv-hero__titles">
          <h1 class="tv-hero__title">{{ competitionName }}</h1>
          <span v-if="tierBadge" class="tv-hero__badge">{{ tierBadge }}</span>
        </div>
      </div>
    </section>

    <!-- Live now -->
    <section v-if="liveMatches.length" class="tv-section" :aria-label="t('worldcup.liveNow')">
      <h2 class="tv-section-title">
        <span class="tv-live-dot" aria-hidden="true"></span>
        {{ t('worldcup.liveNow') }}
      </h2>
      <div class="tv-list">
        <LiveMatchRow v-for="m in liveMatches" :key="m.id" :match="m" @select="onMatchClick" />
      </div>
    </section>

    <!-- Tabs -->
    <div class="tv-tabs" role="tablist" :aria-label="competitionName">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="tv-tab"
        :class="{ 'tv-tab--active': currentTab === tab.key }"
        :aria-selected="currentTab === tab.key"
        @click="setTab(tab.key)"
      >{{ tab.label }}</button>
    </div>

    <!-- Groups -->
    <section v-if="currentTab === 'groups'" class="tv-section">
      <div v-if="groupsLoading && !compStore.groups.length" class="tv-skeletons">
        <SkeletonCard v-for="n in 8" :key="n" />
      </div>
      <EmptyState v-else-if="!compStore.groups.length" :message="t('worldcup.emptyGroups')" :show-reset="false" />
      <GroupStageGrid
        v-else
        :groups="compStore.groups"
        :competition-id="competitionId"
        :live-matches="liveMatches"
      />
    </section>

    <!-- Bracket -->
    <section v-else-if="currentTab === 'bracket'" class="tv-section">
      <TournamentBracket v-if="showBracket" :fixtures="allFixtures" @select="onMatchClick" />
      <EmptyState v-else :message="t('tournament.emptyBracket')" :show-reset="false" />
    </section>

    <!-- Fixtures -->
    <section v-else-if="currentTab === 'fixtures'" class="tv-section">
      <div v-if="fixturesLoading && !allFixtures.length" class="tv-skeletons tv-skeletons--list">
        <SkeletonCard v-for="n in 5" :key="n" />
      </div>
      <EmptyState v-else-if="!allFixtures.length" :message="t('worldcup.emptyFixtures')" :show-reset="false" />
      <template v-else>
        <template v-for="(matches, round) in fixturesByRound" :key="round">
          <h3 class="tv-round">{{ round }}</h3>
          <div class="tv-list">
            <LiveMatchRow
              v-for="m in matches"
              :key="m.id || m.fixture_id"
              :match="m"
              @select="onMatchClick"
            />
          </div>
        </template>
      </template>
    </section>

    <!-- Teams -->
    <section v-else-if="currentTab === 'teams'" class="tv-section">
      <EmptyState v-if="!teams.length" :message="t('worldcup.teamDataUnavailable')" :show-reset="false" />
      <div v-else class="tv-teams">
        <RouterLink
          v-for="team in teams"
          :key="team.id"
          :to="{ name: 'TeamDetail', params: { teamId: team.id } }"
          class="tv-team"
        >
          <img v-if="team.logo" :src="team.logo" alt="" class="tv-team__logo" width="40" height="40" loading="lazy" />
          <span v-else class="tv-team__logo tv-team__logo--ph" aria-hidden="true">{{ (team.name || '?')[0] }}</span>
          <span class="tv-team__name">{{ team.name }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- Top scorers -->
    <section v-else-if="currentTab === 'scorers'" class="tv-section tv-section--scorers">
      <GoalscorersTable :scorers="compStore.topGoalscorers" :loading="scorersLoading" />
      <EmptyState
        v-if="!compStore.topGoalscorers.length && !scorersLoading"
        :message="t('worldcup.emptyScorers')"
        :show-reset="false"
      />
    </section>
  </main>
</template>

<style scoped>
.tv {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 0 var(--content-padding) 64px;
}

.tv-hero {
  margin-inline: calc(var(--content-padding) * -1);
  padding: 40px var(--content-padding) 32px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, var(--color-bg)) 0%, var(--color-bg) 62%);
  border-bottom: 1px solid var(--color-line);
  margin-bottom: 24px;
}

.tv-hero__inner { max-width: var(--max-content-width); }

.tv-hero__back {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.tv-hero__back:hover { color: var(--color-text); }

.tv-hero__titles {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tv-hero__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(30px, 5vw, 52px);
  font-weight: 800;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: var(--color-text);
}
.tv--f2 .tv-hero__title { text-transform: none; }

.tv-hero__badge {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  padding: 4px 10px;
  border-radius: 999px;
}

.tv-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.tv-tabs::-webkit-scrollbar { display: none; }

.tv-tab {
  flex-shrink: 0;
  min-height: 44px;
  padding: 10px 18px;
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
.tv-tab--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.tv--f2 .tv-tab { border-radius: 999px; text-transform: none; letter-spacing: 0; font-size: 14px; }
.tv--f2 .tv-tab--active { color: #10112a; }

.tv-section { margin-bottom: 36px; }
.tv-section--scorers { max-width: 680px; }

.tv-section-title {
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
.tv--f2 .tv-section-title { text-transform: none; letter-spacing: 0; }

.tv-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-red, #e53935);
  animation: tv-pulse 1.2s ease-in-out infinite;
}
@keyframes tv-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.tv-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }

.tv-round {
  margin: 20px 0 10px;
  font-family: var(--font-heading);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-line);
}
.tv-round:first-child { margin-top: 0; }

.tv-skeletons {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}
.tv-skeletons--list { grid-template-columns: 1fr; }

.tv-teams {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.tv-team {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-card);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
  transition: var(--transition-default);
}
.tv-team:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  box-shadow: var(--shadow-card-hover);
}

.tv-team__logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}
.tv-team__logo--ph {
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-family: var(--font-heading);
  font-weight: 800;
}

.tv-team__name {
  font-weight: 600;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .tv-hero { padding: 28px 16px 24px; margin-inline: -16px; }
}
</style>
