import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import MovieCard from '../components/Moviecard'
import { tmdbService } from '../services/tmdb'

export default function Search() {
  const [searchParams] = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const [search, setSearch] = useState(queryParam)
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
    queryKey: ['search-page', search, page],
    queryFn: () => isSearching
      ? tmdbService.searchMovies(search, page)
      : tmdbService.discoverMovies('', 'popularity.desc', page),
  })

  useEffect(() => {
    const results = data?.data?.results || []
    const totalPages = data?.data?.total_pages || 1
    if (results.length > 0) {
      setAllMovies(prev => page === 1 ? results : [...prev, ...results])
      setHasMore(page < Math.min(totalPages, 100))
    }
  }, [data])

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage(p => p + 1)
    }
  }, [isFetching, hasMore])

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

        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.08em', marginBottom: '2rem' }}>
          {isSearching ? `RESULTADOS PARA "${search.toUpperCase()}"` : 'EXPLORAR PELÍCULAS'}
        </h1>

        {/* Results */}
        {allMovies.length === 0 && isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', aspectRatio: '2/3' }} />
            ))}
          </div>
        ) : allMovies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</p>
            <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.05em' }}>
              NO SE ENCONTRARON RESULTADOS
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {allMovies.map((movie, i) => (
                <MovieCard key={`${movie.id}-${i}`} movie={movie} />
              ))}
            </div>

            {/* Loader trigger */}
            <div ref={loaderRef} style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
              {isFetching && (
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
              {!hasMore && allMovies.length > 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay más resultados</p>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  )
}