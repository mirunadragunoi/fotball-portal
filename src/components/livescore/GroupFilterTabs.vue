<script setup>
const props = defineProps({
  groups:  { type: Array, required: true }, // ['A','B',...,'L']
  active:  { type: String, default: 'all' },
})
const emit = defineEmits(['update:active'])
</script>

<template>
  <div class="gft" role="tablist" aria-label="Filter by group">
    <button
      class="gft__btn"
      :class="{ 'gft__btn--active': active === 'all' }"
      role="tab"
      :aria-selected="active === 'all'"
      @click="emit('update:active', 'all')"
    >
      All
    </button>
    <button
      v-for="g in groups"
      :key="g"
      class="gft__btn"
      :class="{ 'gft__btn--active': active === g }"
      role="tab"
      :aria-selected="active === g"
      @click="emit('update:active', g)"
    >
      {{ g }}
    </button>
  </div>
</template>

<style scoped>
.gft {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
}

.gft__btn {
  min-height: 36px;
  padding: 6px 14px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: var(--transition-default);
}

.gft__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.gft__btn:hover:not(.gft__btn--active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
