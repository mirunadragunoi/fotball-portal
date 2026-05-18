<script setup>
import AppIcon from './AppIcon.vue'

const props = defineProps({
  kind: {
    type: String,
    default: null,
  },
  label: { type: String, default: '' },
  color: { type: String, default: null },
  bgColor: { type: String, default: null },
})

const platformMap = {
  html5:   { label: 'HTML5',   icon: 'html',    cssVar: '--badge-html-bg',     fgVar: '--badge-html-color' },
  android: { label: 'Android', icon: 'android', cssVar: '--badge-android-bg',  fgVar: '--badge-android-color' },
}

const platform = props.kind ? platformMap[props.kind] : null
</script>

<template>
  <span
    class="base-badge"
    :style="platform ? {} : {
      background: bgColor ? bgColor : (color ? `color-mix(in srgb, ${color} 18%, transparent)` : 'color-mix(in srgb, var(--color-primary) 18%, transparent)'),
      color: color || 'var(--color-primary)',
    }"
    :class="{ 'base-badge--platform': !!platform }"
  >
    <AppIcon v-if="platform" :name="platform.icon" :size="11" style="stroke: currentColor" />
    {{ platform ? platform.label : label }}
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: var(--radius-badge);
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.base-badge--platform {
  background: var(--badge-html-bg);
  color: var(--badge-html-color);
}

/* Android overrides the default platform vars inline via data-platform attr —
   we rely on CSS custom properties set per brand for the two platform colours */
</style>
