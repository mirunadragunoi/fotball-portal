<script setup>
import { computed } from 'vue'
import CommentaryEvent from './CommentaryEvent.vue'

const props = defineProps({
  events: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

// Show newest events first
const sorted = computed(() =>
  [...props.events].sort((a, b) => {
    const ta = Number(a.time ?? a.minute ?? a.sort ?? 0)
    const tb = Number(b.time ?? b.minute ?? b.sort ?? 0)
    return tb - ta
  }),
)
</script>

<template>
  <div class="comm-timeline">
    <p v-if="loading" class="comm-timeline__hint">Loading commentary…</p>
    <p v-else-if="!events.length" class="comm-timeline__hint">
      No commentary available yet.
    </p>
    <ul v-else class="comm-timeline__list">
      <CommentaryEvent v-for="(ev, i) in sorted" :key="ev.id || i" :event="ev" />
    </ul>
  </div>
</template>

<style scoped>
.comm-timeline__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.comm-timeline__list {
  margin: 0;
  padding: 0;
  max-height: 480px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
