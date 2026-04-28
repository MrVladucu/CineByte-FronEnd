import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MovieCard from "../components/Moviecard";
import { tmdbService } from '../services/tmdb'
import { Carousel } from 'primereact/carousel'
import { Skeleton } from 'primereact/skeleton'
import { Button } from 'primereact/button'

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
            <Skeleton key={i} shape="rectangle" width="100%" height="225px" borderRadius="6px" />
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

  const trendingMovies = trendingData?.data?.results?.slice(0, 10) || []

  const heroItemTemplate = (movie) => {
    const backdropUrl = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
      : null

    return (
      <div style={{ position: 'relative', height: '70vh', overflow: 'hidden' }}>
        {backdropUrl && (
          <img src={backdropUrl} alt={movie.title} style={{ opacity: 0.4, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,10,1) 30%, transparent 70%), linear-gradient(to top, rgba(10,10,10,1) 0%, transparent 50%)'
        }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 3rem 2rem' }}>
            <p style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 500, marginBottom: '0.5rem' }}>
              TENDENCIA ESTA SEMANA
            </p>
            <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1, marginBottom: '1rem', maxWidth: '600px' }}>
              {movie.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '480px' }}>
              {movie.overview?.slice(0, 180)}...
            </p>
            <Button
              label="VER DETALLES"
              onClick={() => navigate(`/movie/${movie.id}`)}
              style={{
                background: 'var(--accent)',
                borderColor: 'var(--accent)',
                padding: '0.7rem 2rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero Carousel */}
      <div style={{ marginTop: '64px' }}>
        {trendingLoading ? (
          <Skeleton width="100%" height="70vh" />
        ) : (
          <Carousel 
            value={trendingMovies} 
            numVisible={1} 
            numScroll={1} 
            itemTemplate={heroItemTemplate} 
            autoplayInterval={5000}
            circular
            showIndicators={true}
            showNavigators={false}
          />
        )}
      </div>

      {/* Secciones */}
      <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <MovieSection title="Tendencias de la semana" queryKey={['trending']} queryFn={tmdbService.getTrendingMovies} />
        <MovieSection title="Populares ahora" queryKey={['popular']} queryFn={() => tmdbService.getPopularMovies(1)} />
      </div>

      <style>{`
        .p-carousel-indicators {
          position: absolute;
          bottom: 1.5rem;
          width: 100%;
          justify-content: center;
          padding: 0;
          margin: 0;
          pointer-events: none;
          z-index: 10;
        }
        .p-carousel-indicator {
          pointer-events: auto;
          margin: 0 0.25rem;
        }
        .p-carousel-indicator button {
          background-color: rgba(255, 255, 255, 0.2) !important;
          width: 1.5rem !important;
          height: 3px !important;
          border-radius: 2px !important;
          border: none !important;
          transition: background-color 0.3s, width 0.3s !important;
        }
        .p-carousel-indicator.p-highlight button {
          background-color: var(--accent) !important;
          width: 2.5rem !important;
        }
        .p-carousel-content {
            position: relative;
        }
        .p-carousel-container {
            position: relative;
        }
        .p-carousel-items-container {
            display: flex;
        }
      `}</style>
    </div>
  )
}