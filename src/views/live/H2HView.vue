<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTeamsStore } from '@/stores/teams'
import H2HComparison from '@/components/livescore/H2HComparison.vue'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()

const teamsStore = useTeamsStore()

const team1Id = computed(() => route.params.team1Id)
const team2Id = computed(() => route.params.team2Id)

const loading = ref(true)
const error   = ref(null)

onMounted(async () => {
  try {
    await teamsStore.loadH2H(team1Id.value, team2Id.value)
  } catch (e) {
    error.value = e?.message || 'Failed to load H2H data'
  } finally {
    loading.value = false
  }
})

const h2hData   = computed(() => teamsStore.teamH2H || {})
const matches   = computed(() => h2hData.value.matches || h2hData.value.previous || [])
const team1Info = computed(() => h2hData.value.team1 || h2hData.value.home_team || null)
const team2Info = computed(() => h2hData.value.team2 || h2hData.value.away_team || null)
</script>

<template>
  <main class="h2h-view">
    <div class="h2h-view__inner">
      <button class="h2h-view__back" @click="router.back()">← {{ t('common.back', 'Back') }}</button>

      <div class="h2h-view__head">
        <div class="h2h-view__team">
          <img v-if="team1Info?.logo" :src="team1Info.logo" :alt="team1Info.name" width="48" height="48" loading="lazy" />
          <span class="h2h-view__team-name">{{ team1Info?.name || `Team ${team1Id}` }}</span>
        </div>

        <div class="h2h-view__vs">
          <span class="h2h-view__vs-label">{{ t('live.headToHead', 'Head to Head') }}</span>
          <span class="h2h-view__vs-vs">VS</span>
        </div>

        <div class="h2h-view__team h2h-view__team--right">
          <img v-if="team2Info?.logo" :src="team2Info.logo" :alt="team2Info.name" width="48" height="48" loading="lazy" />
          <span class="h2h-view__team-name">{{ team2Info?.name || `Team ${team2Id}` }}</span>
        </div>
      </div>

      <div v-if="loading" class="h2h-view__loading">
        <div v-for="n in 5" :key="n" class="h2h-view__skel"></div>
      </div>

      <div v-else-if="error" class="h2h-view__error">{{ error }}</div>

      <H2HComparison
        v-else
        :matches="matches"
        :team1-id="team1Id"
        :team2-id="team2Id"
      />
    </div>
  </main>
</template>

<style scoped>
.h2h-view {
  padding: 32px var(--content-padding);
}

.h2h-view__inner {
  max-width: 800px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.h2h-view__back {
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

.h2h-view__back:hover { color: var(--color-text); }

.h2h-view__head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  background: var(--color-surface);
  border-radius: var(--radius-card);
  padding: 24px;
}

.h2h-view__team {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.h2h-view__team img { border-radius: 8px; object-fit: contain; }

.h2h-view__team--right { align-items: flex-end; }

.h2h-view__team-name {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
}

.h2h-view__vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.h2h-view__vs-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

.h2h-view__vs-vs {
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-secondary);
}

.h2h-view__loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.h2h-view__skel {
  height: 48px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.h2h-view__error {
  padding: 24px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border-radius: var(--radius-card);
}

@media (max-width: 600px) {
  .h2h-view__head { grid-template-columns: 1fr; gap: 16px; padding: 16px; }
  .h2h-view__team--right { align-items: flex-start; }
  .h2h-view__vs { flex-direction: row; gap: 12px; }
}
</style>
