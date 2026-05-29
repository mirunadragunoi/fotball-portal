<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLiveScoreStore } from '@/stores/livescore'
import { LIVESCORE_POLL } from '@/config/livescore'
import MatchDetail from '@/components/livescore/MatchDetail.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'

const route  = useRoute()
const router = useRouter()
const store  = useLiveScoreStore()

const matchId = computed(() => route.params.matchId)

const match = computed(
  () => store.matchById(matchId.value) || store.selectedMatch,
)

onMounted(async () => {
  await store.loadLive()
  await store.fetchMatchDetail(matchId.value)
  store.setupVisibilityPolling(LIVESCORE_POLL.live)
  store.startDetailPolling()
})

onUnmounted(() => {
  store.teardownVisibilityPolling()
  store.clearSelection()
})

watch(matchId, async (id) => {
  store.stopDetailPolling()
  await store.fetchMatchDetail(id)
  store.startDetailPolling()
})

function onClose() {
  router.push({ name: 'Live' })
}
</script>

<template>
  <main class="match-detail-page">
    <div v-if="store.detailLoading && !match" class="match-detail-page__skeleton">
      <SkeletonCard v-for="n in 3" :key="n" />
    </div>

    <MatchDetail
      v-else
      :match="match"
      :events="store.selectedMatchEvents"
      :commentary="store.selectedMatchCommentary"
      :stats="store.selectedMatchStats"
      :lineups="store.selectedMatchLineups"
      :loading="store.detailLoading"
      @close="onClose"
    />
  </main>
</template>

<style scoped>
.match-detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px var(--content-padding) 64px;
}

.match-detail-page__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
