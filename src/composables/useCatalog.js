import { useGamesStore } from '@/stores/games'
import { useVideosStore } from '@/stores/videos'
import { useLiveScoreStore } from '@/stores/livescore'

export async function prefetchCatalog() {
  const games = useGamesStore()
  const videos = useVideosStore()
  const live = useLiveScoreStore()
  await Promise.all([
    games.loadGames(),
    videos.loadVideos(),
    live.loadLive(),
  ])
}
