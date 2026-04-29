import { Link } from 'react-router-dom'

export default function MovieCard({ movie, type = 'movie' }) {
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null

  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const mediaType = movie.media_type || type;

  return (
    <Link to={`/${mediaType}/${movie.id}`} className="group block">
      <div style={{ borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        className="relative aspect-[2/3] transition-all duration-300 group-hover:scale-[1.05] group-hover:shadow-[0_0_20px_rgba(229,27,35,0.4)] group-hover:border-[var(--accent)]">

        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Sin imagen
          </div>
        )}

        {/* Overlay on hover */}
        <div style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%)' }}
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p style={{ fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: '0.05em' }}
            className="text-white leading-tight">
            {title}
          </p>
          {movie.vote_average > 0 && (
            <p style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500 }}>
              ★ {movie.vote_average.toFixed(1)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 px-1">
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)' }}
          className="truncate transition-colors duration-300 group-hover:text-[var(--accent)]">
          {title}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {releaseDate?.split('-')[0]}
        </p>
      </div>
    </Link>
  )
}