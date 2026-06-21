<script setup>
import { useI18n } from 'vue-i18n'
import { timeAgo } from '@/utils/timeAgo'

const props = defineProps({
  article: { type: Object, required: true },
})

const { t, locale } = useI18n()

function open() {
  if (props.article.link) window.open(props.article.link, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <article class="nc" @click="open" role="button" tabindex="0" @keydown.enter="open"
    :aria-label="article.title">
    <div class="nc__img-wrap">
      <img
        v-if="article.image"
        :src="article.image"
        :alt="article.title"
        class="nc__img"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <div v-else class="nc__img-fallback" aria-hidden="true">
        <span class="nc__source-initial">{{ (article.source?.name || '?')[0] }}</span>
      </div>
    </div>

    <div class="nc__body">
      <h3 class="nc__title">{{ article.title }}</h3>
      <p v-if="article.description" class="nc__desc">{{ article.description }}</p>
      <footer class="nc__meta">
        <span class="nc__source">{{ article.source?.name }}</span>
        <span class="nc__sep" aria-hidden="true">·</span>
        <time class="nc__time" :datetime="article.publishedAt">
          {{ timeAgo(article.publishedAt, { t, locale: locale }) }}
        </time>
        <span class="nc__read-more">{{ t('news.readMore') }} ↗</span>
      </footer>
    </div>
  </article>
</template>

<style scoped>
.nc {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-line);
  cursor: pointer;
  transition: background 0.15s ease;
  border-radius: 4px;
  outline: none;
}

.nc:last-child { border-bottom: none; }

.nc:hover, .nc:focus-visible {
  background: color-mix(in srgb, var(--color-text) 3%, transparent);
}

.nc:focus-visible { box-shadow: 0 0 0 2px var(--color-primary); }

.nc__img-wrap {
  flex-shrink: 0;
  width: 100px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
}

.nc__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nc__img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nc__source-initial {
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
  opacity: 0.5;
}

.nc__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nc__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nc__desc {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nc__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: auto;
  flex-wrap: wrap;
}

.nc__source { font-weight: 700; color: var(--color-primary); }
.nc__sep { opacity: 0.4; }
.nc__read-more { margin-left: auto; font-weight: 600; color: var(--color-primary); opacity: 0.8; }

@media (max-width: 480px) {
  .nc__img-wrap { width: 80px; }
  .nc__read-more { display: none; }
}
</style>
