import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function MovieCard({ movie, type = 'movie' }) {
  const [isHovered, setIsHovered] = useState(false)

  const posterUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null

  const title = movie.title || movie.name
  const releaseDate = movie.release_date || movie.first_air_date
  const mediaType = movie.media_type || type

  return (
      <div style={{ textDecoration: 'none' }}>
        <Link
            to={`/${mediaType}/${movie.id}`}
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
                fontSize: '0.75rem'
              }}>
                Sin imagen
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
            <p style={{
              fontFamily: 'Bebas Neue',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              color: 'white',
              lineHeight: 1.2,
              marginBottom: '0.25rem',
            }}>
              {title}
            </p>
            {movie.vote_average > 0 && (
                <p style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, margin: 0 }}>
                  ★ {movie.vote_average.toFixed(1)}
                </p>
            )}
          </div>
        </Link>

        <div style={{ marginTop: '0.5rem', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: isHovered ? 'var(--accent)' : 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.3s',
          }}>
            {title}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            {releaseDate?.split('-')[0]}
          </p>
        </div>
      </div>
  )
}