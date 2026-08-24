<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { getCompetitionRoute } from '@/config/europeanCompetitions'

const props = defineProps({
  competition: { type: Object, required: true },
})

const { t } = useI18n()

// Cup competitions with groups (UCL/UEL/UECL/Club WC) go to the rich
// TournamentView; leagues go to CompetitionDetail.
const target = computed(() => getCompetitionRoute(props.competition))

// Two-letter monogram used as a lightweight crest stand-in (no logo assets).
const monogram = computed(() => {
  const name = String(props.competition?.name || '').trim()
  const words = name.split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (name || '?').slice(0, 2).toUpperCase()
})

const subtitle = computed(() => {
  const c = props.competition
  if (c?.country) return c.country
  if (c?.isCup) return t('competitions.continental', 'European competition')
  return ''
})
</script>

<template>
  <RouterLink :to="target" class="comp-card">
    <span class="comp-card__crest" aria-hidden="true">{{ monogram }}</span>
    <span class="comp-card__text">
      <span class="comp-card__name">{{ competition.name }}</span>
      <span v-if="subtitle" class="comp-card__sub">{{ subtitle }}</span>
    </span>
    <span class="comp-card__arrow" aria-hidden="true">→</span>
  </RouterLink>
</template>

<style scoped>
.comp-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-card);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
  box-shadow: var(--shadow-card);
  transition: var(--transition-default);
  min-height: 44px;
}

.comp-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.comp-card__crest {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.comp-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.comp-card__name {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comp-card__sub {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.comp-card__arrow {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-weight: 700;
  transition: var(--transition-default);
}

.comp-card:hover .comp-card__arrow {
  color: var(--color-primary);
  transform: translateX(2px);
}
</style>
