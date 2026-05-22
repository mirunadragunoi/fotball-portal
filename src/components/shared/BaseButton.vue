<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'ghost', 'icon'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  tag: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>

<template>
  <component
    :is="tag"
    class="base-btn"
    :class="[`base-btn--${variant}`, `base-btn--${size}`]"
    :disabled="disabled"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  transition: var(--transition-default);
  white-space: nowrap;
  border-radius: var(--radius-button);
}

.base-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* sizes */
.base-btn--sm  { height: 34px; padding: 0 14px; font-size: 11px; }
.base-btn--md  { height: 44px; padding: 0 20px; font-size: 13px; }
.base-btn--lg  { height: 52px; padding: 0 26px; font-size: 14px; }

/* variants */
.base-btn--primary {
  background: var(--color-accent);
  color: #1a1500;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-accent) 35%, transparent);
}
.base-btn--primary:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.base-btn--secondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-line-strong);
}
.base-btn--secondary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.base-btn--ghost {
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  color: var(--color-text);
  border: 1px solid var(--color-line);
}
.base-btn--ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}

.base-btn--icon {
  width: 44px;
  padding: 0;
  background: color-mix(in srgb, var(--color-text) 5%, transparent);
  color: var(--color-text);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-button);
}
.base-btn--icon:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}
</style>
