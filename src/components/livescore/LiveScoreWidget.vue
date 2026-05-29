<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLiveScores } from '@/composables/useLiveScores'
import { parseScoreString, matchMinuteLabel, isLiveStatus } from '@/utils/liveScoreFormat'

defineProps({
  limit: { type: Number, default: 5 },
})

const { t } = useI18n()
const { matches, loading, heroRows } = useLiveScores({ limit: 5, inPlayOnly: false, autoStart: true })

const displayRows = computed(() => heroRows.value.slice(0, 5))
</script>

<template>
  <section v-if="loading || displayRows.length" class="ls-widget" aria-label="Live scores">
    <div class="ls-widget__inner">
      <div class="ls-widget__head">
        <span class="ls-widget__dot" aria-hidden="true"></span>
        <span class="ls-widget__label">{{ t('live.title', 'Live scores') }}</span>
        <RouterLink to="/live" class="ls-widget__link">{{ t('live.statusLive', 'Live') }} →</RouterLink>
      </div>

      <div v-if="loading && !displayRows.length" class="ls-widget__skeleton">
        <div v-for="n in 3" :key="n" class="ls-widget__skel-row"></div>
      </div>

      <div v-else class="ls-widget__rows">
        <RouterLink
          v-for="row in displayRows"
          :key="row.id"
          :to="`/live/match/${row.id}`"
          class="ls-widget__row"
        >
          <span class="ls-widget__team ls-widget__team--home">{{ row.home }}</span>
          <span class="ls-widget__score">
            <span class="ls-widget__goals">{{ row.h }}</span>
            <span class="ls-widget__min">{{ row.min || row.stage }}</span>
            <span class="ls-widget__goals">{{ row.a }}</span>
          </span>
          <span class="ls-widget__team ls-widget__team--away">{{ row.away }}</span>
        </RouterLink>
      </div>

      <RouterLink to="/live" class="ls-widget__more">
        {{ t('live.eyebrow', 'Matchday') }} — {{ t('live.emptyLiveMessage', 'See all') }}
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.ls-widget {
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  border-radius: var(--radius-card);
  overflow: hidden;
  margin: 0 var(--content-padding);
}

.ls-widget__inner {
  padding: 14px 16px 12px;
}

.ls-widget__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ls-widget__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: pulse 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.ls-widget__label {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  flex: 1;
}

.ls-widget__link {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}

.ls-widget__rows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ls-widget__row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text);
  transition: var(--transition-default);
  font-size: 13px;
}

.ls-widget__row:hover {
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
}

.ls-widget__team {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ls-widget__team--home { text-align: right; }
.ls-widget__team--away { text-align: left; }

.ls-widget__score {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-heading);
  flex-shrink: 0;
}

.ls-widget__goals {
  font-size: 16px;
  font-weight: 800;
  min-width: 1ch;
  text-align: center;
}

.ls-widget__min {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-accent) 15%, transparent);
  color: var(--color-accent);
}

.ls-widget__skel-row {
  height: 36px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  margin-bottom: 4px;
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

.ls-widget__more {
  display: block;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  text-align: center;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  transition: var(--transition-default);
}

.ls-widget__more:hover {
  color: var(--color-text);
  border-color: var(--color-primary);
}
</style>
