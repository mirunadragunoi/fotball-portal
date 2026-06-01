import { onMounted, onUnmounted } from 'vue'
import { useNewsStore } from '@/stores/news'

export function useNews(options = {}) {
  const store = useNewsStore()
  let refreshTimer = null

  onMounted(() => {
    if (store.articles.length === 0) store.fetchNews(options)

    if (options.autoRefresh !== false) {
      refreshTimer = setInterval(() => store.fetchNews(options), 5 * 60 * 1000)
    }
  })

  onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer)
  })

  return store
}
