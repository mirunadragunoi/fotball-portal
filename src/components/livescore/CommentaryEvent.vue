<script setup>
import { computed } from 'vue'

const props = defineProps({
  event: { type: Object, required: true },
})

const ICONS = {
  GOAL:            '⚽',
  GOAL_PENALTY:    '⚽',
  OWN_GOAL:        '⚽',
  YELLOW_CARD:     '🟨',
  RED_CARD:        '🟥',
  YELLOW_RED_CARD: '🟥',
  SUBSTITUTION:    '🔄',
  MISSED_PENALTY:  '❌',
  CORNER:          '🚩',
  FREE_KICK:       '🦵',
  OFFSIDE:         '🚫',
  FOUL:            '🤚',
  SAVE:            '🧤',
  SHOT:            '🎯',
  SHOT_ON_TARGET:  '🎯',
  VAR:             '📺',
  PENALTY:         '⚽',
}

const icon = computed(() => {
  const type = (props.event.event || props.event.type || '').toUpperCase()
  return ICONS[type] || '•'
})

const isKey = computed(() => {
  const type = (props.event.event || props.event.type || '').toUpperCase()
  return ['GOAL','GOAL_PENALTY','OWN_GOAL','RED_CARD','YELLOW_RED_CARD'].includes(type)
})

const minute = computed(() => {
  const t = props.event.time ?? props.event.minute ?? props.event.sort ?? ''
  return t !== '' ? `${t}'` : ''
})

const text = computed(() =>
  props.event.comment || props.event.description || props.event.label || ''
)

const player = computed(() =>
  props.event.player?.name || props.event.player_name || ''
)
</script>

<template>
  <li class="comm-event" :class="{ 'comm-event--key': isKey }">
    <span class="comm-event__minute" aria-label="Minute">{{ minute }}</span>
    <span class="comm-event__icon" aria-hidden="true">{{ icon }}</span>
    <div class="comm-event__body">
      <span v-if="player" class="comm-event__player">{{ player }}</span>
      <span v-if="text" class="comm-event__text">{{ text }}</span>
    </div>
  </li>
</template>

<style scoped>
.comm-event {
  display: grid;
  grid-template-columns: 36px 20px 1fr;
  gap: 8px;
  align-items: start;
  padding: 8px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
  list-style: none;
}

.comm-event--key {
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  margin-inline: -12px;
  padding-inline: 12px;
  border-radius: 6px;
  border-bottom-color: transparent;
}

.comm-event__minute {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
  padding-top: 2px;
  text-align: right;
}

.comm-event__icon {
  font-size: 14px;
  padding-top: 1px;
}

.comm-event__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comm-event__player {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
}

.comm-event__text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
</style>
