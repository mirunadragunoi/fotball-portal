<script setup>
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/shared/AppIcon.vue'

defineProps({
  open: { type: Boolean, default: false },
  tournament: { type: Object, default: null },
  isF2: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'viewMatches'])
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && tournament"
      class="history-drawer-backdrop"
      role="presentation"
      @click="emit('close')"
    />
    <aside
      v-if="open && tournament"
      class="history-drawer"
      :class="{ 'history-drawer--f2': isF2 }"
      role="dialog"
      aria-modal="true"
      :aria-label="t('history.tournamentDetail')"
    >
      <button type="button" class="history-drawer__close" :aria-label="t('history.close')" @click="emit('close')">
        <AppIcon name="x" :size="22" />
      </button>
      <p class="history-drawer__year">{{ tournament.year }}</p>
      <h2 class="history-drawer__title">{{ tournament.hostCountry }}</h2>
      <dl class="history-drawer__dl">
        <div>
          <dt>{{ t('history.dates') }}</dt>
          <dd>{{ tournament.startDate }} — {{ tournament.endDate }}</dd>
        </div>
        <div>
          <dt>{{ t('history.winner') }}</dt>
          <dd>{{ tournament.winner }}</dd>
        </div>
        <div>
          <dt>{{ t('history.hostWon') }}</dt>
          <dd>{{ tournament.hostWon ? t('history.yes') : t('history.no') }}</dd>
        </div>
      </dl>
      <button type="button" class="history-drawer__cta" @click="emit('viewMatches', tournament)">
        {{ t('history.viewMatches') }}
      </button>
    </aside>
  </Teleport>
</template>

<style scoped>
.history-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 200;
}

.history-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(400px, 100vw);
  height: 100%;
  padding: 28px 24px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-line);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.25);
  z-index: 201;
  overflow-y: auto;
}

.history-drawer__close {
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
}

.history-drawer__year {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px;
}

.history-drawer__title {
  margin: 0 0 24px;
  font-family: var(--font-heading);
  font-size: 1.5rem;
}

.history-drawer__dl {
  margin: 0 0 24px;
}

.history-drawer__dl div {
  margin-bottom: 14px;
}

.history-drawer__dl dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.history-drawer__dl dd {
  margin: 0;
  font-size: 15px;
}

.history-drawer__cta {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: var(--radius-button);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
</style>
