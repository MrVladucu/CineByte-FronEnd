import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'
import { useMovieTitles } from '../hooks/useMovieTitles'

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

export default function Profile() {
  const { user } = useAuth()
  const { username } = useParams()


  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', username)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: statsData } = useQuery({
    queryKey: ['stats', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', username)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!profileData,
  })

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', username)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!profileData,
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', username)
      if (error) throw error
      return data
    },
    enabled: !!profileData,
  })

  const { data: followersData } = useQuery({
    queryKey: ['followers', username],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', username)
      return count
    },
    enabled: !!profileData,
  })

  const { data: followingData } = useQuery({
    queryKey: ['following', username],
    queryFn: async () => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', username)
      return count
    },
    enabled: !!profileData,
  })

  const navigate = useNavigate()
const movieIds = reviewsData?.map(r => r.tmdb_movie_id) || []
const { titles, posters } = useMovieTitles(movieIds)

  const isOwnProfile = user?.id === username

  const handleFollow = async () => {
    await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: username,
    })
  }

  if (profileLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
          Cargando...
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
          Usuario no encontrado
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ width: '100%', maxWidth: '1024px', margin: '0 auto', padding: '5rem 2rem 0 2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '2.5rem' }}>

          {/* Avatar */}
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0, overflow: 'hidden' }}>
            {profileData.avatar_url ? (
              <img src={profileData.avatar_url} alt={profileData.username} className="w-full h-full object-cover" />
            ) : '👤'}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em' }}>
                {profileData.username}
              </h1>
              {statsData && (
                <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '3px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  NIV. {statsData.level}
                </span>
              )}
            </div>

            {profileData.bio && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '500px', marginBottom: '1rem' }}>
                {profileData.bio}
              </p>
            )}

            {statsData && <XpBar xp={statsData.xp} level={statsData.level} />}

            {!isOwnProfile && (
              <button onClick={handleFollow} style={{
                marginTop: '1rem',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.6rem 1.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}>
                + SEGUIR
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

        {/* Reseñas */}
        <div style={{ marginBottom: '4rem' }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
            RESEÑAS
          </h2>

          {reviewsData?.length === 0 ? (
  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aún no hay reseñas.</p>
) : (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {reviewsData?.map(review => (
      <div
        key={review.id}
        onClick={() => navigate(`/movie/${review.tmdb_movie_id}`)}
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {/* Poster */}
        {posters[review.tmdb_movie_id] && (
          <img
            src={`https://image.tmdb.org/t/p/w92${posters[review.tmdb_movie_id]}`}
            alt=""
            style={{ width: '46px', borderRadius: '3px', flexShrink: 0 }}
          />
        )}

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {titles[review.tmdb_movie_id] || '...'}
              </p>
              <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>★ {review.rating}/10</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
              {new Date(review.created_at).toLocaleDateString('es-ES')}
            </span>
          </div>
          {review.content && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{review.content}</p>
          )}
        </div>
      </div>
    ))}
  </div>
)}
        </div>
      </div>
    </div>
  )
}