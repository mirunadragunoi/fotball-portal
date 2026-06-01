<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  sources: { type: Array, default: () => [] },
  active:  { type: String, default: null },
})
const emit = defineEmits(['change'])
const { t } = useI18n()
</script>

<template>
  <div class="nsf" role="group" :aria-label="t('news.allSources')">
    <button
      class="nsf__btn"
      :class="{ 'nsf__btn--active': !active }"
      @click="emit('change', null)"
    >{{ t('news.allSources') }}</button>
    <button
      v-for="src in sources"
      :key="src.slug"
      class="nsf__btn"
      :class="{ 'nsf__btn--active': active === src.slug }"
      @click="emit('change', active === src.slug ? null : src.slug)"
    >{{ src.name }}</button>
  </div>
</template>

<style scoped>
.nsf {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.nsf__btn {
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 12%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-default);
  white-space: nowrap;
}

.nsf__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.nsf__btn:hover:not(.nsf__btn--active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
