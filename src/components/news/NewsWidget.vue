<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNewsStore } from '@/stores/news'
import { timeAgo } from '@/utils/timeAgo'

const props = defineProps({
  limit: { type: Number, default: 5 },
})

const { t } = useI18n()
const router = useRouter()
const store = useNewsStore()

onMounted(() => {
  if (store.articles.length === 0) store.fetchNews()
})
</script>

<template>
  <section class="nw">
    <header class="nw__header">
      <h2 class="nw__title">📰 {{ t('news.latest') }}</h2>
      <RouterLink to="/news" class="nw__see-all">{{ t('news.seeAll') }} →</RouterLink>
    </header>

    <div v-if="store.loading" class="nw__list">
      <div v-for="n in limit" :key="n" class="nw__skeleton" aria-hidden="true"></div>
    </div>

    <div v-else-if="store.articles.length" class="nw__list">
      <a
        v-for="article in store.articles.slice(0, limit)"
        :key="article.id"
        class="nw__item"
        :href="article.link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="nw__thumb-wrap">
          <img
            v-if="article.image"
            :src="article.image"
            :alt="article.title"
            class="nw__thumb"
            loading="lazy"
            referrerpolicy="no-referrer"
          />
          <div v-else class="nw__thumb-fallback" aria-hidden="true">
            {{ (article.source?.name || '?')[0] }}
          </div>
        </div>
        <div class="nw__item-body">
          <span class="nw__item-title">{{ article.title }}</span>
          <span class="nw__item-meta">{{ article.source?.name }} · {{ timeAgo(article.publishedAt) }}</span>
        </div>
      </a>
    </div>

    <p v-else class="nw__empty">{{ t('news.noNews') }}</p>
  </section>
</template>

<style scoped>
.nw {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-card);
  padding: 20px;
}

.nw__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nw__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text);
}

.nw__see-all {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}

.nw__see-all:hover { text-decoration: underline; }

.nw__list { display: flex; flex-direction: column; gap: 12px; }

.nw__item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;
  padding: 4px;
  border-radius: 6px;
  transition: background 0.12s ease;
}

.nw__item:hover {
  background: color-mix(in srgb, var(--color-text) 4%, transparent);
}

.nw__thumb-wrap {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 6px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
}

.nw__thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nw__thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-primary);
  opacity: 0.4;
}

.nw__item-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.nw__item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nw__item-meta {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.nw__skeleton {
  height: 52px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  animation: nw-pulse 1.5s ease-in-out infinite;
}

@keyframes nw-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.nw__empty {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  padding: 16px 0;
  margin: 0;
}
</style>
