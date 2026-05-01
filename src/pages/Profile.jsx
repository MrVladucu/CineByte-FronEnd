import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { useMovieTitles } from '../hooks/useMovieTitles'
import { tmdbService } from '../services/tmdb'

function StatCard({ value, label }) {
  return (
      <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border)' }}>
        <p style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', color: 'var(--accent)', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{label}</p>
      </div>
  )
}

function XpBar({ xp, level }) {
  const xpForLevel = (lvl) => {
    let req = 100
    for (let i = 1; i < lvl; i++) req *= 2
    return req
  }
  const xpForCurrent = level > 1 ? xpForLevel(level - 1) * 2 - 100 : 0
  const xpForNext = xpForLevel(level)
  const progress = Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100)

  return (
      <div style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>NIVEL {level}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{xp} XP</span>
        </div>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
        </div>
      </div>
  )
}

function MovieGrid({ items, emptyText }) {
  const { data, isLoading } = useQuery({
    queryKey: ['movie-grid', items],
    queryFn: async () => {
      const results = await Promise.all(
          items.map(item => (item.type === 'tv' ? tmdbService.getTvDetails(item.id) : tmdbService.getMovieDetails(item.id)).catch(() => null))
      )
      return results.filter(Boolean).map((r, i) => ({ ...r.data, media_type: items[i].type }))
    },
    enabled: items.length > 0,
  })

  const navigate = useNavigate()

  if (items.length === 0) return (
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{emptyText}</p>
  )

  if (isLoading) return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
        {items.map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', aspectRatio: '2/3' }} />
        ))}
      </div>
  )

  return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
        {data?.map(media => media && (
            <div key={`${media.media_type}-${media.id}`} onClick={() => navigate(`/${media.media_type}/${media.id}`)}
                 style={{ cursor: 'pointer' }}
                 onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                 onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '2/3', background: 'var(--bg-elevated)' }}>
                {media.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${media.poster_path}`} alt={media.title || media.name}
                         style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Sin imagen</div>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {media.title || media.name}
              </p>
            </div>
        ))}
      </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const { username } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('reseñas')

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', username).single()
      if (error) throw error
      return data
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['stats', username],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', username).single()
      if (error) throw error
      return data
    },
    enabled: !!profileData,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', username],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').eq('user_id', username).order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!profileData,
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', username],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', username)
      if (error) throw error
      return data
    },
    enabled: !!profileData,
  })

  const { data: followersData } = useQuery({
    queryKey: ['followers', username],
    queryFn: async () => {
      const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', username)
      return count
    },
    enabled: !!profileData,
  })

  const { data: followingData } = useQuery({
    queryKey: ['following', username],
    queryFn: async () => {
      const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', username)
      return count
    },
    enabled: !!profileData,
  })

  const { data: watchlistData } = useQuery({
    queryKey: ['profile-watchlist', username],
    queryFn: async () => {
      const { data } = await supabase
          .from('lists')
          .select('id, list_movies(tmdb_movie_id)')
          .eq('user_id', username)
          .eq('name', 'Watchlist')
          .maybeSingle()
      return data
    },
    enabled: !!profileData,
  })

  const { data: favoritesData } = useQuery({
    queryKey: ['profile-favorites', username],
    queryFn: async () => {
      const { data } = await supabase
          .from('favorite_movies')
          .select('tmdb_movie_id, media_type')
          .eq('user_id', username)
          .order('added_at', { ascending: false })
      return data
    },
    enabled: !!profileData,
  })

  const movieIds = reviewsData?.map(r => ({ id: r.tmdb_movie_id, type: r.media_type || 'movie' })) || []
  const { titles, posters } = useMovieTitles(movieIds)
  const watchlistIds = watchlistData?.list_movies?.map(m => ({ id: m.tmdb_movie_id, type: m.media_type || 'movie' })) || []
  const favoriteIds = favoritesData?.map(f => ({ id: f.tmdb_movie_id, type: f.media_type || 'movie' })) || []
  const isOwnProfile = user?.id === username
  const topFavoriteId = profileData?.background_movie_id
  const topFavoriteType = profileData?.background_media_type || 'movie'

  const { data: topFavoriteMovie } = useQuery({
    queryKey: ['movie-details', topFavoriteType, topFavoriteId],
    queryFn: async () => {
      if (!topFavoriteId) return null
      const res = await (topFavoriteType === 'tv' ? tmdbService.getTvDetails(topFavoriteId) : tmdbService.getMovieDetails(topFavoriteId))
      return res.data
    },
    enabled: !!topFavoriteId,
  })

  const handleFollow = async () => {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: username })
  }

  const tabs = [
    { id: 'reseñas', label: `Reseñas (${reviewsData?.length || 0})` },
    { id: 'watchlist', label: `Watchlist (${watchlistIds.length})` },
    { id: 'favoritas', label: `Favoritas (${favoriteIds.length})` },
  ]

  if (profileLoading) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <Navbar />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>Cargando...</div>
        </div>
    )
  }

  if (!profileData) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <Navbar />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>Usuario no encontrado</div>
        </div>
    )
  }

  return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
        {topFavoriteMovie?.backdrop_path && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65vh', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
                <img 
                    src={`https://image.tmdb.org/t/p/original${topFavoriteMovie.backdrop_path}`} 
                    alt="" 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        opacity: 0.35, 
                        maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)', 
                        WebkitMaskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)' 
                    }} 
                />
            </div>
        )}

        <Navbar />

        <div style={{ width: '100%', maxWidth: '1024px', margin: '0 auto', padding: '5rem 2rem 4rem 2rem', position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0, overflow: 'hidden' }}>
              {profileData.avatar_url ? <img src={profileData.avatar_url} alt={profileData.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em' }}>{profileData.username}</h1>
                {statsData && (
                    <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '3px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  NIV. {statsData.level}
                </span>
                )}
              </div>
              {profileData.bio && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '500px', marginBottom: '1rem' }}>{profileData.bio}</p>
              )}
              {statsData && <XpBar xp={statsData.xp} level={statsData.level} />}
              {!isOwnProfile ? (
                  <button onClick={handleFollow} style={{ marginTop: '1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem 1.5rem', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    + SEGUIR
                  </button>
              ) : (
                  <button onClick={() => navigate('/profile/edit')} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px', padding: '0.4rem 1rem', fontSize: '0.8rem', letterSpacing: '0.1em', cursor: 'pointer' }}>
                    ✏ EDITAR PERFIL
                  </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
            <StatCard value={reviewsData?.length || 0} label="Reseñas" />
            <StatCard value={followersData || 0} label="Seguidores" />
            <StatCard value={followingData || 0} label="Siguiendo" />
            <StatCard value={statsData?.xp || 0} label="XP Total" />
            <StatCard value={statsData?.streak || 0} label="Racha" />
          </div>

          {/* Trofeos */}
          {achievementsData?.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
                  TROFEOS
                </h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {achievementsData.map(ua => (
                      <div key={ua.achievement_id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{ua.achievements.icon}</span>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ua.achievements.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ua.achievements.description}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '2rem', display: 'flex', gap: '0' }}>
            {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  background: 'none', border: 'none', color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: activeTab === tab.id ? 600 : 400,
                  letterSpacing: '0.05em', cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.2s',
                }}>
                  {tab.label}
                </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ marginBottom: '4rem' }}>
            {activeTab === 'reseñas' && (
                reviewsData?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no hay reseñas.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {reviewsData?.map(review => {
                          const mediaType = review.media_type || 'movie'
                          const idKey = `${mediaType}-${review.tmdb_movie_id}`
                          return (
                          <div key={review.id} onClick={() => navigate(`/${mediaType}/${review.tmdb_movie_id}`)}
                               style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'border-color 0.2s' }}
                               onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                               onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            {posters[idKey] && (
                                <img src={`https://image.tmdb.org/t/p/w92${posters[idKey]}`} alt=""
                                     style={{ width: '46px', borderRadius: '3px', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div>
                                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{titles[idKey] || '...'}</p>
                                  <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>★ {review.rating}/10</span>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                          {new Date(review.created_at).toLocaleDateString('es-ES')}
                        </span>
                              </div>
                              {review.content && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{review.content}</p>}
                            </div>
                          </div>
                      )})}
                    </div>
                )
            )}

            {activeTab === 'watchlist' && (
                <MovieGrid items={watchlistIds} emptyText="La watchlist está vacía." />
            )}

            {activeTab === 'favoritas' && (
                <MovieGrid items={favoriteIds} emptyText="No hay películas favoritas aún." />
            )}
          </div>
        </div>
      </div>
  )
}