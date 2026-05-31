<script setup>
const props = defineProps({
  player:   { type: Object, required: true },
  team:     { type: Object, required: true },
})
const emit = defineEmits(['select'])

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
</script>

<template>
  <button
    class="ppc"
    :aria-label="`Photo of ${player.name}, ${player.position} for ${team.name}`"
    @click="emit('select', player)"
  >
    <!-- headshot -->
    <div class="ppc__photo-wrap">
      <img
        v-if="player.photo"
        :src="player.photo"
        :alt="`Photo of ${player.name}`"
        class="ppc__photo"
        loading="lazy"
      />
      <div v-else class="ppc__photo-placeholder" aria-hidden="true">
        {{ initials(player.name) }}
      </div>
      <!-- jersey number badge -->
      <span v-if="player.number" class="ppc__number">#{{ player.number }}</span>
    </div>

    <!-- info strip -->
    <div class="ppc__info">
      <span class="ppc__name">{{ player.name }}</span>
      <span class="ppc__sub">{{ player.position }}<template v-if="player.age"> · {{ player.age }}y</template></span>
    </div>

    <!-- team logo -->
    <img
      v-if="team.logo"
      :src="team.logo"
      :alt="team.name"
      class="ppc__team-logo"
      loading="lazy"
    />
  </button>
</template>

<style scoped>
.ppc {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  text-align: left;
  width: 100%;
  padding: 0;
}

.ppc:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.ppc__photo-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: linear-gradient(160deg,
    color-mix(in srgb, var(--color-primary) 35%, var(--color-surface)),
    color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))
  );
}

.ppc__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}

.ppc__photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: 0.04em;
}

.ppc__number {
  position: absolute;
  top: 7px;
  left: 7px;
  background: var(--color-primary);
  color: #fff;
  font-family: var(--font-heading);
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

.ppc__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px 10px;
  flex: 1;
}

.ppc__name {
  font-family: var(--font-heading);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ppc__sub {
  font-size: 10px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ppc__team-logo {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  object-fit: contain;
  opacity: 0.7;
}
</style>