import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MovieCard from "../components/Moviecard"
import { tmdbService } from '../services/tmdb'
import { Carousel } from 'primereact/carousel'
import { Skeleton } from 'primereact/skeleton'
import { Button } from 'primereact/button'

function MovieSection({ title, queryKey, queryFn, type = 'movie' }) {
    const { data, isLoading } = useQuery({ queryKey, queryFn })
    const movies = data?.data?.results || []

    const responsiveOptions = [
        { breakpoint: '1400px', numVisible: 6, numScroll: 3 },
        { breakpoint: '1200px', numVisible: 5, numScroll: 2 },
        { breakpoint: '992px', numVisible: 4, numScroll: 2 },
        { breakpoint: '768px', numVisible: 3, numScroll: 1 },
        { breakpoint: '576px', numVisible: 2, numScroll: 1 },
    ]

    const movieTemplate = (movie) => {
        return (
            <div style={{ padding: '20px 0.5rem', width: '100%', height: '100%', minWidth: 0 }}>
                <MovieCard movie={movie} type={type} />
            </div>
        )
    }

    return (
        <section style={{ marginBottom: '3rem', position: 'relative' }}>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)' }}>
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
                <Carousel
                    className="section-carousel" // AÑADIDO: Clase esencial para el CSS
                    value={movies}
                    numVisible={6}
                    numScroll={3}
                    responsiveOptions={responsiveOptions}
                    itemTemplate={movieTemplate}
                    circular={false}
                />
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

        const title = movie.title || movie.name
        const mediaType = movie.media_type || 'movie'

        return (
            <div style={{ position: 'relative', height: '70vh', overflow: 'hidden' }}>
                {backdropUrl && (
                    <img src={backdropUrl} alt={title} style={{ opacity: 0.4, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, var(--bg) 30%, transparent 70%), linear-gradient(to top, var(--bg) 0%, transparent 50%)'
                }} />

                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 3rem 2rem' }}>
                        <p style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 500, marginBottom: '0.5rem' }}>
                            TENDENCIA ESTA SEMANA
                        </p>
                        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1, marginBottom: '1rem', maxWidth: '600px' }}>
                            {title}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: '480px' }}>
                            {movie.overview?.slice(0, 180)}...
                        </p>
                        <Button
                            label="VER DETALLES"
                            onClick={() => navigate(`/${mediaType}/${movie.id}`)}
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
                        className="hero-carousel"
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
            <div style={{ width: '100%', maxWidth: '1550px', margin: '0 auto', padding: '0 2rem' }}>
                <MovieSection title="Películas en tendencia" queryKey={['trending-movies']} queryFn={tmdbService.getTrendingMovies} type="movie" />
            </div>
            <div style={{ width: '100%', maxWidth: '1550px', margin: '0 auto', padding: '0 2rem' }}>
                <MovieSection title="Series en tendencia" queryKey={['trending-tv']} queryFn={tmdbService.getTrendingTv} type="tv" />
            </div>
            <div style={{ width: '100%', maxWidth: '1550px', margin: '0 auto', padding: '0 2rem' }}>
                <MovieSection title="Populares ahora" queryKey={['popular-movies']} queryFn={() => tmdbService.getPopularMovies(1)} type="movie" />
            </div>

            <style>{`
        /* --- HERO CAROUSEL --- */
        .hero-carousel .p-carousel-indicators {
          position: absolute;
          bottom: 1.5rem;
          width: 100%;
          justify-content: center;
          padding: 0;
          margin: 0;
          pointer-events: none;
          z-index: 10;
        }
        .hero-carousel .p-carousel-indicator {
          pointer-events: auto;
          margin: 0 0.25rem;
        }
        .hero-carousel .p-carousel-indicator button {
          background-color: rgba(255, 255, 255, 0.2) !important;
          width: 1.5rem !important;
          height: 3px !important;
          border-radius: 2px !important;
          border: none !important;
          transition: background-color 0.3s, width 0.3s !important;
        }
        .hero-carousel .p-carousel-indicator.p-highlight button {
          background-color: var(--accent) !important;
          width: 2.5rem !important;
        }
        .hero-carousel .p-carousel-content,
        .hero-carousel .p-carousel-container {
          position: relative;
        }
        
        .hero-carousel .p-carousel-items-container {
          display: grid !important;
          transform: none !important;
          transition: none !important;
        }
        .hero-carousel .p-carousel-item {
          grid-area: 1 / 1;
          opacity: 0;
          transition: opacity 1.2s ease-in-out;
          pointer-events: none;
        }
        .hero-carousel .p-carousel-item.p-carousel-item-active {
          opacity: 1;
          pointer-events: auto;
          z-index: 1;
        }

        /* --- SECTION CAROUSEL (MALLA PERFECTA) --- */
        
        /* Ocultar barra gris de scroll horizontal */
        .section-carousel .p-carousel-content {
            overflow: hidden !important;
        }
        
        /* Que PrimeReact se encargue de los anchos, nosotros solo le pedimos que estire la altura */
        .section-carousel .p-carousel-items-container {
            align-items: stretch !important;
        }
        .section-carousel .p-carousel-item {
            min-width: 0 !important;
        }

        /* Estilos y Posición de los botones */
        .section-carousel .p-carousel-prev,
        .section-carousel .p-carousel-next {
          background: rgba(229, 27, 35, 0.8) !important;
          color: white !important;
          border: none !important;
          width: 2.5rem !important;
          height: 2.5rem !important;
          border-radius: 50% !important;
          transition: all 0.2s !important;
          position: absolute !important;
          top: calc(50% - 1.5rem) !important;
          transform: translateY(-50%) !important;
          z-index: 10 !important;
          margin: 0 !important;
        }
        .section-carousel .p-carousel-prev { left: -1.25rem !important; }
        .section-carousel .p-carousel-next { right: -1.25rem !important; }
        
        .section-carousel .p-carousel-prev:hover,
        .section-carousel .p-carousel-next:hover {
          background: var(--accent) !important;
          transform: translateY(-50%) scale(1.1) !important;
        }
        .section-carousel .p-carousel-prev:disabled,
        .section-carousel .p-carousel-next:disabled {
          opacity: 0.3 !important;
        }
      `}</style>
        </div>
    )
}