<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCompetitionStore } from '@/stores/competition'
import StandingsTable from '@/components/livescore/StandingsTable.vue'
import LiveStandingsTable from '@/components/livescore/LiveStandingsTable.vue'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()

const compStore = useCompetitionStore()

const competitionId = computed(() => route.params.competitionId)

const loading = ref(true)
const error   = ref(null)
const live    = ref(false)

onMounted(async () => {
  try {
    await Promise.allSettled([
      compStore.loadStandings(competitionId.value),
      compStore.loadLiveStandings(competitionId.value),
    ])
    live.value = (compStore.liveStandings?.length ?? 0) > 0
  } catch (e) {
    error.value = e?.message || 'Failed to load standings'
  } finally {
    loading.value = false
  }
})

const rows     = computed(() => compStore.standings || [])
const liveRows = computed(() => compStore.liveStandings || [])
</script>

<template>
  <main class="standings-view">
    <div class="standings-view__inner">
      <button class="standings-view__back" @click="router.back()">← {{ t('common.back', 'Back') }}</button>

      <div class="standings-view__head">
        <h1 class="standings-view__title">{{ t('live.standings', 'Standings') }}</h1>
        <span v-if="live" class="standings-view__live-pill">
          <span class="standings-view__dot" aria-hidden="true"></span>
          {{ t('live.liveUpdates', 'Live updates') }}
        </span>
      </div>

      <div v-if="loading" class="standings-view__loading">
        <div v-for="n in 10" :key="n" class="standings-view__skel"></div>
      </div>

      <div v-else-if="error" class="standings-view__error">{{ error }}</div>

      <template v-else>
        <LiveStandingsTable v-if="live" :rows="liveRows" />
        <StandingsTable v-else :rows="rows" :show-goals="true" />
      </template>
    </div>
  </main>
</template>

<style scoped>
.standings-view {
  padding: 32px var(--content-padding);
}

.standings-view__inner {
  max-width: 900px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.standings-view__back {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: var(--transition-default);
}

.standings-view__back:hover { color: var(--color-text); }

.standings-view__head {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.standings-view__title {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
}

.standings-view__live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.standings-view__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.standings-view__loading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.standings-view__skel {
  height: 40px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.standings-view__error {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border-radius: var(--radius-card);
}
</style>
