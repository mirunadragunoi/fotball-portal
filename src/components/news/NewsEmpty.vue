<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div class="ne">
    <span class="ne__icon" aria-hidden="true">📰</span>
    <p class="ne__text">{{ t('news.noNews') }}</p>
  </div>
</template>

<style scoped>
.ne {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--color-text-secondary);
}

.ne__icon { font-size: 36px; }
.ne__text  { font-size: 14px; margin: 0; }
</style>
