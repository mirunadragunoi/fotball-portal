<script setup>
import { useI18n } from 'vue-i18n'
import { LIVESCORE_TABS } from '@/config/livescore'

defineProps({
  active: { type: String, required: true },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])
const { t } = useI18n()
</script>

<template>
  <div
    class="live-tabs"
    :class="{ 'live-tabs--f2': isF2 }"
    role="tablist"
    :aria-label="t('live.tabsLabel')"
  >
    <button
      v-for="tab in LIVESCORE_TABS"
      :key="tab"
      type="button"
      role="tab"
      class="live-tabs__btn"
      :class="{ 'live-tabs__btn--active': active === tab }"
      :aria-selected="active === tab"
      @click="emit('change', tab)"
    >
      {{ t(`live.tabs.${tab}`) }}
      <span v-if="tab === 'live'" class="live-tabs__badge" aria-hidden="true">●</span>
    </button>
  </div>
</template>

<style scoped>
.live-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.live-tabs__btn {
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-default);
}

.live-tabs__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.live-tabs--f2 .live-tabs__btn {
  border-radius: 999px;
}

.live-tabs--f2 .live-tabs__btn--active {
  background: var(--color-primary);
  color: #10112a;
}

.live-tabs__badge {
  margin-left: 4px;
  color: var(--color-accent);
  font-size: 10px;
}
</style>
