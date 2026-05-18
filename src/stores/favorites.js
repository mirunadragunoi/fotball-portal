import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as footballApi from '@/services/footballApi'
import { useAuthStore } from '@/stores/auth'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref(new Set())
  const loaded = ref(false)

  function isFavorite(productId) {
    return ids.value.has(String(productId))
  }

  async function loadFavorites() {
    const auth = useAuthStore()
    auth.hydrate()
    const creds = auth.getAuthQuery()
    if (!creds) return

    try {
      const list = await footballApi.fetchFavorites(creds)
      const next = new Set()
      list.forEach((item) => {
        const id = item?.product_id ?? item?.id
        if (id != null) next.add(String(id))
      })
      ids.value = next
      loaded.value = true
    } catch {
      ids.value = new Set()
    }
  }

  async function toggle(productId) {
    const auth = useAuthStore()
    const creds = auth.getAuthQuery()
    if (!creds) return { ok: false }

    const id = String(productId)
    try {
      const data = await footballApi.toggleFavorite(id, creds)
      const isFav = Boolean(data.is_favorite)
      if (isFav) ids.value.add(id)
      else ids.value.delete(id)
      ids.value = new Set(ids.value)
      return { ok: true, isFavorite: isFav }
    } catch {
      return { ok: false }
    }
  }

  function clear() {
    ids.value = new Set()
    loaded.value = false
  }

  return { ids, loaded, isFavorite, loadFavorites, toggle, clear }
})
