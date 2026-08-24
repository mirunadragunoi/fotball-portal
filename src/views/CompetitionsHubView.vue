<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import {
  getCompetitionsForBrand,
  COMPETITION_TIER_ORDER,
} from '@/config/europeanCompetitions'
import SectionHeader from '@/components/shared/SectionHeader.vue'

const { t } = useI18n()
const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const TIER_LABEL_KEY = {
  'european-cup': 'competitions.tierUefaCups',
  top5:           'competitions.tierTopLeagues',
  secondary:      'competitions.tierMoreLeagues',
  local:          'competitions.tierLocal',
  bonus:          'competitions.tierBonus',
}

// Competitions for the active brand, grouped by tier in display order.
const tiers = computed(() => {
  const comps = getCompetitionsForBrand(brandStore.activeBrand)
  return COMPETITION_TIER_ORDER
    .map((tier) => ({
      tier,
      labelKey: TIER_LABEL_KEY[tier],
      items: comps.filter((c) => c.tier === tier),
    }))
    .filter((group) => group.items.length > 0)
})

// Two-letter monogram used as a lightweight crest stand-in.
function monogram(name) {
  const words = String(name || '').trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return String(name || '?').slice(0, 2).toUpperCase()
}

function subtitle(comp) {
  if (comp.country) return comp.country
  if (comp.isCup) return t('competitions.continental', 'European competition')
  return ''
}
</script>

<template>
  <main class="hub" :class="{ 'hub--f2': isF2 }">
    <div class="hub__inner">
      <SectionHeader
        :eyebrow="t('competitions.eyebrow')"
        :title="t('competitions.title')"
        id="hub-heading"
      />
      <p class="hub__subtitle">{{ t('competitions.subtitle') }}</p>

      <section
        v-for="group in tiers"
        :key="group.tier"
        class="hub__group"
        :aria-label="t(group.labelKey)"
      >
        <h2 class="hub__group-title">{{ t(group.labelKey) }}</h2>
        <div class="hub__grid">
          <RouterLink
            v-for="comp in group.items"
            :key="comp.id"
            :to="`/live/competition/${comp.id}`"
            class="hub-card"
          >
            <span class="hub-card__crest" aria-hidden="true">{{ monogram(comp.name) }}</span>
            <span class="hub-card__text">
              <span class="hub-card__name">{{ comp.name }}</span>
              <span v-if="subtitle(comp)" class="hub-card__sub">{{ subtitle(comp) }}</span>
            </span>
            <span class="hub-card__arrow" aria-hidden="true">→</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.hub {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 24px var(--content-padding) 64px;
}

.hub__subtitle {
  margin: 8px 0 28px;
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1.5;
  max-width: 640px;
}

.hub__group + .hub__group {
  margin-top: 36px;
}

.hub__group-title {
  margin: 0 0 14px;
  font-family: var(--font-heading);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

.hub--f2 .hub__group-title {
  text-transform: none;
  letter-spacing: 0;
}

.hub__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.hub-card {
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

.hub-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.hub-card__crest {
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

.hub-card__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.hub-card__name {
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hub--f2 .hub-card__name {
  font-family: var(--font-body);
}

.hub-card__sub {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.hub-card__arrow {
  flex-shrink: 0;
  color: var(--color-text-secondary);
  font-weight: 700;
  transition: var(--transition-default);
}

.hub-card:hover .hub-card__arrow {
  color: var(--color-primary);
  transform: translateX(2px);
}

@media (max-width: 767px) {
  .hub__grid {
    grid-template-columns: 1fr;
  }
}
</style>
