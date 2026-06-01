<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWorldCupTeamsStore } from '@/stores/worldcupTeams'
import GroupFilterTabs from './GroupFilterTabs.vue'
import TeamFlagCard from './TeamFlagCard.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const { t } = useI18n()
const store = useWorldCupTeamsStore()

onMounted(() => store.loadTeams())

const activeGroup = ref('all')

const visibleTeams = computed(() => {
  if (activeGroup.value === 'all') return store.teamsSorted
  return store.teams.filter((t) => t.group === activeGroup.value)
})
</script>

<template>
  <section class="qts" :aria-label="t('worldcup.qualifiedTeams')">
    <h2 class="qts__title">{{ t('worldcup.qualifiedTeams') }}</h2>

    <GroupFilterTabs
      :groups="store.groupKeys"
      :active="activeGroup"
      @update:active="activeGroup = $event"
    />

    <!-- loading skeletons -->
    <div v-if="store.loading" class="qts__grid">
      <SkeletonCard v-for="n in 12" :key="n" />
    </div>

    <EmptyState
      v-else-if="!store.teams.length"
      :message="t('worldcup.teamDataUnavailable')"
      :show-reset="false"
    />

    <div v-else class="qts__grid">
      <TeamFlagCard
        v-for="team in visibleTeams"
        :key="team.id ?? team.code"
        :team="team"
      />
    </div>

    <p v-if="store.lastSync" class="qts__sync-note">
      {{ t('worldcup.syncNote', { date: new Date(store.lastSync).toLocaleDateString() }) }}
    </p>
  </section>
</template>

<style scoped>
.qts {
  margin-top: 0;
}

.qts__title {
  font-family: var(--font-heading);
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 20px;
  color: var(--color-text);
}

.qts__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 480px) {
  .qts__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .qts__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .qts__grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.qts__sync-note {
  margin-top: 16px;
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: center;
}
</style>