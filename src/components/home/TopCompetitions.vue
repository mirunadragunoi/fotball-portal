<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { getCompetitionsForBrand } from '@/config/europeanCompetitions'
import CompetitionCard from '@/components/shared/CompetitionCard.vue'

const { t } = useI18n()
const brandStore = useBrandStore()

// The most important entry points: UEFA club cups + top 5 leagues + the
// brand's local league(s). All static config — no API call.
const TOP_TIERS = ['european-cup', 'top5', 'local']
const competitions = computed(() =>
  getCompetitionsForBrand(brandStore.activeBrand).filter((c) => TOP_TIERS.includes(c.tier)),
)
</script>

<template>
  <section class="top-comps" aria-labelledby="top-comps-heading">
    <div class="top-comps__inner">
      <div class="top-comps__head">
        <h2 id="top-comps-heading" class="top-comps__title">{{ t('home.topCompetitions') }}</h2>
        <RouterLink to="/competitions" class="top-comps__all">
          {{ t('home.viewAllCompetitions') }} →
        </RouterLink>
      </div>

      <div class="top-comps__grid">
        <CompetitionCard
          v-for="comp in competitions"
          :key="comp.id"
          :competition="comp"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.top-comps {
  padding: 40px var(--content-padding) 0;
}

.top-comps__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.top-comps__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.top-comps__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text);
}

.top-comps__all {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.top-comps__all:hover {
  text-decoration: underline;
}

.top-comps__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

@media (max-width: 767px) {
  .top-comps {
    padding: 24px 16px 0;
  }
  .top-comps__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
