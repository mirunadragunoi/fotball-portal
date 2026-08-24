<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { fetchLiveMatches, fetchFixtures } from '@/services/livescoreApi'
import {
  getCompetitionFilterForCountry,
  isLiveStatus,
  formatKickoff,
} from '@/utils/liveScoreFormat'
import LiveMatchRow from '@/components/livescore/LiveMatchRow.vue'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const POLL_MS = 30_000

const live = ref([])       // in-play matches from curated competitions
const upcoming = ref([])    // next scheduled fixtures (fallback)
const loaded = ref(false)
const now = ref(Date.now())

let timer = null

const creds = computed(() => authStore.getAuthQuery())

// Kickoff timestamp (ms) from a fixture's UTC date + time.
function kickoffMs(m) {
  const date = m?.date || m?.match_date || m?.fixture?.date
  if (!date) return Infinity
  const time = m?.time && /^\d{1,2}:\d{2}/.test(String(m.time)) ? String(m.time) : '00:00'
  const norm = time.length === 5 ? `${time}:00` : time
  const ts = Date.parse(`${date}T${norm}Z`)
  return Number.isNaN(ts) ? Infinity : ts
}

async function refresh() {
  if (!creds.value?.accessCode) return
  const filter = getCompetitionFilterForCountry() || undefined
  try {
    const matches = await fetchLiveMatches(creds.value, { competitionId: filter })
    live.value = (matches || []).filter((m) => isLiveStatus(m?.status)).slice(0, 3)
  } catch {
    live.value = []
  }

  // Only fetch the upcoming fallback when nothing is live (and not yet loaded).
  if (!live.value.length && !upcoming.value.length) {
    try {
      const fixtures = await fetchFixtures(creds.value, { competitionId: filter })
      const nowTs = Date.now()
      upcoming.value = (fixtures || [])
        .filter((m) => kickoffMs(m) > nowTs && kickoffMs(m) !== Infinity)
        .sort((a, b) => kickoffMs(a) - kickoffMs(b))
        .slice(0, 2)
    } catch {
      upcoming.value = []
    }
  }
  now.value = Date.now()
  loaded.value = true
}

// Poll only while the tab is visible; pause when hidden.
function tick() {
  if (document.visibilityState !== 'visible') return
  refresh()
}

function onVisibility() {
  if (document.visibilityState === 'visible') refresh()
}

onMounted(() => {
  refresh()
  timer = setInterval(tick, POLL_MS)
  document.addEventListener('visibilitychange', onVisibility)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  timer = null
  document.removeEventListener('visibilitychange', onVisibility)
})

const hasLive = computed(() => live.value.length > 0)

// Human "Starts in 2h 15m" / "Starts in 45m" for a fixture.
function startsInLabel(m) {
  const diff = kickoffMs(m) - now.value
  if (!Number.isFinite(diff) || diff <= 0) return ''
  const mins = Math.round(diff / 60000)
  const h = Math.floor(mins / 60)
  const mm = mins % 60
  const time = h > 0 ? `${h}h ${mm}m` : `${mm}m`
  return t('home.startsIn', { time })
}

function kickoffLabel(m) {
  return formatKickoff(m?.date || m?.match_date, m?.time, { locale: locale.value }).dateTime
}

function goToMatch(m) {
  const id = m?.id ?? m?.match_id ?? m?.fixture_id
  if (id) router.push({ name: 'MatchDetail', params: { matchId: id } })
}

function goToCompetition(competitionId) {
  if (competitionId) router.push({ name: 'CompetitionDetail', params: { competitionId } })
}
</script>

<template>
  <section v-if="!loaded || hasLive || upcoming.length" class="live-now" aria-labelledby="live-now-heading">
    <div class="live-now__inner">
      <div class="live-now__head">
        <span class="live-now__dot" :class="{ 'live-now__dot--live': hasLive }" aria-hidden="true"></span>
        <h2 id="live-now-heading" class="live-now__title">{{ t('home.liveNow') }}</h2>
        <RouterLink to="/live" class="live-now__all">{{ t('news.seeAll', 'See all') }} →</RouterLink>
      </div>

      <!-- Live matches -->
      <div v-if="hasLive" class="live-now__list">
        <LiveMatchRow
          v-for="m in live"
          :key="m.id"
          :match="m"
          @select="goToMatch"
          @select-competition="goToCompetition"
        />
      </div>

      <!-- Upcoming fallback -->
      <template v-else-if="upcoming.length">
        <p class="live-now__next-label">{{ t('home.nextMatch') }}</p>
        <div class="live-now__list">
          <div v-for="m in upcoming" :key="m.id || m.fixture_id" class="live-now__upcoming">
            <LiveMatchRow :match="m" @select="goToMatch" @select-competition="goToCompetition" />
            <span class="live-now__starts">{{ startsInLabel(m) || kickoffLabel(m) }}</span>
          </div>
        </div>
      </template>

      <!-- Empty (only shown once loaded with nothing) -->
      <p v-else-if="loaded" class="live-now__empty">{{ t('home.noLiveMatches') }}</p>

      <!-- Loading skeleton -->
      <div v-else class="live-now__skeletons">
        <div v-for="n in 2" :key="n" class="live-now__skel"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.live-now {
  padding: 32px var(--content-padding) 0;
}

.live-now__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.live-now__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.live-now__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  flex-shrink: 0;
}

.live-now__dot--live {
  background: var(--color-red, #e53935);
  animation: live-now-pulse 1.2s ease-in-out infinite;
}

@keyframes live-now-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.live-now__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-text);
  flex: 1;
}

.live-now__all {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.live-now__all:hover { text-decoration: underline; }

.live-now__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.live-now__next-label {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}

.live-now__upcoming {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.live-now__starts {
  align-self: flex-end;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
}

.live-now__empty {
  margin: 0;
  padding: 12px 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.live-now__skeletons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.live-now__skel {
  height: 64px;
  border-radius: var(--radius-card);
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  animation: live-now-shimmer 1.4s ease-in-out infinite;
}

@keyframes live-now-shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

@media (max-width: 767px) {
  .live-now {
    padding: 24px 16px 0;
  }
  /* Show only the first match on mobile */
  .live-now__list > *:nth-child(n + 2) {
    display: none;
  }
}
</style>
