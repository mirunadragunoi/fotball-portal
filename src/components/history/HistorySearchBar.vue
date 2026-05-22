<script setup>
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/shared/AppIcon.vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  placeholder: { type: String, default: '' },
  id: { type: String, default: 'history-search' },
})

const emit = defineEmits(['search'])
const { t } = useI18n()
</script>

<template>
  <form class="history-search" @submit.prevent="emit('search')">
    <label :for="id" class="visually-hidden">{{ placeholder || t('history.search') }}</label>
    <AppIcon name="search" :size="18" class="history-search__icon" aria-hidden="true" />
    <input
      :id="id"
      v-model="model"
      type="search"
      class="history-search__input"
      :placeholder="placeholder"
      autocomplete="off"
    />
    <button type="submit" class="history-search__btn">{{ t('history.searchBtn') }}</button>
  </form>
</template>

<style scoped>
.history-search {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 420px;
  padding: 4px 4px 4px 14px;
  border-radius: var(--radius-button);
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}

.history-search__icon {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.history-search__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 15px;
  outline: none;
}

.history-search__btn {
  min-height: 40px;
  padding: 8px 14px;
  border: none;
  border-radius: calc(var(--radius-button) - 2px);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
</style>
