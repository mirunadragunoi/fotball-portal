<script setup>
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/shared/AppIcon.vue'

defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['change'])
const { t } = useI18n()

const icons = {
  tournaments: 'calendar',
  teams: 'ball',
  matches: 'live',
  players: 'user',
  squads: 'filter',
}
</script>

<template>
  <nav
    class="history-tabs"
    :class="{ 'history-tabs--f2': isF2 }"
    role="tablist"
    :aria-label="t('history.tabsLabel')"
  >
    <button
      v-for="tab in tabs"
      :key="tab"
      type="button"
      role="tab"
      class="history-tabs__btn"
      :class="{ 'history-tabs__btn--active': active === tab }"
      :aria-selected="active === tab"
      @click="emit('change', tab)"
    >
      <AppIcon :name="icons[tab] || 'info'" :size="18" class="history-tabs__icon" />
      <span>{{ t(`history.tabs.${tab}`) }}</span>
    </button>
  </nav>
</template>

<style scoped>
.history-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 var(--content-padding) 20px;
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.history-tabs__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--radius-button);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-default);
}

.history-tabs__btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text);
}

.history-tabs__btn--active {
  background: color-mix(in srgb, var(--color-primary) 18%, var(--color-surface));
  border-color: var(--color-primary);
  color: var(--color-text);
}

.history-tabs--f2 .history-tabs__btn--active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.history-tabs__icon {
  opacity: 0.85;
}
</style>
