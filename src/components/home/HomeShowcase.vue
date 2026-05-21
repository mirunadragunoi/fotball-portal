<script setup>
import { useI18n } from 'vue-i18n'
import { useLandingImages } from '@/composables/useLandingImages'

const { t } = useI18n()
const { images } = useLandingImages()
</script>

<template>
  <section class="home-showcase" aria-labelledby="home-showcase-heading">
    <div class="home-showcase__inner">
      <h2 id="home-showcase-heading" class="home-showcase__title">{{ t('home.showcaseTitle') }}</h2>
      <p class="home-showcase__lead">{{ t('home.showcaseLead') }}</p>
      <div class="home-showcase__grid">
        <figure
          v-for="(item, index) in images.gallery"
          :key="item.src"
          class="home-showcase__item"
          :class="{ 'home-showcase__item--featured': index === 0 }"
        >
          <img :src="item.src" :alt="item.alt" loading="lazy" class="home-showcase__img" />
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-showcase {
  padding: 56px var(--content-padding);
}

.home-showcase__inner {
  max-width: var(--max-content-width);
  margin-inline: auto;
}

.home-showcase__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text);
  text-transform: uppercase;
}

.home-showcase__lead {
  margin: 10px 0 28px;
  max-width: 520px;
  font-size: 16px;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.home-showcase__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  grid-template-rows: 220px 220px;
  gap: 16px;
}

.home-showcase__item {
  margin: 0;
  border-radius: var(--radius-card);
  overflow: hidden;
  position: relative;
  border: 1px solid var(--color-line);
  box-shadow: var(--shadow-card);
}

.home-showcase__item--featured {
  grid-row: span 2;
}

.home-showcase__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.home-showcase__item:hover .home-showcase__img {
  transform: scale(1.04);
}

@media (max-width: 1023px) {
  .home-showcase__grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 200px 200px 200px;
  }

  .home-showcase__item--featured {
    grid-column: span 2;
    grid-row: span 1;
  }
}

@media (max-width: 767px) {
  .home-showcase {
    padding: 32px 16px;
  }

  .home-showcase__grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .home-showcase__item,
  .home-showcase__item--featured {
    grid-column: auto;
    grid-row: auto;
    min-height: 200px;
  }
}
</style>
