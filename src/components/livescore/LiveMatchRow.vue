<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  parseScoreString,
  matchMinuteLabel,
  isLiveStatus,
  isFinishedStatus,
} from '@/utils/liveScoreFormat'

const props = defineProps({
  match: { type: Object, required: true },
  compact: { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const { t } = useI18n()

const score = computed(() => parseScoreString(props.match?.scores?.score))
const minute = computed(() => matchMinuteLabel(props.match))
const live = computed(() => isLiveStatus(props.match?.status))
const finished = computed(() => isFinishedStatus(props.match?.status))

const statusLabel = computed(() => {
  if (live.value) return t('live.statusLive')
  if (finished.value) return t('live.statusFinished')
  return props.match?.status || t('live.statusScheduled')
})

function onClick() {
  emit('select', props.match)
}
</script>

<template>
  <button
    type="button"
    class="live-row"
    :class="{
      'live-row--compact': compact,
      'live-row--selected': selected,
      'live-row--live': live,
    }"
    @click="onClick"
  >
    <div v-if="!compact" class="live-row__meta">
      <span class="live-row__competition">{{ match.competition?.name }}</span>
      <span class="live-row__status" :class="{ 'live-row__status--live': live }">
        <span v-if="live" class="live-row__dot" aria-hidden="true"></span>
        {{ statusLabel }}
      </span>
    </div>

    <div class="live-row__teams">
      <div class="live-row__team live-row__team--home">
        <img
          v-if="match.home?.logo"
          :src="match.home.logo"
          :alt="''"
          class="live-row__logo"
          loading="lazy"
          width="24"
          height="24"
        />
        <span class="live-row__name">{{ match.home?.name }}</span>
      </div>

      <div class="live-row__score-block" aria-label="Score">
        <span class="live-row__goals">{{ score.home ?? '–' }}</span>
        <span
          class="live-row__minute"
          :class="{ 'live-row__minute--ft': minute === 'FT' }"
        >
          {{ minute || '–' }}
        </span>
        <span class="live-row__goals">{{ score.away ?? '–' }}</span>
      </div>

      <div class="live-row__team live-row__team--away">
        <img
          v-if="match.away?.logo"
          :src="match.away.logo"
          :alt="''"
          class="live-row__logo"
          loading="lazy"
          width="24"
          height="24"
        />
        <span class="live-row__name">{{ match.away?.name }}</span>
      </div>
    </div>

    <p v-if="compact && match.competition?.name" class="live-row__competition-compact">
      {{ match.competition?.name }}
    </p>
  </button>
</template>

<style scoped>
.live-row {
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: var(--transition-default);
  min-height: 44px;
}

.live-row:hover,
.live-row--selected {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  box-shadow: var(--shadow-card-hover);
}

.live-row--compact {
  padding: 10px 12px;
}

.live-row__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.live-row__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.live-row__status--live {
  color: var(--color-accent);
}

.live-row__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: live-pulse 1.2s ease-in-out infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.live-row__teams {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}

.live-row__team {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.live-row__team--away {
  flex-direction: row-reverse;
  text-align: right;
}

.live-row__logo {
  flex-shrink: 0;
  object-fit: contain;
}

.live-row__name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.live-row__score-block {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-heading);
  font-weight: 800;
}

.live-row__goals {
  font-size: 20px;
  min-width: 1ch;
  text-align: center;
}

.live-row__minute {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
  color: var(--color-text-secondary);
}

.live-row__minute--ft {
  color: var(--color-text-secondary);
}

.live-row--live .live-row__minute {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.live-row__competition-compact {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--color-text-secondary);
}
</style>
