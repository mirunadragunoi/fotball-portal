<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useHistoryStore } from '@/stores/history'
import { HISTORY_TABS } from '@/config/history'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import HistoryTabs from '@/components/history/HistoryTabs.vue'
import HistoryTournamentsPanel from '@/components/history/HistoryTournamentsPanel.vue'
import HistoryTeamsPanel from '@/components/history/HistoryTeamsPanel.vue'
import HistoryMatchesPanel from '@/components/history/HistoryMatchesPanel.vue'
import HistoryPlayersPanel from '@/components/history/HistoryPlayersPanel.vue'
import HistorySquadsPanel from '@/components/history/HistorySquadsPanel.vue'
import HistoryDetailDrawer from '@/components/history/HistoryDetailDrawer.vue'

const { t } = useI18n()
const brandStore = useBrandStore()
const store = useHistoryStore()

const isF2 = computed(() => brandStore.activeBrand === 'football2')
const drawerOpen = ref(false)

const errorMessage = computed(() => {
  if (!store.error) return ''
  return typeof store.error === 'string' ? store.error : t('history.errorLoad')
})

onMounted(async () => {
  await store.loadTabData()
  if (!store.teams.length) await store.loadTeams()
})

watch(
  () => store.activeTab,
  () => store.loadTabData(),
)

function onTabChange(tab) {
  store.setTab(tab)
}

function onTournamentSelect(t) {
  store.selectTournament(t)
  drawerOpen.value = true
}

function onViewMatches(t) {
  drawerOpen.value = false
  store.openMatchesForTournament(t)
}

function onPlayerPage(page) {
  if (page < 1 || page > store.playersPageCount) return
  store.playersPage = page
  store.loadPlayers()
}
</script>

<template>
  <main class="history-page" :class="{ 'history-page--f2': isF2 }">
    <div class="history-page__header">
      <SectionHeader
        :eyebrow="t('history.eyebrow')"
        :title="t('history.title')"
        id="history-heading"
      />
      <p class="history-page__subtitle">{{ t('history.subtitle') }}</p>
    </div>

    <HistoryTabs
      :tabs="HISTORY_TABS"
      :active="store.activeTab"
      :is-f2="isF2"
      @change="onTabChange"
    />

    <p v-if="errorMessage" class="history-page__error" role="alert">{{ errorMessage }}</p>

    <section class="history-page__content" aria-labelledby="history-heading">
      <HistoryTournamentsPanel
        v-if="store.activeTab === 'tournaments'"
        :items="store.mensTournaments"
        :loading="store.loading"
        :is-f2="isF2"
        @select="onTournamentSelect"
        @view-matches="onViewMatches"
      />

      <HistoryTeamsPanel
        v-else-if="store.activeTab === 'teams'"
        v-model:team-query="store.teamQuery"
        :items="store.teams"
        :loading="store.loading"
        :is-f2="isF2"
        @search="store.loadTeams"
      />

      <HistoryMatchesPanel
        v-else-if="store.activeTab === 'matches'"
        v-model:match-query="store.matchQuery"
        v-model:match-tournament-id="store.matchTournamentId"
        v-model:match-stage="store.matchStage"
        :items="store.matches"
        :tournaments="store.mensTournaments"
        :stages="store.matchStages"
        :loading="store.loading"
        :is-f2="isF2"
        @search="store.loadMatches"
        @filter="store.loadMatches"
      />

      <HistoryPlayersPanel
        v-else-if="store.activeTab === 'players'"
        v-model:player-query="store.playerQuery"
        v-model:players-page="store.playersPage"
        :items="store.players"
        :total="store.playersTotal"
        :page-count="store.playersPageCount"
        :loading="store.loading"
        :is-f2="isF2"
        @search="() => { store.playersPage = 1; store.loadPlayers() }"
        @page="onPlayerPage"
      />

      <HistorySquadsPanel
        v-else-if="store.activeTab === 'squads'"
        v-model:squad-tournament-id="store.squadTournamentId"
        v-model:squad-team-id="store.squadTeamId"
        :items="store.squads"
        :tournaments="store.mensTournaments"
        :teams="store.teams"
        :loading="store.loading"
        :is-f2="isF2"
        @filter="store.loadSquads"
      />
    </section>

    <HistoryDetailDrawer
      :open="drawerOpen"
      :tournament="store.selectedTournament"
      :is-f2="isF2"
      @close="drawerOpen = false"
      @view-matches="onViewMatches"
    />
  </main>
</template>

<style scoped>
.history-page {
  padding-bottom: 64px;
}

.history-page__header {
  padding: 48px var(--content-padding) 8px;
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.history-page__subtitle {
  margin: 12px 0 0;
  max-width: 52ch;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.55;
}

.history-page__error {
  max-width: var(--max-content-width);
  margin: 0 auto 16px;
  padding: 0 var(--content-padding);
  color: var(--color-accent);
  font-size: 14px;
}

.history-page__content {
  max-width: var(--max-content-width);
  margin-inline: auto;
  padding: 8px var(--content-padding) 0;
}

.history-page--f2 .history-page__header {
  padding-top: 40px;
}
</style>
