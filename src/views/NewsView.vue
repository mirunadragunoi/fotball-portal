<script setup>
import { useI18n } from 'vue-i18n'
import { useBrandStore } from '@/stores/brand'
import { useNews } from '@/composables/useNews'
import SectionHeader from '@/components/shared/SectionHeader.vue'
import NewsCardFeatured from '@/components/news/NewsCardFeatured.vue'
import NewsCard from '@/components/news/NewsCard.vue'
import NewsCardSkeleton from '@/components/news/NewsCardSkeleton.vue'
import NewsSourceFilter from '@/components/news/NewsSourceFilter.vue'
import NewsEmpty from '@/components/news/NewsEmpty.vue'

const { t } = useI18n()
const brandStore = useBrandStore()
const store = useNews({ autoRefresh: true })
</script>

<template>
  <main class="news-page">
    <div class="news-page__header">
      <SectionHeader
        :eyebrow="t('news.eyebrow')"
        :title="t('news.title')"
      />
      <p class="news-page__subtitle">{{ t('news.subtitle') }}</p>
    </div>

    <!-- Featured grid: first article large + 4 smaller -->
    <section v-if="store.featuredArticles.length" class="news-page__featured" :aria-label="t('news.featured')">
      <div class="news-page__featured-grid">
        <NewsCardFeatured
          :article="store.featuredArticles[0]"
          large
          class="news-page__feat-main"
        />
        <div v-if="store.featuredArticles.length > 1" class="news-page__feat-side">
          <NewsCardFeatured
            v-for="art in store.featuredArticles.slice(1, 5)"
            :key="art.id"
            :article="art"
          />
        </div>
      </div>
    </section>

    <!-- Latest articles list -->
    <section class="news-page__list-section" :aria-label="t('news.latest')">
      <h2 class="news-page__section-title">{{ t('news.latest') }}</h2>

      <NewsSourceFilter
        v-if="store.sources.length > 1"
        :sources="store.sources"
        :active="store.sourceFilter"
        @change="store.setSource"
      />

      <div v-if="store.loading && !store.articles.length">
        <NewsCardSkeleton v-for="n in 8" :key="n" />
      </div>

      <template v-else-if="store.filteredArticles.length">
        <NewsCard
          v-for="article in store.filteredArticles"
          :key="article.id"
          :article="article"
        />

        <div v-if="store.loading" class="news-page__loading-more">
          <NewsCardSkeleton v-for="n in 4" :key="n" />
        </div>

        <div v-else-if="store.hasMore" class="news-page__load-more-wrap">
          <button class="news-page__load-more" @click="store.loadMore">
            {{ t('news.loadMore') }}
          </button>
        </div>
      </template>

      <NewsEmpty v-else />
    </section>
  </main>
</template>

<style scoped>
.news-page {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 24px var(--content-padding) 64px;
}

.news-page__header { margin-bottom: 28px; }

.news-page__subtitle {
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 16px;
  max-width: 640px;
}

/* Featured grid */
.news-page__featured { margin-bottom: 40px; }

.news-page__featured-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .news-page__featured-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

@media (min-width: 1024px) {
  .news-page__featured-grid {
    grid-template-columns: 1.4fr 1fr;
  }
}

.news-page__feat-side {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Latest section */
.news-page__section-title {
  font-family: var(--font-heading);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-line);
}

.news-page__loading-more { margin-top: 8px; }

.news-page__load-more-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.news-page__load-more {
  height: 44px;
  padding: 0 28px;
  border-radius: var(--radius-button);
  border: 1px solid color-mix(in srgb, var(--color-text) 15%, transparent);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: var(--transition-default);
}

.news-page__load-more:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
