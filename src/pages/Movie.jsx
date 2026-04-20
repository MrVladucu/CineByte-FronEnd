import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ReviewModal from '../components/ReviewModal'
import { tmdbService } from '../services/tmdb'

export default function Movie() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showReviewModal, setShowReviewModal] = useState(false)

  const { data: movieData, isLoading: movieLoading } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => tmdbService.getMovieDetails(id),
  })

  const { data: creditsData } = useQuery({
    queryKey: ['credits', id],
    queryFn: () => tmdbService.getMovieCredits(id),
  })

  const { data: similarData } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => tmdbService.getSimilarMovies(id),
  })

  const { data: watchlistData } = useQuery({
    queryKey: ['watchlist', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lists')
        .select('id, list_movies(tmdb_movie_id)')
        .eq('user_id', user.id)
        .eq('name', 'Watchlist')
        .maybeSingle()
      return data
    },
    enabled: !!user,
  })

  const { data: favoriteData } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('favorite_movies')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('tmdb_movie_id', parseInt(id))
      return data
    },
    enabled: !!user,
  })

  const { data: reviewsData, refetch: refetchReviews } = useQuery({
  queryKey: ['movie-reviews', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_user_id_fkey(username, avatar_url)')
      .eq('tmdb_movie_id', parseInt(id))
      .order('created_at', { ascending: false })
    console.log('reviews data:', data, 'error:', error)
    return data
  },
})

  const { data: userReviewData } = useQuery({
    queryKey: ['user-review', id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('tmdb_movie_id', parseInt(id))
        .eq('user_id', user.id)
      return data
    },
    enabled: !!user,
  })

  const hasReviewed = userReviewData && userReviewData.length > 0
  const isFavorite = favoriteData && favoriteData.length > 0
  const isInWatchlist = watchlistData?.list_movies?.some(m => m.tmdb_movie_id === parseInt(id))

  const toggleWatchlist = async () => {
    if (!user) return
    let listId = watchlistData?.id
    if (!listId) {
      const { data } = await supabase
        .from('lists')
        .insert({ user_id: user.id, name: 'Watchlist', is_public: false })
        .select()
        .single()
      listId = data.id
    }
    if (isInWatchlist) {
      await supabase.from('list_movies').delete()
        .eq('list_id', listId).eq('tmdb_movie_id', parseInt(id))
    } else {
      await supabase.from('list_movies').insert({ list_id: listId, tmdb_movie_id: parseInt(id) })
    }
    queryClient.invalidateQueries(['watchlist', id, user?.id])
  }

  const toggleFavorite = async () => {
    if (!user) return
    if (isFavorite) {
      await supabase.from('favorite_movies').delete()
        .eq('user_id', user.id).eq('tmdb_movie_id', parseInt(id))
    } else {
      await supabase.from('favorite_movies').insert({ user_id: user.id, tmdb_movie_id: parseInt(id) })
    }
    queryClient.invalidateQueries(['favorite', id, user?.id])
  }

  const movie = movieData?.data
  const credits = creditsData?.data
  const similar = similarData?.data?.results?.slice(0, 6) || []
  const director = credits?.crew?.find(p => p.job === 'Director')
  const cast = credits?.cast?.slice(0, 8) || []

  if (movieLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Navbar />
        <div style={{ color: 'var(--text-muted)' }}>Cargando...</div>
      </div>
    )
  }

  if (!movie) return null

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero backdrop */}
      <div style={{ position: 'relative', height: '60vh', marginTop: '64px', overflow: 'hidden' }}>
        {backdropUrl && (
          <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" style={{ opacity: 0.3 }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 20%, transparent 80%)' }} />
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', marginTop: '-12rem', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Poster */}
          {posterUrl && (
            <div style={{ flexShrink: 0, width: '220px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid var(--border)' }}>
              <img src={posterUrl} alt={movie.title} className="w-full" />
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: '280px', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {movie.genres?.map(g => (
                <span key={g.id} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.7rem',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}>
                  {g.name}
                </span>
              ))}
            </div>

            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1, marginBottom: '0.5rem' }}>
              {movie.title}
            </h1>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {movie.vote_average > 0 && (
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>
                  ★ {movie.vote_average.toFixed(1)}
                </span>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {movie.release_date?.split('-')[0]}
              </span>
              {movie.runtime > 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              {director && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Dir. <span style={{ color: 'var(--text)' }}>{director.name}</span>
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', maxWidth: '600px', marginBottom: '2rem' }}>
              {movie.overview}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowReviewModal(true)}
                disabled={hasReviewed}
                style={{
                  background: hasReviewed ? 'var(--bg-elevated)' : 'var(--accent)',
                  color: hasReviewed ? 'var(--text-muted)' : 'white',
                  border: hasReviewed ? '1px solid var(--border)' : 'none',
                  borderRadius: '4px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: hasReviewed ? 'not-allowed' : 'pointer',
                }}>
                {hasReviewed ? '✓ Ya reseñada' : '★ Escribir reseña'}
              </button>
              <button
                onClick={toggleWatchlist}
                style={{
                  background: isInWatchlist ? 'var(--bg-elevated)' : 'transparent',
                  color: isInWatchlist ? 'var(--accent)' : 'var(--text)',
                  border: `1px solid ${isInWatchlist ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>
                {isInWatchlist ? '✓ En Watchlist' : '+ Watchlist'}
              </button>
              <button
                onClick={toggleFavorite}
                style={{
                  background: isFavorite ? 'var(--bg-elevated)' : 'transparent',
                  color: isFavorite ? 'var(--accent)' : 'var(--text)',
                  border: `1px solid ${isFavorite ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '4px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}>
                {isFavorite ? '♥ Favorita' : '♡ Favorita'}
              </button>
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
              REPARTO
            </h2>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
              {cast.map(person => (
                <div key={person.id} style={{ flexShrink: 0, width: '100px', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    {person.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ fontSize: '1.5rem' }}>👤</div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.3 }}>{person.name}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reseñas */}
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
            RESEÑAS ({reviewsData?.length || 0})
          </h2>
          {!reviewsData?.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sé el primero en reseñar esta película.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviewsData.map(review => (
                <div key={review.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', overflow: 'hidden' }}>
                        {review.profiles?.avatar_url
                          ? <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          : '👤'}
                      </div>
                      <span
                        onClick={() => navigate(`/profile/${review.user_id}`)}
                        style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                      >
                        {review.profiles?.username || 'Usuario'}
                      </span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>★ {review.rating}/10</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(review.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  {review.content && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div style={{ marginTop: '3rem', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
              PELÍCULAS SIMILARES
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {similar.map(movie => (
                <div key={movie.id} onClick={() => navigate(`/movie/${movie.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }} className="aspect-[2/3]">
                    {movie.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sin imagen</div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500 }} className="truncate">{movie.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showReviewModal && (
        <ReviewModal
          movie={movie}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            refetchReviews()
            queryClient.invalidateQueries(['user-review', id, user?.id])
          }}
        />
      )}
    </div>
  )
}