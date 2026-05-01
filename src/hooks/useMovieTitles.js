import { useQueries } from '@tanstack/react-query'
import { tmdbService } from '../services/tmdb'

export function useMovieTitles(items = []) {
  // Normalize input to handle both old format [id, id, ...] and new format [{ id, type }, ...]
  const normalizedItems = items.map(item => typeof item === 'object' ? item : { id: item, type: 'movie' })

  const results = useQueries({
    queries: normalizedItems.map(item => ({
      queryKey: ['media-title', item.type, item.id],
      queryFn: () => item.type === 'tv' ? tmdbService.getTvDetails(item.id) : tmdbService.getMovieDetails(item.id),
      staleTime: Infinity,
    }))
  })

  const titles = {}
  const posters = {}
  results.forEach((result, i) => {
    if (result.data?.data) {
      const idStr = `${normalizedItems[i].type}-${normalizedItems[i].id}`
      titles[idStr] = result.data.data.title || result.data.data.name
      posters[idStr] = result.data.data.poster_path
    }
  })

  return { titles, posters }
}