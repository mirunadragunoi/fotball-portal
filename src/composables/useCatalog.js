import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'
import { useFavoritesStore } from '@/stores/favorites'

/** Load games, videos and favorites from the backend (after login). */
export async function prefetchCatalog() {
  const games = useGamesStore()
  const videos = useVideosStore()
  const favorites = useFavoritesStore()
  await Promise.all([
    games.loadGames(),
    videos.loadVideos(),
    favorites.loadFavorites(),
  ])
}
