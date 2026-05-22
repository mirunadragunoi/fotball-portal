<script setup>
import BaseButton from '@/components/shared/BaseButton.vue'
import AppIcon from '@/components/shared/AppIcon.vue'

defineProps({
  score: { type: Number, required: true },
  total: { type: Number, required: true },
})

defineEmits(['playAgain'])
</script>

<template>
  <div class="trivia-results">
    <div class="trivia-results__icon" aria-hidden="true">
      <AppIcon name="trophy" :size="48" stroke="var(--color-accent)" />
    </div>
    <h2 class="trivia-results__title">
      <slot name="title" />
    </h2>
    <p class="trivia-results__score">
      <slot name="score" />
    </p>
    <p class="trivia-results__message">
      <slot name="message" />
    </p>
    <div class="trivia-results__actions">
      <BaseButton variant="primary" size="lg" @click="$emit('playAgain')">
        <slot name="play-again" />
      </BaseButton>
      <BaseButton tag="router-link" to="/" variant="secondary" size="md">
        <slot name="home" />
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.trivia-results {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
}

.trivia-results__icon {
  width: 88px;
  height: 88px;
  border-radius: 28px;
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
  display: grid;
  place-items: center;
}

.trivia-results__title {
  font-family: var(--font-heading);
  font-size: clamp(28px, 5vw, 40px);
  font-weight: 800;
  margin: 0;
  color: var(--color-text);
}

.trivia-results__score {
  font-size: 48px;
  font-weight: 800;
  margin: 0;
  color: var(--color-primary);
  line-height: 1;
}

.trivia-results__message {
  font-size: 16px;
  color: var(--color-text-secondary);
  max-width: 360px;
  margin: 0;
  line-height: 1.5;
}

.trivia-results__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 12px;
}
</style>
