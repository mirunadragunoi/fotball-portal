<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import BaseButton from '@/components/shared/BaseButton.vue'
import AppIcon from '@/components/shared/AppIcon.vue'

const { t } = useI18n()
const route = useRoute()
const brandStore = useBrandStore()
const isF2 = computed(() => brandStore.activeBrand === 'football2')

const pageInfo = {
  trivia:  { icon: 'trophy', label: 'Trivia',  colour: '#FF1744' },
  history: { icon: 'calendar', label: 'History', colour: '#2979FF' },
  live:    { icon: 'live',     label: 'Live',    colour: '#00C853' },
}

const page = computed(() => {
  const key = route.path.replace('/', '')
  return pageInfo[key] || { icon: 'ball', label: 'Coming Soon', colour: 'var(--color-primary)' }
})
</script>

<template>
  <main class="coming-soon" :class="{ 'coming-soon--f2': isF2 }">
    <div class="coming-soon__content">
      <div
        class="coming-soon__icon"
        :style="{ '--icon-color': page.colour }"
        aria-hidden="true"
      >
        <AppIcon :name="page.icon" :size="40" stroke="currentColor" />
      </div>

      <div class="coming-soon__eyebrow">
        <span class="coming-soon__eyebrow-inner">{{ page.label }}</span>
      </div>

      <h1 class="coming-soon__title">{{ t('comingSoon.title') }}</h1>
      <p class="coming-soon__subtitle">{{ t('comingSoon.subtitle') }}</p>

      <BaseButton tag="router-link" to="/" variant="primary" size="md">
        {{ t('comingSoon.backHome') }}
      </BaseButton>
    </div>
  </main>
</template>

<style scoped>
.coming-soon {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px var(--content-padding);
}

.coming-soon__content {
  max-width: 480px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.coming-soon__icon {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: color-mix(in srgb, var(--icon-color) 15%, transparent);
  color: var(--icon-color);
  display: grid;
  place-items: center;
}

.coming-soon--f2 .coming-soon__icon {
  border-radius: 28px;
}

.coming-soon__eyebrow {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.coming-soon__eyebrow-inner {
  padding: 4px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.coming-soon__title {
  font-family: var(--font-heading);
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  line-height: 0.95;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0;
}

:root[data-brand="football2"] .coming-soon__title {
  text-transform: none;
  font-size: clamp(32px, 5vw, 48px);
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.coming-soon__subtitle {
  font-size: 16px;
  line-height: 1.55;
  color: var(--color-text-secondary);
  max-width: 360px;
  margin: 0;
}
</style>
