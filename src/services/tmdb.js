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

  getSimilarMovies: (id) =>
    api.get(`/api/tmdb/movies/${id}/similar`),

  getMovieGenres: () =>
    api.get(`/api/tmdb/genres`),

  discoverMovies: (genreId, sortBy, page = 1) =>
    api.get(`/api/tmdb/discover`, { params: { genreId, sortBy, page } }),

  getTrendingTv: () =>
    api.get(`/api/tmdb/tv/trending`),

  getTvDetails: (id) =>
    api.get(`/api/tmdb/tv/${id}`),

  getTvCredits: (id) =>
    api.get(`/api/tmdb/tv/${id}/credits`),

  getSimilarTv: (id) =>
    api.get(`/api/tmdb/tv/${id}/similar`),
}