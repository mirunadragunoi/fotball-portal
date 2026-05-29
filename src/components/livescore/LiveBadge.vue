<script setup>
import { computed } from 'vue'
import { useLiveScoreStore } from '@/stores/livescore'

defineProps({
  showCount: { type: Boolean, default: true },
})

const store = useLiveScoreStore()
const count = computed(() => store.liveCount)
const visible = computed(() => count.value > 0)
</script>

<template>
  <span
    v-if="visible"
    class="live-badge"
    :aria-label="`${count} matches live`"
  >
    <span class="live-badge__dot" aria-hidden="true"></span>
    <span class="live-badge__text">LIVE</span>
    <span v-if="showCount" class="live-badge__count">{{ count }}</span>
  </span>
</template>

<style scoped>
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: color-mix(in srgb, var(--color-red, #e53935) 15%, transparent);
  color: var(--color-red, #e53935);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.live-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-red, #e53935);
  animation: live-pulse 1.2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.live-badge__count {
  background: var(--color-red, #e53935);
  color: #fff;
  border-radius: 999px;
  padding: 1px 5px;
  font-size: 10px;
}
</style>
