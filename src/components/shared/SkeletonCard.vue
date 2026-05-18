<script setup>
defineProps({
  aspectRatio: { type: String, default: '16 / 10' },
  lines: { type: Number, default: 2 },
})
</script>

<template>
  <div class="skeleton-card" aria-busy="true" aria-label="Loading…">
    <div class="skeleton-card__thumb" :style="{ aspectRatio }"></div>
    <div class="skeleton-card__body">
      <div
        v-for="i in lines"
        :key="i"
        class="skeleton-card__line"
        :style="{ width: i === 1 ? '80%' : '50%' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
  overflow: hidden;
  border: 1px solid var(--color-line);
}

.skeleton-card__thumb,
.skeleton-card__line {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    color-mix(in srgb, var(--color-text) 8%, var(--color-surface)) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

.skeleton-card__thumb {
  width: 100%;
}

.skeleton-card__body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card__line {
  height: 12px;
  border-radius: 6px;
}
</style>
