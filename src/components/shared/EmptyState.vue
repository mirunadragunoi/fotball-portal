<script setup>
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

const { t } = useI18n()

defineProps({
  message: { type: String, default: '' },
  showReset: { type: Boolean, default: true },
})

defineEmits(['reset'])
</script>

<template>
  <div class="empty-state" role="status">
    <div class="empty-state__icon" aria-hidden="true">⚽</div>
    <p class="empty-state__message">{{ message || t('games.noResults') }}</p>
    <BaseButton
      v-if="showReset"
      variant="ghost"
      size="sm"
      @click="$emit('reset')"
    >
      {{ t('games.resetFilters') }}
    </BaseButton>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 24px;
  text-align: center;
}

.empty-state__icon {
  font-size: 48px;
  opacity: 0.4;
}

.empty-state__message {
  font-size: 15px;
  color: var(--color-text-secondary);
  max-width: 320px;
}
</style>
