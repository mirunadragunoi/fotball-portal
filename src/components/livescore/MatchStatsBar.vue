<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  home: { type: [Number, String], default: 0 },
  away: { type: [Number, String], default: 0 },
})

const h = computed(() => Number(props.home) || 0)
const a = computed(() => Number(props.away) || 0)
const total = computed(() => h.value + a.value)
const homePct = computed(() => total.value ? Math.round((h.value / total.value) * 100) : 50)
const awayPct = computed(() => 100 - homePct.value)
</script>

<template>
  <div class="stat-bar" :aria-label="`${label}: ${home} vs ${away}`">
    <div class="stat-bar__row">
      <span class="stat-bar__val">{{ home }}</span>
      <span class="stat-bar__label">{{ label }}</span>
      <span class="stat-bar__val">{{ away }}</span>
    </div>
    <div class="stat-bar__track" aria-hidden="true">
      <div class="stat-bar__fill stat-bar__fill--home" :style="{ width: homePct + '%' }"></div>
      <div class="stat-bar__fill stat-bar__fill--away" :style="{ width: awayPct + '%' }"></div>
    </div>
  </div>
</template>

<style scoped>
.stat-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-bar__row {
  display: grid;
  grid-template-columns: 2rem 1fr 2rem;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat-bar__val {
  font-weight: 700;
  text-align: center;
}

.stat-bar__label {
  text-align: center;
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.stat-bar__track {
  display: flex;
  height: 5px;
  border-radius: 3px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.stat-bar__fill {
  height: 100%;
  transition: width 0.4s ease;
}

.stat-bar__fill--home {
  background: var(--color-primary);
  border-radius: 3px 0 0 3px;
}

.stat-bar__fill--away {
  background: var(--color-text-secondary);
  border-radius: 0 3px 3px 0;
}
</style>
