import api from './api'

export const tmdbService = {
  searchMovies: (query, page = 1) =>
    api.get(`/api/tmdb/search`, { params: { query, page } }),

  getMovieDetails: (id) =>
    api.get(`/api/tmdb/movies/${id}`),

  getPopularMovies: (page = 1) =>
    api.get(`/api/tmdb/movies/popular`, { params: { page } }),

  getTrendingMovies: () =>
    api.get(`/api/tmdb/movies/trending`),
getMovieCredits: (id) =>
  api.get(`/api/tmdb/movies/${id}/credits`),

getMovieProviders: (id) =>
  api.get(`/api/tmdb/movies/${id}/providers`),

getSimilarMovies: (id) =>
  api.get(`/api/tmdb/movies/${id}/similar`),

getMovieGenres: () =>
  api.get(`/api/tmdb/movies/genres`),

discoverMovies: (genre, sort, page = 1) =>
  api.get(`/api/tmdb/movies/discover`, { params: { genre, sort, page } }),

// --- TV SHOWS ---
getTrendingTv: () =>
  api.get(`/api/tmdb/tv/trending`),

getTvDetails: (id) =>
  api.get(`/api/tmdb/tv/${id}`),

getTvCredits: (id) =>
  api.get(`/api/tmdb/tv/${id}/credits`),

getTvProviders: (id) =>
  api.get(`/api/tmdb/tv/${id}/providers`),

getSimilarTv: (id) =>
  api.get(`/api/tmdb/tv/${id}/similar`),
}