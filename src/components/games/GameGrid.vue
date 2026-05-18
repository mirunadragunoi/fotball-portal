<script setup>
import GameCard from './GameCard.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

defineProps({
  games:   { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
  skeletonCount: { type: Number, default: 8 },
})

defineEmits(['reset'])
</script>

<template>
  <div class="game-grid">
    <!-- Loading skeletons -->
    <template v-if="loading">
      <SkeletonCard
        v-for="n in skeletonCount"
        :key="n"
        aspect-ratio="16 / 10"
      />
    </template>

    <!-- Games -->
    <template v-else-if="games.length">
      <GameCard
        v-for="game in games"
        :key="game.id"
        :game="game"
      />
    </template>

    <!-- Empty state -->
    <div v-else class="game-grid__empty">
      <EmptyState @reset="$emit('reset')" />
    </div>
  </div>
</template>

<style scoped>
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.game-grid__empty {
  grid-column: 1 / -1;
}

@media (max-width: 1023px) {
  .game-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 767px) {
  .game-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 400px) {
  .game-grid {
    grid-template-columns: 1fr;
  }
}
</style>
