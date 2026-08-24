<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import {
  getCompetitionsForBrand,
  COMPETITION_TIER_ORDER,
} from '@/config/europeanCompetitions'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import CompetitionCard from '@/components/shared/CompetitionCard.vue'

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
          <CompetitionCard
            v-for="comp in group.items"
            :key="comp.id"
            :competition="comp"
          />
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

@media (max-width: 767px) {
  .hub__grid {
    grid-template-columns: 1fr;
  }
}
</style>
