<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  kind: { type: String, required: true }, // 'html5' | 'android'
})

const map = {
  html5:   { label: 'HTML5',   icon: 'html' },
  android: { label: 'Android', icon: 'android' },
}
</script>

<template>
  <span class="platform-badge" :class="`platform-badge--${kind}`">
    <AppIcon :name="map[kind].icon" :size="12" style="stroke: currentColor" />
    {{ map[kind].label }}
  </span>
</template>

<style scoped>
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: var(--radius-badge);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.platform-badge--html5 {
  background: var(--badge-html-bg);
  color: var(--badge-html-color);
}

.platform-badge--android {
  background: var(--badge-android-bg);
  color: var(--badge-android-color);
}
</style>
