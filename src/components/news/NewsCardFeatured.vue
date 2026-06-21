<script setup>
import { useI18n } from 'vue-i18n'
import { timeAgo } from '@/utils/timeAgo'

const props = defineProps({
  article: { type: Object, required: true },
  large:   { type: Boolean, default: false },
})

const { t, locale } = useI18n()

function open() {
  if (props.article.link) window.open(props.article.link, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <article
    class="ncf"
    :class="{ 'ncf--large': large }"
    @click="open"
    role="button"
    tabindex="0"
    @keydown.enter="open"
    :aria-label="article.title"
  >
    <div class="ncf__img-wrap">
      <img
        v-if="article.image"
        :src="article.image"
        :alt="article.title"
        class="ncf__img"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <div v-else class="ncf__img-fallback" aria-hidden="true">
        <span class="ncf__source-initial">{{ (article.source?.name || '?')[0] }}</span>
      </div>
    </div>

    <div class="ncf__overlay">
      <span class="ncf__source">{{ article.source?.name }}</span>
      <h3 class="ncf__title">{{ article.title }}</h3>
      <time class="ncf__time" :datetime="article.publishedAt">
        {{ timeAgo(article.publishedAt, { t, locale: locale }) }}
      </time>
    </div>
  </article>
</template>

<style scoped>
.ncf {
  position: relative;
  border-radius: var(--radius-card);
  overflow: hidden;
  cursor: pointer;
  display: block;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  outline: none;
  aspect-ratio: 16 / 10;
}

.ncf:hover, .ncf:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.28);
}

.ncf:focus-visible { box-shadow: 0 0 0 3px var(--color-primary); }

.ncf--large { aspect-ratio: 16 / 9; }

.ncf__img-wrap {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-primary) 20%, #111);
}

.ncf__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ncf__img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ncf__source-initial {
  font-family: var(--font-heading);
  font-size: 48px;
  font-weight: 900;
  color: rgba(255,255,255,0.15);
}

.ncf__overlay {
  position: absolute;
  inset: 0;
  top: 40%;
  background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 14px;
  gap: 4px;
}

.ncf__source {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
}

.ncf__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(13px, 2vw, 16px);
  font-weight: 800;
  color: #fff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ncf--large .ncf__title {
  font-size: clamp(16px, 2.5vw, 22px);
}

.ncf__time {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}
</style>
