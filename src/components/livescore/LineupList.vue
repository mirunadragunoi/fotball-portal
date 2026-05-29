<script setup>
import { computed } from 'vue'

const props = defineProps({
  lineups: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

function extractTeam(raw) {
  if (!raw) return null
  return {
    name: raw.name || raw.team_name || '',
    formation: raw.formation || '',
    starting: raw.starting_eleven || raw.lineup || [],
    subs: raw.substitutes || raw.subs || [],
  }
}

const home = computed(() => extractTeam(props.lineups.home))
const away = computed(() => extractTeam(props.lineups.away))
const hasData = computed(() => home.value || away.value)
</script>

<template>
  <div class="lineup">
    <p v-if="loading" class="lineup__hint">Loading lineups…</p>
    <p v-else-if="!hasData" class="lineup__hint">Lineups not announced yet.</p>

    <div v-else class="lineup__grid">
      <section v-for="(team, side) in { home, away }" :key="side" class="lineup__team">
        <h3 class="lineup__team-name">
          {{ team.name }}
          <span v-if="team.formation" class="lineup__formation">{{ team.formation }}</span>
        </h3>

        <div class="lineup__group">
          <p class="lineup__group-label">Starting XI</p>
          <ol class="lineup__list">
            <li
              v-for="player in team.starting"
              :key="player.id || player.name"
              class="lineup__player"
            >
              <span class="lineup__number">{{ player.number ?? player.shirt_number ?? '' }}</span>
              <span class="lineup__name">{{ player.name || player.player_name }}</span>
              <span v-if="player.position" class="lineup__pos">{{ player.position }}</span>
            </li>
          </ol>
        </div>

        <div v-if="team.subs.length" class="lineup__group">
          <p class="lineup__group-label">Substitutes</p>
          <ol class="lineup__list lineup__list--subs">
            <li
              v-for="player in team.subs"
              :key="player.id || player.name"
              class="lineup__player"
            >
              <span class="lineup__number">{{ player.number ?? player.shirt_number ?? '' }}</span>
              <span class="lineup__name">{{ player.name || player.player_name }}</span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lineup__hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.lineup__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 540px) {
  .lineup__grid { grid-template-columns: 1fr; }
}

.lineup__team-name {
  font-family: var(--font-heading);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lineup__formation {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-secondary);
  font-family: var(--font-body);
  text-transform: none;
  letter-spacing: 0;
}

.lineup__group {
  margin-bottom: 12px;
}

.lineup__group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin: 0 0 6px;
}

.lineup__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lineup__player {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
  font-size: 13px;
}

.lineup__list--subs .lineup__player {
  opacity: 0.75;
}

.lineup__number {
  font-weight: 700;
  font-size: 11px;
  color: var(--color-primary);
  text-align: center;
}

.lineup__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lineup__pos {
  font-size: 10px;
  color: var(--color-text-secondary);
}
</style>
