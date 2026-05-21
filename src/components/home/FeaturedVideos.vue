<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import VideoCard from '@/components/videos/VideoCard.vue'
import { useVideosStore } from '@/stores/videos'

const { t } = useI18n()
const store = useVideosStore()
const featured = computed(() => store.featured)

onMounted(() => {
  store.loadVideos()
})
</script>

<template>
  <section class="featured-videos" aria-labelledby="featured-videos-heading">
    <div class="featured-videos__inner">
      <SectionHeader
        :eyebrow="t('nav.videos')"
        :title="t('home.latestVideos')"
        :link="t('home.allVideos')"
        link-to="/videos"
        id="featured-videos-heading"
      />
      <div class="featured-videos__grid">
        <VideoCard
          v-for="video in featured.slice(0, 4)"
          :key="video.id"
          :video="video"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.featured-videos {
  padding: 32px var(--content-padding) 80px;
}

.featured-videos__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.featured-videos__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1023px) {
  .featured-videos__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .featured-videos {
    padding: 16px 16px 48px;
  }
  .featured-videos__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
