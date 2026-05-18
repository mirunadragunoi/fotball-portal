<script setup>
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

const uid = ref(`filter-sort-${Math.random().toString(36).slice(2, 8)}`)

const props = defineProps({
  platformOptions: { type: Array, default: () => [] }, // [{ value, label, count }]
  categoryOptions: { type: Array, default: () => [] }, // [{ value, label, color? }]
  sortOptions:     { type: Array, default: () => [] }, // [{ value, label }]
  activePlatform:  { type: String, default: 'all' },
  activeCategory:  { type: String, default: 'all' },
  activeSort:      { type: String, default: 'plays' },
})

const emit = defineEmits(['platform', 'category', 'sort'])
</script>

<template>
  <div class="filter-bar" role="toolbar" aria-label="Filter and sort">
    <!-- Platform toggle group -->
    <div v-if="platformOptions.length" class="filter-bar__toggle-group" role="group" aria-label="Filter by platform">
      <button
        v-for="opt in platformOptions"
        :key="opt.value"
        class="filter-bar__toggle"
        :class="{ 'filter-bar__toggle--active': activePlatform === opt.value }"
        :aria-pressed="activePlatform === opt.value"
        @click="emit('platform', opt.value)"
      >
        {{ opt.label }}
        <span v-if="opt.count != null" class="filter-bar__count">{{ opt.count }}</span>
      </button>
    </div>

    <!-- Category pills -->
    <div v-if="categoryOptions.length" class="filter-bar__pills">
      <button
        v-for="opt in categoryOptions"
        :key="opt.value"
        class="filter-bar__pill"
        :class="{ 'filter-bar__pill--active': activeCategory === opt.value }"
        :aria-pressed="activeCategory === opt.value"
        @click="emit('category', opt.value)"
      >
        <span v-if="opt.color" class="filter-bar__pill-dot" :style="{ background: opt.color }"></span>
        {{ opt.label }}
      </button>
    </div>

    <div class="filter-bar__spacer"></div>

    <!-- Sort dropdown (styled as button) -->
    <div v-if="sortOptions.length" class="filter-bar__sort-wrap">
      <label :for="uid" class="visually-hidden">Sort by</label>
      <select
        :id="uid"
        class="filter-bar__sort"
        :value="activeSort"
        @change="emit('sort', $event.target.value)"
        aria-label="Sort games"
      >
        <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <AppIcon name="chev-d" :size="14" class="filter-bar__sort-icon" />
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* Platform toggle group */
.filter-bar__toggle-group {
  display: flex;
  padding: 4px;
  background: var(--color-surface);
  border-radius: 10px;
  border: 1px solid var(--color-line);
  gap: 2px;
}

.filter-bar__toggle {
  height: 34px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 7px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: transparent;
  transition: var(--transition-default);
  cursor: pointer;
}

.filter-bar__toggle--active {
  background: var(--color-accent);
  color: #1a1500;
}

.filter-bar__count {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

/* Category pills */
.filter-bar__pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-bar__pill {
  height: 34px;
  padding: 0 12px;
  border-radius: 17px;
  background: transparent;
  border: 1px solid var(--color-line-strong);
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition-default);
  cursor: pointer;
}

.filter-bar__pill:hover {
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-text) 30%, transparent);
}

.filter-bar__pill--active {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: color-mix(in srgb, var(--color-text) 30%, transparent);
}

.filter-bar__pill-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.filter-bar__spacer {
  flex: 1;
}

/* Sort */
.filter-bar__sort-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.filter-bar__sort {
  appearance: none;
  height: 38px;
  padding: 0 36px 0 14px;
  border-radius: var(--radius-button);
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.filter-bar__sort:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.filter-bar__sort-icon {
  position: absolute;
  right: 12px;
  pointer-events: none;
  color: var(--color-text-secondary);
}

/* football2 overrides */
:root[data-brand="football2"] .filter-bar__toggle-group {
  border-radius: 999px;
  background: var(--color-surface);
  box-shadow: 0 1px 2px rgba(16,17,42,0.06);
}

:root[data-brand="football2"] .filter-bar__toggle {
  border-radius: 999px;
  text-transform: none;
}

:root[data-brand="football2"] .filter-bar__toggle--active {
  background: var(--color-text);
  color: var(--color-surface);
}

:root[data-brand="football2"] .filter-bar__pill {
  border-radius: 999px;
  font-size: 13px;
}

:root[data-brand="football2"] .filter-bar__sort {
  border-radius: 20px;
}

@media (max-width: 767px) {
  .filter-bar {
    gap: 10px;
  }
  .filter-bar__toggle {
    height: 40px;
    min-width: 44px;
    justify-content: center;
  }
  .filter-bar__pill {
    height: 40px;
  }
}
</style>
