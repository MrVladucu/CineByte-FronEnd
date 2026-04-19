import { useQueries } from '@tanstack/react-query'
import { tmdbService } from '../services/tmdb'

export function useMovieTitles(movieIds = []) {
  const results = useQueries({
    queries: movieIds.map(id => ({
      queryKey: ['movie-title', id],
      queryFn: () => tmdbService.getMovieDetails(id),
      staleTime: Infinity,
    }))
  })

  const titles = {}
  const posters = {}
  results.forEach((result, i) => {
    if (result.data?.data) {
      titles[movieIds[i]] = result.data.data.title
      posters[movieIds[i]] = result.data.data.poster_path
    }
  })

  return { titles, posters }
}