<script setup>
import PlayerPaniniCard from './PlayerPaniniCard.vue'

defineProps({
  positionLabel: { type: String, required: true },
  players:       { type: Array,  required: true },
  team:          { type: Object, required: true },
})
defineEmits(['select-player'])
</script>

<template>
  <section v-if="players.length" class="ppg">
    <h3 class="ppg__title">{{ positionLabel }}</h3>
    <div class="ppg__grid">
      <PlayerPaniniCard
        v-for="p in players"
        :key="p.id"
        :player="p"
        :team="team"
        @select="$emit('select-player', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.ppg {
  margin-bottom: 32px;
}

.ppg__title {
  font-family: var(--font-heading);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
}

.ppg__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

@media (min-width: 480px) {
  .ppg__grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
}

@media (min-width: 1024px) {
  .ppg__grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>