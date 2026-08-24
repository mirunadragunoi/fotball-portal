import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getNews } from '@/services/newsApi'

export const useNewsStore = defineStore('news', () => {
  const articles    = ref([])
  const total       = ref(0)
  const page        = ref(1)
  const limit       = ref(20)
  const hasMore     = ref(false)
  const loading     = ref(false)
  const error       = ref(null)
  const lastFetched = ref(null)
  const sourceFilter = ref(null)   // null = all, 'bbc' | 'sky' | 'espn'
  const language = ref(null)       // null = all feed languages; else 'en'|'ro'|'pl'|'sk'|'cs'

  const authStore = useAuthStore()
  const creds = computed(() => authStore.getAuthQuery() || {})

  const featuredArticles = computed(() =>
    articles.value.filter(a => a.image).slice(0, 5)
  )

  const filteredArticles = computed(() => {
    if (!sourceFilter.value) return articles.value
    return articles.value.filter(a => a.source?.slug === sourceFilter.value)
  })

  const sources = computed(() => {
    const map = new Map()
    articles.value.forEach(a => {
      if (a.source?.slug && !map.has(a.source.slug)) {
        map.set(a.source.slug, a.source.name)
      }
    })
    return [...map.entries()].map(([slug, name]) => ({ slug, name }))
  })

  async function fetchNews(options = {}) {
    loading.value = true
    error.value = null
    try {
      const result = await getNews(creds.value, {
        limit: limit.value,
        page: options.page || 1,
        langs: language.value || undefined,
      })

      if ((options.page || 1) > 1) {
        articles.value = [...articles.value, ...result.articles]
      } else {
        articles.value = result.articles
      }
      total.value    = result.total
      page.value     = result.page
      hasMore.value  = result.hasMore
      lastFetched.value = new Date()
    } catch (e) {
      error.value = e?.message || 'load'
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return
    await fetchNews({ page: page.value + 1 })
  }

  function setSource(slug) {
    sourceFilter.value = slug || null
  }

  // Switching feed language re-queries the backend (server-side filter + fetch).
  async function setLanguage(lang) {
    const next = lang || null
    if (next === language.value) return
    language.value = next
    sourceFilter.value = null
    await fetchNews({ page: 1 })
  }

  return {
    articles,
    featuredArticles,
    filteredArticles,
    sources,
    total,
    page,
    limit,
    hasMore,
    loading,
    error,
    lastFetched,
    sourceFilter,
    language,
    fetchNews,
    loadMore,
    setSource,
    setLanguage,
  }
})
