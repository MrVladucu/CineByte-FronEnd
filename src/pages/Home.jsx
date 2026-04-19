import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MovieCard from "../components/Moviecard";
import { tmdbService } from '../services/tmdb'

function MovieSection({ title, queryKey, queryFn }) {
  const { data, isLoading } = useQuery({ queryKey, queryFn })
  const movies = data?.data?.results || []

  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
        {title}
      </h2>
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', aspectRatio: '2/3' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {movies.slice(0, 12).map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: tmdbService.getTrendingMovies,
  })

  const featured = trendingData?.data?.results?.[0]
  const featuredBackdrop = featured?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${featured.backdrop_path}`
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero */}
      <div style={{ position: 'relative', height: '70vh', marginTop: '64px', overflow: 'hidden' }}>
        {featuredBackdrop && (
          <img src={featuredBackdrop} alt={featured?.title} className="w-full h-full object-cover" style={{ opacity: 0.4, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,10,1) 30%, transparent 70%), linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 50%)'
        }} />

        {!trendingLoading && featured && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 3rem 2rem' }}>
              <p style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 500, marginBottom: '0.5rem' }}>
                TENDENCIA ESTA SEMANA
              </p>
              <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1, marginBottom: '1rem', maxWidth: '600px' }}>
                {featured.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '480px' }}>
                {featured.overview?.slice(0, 180)}...
              </p>
              <button
                onClick={() => navigate(`/movie/${featured.id}`)}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  padding: '0.7rem 2rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                }}>
                VER DETALLES
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secciones */}
      <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <MovieSection title="Tendencias de la semana" queryKey={['trending']} queryFn={tmdbService.getTrendingMovies} />
        <MovieSection title="Populares ahora" queryKey={['popular']} queryFn={() => tmdbService.getPopularMovies(1)} />
      </div>
    </div>
  )
}