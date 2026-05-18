<script setup>
import AppIcon from './AppIcon.vue'
import AuthLink from './AuthLink.vue'

defineProps({
  eyebrow: { type: String, default: '' },
  title:   { type: String, required: true },
  link:    { type: String, default: '' },
  linkTo:  { type: String, default: '' },
})
</script>

<template>
  <div class="section-header">
    <div class="section-header__left">
      <div v-if="eyebrow" class="section-header__eyebrow">
        <span class="section-header__eyebrow-bar" aria-hidden="true"></span>
        {{ eyebrow }}
      </div>
      <h2 class="section-header__title">{{ title }}</h2>
    </div>
    <AuthLink
      v-if="link && linkTo"
      :to="linkTo"
      class="section-header__link"
    >
      {{ link }}
      <AppIcon name="chev-r" :size="12" />
    </AuthLink>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.section-header__left {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.section-header__eyebrow-bar {
  display: inline-block;
  width: 24px;
  height: 1.5px;
  background: var(--color-accent);
}

.section-header__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.005em;
  text-transform: uppercase;
  color: var(--color-text);
}

.section-header__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: var(--transition-default);
  white-space: nowrap;
}

.section-header__link:hover {
  color: var(--color-text);
}

/* football2 overrides via CSS specificity */
:root[data-brand="football2"] .section-header__eyebrow {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  color: var(--color-primary);
  gap: 8px;
}

:root[data-brand="football2"] .section-header__eyebrow-bar {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

:root[data-brand="football2"] .section-header__title {
  text-transform: none;
  letter-spacing: -0.015em;
  font-size: clamp(28px, 4vw, 40px);
}

:root[data-brand="football2"] .section-header__link {
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  color: var(--color-text);
  font-size: 13px;
}
</style>
