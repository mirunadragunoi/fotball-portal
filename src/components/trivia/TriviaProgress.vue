<script setup>
defineProps({
  current: { type: Number, required: true },
  total: { type: Number, required: true },
  score: { type: Number, default: 0 },
})
</script>

<template>
  <div class="trivia-progress" role="status" :aria-label="`Question ${current} of ${total}`">
    <div class="trivia-progress__meta">
      <span class="trivia-progress__label">{{ current }} / {{ total }}</span>
      <span class="trivia-progress__score">{{ score }}</span>
    </div>
    <div class="trivia-progress__track" aria-hidden="true">
      <div
        class="trivia-progress__fill"
        :style="{ width: total ? `${(current / total) * 100}%` : '0%' }"
      />
    </div>
  </div>
</template>

<style scoped>
.trivia-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trivia-progress__meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.trivia-progress__score::before {
  content: '★ ';
  color: var(--color-accent);
}

.trivia-progress__track {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-text) 12%, transparent);
  overflow: hidden;
}

.trivia-progress__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.25s ease;
}
</style>
