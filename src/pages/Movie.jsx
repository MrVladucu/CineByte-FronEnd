import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import MovieCard from '../components/Moviecard'
import ReviewModal from '../components/ReviewModal'
import { tmdbService } from '../services/tmdb'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import { Skeleton } from 'primereact/skeleton'
import { Rating } from 'primereact/rating'

export default function Movie({ type = 'movie' }) {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [showTrailer, setShowTrailer] = useState(false)

    const { data: movieData, isLoading: movieLoading } = useQuery({
        queryKey: [type, id],
        queryFn: () => type === 'tv' ? tmdbService.getTvDetails(id) : tmdbService.getMovieDetails(id),
    })

    const { data: creditsData } = useQuery({
        queryKey: [`${type}-credits`, id],
        queryFn: () => type === 'tv' ? tmdbService.getTvCredits(id) : tmdbService.getMovieCredits(id),
    })

    const { data: providersData } = useQuery({
        queryKey: [`${type}-providers`, id],
        queryFn: () => type === 'tv' ? tmdbService.getTvProviders(id) : tmdbService.getMovieProviders(id),
    })

    const { data: similarData } = useQuery({
        queryKey: [`${type}-similar`, id],
        queryFn: () => type === 'tv' ? tmdbService.getSimilarTv(id) : tmdbService.getSimilarMovies(id),
    })

    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist', id, type, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('lists')
                .select('id, list_movies(tmdb_movie_id, media_type)')
                .eq('user_id', user.id)
                .eq('name', 'Watchlist')
                .maybeSingle()
            return data
        },
        enabled: !!user,
    })

    const { data: favoriteData } = useQuery({
        queryKey: ['favorite', id, type, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('favorite_movies')
                .select('user_id')
                .eq('user_id', user.id)
                .eq('tmdb_movie_id', parseInt(id))
                .eq('media_type', type)
            return data
        },
        enabled: !!user,
    })

    const { data: reviewsData, refetch: refetchReviews } = useQuery({
        queryKey: ['movie-reviews', id, type],
        queryFn: async () => {
            const { data } = await supabase
                .from('reviews')
                .select('*, profiles!reviews_user_id_fkey(username, avatar_url)')
                .eq('tmdb_movie_id', parseInt(id))
                .eq('media_type', type)
                .order('created_at', { ascending: false })
            return data
        },
    })

    const { data: likesData, refetch: refetchLikes } = useQuery({
        queryKey: ['review-likes', id, type],
        queryFn: async () => {
            const reviewIds = reviewsData?.map(r => r.id) || []
            if (!reviewIds.length) return []
            const { data } = await supabase
                .from('review_likes')
                .select('*')
                .in('review_id', reviewIds)
            return data || []
        },
        enabled: !!reviewsData?.length,
    })

    const { data: userReviewData } = useQuery({
        queryKey: ['user-review', id, type, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('reviews')
                .select('id')
                .eq('tmdb_movie_id', parseInt(id))
                .eq('media_type', type)
                .eq('user_id', user.id)
            return data
        },
        enabled: !!user,
    })

    const hasReviewed = userReviewData && userReviewData.length > 0
    const isFavorite = favoriteData && favoriteData.length > 0
    const isInWatchlist = watchlistData?.list_movies?.some(m => m.tmdb_movie_id === parseInt(id) && (m.media_type || 'movie') === type)

    const toggleWatchlist = async () => {
        if (!user) return
        let listId = watchlistData?.id
        if (!listId) {
            const { data } = await supabase
                .from('lists')
                .insert({ user_id: user.id, name: 'Watchlist', is_public: false })
                .select()
                .single()
            listId = data.id
        }
        if (isInWatchlist) {
            await supabase.from('list_movies').delete()
                .eq('list_id', listId).eq('tmdb_movie_id', parseInt(id)).eq('media_type', type)
        } else {
            await supabase.from('list_movies').insert({ list_id: listId, tmdb_movie_id: parseInt(id), media_type: type })
        }
        queryClient.invalidateQueries(['watchlist', id, type, user?.id])
    }

    const toggleFavorite = async () => {
        if (!user) return
        if (isFavorite) {
            await supabase.from('favorite_movies').delete()
                .eq('user_id', user.id).eq('tmdb_movie_id', parseInt(id)).eq('media_type', type)
        } else {
            await supabase.from('favorite_movies').insert({ user_id: user.id, tmdb_movie_id: parseInt(id), media_type: type })
        }
        queryClient.invalidateQueries(['favorite', id, type, user?.id])
    }

    const handleVote = async (reviewId, isLike) => {
        if (!user) return
        const existing = likesData?.find(l => l.review_id === reviewId && l.user_id === user.id)

        if (existing) {
            if (existing.is_like === isLike) {
                await supabase.from('review_likes').delete()
                    .eq('review_id', reviewId).eq('user_id', user.id)
            } else {
                await supabase.from('review_likes').update({ is_like: isLike })
                    .eq('review_id', reviewId).eq('user_id', user.id)
            }
        } else {
            await supabase.from('review_likes').insert({
                review_id: reviewId,
                user_id: user.id,
                is_like: isLike,
            })
        }
        refetchLikes()
    }

    const movie = movieData?.data
    const credits = creditsData?.data
    const similar = similarData?.data?.results?.slice(0, 6) || []
    const director = type === 'tv' ? movie?.created_by?.[0] : credits?.crew?.find(p => p.job === 'Director')
    const cast = credits?.cast?.slice(0, 8) || []

    if (movieLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ width: '100%', maxWidth: '1280px', margin: '64px auto 0 auto', padding: '2rem' }}>
                    <Skeleton width="100%" height="40vh" borderRadius="12px" />
                    <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                        <Skeleton width="220px" height="330px" borderRadius="8px" />
                        <div style={{ flex: 1 }}>
                            <Skeleton width="60%" height="3rem" style={{ marginBottom: '1rem' }} />
                            <Skeleton width="40%" height="1.5rem" style={{ marginBottom: '2rem' }} />
                            <Skeleton width="100%" height="10rem" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!movie) return null

    const backdropUrl = movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null

    const title = movie.title || movie.name;
    const releaseDate = movie.release_date || movie.first_air_date;
    const runtime = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]);
    const trailer = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || movie.videos?.results?.find(v => v.site === 'YouTube');
    const cinebyteAverage = reviewsData?.length ? (reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / reviewsData.length).toFixed(1) : null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            {/* Hero backdrop */}
            <div style={{ position: 'relative', height: '70vh', marginTop: '64px', overflow: 'hidden' }}>
                {backdropUrl && (
                    <img src={backdropUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
                )}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to right, var(--bg) 30%, transparent 70%), linear-gradient(to top, var(--bg) 0%, transparent 50%)'
                }} />
            </div>

            {/* Content */}
            <div style={{ width: '100%', maxWidth: '1550px', margin: '0 auto', padding: '0 2rem', marginTop: '-15rem', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* Poster */}
                    {posterUrl && (
                        <div style={{ flexShrink: 0, width: '280px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid var(--border)' }}>
                            <img src={posterUrl} alt={title} style={{ width: '100%' }} />
                        </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '300px', paddingTop: '2rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {movie.genres?.map(g => (
                                <Tag key={g.id} value={g.name} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 500 }} />
                            ))}
                        </div>

                        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(3rem, 6vw, 5rem)', lineHeight: 1, marginBottom: '1rem' }}>
                            {title}
                        </h1>

                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            {movie.vote_average > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TMDB</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Rating value={Math.round(movie.vote_average)} readOnly stars={10} cancel={false} style={{ fontSize: '0.9rem' }} />
                                        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.2rem' }}>{movie.vote_average.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}

                            {cinebyteAverage && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '2rem', borderLeft: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CINEBYTE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Rating value={Math.round(cinebyteAverage)} readOnly stars={10} cancel={false} style={{ fontSize: '0.9rem' }} />
                                        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.2rem' }}>{cinebyteAverage}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingLeft: (movie.vote_average > 0 || cinebyteAverage) ? '2rem' : '0' }}>
                                {releaseDate && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{releaseDate.split('-')[0]}</span>}
                                {runtime > 0 && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                                )}
                                {director && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                                        {type === 'tv' ? 'CREADOR ' : 'DIR. '} <span style={{ color: 'var(--text)' }}>{director.name}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1rem', maxWidth: '800px', marginBottom: '2.5rem' }}>
                            {movie.overview}
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                            {trailer && (
                                <Button 
                                    label="VER TRÁILER" 
                                    icon="pi pi-youtube"
                                    onClick={() => setShowTrailer(true)} 
                                    style={{ background: '#ef4444', borderColor: '#ef4444', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', padding: '0.7rem 1.5rem' }}
                                />
                            )}
                            <Button 
                                label={hasReviewed ? 'YA RESEÑADA' : 'ESCRIBIR RESEÑA'} 
                                icon={hasReviewed ? 'pi pi-check' : 'pi pi-star-fill'}
                                onClick={() => setShowReviewModal(true)} 
                                disabled={hasReviewed}
                                style={{ background: hasReviewed ? 'var(--bg-elevated)' : 'var(--accent)', borderColor: hasReviewed ? 'var(--border)' : 'var(--accent)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', padding: '0.7rem 1.5rem' }}
                            />
                            <Button 
                                label={isInWatchlist ? 'EN WATCHLIST' : 'WATCHLIST'} 
                                icon={isInWatchlist ? 'pi pi-check' : 'pi pi-plus'}
                                onClick={toggleWatchlist}
                                outlined={!isInWatchlist}
                                style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', padding: '0.7rem 1.5rem', color: isInWatchlist ? 'var(--accent)' : 'white', borderColor: isInWatchlist ? 'var(--accent)' : 'var(--border)' }}
                            />
                            <Button 
                                label="FAVORITA" 
                                icon={isFavorite ? 'pi pi-heart-fill' : 'pi pi-heart'}
                                onClick={toggleFavorite}
                                outlined={!isFavorite}
                                style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', padding: '0.7rem 1.5rem', color: isFavorite ? 'var(--accent)' : 'white', borderColor: isFavorite ? 'var(--accent)' : 'var(--border)' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '0' }}>

                {/* Cast */}
                {cast.length > 0 && (
                    <div style={{ marginTop: '5rem' }}>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.08em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ display: 'inline-block', width: '4px', height: '1.5rem', background: 'var(--accent)', borderRadius: '2px' }} />
                            REPARTO PRINCIPAL
                        </h2>
                        <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '1.5rem', scrollbarWidth: 'none' }}>
                            {cast.map(person => (
                                <div key={person.id} onClick={() => navigate(`/actor/${person.id}`)}
                                     style={{ flexShrink: 0, width: '130px', textAlign: 'center', cursor: 'pointer' }}
                                     className="hover:opacity-80 transition-opacity">
                                    <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', background: 'var(--bg-elevated)', border: '2px solid var(--border)', boxShadow: '0 8px 20px rgba(0,0,0,0.4)' }}>
                                        {person.profile_path
                                            ? <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👤</div>
                                        }
                                    </div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '0.25rem' }}>{person.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{person.character}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reseñas */}
                <div style={{ marginTop: '5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                            <span style={{ display: 'inline-block', width: '4px', height: '1.5rem', background: 'var(--accent)', borderRadius: '2px' }} />
                            RESEÑAS ({reviewsData?.length || 0})
                        </h2>
                        {!hasReviewed && (
                            <Button label="ESCRIBIR RESEÑA" icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => setShowReviewModal(true)} style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.1em' }} />
                        )}
                    </div>
                    
                    {!reviewsData?.length ? (
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: '8px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--border)' }}>
                            <i className="pi pi-comments" style={{ fontSize: '2rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}></i>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sé el primero en reseñar esta {type === 'tv' ? 'serie' : 'película'}.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {reviewsData.map(review => {
                                const likeCount = likesData?.filter(l => l.review_id === review.id && l.is_like === true).length || 0
                                const dislikeCount = likesData?.filter(l => l.review_id === review.id && l.is_like === false).length || 0
                                const userVote = likesData?.find(l => l.review_id === review.id && l.user_id === user?.id)

                                return (
                                    <div key={review.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                                                    {review.profiles?.avatar_url
                                                        ? <img src={review.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : '👤'}
                                                </div>
                                                <div>
                                                    <span onClick={() => navigate(`/profile/${review.user_id}`)}
                                                        style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'block' }}
                                                        className="hover:text-[var(--accent)] transition-colors">
                                                        {review.profiles?.username || 'Usuario'}
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                        {new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(229,27,35,0.1)', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid var(--accent)' }}>
                                                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem' }}>★ {review.rating}</span>
                                            </div>
                                        </div>

                                        {review.content && (
                                            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>{review.content}</p>
                                        )}

                                        {/* Likes / Dislikes */}
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            <Button 
                                                icon="pi pi-thumbs-up" 
                                                label={String(likeCount)}
                                                onClick={() => handleVote(review.id, true)}
                                                className={`p-button-sm ${userVote?.is_like === true ? '' : 'p-button-text'}`}
                                                style={{ background: userVote?.is_like === true ? '#22c55e' : 'transparent', borderColor: userVote?.is_like === true ? '#22c55e' : 'var(--border)', color: userVote?.is_like === true ? 'white' : 'var(--text-muted)' }}
                                            />
                                            <Button 
                                                icon="pi pi-thumbs-down" 
                                                label={String(dislikeCount)}
                                                onClick={() => handleVote(review.id, false)}
                                                className={`p-button-sm ${userVote?.is_like === false ? '' : 'p-button-text'}`}
                                                style={{ background: userVote?.is_like === false ? 'var(--accent)' : 'transparent', borderColor: userVote?.is_like === false ? 'var(--accent)' : 'var(--border)', color: userVote?.is_like === false ? 'white' : 'var(--text-muted)' }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Similar */}
                {similar.length > 0 && (
                    <div style={{ marginTop: '4rem', marginBottom: '5rem' }}>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.08em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
                            RECOMENDACIONES SIMILARES
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
                            {similar.map(sim => (
                                <MovieCard key={sim.id} movie={sim} type={type} />
                            ))}
                        </div>
                    </div>
                )}
                </div>

                {/* Stats Sidebar */}
                <div style={{ width: '320px', flexShrink: 0, background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', padding: '2rem', position: 'sticky', top: '100px' }}>
                    <h3 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.08em', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
                        INFORMACIÓN
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Providers */}
                        {(() => {
                            const countryData = providersData?.data?.results?.ES || providersData?.data?.results?.US
                            const flatrate = countryData?.flatrate || []
                            if (flatrate.length === 0) return null
                            return (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Dónde Ver</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {flatrate.map(provider => (
                                            <img 
                                                key={provider.provider_id} 
                                                src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                                                alt={provider.provider_name} 
                                                title={provider.provider_name}
                                                style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border)' }} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}

                        {movie.status && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Estado</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{movie.status}</p>
                            </div>
                        )}
                        {movie.original_language && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Idioma Original</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase' }}>{movie.original_language}</p>
                            </div>
                        )}
                        {type === 'movie' && movie.budget > 0 && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Presupuesto</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>${movie.budget.toLocaleString()}</p>
                            </div>
                        )}
                        {type === 'movie' && movie.revenue > 0 && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Recaudación</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>${movie.revenue.toLocaleString()}</p>
                            </div>
                        )}
                        {type === 'tv' && movie.networks && movie.networks.length > 0 && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Cadena</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{movie.networks.map(n => n.name).join(', ')}</p>
                            </div>
                        )}
                        {type === 'tv' && movie.number_of_seasons > 0 && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Temporadas</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{movie.number_of_seasons}</p>
                            </div>
                        )}
                        {type === 'tv' && movie.number_of_episodes > 0 && (
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Episodios</p>
                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{movie.number_of_episodes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {showTrailer && trailer && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)' }} onClick={() => setShowTrailer(false)}>
                    <div style={{ position: 'relative', width: '90%', maxWidth: '1000px', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowTrailer(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`} title="Trailer" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                </div>
            )}

            {showReviewModal && (
                <ReviewModal
                    movie={{ ...movie, title: title, media_type: type }}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        refetchReviews()
                        queryClient.invalidateQueries(['user-review', id, type, user?.id])
                    }}
                />
            )}
            
            <style>{`
                .p-rating-item .p-rating-icon {
                    color: var(--accent) !important;
                    font-size: 0.8rem;
                }
                .p-skeleton {
                    background-color: var(--bg-elevated) !important;
                }
                .p-skeleton::after {
                    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0)) !important;
                }
            `}</style>
        </div>
    )
}