<script setup>
import { useI18n } from 'vue-i18n'
import HistorySearchBar from './HistorySearchBar.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import BaseButton from '@/components/shared/BaseButton.vue'
import AppIcon from '@/components/shared/AppIcon.vue'

const playerQuery = defineModel('playerQuery', { type: String, default: '' })
const playersPage = defineModel('playersPage', { type: Number, default: 1 })

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  pageCount: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['search', 'page'])
const { t } = useI18n()

const POSITIONS = [
  { key: 'goalKeeper', code: 'GK', labelKey: 'history.posGK' },
  { key: 'defender', code: 'DF', labelKey: 'history.posDF' },
  { key: 'midfielder', code: 'MF', labelKey: 'history.posMF' },
  { key: 'forward', code: 'FW', labelKey: 'history.posFW' },
]

function activePositions(p) {
  return POSITIONS.filter((pos) => p[pos.key])
}

function birthYear(p) {
  if (!p.birthDate) return null
  const y = String(p.birthDate).slice(0, 4)
  return /^\d{4}$/.test(y) ? y : null
}

function tournamentYears(p) {
  if (!p.listTournaments) return []
  return String(p.listTournaments)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

</script>

<template>
  <div class="history-panel history-players" :class="{ 'history-players--f2': isF2 }">
    <div class="history-players__toolbar">
      <HistorySearchBar
        v-model="playerQuery"
        :placeholder="t('history.searchPlayers')"
        id="history-player-search"
        @search="emit('search')"
      />
    </div>

    <p v-if="!loading && total" class="history-players__count">
      <AppIcon name="user" :size="16" class="history-players__count-icon" aria-hidden="true" />
      {{ t('history.countPlayers', { count: total }) }}
    </p>

    <div v-if="loading" class="history-players__grid">
      <div v-for="n in 8" :key="n" class="history-players__skeleton">
        <SkeletonCard />
      </div>
    </div>

    <EmptyState
      v-else-if="!items.length"
      :title="t('history.emptyTitle')"
      :message="t('history.emptyPlayers')"
    />

    <div v-else class="history-players__results">
      <ul class="history-players__grid" role="list">
        <li v-for="item in items" :key="item.playerId" class="history-player-card">
          <div class="history-player-card__main">
            <div class="history-player-card__head">
              <h3 class="history-player-card__name">
                <span class="history-player-card__given">{{ item.givenName }}</span>
                <span class="history-player-card__family">{{ item.familyName }}</span>
              </h3>
              <span v-if="item.female" class="history-player-card__womens">
                {{ t('history.womens') }}
              </span>
            </div>

            <p v-if="birthYear(item)" class="history-player-card__meta">
              <span class="history-player-card__meta-item">
                <AppIcon name="calendar" :size="13" aria-hidden="true" />
                {{ birthYear(item) }}
              </span>
            </p>

            <div v-if="activePositions(item).length" class="history-player-card__positions">
              <span
                v-for="pos in activePositions(item)"
                :key="pos.code"
                class="history-player-card__chip"
                :data-pos="pos.code"
              >
                {{ t(pos.labelKey) }}
              </span>
            </div>

            <div class="history-player-card__stats">
              <span class="history-player-card__stat">
                <strong>{{ item.countTournaments }}</strong>
                <span>{{ t('history.tournamentsShort') }}</span>
              </span>
            </div>

            <div v-if="tournamentYears(item).length" class="history-player-card__years">
              <span
                v-for="year in tournamentYears(item).slice(0, 6)"
                :key="year"
                class="history-player-card__year"
              >{{ year }}</span>
              <span
                v-if="tournamentYears(item).length > 6"
                class="history-player-card__year history-player-card__year--more"
              >
                +{{ tournamentYears(item).length - 6 }}
              </span>
            </div>
          </div>
        </li>
      </ul>

      <nav v-if="pageCount > 1" class="history-players__pager" :aria-label="t('history.pagination')">
        <BaseButton
          variant="secondary"
          :disabled="playersPage <= 1"
          @click="emit('page', playersPage - 1)"
        >
          {{ t('history.prev') }}
        </BaseButton>
        <div class="history-players__pager-dots" aria-hidden="true">
          <span
            v-for="p in Math.min(pageCount, 7)"
            :key="p"
            class="history-players__pager-dot"
            :class="{ 'history-players__pager-dot--active': p === playersPage }"
          />
        </div>
        <span class="history-players__pager-info">
          {{ t('history.pageOf', { page: playersPage, total: pageCount }) }}
        </span>
        <BaseButton
          variant="secondary"
          :disabled="playersPage >= pageCount"
          @click="emit('page', playersPage + 1)"
        >
          {{ t('history.next') }}
        </BaseButton>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.history-players__toolbar {
  margin-bottom: 20px;
}

.history-players__count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.history-players__count-icon {
  color: var(--color-primary);
}

.history-players__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.history-players__skeleton {
  min-height: 180px;
}

.history-player-card {
  padding: 18px 18px 16px;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  transition: var(--transition-default);
}

.history-player-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-line));
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.history-player-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.history-player-card__name {
  margin: 0;
  line-height: 1.25;
}

.history-player-card__given {
  display: block;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.history-player-card__family {
  display: block;
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text);
}

.history-player-card__womens {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: color-mix(in srgb, var(--color-secondary) 22%, transparent);
  color: var(--color-secondary);
}

.history-player-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.history-player-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.history-player-card__positions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.history-player-card__chip {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.history-player-card__chip[data-pos='GK'] {
  background: color-mix(in srgb, var(--color-accent) 25%, transparent);
  color: var(--color-accent);
}

.history-player-card__chip[data-pos='DF'] {
  background: color-mix(in srgb, var(--color-secondary) 22%, transparent);
  color: var(--color-secondary);
}

.history-player-card__chip[data-pos='MF'] {
  background: color-mix(in srgb, var(--color-primary) 22%, transparent);
  color: var(--color-primary);
}

.history-player-card__chip[data-pos='FW'] {
  background: color-mix(in srgb, #e53935 20%, transparent);
  color: #e53935;
}

.history-player-card__stats {
  margin-bottom: 10px;
}

.history-player-card__stat {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.history-player-card__stat strong {
  font-family: var(--font-heading);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.history-player-card__years {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.history-player-card__year {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-line);
}

.history-player-card__year--more {
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
  color: var(--color-primary);
  border-color: transparent;
}

.history-players__pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 20px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-line);
}

.history-players__pager-dots {
  display: none;
  gap: 6px;
}

@media (min-width: 768px) {
  .history-players__pager-dots {
    display: flex;
  }
}

.history-players__pager-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-line);
}

.history-players__pager-dot--active {
  background: var(--color-primary);
  transform: scale(1.2);
}

.history-players__pager-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* football2 — softer cards */
.history-players--f2 .history-player-card {
  border-radius: 16px;
}

.history-players--f2 .history-player-card:hover {
  border-color: var(--color-primary);
}

.history-players--f2 .history-player-card__stat strong {
  color: var(--color-secondary);
}
</style>
