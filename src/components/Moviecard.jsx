import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function MovieCard({ movie, type = 'movie' }) {
  const [isHovered, setIsHovered] = useState(false)

  const mediaType = movie.media_type || type
  const isPerson = mediaType === 'person'

  const posterUrl = isPerson 
      ? (movie.profile_path ? `https://image.tmdb.org/t/p/w500${movie.profile_path}` : null)
      : (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null)

  const title = movie.title || movie.name
  const releaseDate = isPerson ? movie.known_for_department : (movie.release_date || movie.first_air_date)
  const linkPath = isPerson ? `/actor/${movie.id}` : `/${mediaType}/${movie.id}`

  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minWidth: 0 }}>
        <Link
            to={linkPath}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              display: 'block',
              textDecoration: 'none',
              borderRadius: '6px',
              overflow: 'hidden',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              aspectRatio: '2/3',
              position: 'relative',
              transition: 'all 0.3s',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isHovered ? '0 0 20px rgba(229,27,35,0.4)' : 'none',
              borderColor: isHovered ? 'var(--accent)' : 'var(--border)',
              width: '100%',
            }}>

          {posterUrl ? (
              <img
                  src={posterUrl}
                  alt={title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
              />
          ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {isPerson ? '👤' : 'Sin imagen'}
              </div>
          )}

          {/* Overlay */}
          <div style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%)',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0.75rem',
            pointerEvents: 'none',
          }}>
            <p style={{ fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: '0.05em', color: 'white', lineHeight: 1.2, marginBottom: '0.25rem' }}>
              {title}
            </p>
            {!isPerson && movie.vote_average > 0 && (
                <p style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
                  ★ {movie.vote_average.toFixed(1)}
                </p>
            )}
          </div>
        </Link>

        {/* Contenedor de texto: Altura FIJA de 3rem para que todas las columnas midan igual */}
        <div style={{ marginTop: '0.75rem', padding: '0 0.25rem', height: '3rem', width: '100%', overflow: 'hidden' }}>
          <p style={{
            fontSize: '0.85rem',
            fontWeight: 500,
            margin: '0 0 0.2rem 0',
            color: isHovered ? 'var(--accent)' : 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.3s',
            width: '100%'
          }}>
            {title}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {!isPerson ? (releaseDate?.split('-')[0] || '----') : releaseDate || '----'}
          </p>
        </div>
      </div>
  )
}