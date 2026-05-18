<script setup>
import VideoCard from './VideoCard.vue'
import SkeletonCard from '@/components/shared/SkeletonCard.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

defineProps({
  videos:   { type: Array,   default: () => [] },
  loading:  { type: Boolean, default: false },
  compact:  { type: Boolean, default: false },
  skeletonCount: { type: Number, default: 8 },
})

defineEmits(['reset'])
</script>

<template>
  <div class="video-grid">
    <template v-if="loading">
      <SkeletonCard
        v-for="n in skeletonCount"
        :key="n"
        aspect-ratio="16 / 9"
      />
    </template>

    <template v-else-if="videos.length">
      <VideoCard
        v-for="video in videos"
        :key="video.id"
        :video="video"
        :compact="compact"
      />
    </template>

    <div v-else class="video-grid__empty">
      <EmptyState @reset="$emit('reset')" />
    </div>
  </div>
</template>

<style scoped>
.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.video-grid__empty {
  grid-column: 1 / -1;
}

@media (max-width: 1023px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

@media (max-width: 767px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>
