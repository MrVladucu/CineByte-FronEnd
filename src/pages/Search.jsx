import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import MovieCard from '../components/Moviecard'
import { tmdbService } from '../services/tmdb'
import { motion } from 'framer-motion'

export default function Search() {
    const [searchParams] = useSearchParams()
    const queryParam = searchParams.get('q') || ''
    const [search, setSearch] = useState(queryParam)
    const [aiQuery, setAiQuery] = useState('')
    const [isAiMode, setIsAiMode] = useState(false)
    const [page, setPage] = useState(1)
    const [allMovies, setAllMovies] = useState([])
    const [hasMore, setHasMore] = useState(true)
    const loaderRef = useRef(null)

    useEffect(() => {
        setSearch(queryParam)
        setPage(1)
        setAllMovies([])
        setHasMore(true)
    }, [queryParam])

    const isSearching = search.trim().length > 0

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['search-page', isAiMode ? aiQuery : search, page, isAiMode],
        queryFn: () => {
            if (isAiMode && aiQuery) return tmdbService.aiSearch(aiQuery)
            return isSearching
                ? tmdbService.searchMovies(search, page)
                : tmdbService.discoverMovies('', 'popularity.desc', page)
        },
        enabled: isAiMode ? !!aiQuery : true,
    })

    useEffect(() => {
        const results = data?.data?.results || []
        const totalPages = data?.data?.total_pages || 1
        if (results.length > 0) {
            setAllMovies(prev => (page === 1 || isAiMode) ? results : [...prev, ...results])
            setHasMore(!isAiMode && page < Math.min(totalPages, 100))
        } else if (page === 1) {
            setAllMovies([])
        }
    }, [data, isAiMode, page])

    const handleAiToggle = () => {
        setIsAiMode(!isAiMode)
        setAiQuery('')
        setPage(1)
        setAllMovies([])
    }

    const handleAiSubmit = (e) => {
        e.preventDefault()
        if (!search.trim()) return
        setAiQuery(search)
        setPage(1)
        setAllMovies([])
    }

    const loadMore = useCallback(() => {
        if (!isFetching && hasMore && !isAiMode) {
            setPage(p => p + 1)
        }
    }, [isFetching, hasMore, isAiMode])

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting) loadMore() },
            { threshold: 0.1 }
        )
        if (loaderRef.current) observer.observe(loaderRef.current)
        return () => observer.disconnect()
    }, [loadMore])

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '5rem 2rem 4rem 2rem' }}>

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}
                >
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.08em', margin: 0, flexShrink: 1, minWidth: 'fit-content' }}>
                        {isAiMode
                            ? (aiQuery ? `IA: "${aiQuery.toUpperCase()}"` : 'BÚSQUEDA POR VIBE (IA)')
                            : (isSearching ? `RESULTADOS PARA "${search.toUpperCase()}"` : 'EXPLORAR PELÍCULAS')}
                    </h1>

                    <button
                        onClick={handleAiToggle}
                        style={{
                            background: isAiMode ? 'var(--accent)' : 'var(--bg-elevated)',
                            color: isAiMode ? 'white' : 'var(--text-muted)',
                            border: '1px solid var(--border)',
                            borderRadius: '20px',
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease',
                            flexShrink: 0,
                        }}>
                        <i className={`pi ${isAiMode ? 'pi-sparkles' : 'pi-search'}`} />
                        {isAiMode ? 'MODO IA ACTIVADO' : 'ACTIVAR BÚSQUEDA IA'}
                    </button>
                </motion.div>

                {/* AI Search box */}
                {isAiMode && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ marginBottom: '3rem', background: 'rgba(229,27,35,0.05)', border: '1px solid rgba(229,27,35,0.2)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}
                    >
                        <p style={{ color: 'var(--text)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                            Describe qué tipo de película buscas hoy...
                        </p>
                        <form onSubmit={handleAiSubmit} style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Ej: Película de acción de los 80 con mucha lluvia y ambientación cyberpunk"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'var(--bg-card)',
                                    border: '2px solid var(--border)',
                                    borderRadius: '30px',
                                    padding: '1rem 1.5rem',
                                    paddingRight: '4rem',
                                    color: 'var(--text)',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.3s',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'var(--accent)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                }}>
                                →
                            </button>
                        </form>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                            Gemini analizará tu petición para encontrar los mejores resultados en TMDB.
                        </p>

                        {/* Loading state IA */}
                        {isFetching && aiQuery && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: '6px', height: '6px', borderRadius: '50%',
                                            background: 'var(--accent)',
                                            animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                                Analizando tu búsqueda con IA...
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Results */}
                {allMovies.length === 0 && isLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', aspectRatio: '2/3' }} />
                        ))}
                    </div>
                ) : allMovies.length === 0 && (isAiMode ? !!aiQuery : true) ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}
                    >
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
                        <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.05em' }}>
                            {isAiMode && !aiQuery ? 'DESCRIBE QUÉ QUIERES VER' : 'NO SE ENCONTRARON RESULTADOS'}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}
                        >
                            {allMovies.map((movie, i) => (
                                <motion.div 
                                    key={`${movie.id}-${i}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05, duration: 0.4 }}
                                >
                                    <MovieCard movie={movie} />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Loader trigger */}
                        <div ref={loaderRef} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
                            {isFetching && !isAiMode && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: 'var(--accent)', opacity: 0.7,
                                            animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            )}
                            {!hasMore && allMovies.length > 0 && !isAiMode && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay más resultados</p>
                            )}
                        </div>
                    </>
                )}
              </div>
          </div>
      )
}