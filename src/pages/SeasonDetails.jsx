import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tmdbService } from '../services/tmdb'
import Navbar from '../components/Navbar'
import { Skeleton } from 'primereact/skeleton'
import { Rating } from 'primereact/rating'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function SeasonDetails() {
    const { id, seasonNumber } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [expandedEpisode, setExpandedEpisode] = useState(null)

    const { data: showData } = useQuery({
        queryKey: ['tv', id],
        queryFn: () => tmdbService.getTvDetails(id)
    })

    const { data: seasonData, isLoading } = useQuery({
        queryKey: ['season', id, seasonNumber],
        queryFn: () => tmdbService.getTvSeason(id, seasonNumber)
    })

    const { data: episodeRatings, refetch: refetchRatings } = useQuery({
        queryKey: ['episode-ratings', id, seasonNumber],
        queryFn: async () => {
            const { data } = await supabase
                .from('episode_ratings')
                .select('*')
                .eq('show_id', parseInt(id))
                .eq('season_number', parseInt(seasonNumber))
            return data || []
        }
    })

    const handleRateEpisode = async (episodeId, episodeNum, rating) => {
        if (!user) return
        
        const existing = episodeRatings?.find(r => r.user_id === user.id && r.episode_id === episodeId)
        
        if (existing) {
            await supabase.from('episode_ratings').update({ rating }).eq('user_id', user.id).eq('episode_id', episodeId)
        } else {
            await supabase.from('episode_ratings').insert({
                user_id: user.id,
                show_id: parseInt(id),
                season_number: parseInt(seasonNumber),
                episode_number: episodeNum,
                episode_id: episodeId,
                rating
            })
        }
        refetchRatings()
    }

    const show = showData?.data
    const season = seasonData?.data

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ width: '100%', maxWidth: '1200px', margin: '64px auto 0', padding: '2rem' }}>
                    <Skeleton width="100%" height="150px" borderRadius="12px" style={{ marginBottom: '2rem' }} />
                    <Skeleton width="100%" height="200px" borderRadius="12px" style={{ marginBottom: '1rem' }} />
                </div>
            </div>
        )
    }

    if (!season || !show) return null

    const headerPoster = season.poster_path 
        ? `https://image.tmdb.org/t/p/w92${season.poster_path}` 
        : (show.poster_path ? `https://image.tmdb.org/t/p/w92${show.poster_path}` : null)

    const toggleExpand = (epId) => {
        setExpandedEpisode(prev => prev === epId ? null : epId)
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            
            {/* Header */}
            <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', marginTop: '64px', padding: '1.5rem 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {headerPoster && (
                        <img src={headerPoster} alt={season.name} style={{ width: '58px', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                    )}
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {season.name} <span style={{ color: 'var(--text-muted)' }}>({season.air_date?.split('-')[0]})</span>
                        </h1>
                        <button 
                            onClick={() => navigate(`/tv/${id}/seasons`)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0, fontWeight: 500 }}
                            className="hover:text-[var(--text)] transition-colors"
                        >
                            &larr; Volver a todas las temporadas
                        </button>
                    </div>
                </div>
            </div>

            {/* Episodes List */}
            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700 }}>Episodios <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{season.episodes?.length || 0}</span></h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {season.episodes?.map((episode) => {
                        const isExpanded = expandedEpisode === episode.id
                        
                        // Rating data for this episode
                        const epRatings = episodeRatings?.filter(r => r.episode_id === episode.id) || []
                        const cinebyteAvg = epRatings.length > 0 
                            ? (epRatings.reduce((acc, curr) => acc + curr.rating, 0) / epRatings.length).toFixed(1) 
                            : null
                        const userRatingObj = epRatings.find(r => r.user_id === user?.id)
                        const userRating = userRatingObj ? userRatingObj.rating : 0

                        return (
                            <div key={episode.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ flexShrink: 0, width: '227px', height: '127px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                        {episode.still_path ? (
                                            <img src={`https://image.tmdb.org/t/p/w454_and_h254_bestv2${episode.still_path}`} alt={episode.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin Imagen</div>
                                        )}
                                    </div>
                                    
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{episode.episode_number}</span>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{episode.name}</h3>
                                            
                                            {/* Ratings Block */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
                                                {episode.vote_average > 0 && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TMDB</span>
                                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            ★ {episode.vote_average.toFixed(1)}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {cinebyteAvg && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CINEBYTE</span>
                                                        <div style={{ background: 'var(--accent)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                            ★ {cinebyteAvg}
                                                        </div>
                                                    </div>
                                                )}

                                                {user && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border)' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tu nota</span>
                                                        <Rating 
                                                            value={userRating} 
                                                            onChange={(e) => handleRateEpisode(episode.id, episode.episode_number, e.value)} 
                                                            stars={10} 
                                                            cancel={false} 
                                                            style={{ fontSize: '0.9rem' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
                                            {episode.air_date && <span>{new Date(episode.air_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                                            {episode.runtime > 0 && <span style={{ color: 'var(--text-muted)' }}>&bull;</span>}
                                            {episode.runtime > 0 && <span>{episode.runtime}m</span>}
                                        </div>

                                        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', flex: 1 }}>
                                            {episode.overview || "No hay sinopsis disponible."}
                                        </p>
                                    </div>
                                </div>

                                {/* Expand Button */}
                                <div 
                                    onClick={() => toggleExpand(episode.id)}
                                    style={{ borderTop: '1px solid var(--border)', padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}
                                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                                >
                                    {isExpanded ? 'Ocultar detalles \u2303' : 'Expandir \u2304'}
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', background: 'var(--bg)' }}>
                                        <div style={{ display: 'flex', gap: '3rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Equipo</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                                                    {episode.crew?.slice(0, 6).map(person => (
                                                        <div key={person.credit_id} style={{ fontSize: '0.9rem' }}>
                                                            <p style={{ fontWeight: 700, margin: '0 0 0.25rem 0' }}>{person.name}</p>
                                                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>{person.job}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Estrellas Invitadas</h4>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    {episode.guest_stars?.slice(0, 4).map(guest => (
                                                        <div key={guest.credit_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                                                {guest.profile_path ? (
                                                                    <img src={`https://image.tmdb.org/t/p/w185${guest.profile_path}`} alt={guest.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👤</div>
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: '0.9rem' }}>
                                                                <p style={{ fontWeight: 700, margin: '0 0 0.25rem 0' }}>{guest.name}</p>
                                                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem' }}>{guest.character}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <style>{`
                .p-rating-item .p-rating-icon {
                    color: var(--accent) !important;
                }
                .p-rating-item.p-rating-item-active .p-rating-icon {
                    color: var(--accent) !important;
                }
            `}</style>
        </div>
    )
}