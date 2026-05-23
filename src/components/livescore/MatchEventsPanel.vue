<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatEventNarrative } from '@/utils/liveScoreFormat'

const props = defineProps({
  match: { type: Object, default: null },
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const lines = computed(() =>
  props.events.map((ev) => formatEventNarrative(ev, props.match)),
)
</script>

<template>
  <aside class="events-panel" aria-labelledby="events-panel-title">
    <header class="events-panel__header">
      <div>
        <h2 id="events-panel-title" class="events-panel__title">
          {{ t('live.eventsTitle') }}
        </h2>
        <p v-if="match" class="events-panel__subtitle">
          {{ match.home?.name }} — {{ match.away?.name }}
          <span v-if="match.scores?.score"> · {{ match.scores.score }}</span>
        </p>
      </div>
      <button type="button" class="events-panel__close" @click="emit('close')">
        {{ t('live.close') }}
      </button>
    </header>

    <p v-if="loading" class="events-panel__hint">{{ t('live.loadingEvents') }}</p>
    <ul v-else-if="lines.length" class="events-panel__list">
      <li v-for="(line, i) in lines" :key="i" class="events-panel__item">
        {{ line }}
      </li>
    </ul>
    <p v-else class="events-panel__hint">{{ t('live.noEvents') }}</p>

    <p class="events-panel__note">{{ t('live.eventsNote') }}</p>
  </aside>
</template>

<style scoped>
.events-panel {
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  border-radius: var(--radius-card);
  background: var(--color-surface);
  padding: 16px;
}

.events-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.events-panel__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 18px;
  text-transform: uppercase;
}

.events-panel__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.events-panel__close {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
  min-height: 44px;
  padding: 0 8px;
}

.events-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.events-panel__item {
  font-size: 14px;
  line-height: 1.45;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.events-panel__hint,
.events-panel__note {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.events-panel__note {
  margin-top: 16px;
  font-size: 12px;
}
</style>
