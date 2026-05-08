import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import MovieCard from "../components/Moviecard"
import { tmdbService } from '../services/tmdb'
import { getMovieNews } from '../services/api'
import { Carousel } from 'primereact/carousel'
import { Skeleton } from 'primereact/skeleton'
import { Button } from 'primereact/button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMovieTitles } from '../hooks/useMovieTitles'
import { motion, useScroll, useTransform } from 'framer-motion'

function ScrollReveal({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}

function NewsSection() {
    const { data, isLoading } = useQuery({
        queryKey: ['movie-news'],
        queryFn: getMovieNews
    })

    const articles = data?.data?.articles || []

    if (isLoading) {
        return (
            <ScrollReveal>
                <section style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)' }}>
                        <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
                        NOTICIAS DE CINE
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {[0, 1, 2, 3].map(i => (
                            <Skeleton key={i} shape="rectangle" width="100%" height="200px" borderRadius="8px" />
                        ))}
                    </div>
                </section>
            </ScrollReveal>
        )
    }

    if (articles.length === 0) return null;

    return (
        <ScrollReveal>
            <section style={{ marginBottom: '4rem' }}>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)' }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
                    NOTICIAS DE CINE
                </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {articles.slice(0, 8).map((article, idx) => (
                    <a key={idx} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s', height: '100%', display: 'flex', flexDirection: 'column' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'var(--accent)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                            <div style={{ width: '100%', height: '160px', background: 'var(--border)', position: 'relative' }}>
                                {article.image && (
                                    <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                )}
                            </div>
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                    {article.source?.name || 'NOTICIA'} · {new Date(article.publishedAt).toLocaleDateString()}
                                </p>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.75rem 0', lineHeight: 1.4, color: 'var(--text)' }}>
                                    {article.title}
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                    {article.description}
                                </p>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </section>
        </ScrollReveal>
    )
}

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
        <ScrollReveal>
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
                    className="section-carousel"
                    value={movies}
                    numVisible={6}
                    numScroll={3}
                    responsiveOptions={responsiveOptions}
                    itemTemplate={movieTemplate}
                    circular={false}
                />
            )}
        </section>
        </ScrollReveal>
    )
}

function FriendsReviews() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['friends-reviews', user?.id],
        queryFn: async () => {
            if (!user) return []
            const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
            const followingIds = follows?.map(f => f.following_id) || []
            if (followingIds.length === 0) return []

            const { data } = await supabase
                .from('reviews')
                .select('id, rating, content, created_at, tmdb_movie_id, media_type, profiles!reviews_user_id_fkey(username, id)')
                .in('user_id', followingIds)
                .order('created_at', { ascending: false })
                .limit(5)
            return data || []
        },
        enabled: !!user
    })

    const movieIds = reviews?.map(r => ({ id: r.tmdb_movie_id, type: r.media_type || 'movie' })) || []
    const { titles, posters } = useMovieTitles(movieIds)

    if (!user || isLoading || !reviews || reviews.length === 0) return null

    return (
        <ScrollReveal>
        <section style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text)' }}>
                <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
                RESEÑAS RECIENTES DE AMIGOS
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {reviews.map(review => {
                    const mediaType = review.media_type || 'movie'
                    const idKey = `${mediaType}-${review.tmdb_movie_id}`
                    return (
                        <div key={review.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            {posters[idKey] ? (
                                <img 
                                    src={`https://image.tmdb.org/t/p/w92${posters[idKey]}`} 
                                    alt="" 
                                    style={{ width: '60px', borderRadius: '4px', flexShrink: 0, cursor: 'pointer' }} 
                                    onClick={() => navigate(`/${mediaType}/${review.tmdb_movie_id}`)}
                                />
                            ) : (
                                <div style={{ width: '60px', height: '90px', background: 'var(--border)', borderRadius: '4px', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }} onClick={() => navigate(`/${mediaType}/${review.tmdb_movie_id}`)}>
                                        {titles[idKey] || '...'}
                                    </p>
                                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0, marginLeft: '0.5rem' }}>★ {review.rating}</span>
                                </div>
                                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    por <Link to={`/profile/${review.profiles?.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 500 }}>{review.profiles?.username}</Link>
                                    {' · '}{new Date(review.created_at).toLocaleDateString()}
                                </p>
                                {review.content && (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        "{review.content}"
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
        </ScrollReveal>
    )
}

function HeroItem({ movie, navigate }) {
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 800], [0, 200])
    
    const backdropUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null

    const title = movie.title || movie.name
    const mediaType = movie.media_type || 'movie'

    return (
        <div style={{ position: 'relative', height: '75vh', overflow: 'hidden' }}>
            {backdropUrl && (
                <motion.img 
                    src={backdropUrl} 
                    alt={title} 
                    style={{ y, opacity: 0.5, width: '100%', height: '120%', objectFit: 'cover', objectPosition: 'top', position: 'absolute', top: '-10%', left: 0 }} 
                />
            )}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, var(--bg) 30%, transparent 80%), linear-gradient(to top, var(--bg) 0%, transparent 60%)'
            }} />

            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: '1530px', margin: '3rem auto', padding: '0 2rem 5rem 2rem' }}>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 600, marginBottom: '0.75rem' }}
                    >
                        TENDENCIA ESTA SEMANA
                    </motion.p>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(3rem, 7vw, 6rem)', lineHeight: 1, marginBottom: '1rem', maxWidth: '800px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                    >
                        {title}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '500px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                    >
                        {movie.overview?.slice(0, 180)}...
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Button
                            label="VER DETALLES"
                            icon="pi pi-play"
                            onClick={() => navigate(`/${mediaType}/${movie.id}`)}
                            style={{
                                background: 'var(--accent)',
                                borderColor: 'var(--accent)',
                                padding: '0.8rem 2.5rem',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                letterSpacing: '0.1em',
                                boxShadow: '0 4px 15px rgba(229, 27, 35, 0.4)',
                                borderRadius: '30px'
                            }}
                            className="p-button-rounded"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
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
        return <HeroItem movie={movie} navigate={navigate} />
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            {/* Hero Carousel */}
            <div style={{ marginTop: '0px' }}>
                {trendingLoading ? (
                    <Skeleton width="100%" height="75vh" />
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
            <div style={{ width: '100%', maxWidth: '1550px', margin: '0 auto', padding: '0 2rem', marginTop: '2rem' }}>
                <FriendsReviews />
                <MovieSection title="Películas en tendencia" queryKey={['trending-movies']} queryFn={tmdbService.getTrendingMovies} type="movie" />
                <MovieSection title="Series en tendencia" queryKey={['trending-tv']} queryFn={tmdbService.getTrendingTv} type="tv" />
                <MovieSection title="Populares ahora" queryKey={['popular-movies']} queryFn={() => tmdbService.getPopularMovies(1)} type="movie" />
                <NewsSection />
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