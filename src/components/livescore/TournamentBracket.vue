<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildBracket } from '@/utils/bracket'
import { parseScoreString, matchMinuteLabel, isLiveStatus } from '@/utils/liveScoreFormat'

const props = defineProps({
  fixtures: { type: Array, default: () => [] },
})

const emit = defineEmits(['select'])

const { t } = useI18n()

const rounds = computed(() => buildBracket(props.fixtures))

function teamName(m, side) {
  return m?.[side]?.name || m?.[`${side}_name`] || m?.[`${side}_team_name`] || '—'
}
function score(m) {
  return parseScoreString(m?.scores?.score || m?.score)
}
function statusLabel(m) {
  if (isLiveStatus(m?.status)) return matchMinuteLabel(m) || t('live.statusLive')
  return matchMinuteLabel(m) || ''
}
function matchId(m) {
  return m?.id ?? m?.match_id ?? m?.fixture_id
}
</script>

<template>
  <div v-if="rounds.length" class="bracket">
    <div v-for="round in rounds" :key="round.key" class="bracket__col">
      <h3 class="bracket__round">{{ round.label }}</h3>
      <div class="bracket__matches">
        <button
          v-for="(m, i) in round.matches"
          :key="matchId(m) || i"
          type="button"
          class="bracket__match"
          :class="{ 'bracket__match--live': isLiveStatus(m?.status) }"
          @click="emit('select', m)"
        >
          <span class="bracket__row">
            <span class="bracket__team">{{ teamName(m, 'home') }}</span>
            <span class="bracket__goals">{{ score(m).home ?? '–' }}</span>
          </span>
          <span class="bracket__row">
            <span class="bracket__team">{{ teamName(m, 'away') }}</span>
            <span class="bracket__goals">{{ score(m).away ?? '–' }}</span>
          </span>
          <span v-if="statusLabel(m)" class="bracket__status">{{ statusLabel(m) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bracket {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(200px, 1fr);
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}

.bracket__col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 200px;
}

.bracket__round {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  padding-bottom: 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
}

.bracket__matches {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-around;
  flex: 1;
}

.bracket__match {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-card);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition-default);
}

.bracket__match:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  box-shadow: var(--shadow-card-hover);
}

.bracket__match--live {
  border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
}

.bracket__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bracket__team {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bracket__goals {
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}

.bracket__status {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-accent);
}
</style>
