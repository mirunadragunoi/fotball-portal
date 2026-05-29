import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'

export async function prefetchCatalog() {
  const games = useGamesStore()
  const videos = useVideosStore()
  await Promise.all([
    games.loadGames(),
    videos.loadVideos(),
  ])
}
