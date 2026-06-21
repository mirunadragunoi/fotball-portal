<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  team: { type: Object, required: true },
})

const { t } = useI18n()
const router = useRouter()

function navigate() {
  if (!props.team.id) return
  router.push({ name: 'TournamentTeamSquad', params: { teamId: props.team.id } })
}
</script>

<template>
  <button
    class="tfc"
    :class="{ 'tfc--no-link': !team.id }"
    :aria-label="`${team.name}, Group ${team.group}`"
    @click="navigate"
  >
    <div class="tfc__logo-wrap">
      <img
        v-if="team.logo"
        :src="team.logo"
        :alt="`${team.name} logo`"
        class="tfc__logo"
        loading="lazy"
        width="56"
        height="56"
      />
      <div v-else class="tfc__logo-placeholder" aria-hidden="true">
        {{ team.code || '?' }}
      </div>
    </div>

    <div class="tfc__info">
      <span class="tfc__name">{{ team.name }}</span>
      <span class="tfc__meta">
        <span class="tfc__group-badge">{{ team.group }}</span>
        <span v-if="team.players?.length" class="tfc__players">
          {{ t('worldcup.playerCount', { count: team.players.length }) }}
        </span>
      </span>
    </div>
  </button>
</template>

<style scoped>
.tfc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px 14px;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  border-radius: var(--radius-card);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  text-align: center;
  width: 100%;
}

.tfc:hover:not(.tfc--no-link) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.tfc--no-link {
  cursor: default;
  opacity: 0.6;
}

.tfc__logo-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tfc__logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.tfc__logo-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.04em;
}

.tfc__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.tfc__name {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.tfc__meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tfc__group-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  font-family: var(--font-heading);
}

.tfc__players {
  font-size: 10px;
  color: var(--color-text-secondary);
}
</style>
