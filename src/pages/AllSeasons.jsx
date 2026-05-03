import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tmdbService } from '../services/tmdb'
import Navbar from '../components/Navbar'
import { Skeleton } from 'primereact/skeleton'
import { supabase } from '../lib/supabase'

export default function AllSeasons() {
    const { id } = useParams()
    const navigate = useNavigate()

    const { data: showData, isLoading } = useQuery({
        queryKey: ['tv', id],
        queryFn: () => tmdbService.getTvDetails(id)
    })

    const { data: showEpisodeRatings } = useQuery({
        queryKey: ['show-episode-ratings', id],
        queryFn: async () => {
            const { data } = await supabase
                .from('episode_ratings')
                .select('rating, season_number')
                .eq('show_id', parseInt(id))
            return data || []
        }
    })

    const show = showData?.data

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ width: '100%', maxWidth: '1200px', margin: '64px auto 0', padding: '2rem' }}>
                    <Skeleton width="100%" height="150px" borderRadius="12px" style={{ marginBottom: '2rem' }} />
                    <Skeleton width="100%" height="200px" borderRadius="12px" style={{ marginBottom: '1rem' }} />
                    <Skeleton width="100%" height="200px" borderRadius="12px" />
                </div>
            </div>
        )
    }

    if (!show) return null

    const headerPoster = show.poster_path ? `https://image.tmdb.org/t/p/w92${show.poster_path}` : null

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            
            {/* Header */}
            <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', marginTop: '64px', padding: '1.5rem 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {headerPoster && (
                        <img src={headerPoster} alt={show.name} style={{ width: '58px', borderRadius: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} />
                    )}
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem 0', fontFamily: 'Bebas Neue', letterSpacing: '0.05em' }}>
                            {show.name} <span style={{ color: 'var(--text-muted)' }}>({show.first_air_date?.split('-')[0]})</span>
                        </h1>
                        <button 
                            onClick={() => navigate(`/tv/${id}`)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0, fontWeight: 500 }}
                            className="hover:text-[var(--text)] transition-colors"
                        >
                            &larr; Volver a principal
                        </button>
                    </div>
                </div>
            </div>

            {/* Seasons List */}
            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
                {show.seasons?.map((season) => {
                    const seasonRatings = showEpisodeRatings?.filter(r => r.season_number === season.season_number) || [];
                    const cinebyteSeasonAvg = seasonRatings.length > 0 
                        ? (seasonRatings.reduce((acc, curr) => acc + curr.rating, 0) / seasonRatings.length).toFixed(1)
                        : null;

                    return (
                    <div 
                        key={season.id} 
                        style={{ display: 'flex', gap: '1.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        className="hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1"
                        onClick={() => navigate(`/tv/${id}/season/${season.season_number}`)}
                    >
                        <div style={{ flexShrink: 0, width: '130px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', background: 'var(--bg-card)', alignSelf: 'flex-start' }}>
                            {season.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w300${season.poster_path}`} alt={season.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '195px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin Imagen</div>
                            )}
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {season.name}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500, flexWrap: 'wrap' }}>
                                {season.vote_average > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TMDB</span>
                                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--accent)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            ★ {(season.vote_average * 10).toFixed(0)}%
                                        </div>
                                    </div>
                                )}
                                {cinebyteSeasonAvg && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CINEBYTE</span>
                                        <div style={{ background: 'var(--accent)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                            ★ {cinebyteSeasonAvg}
                                        </div>
                                    </div>
                                )}
                                {season.air_date && <span>{season.air_date.split('-')[0]}</span>}
                                {season.air_date && <span style={{ color: 'var(--text-muted)' }}>&bull;</span>}
                                <span>{season.episode_count} Episodios</span>
                            </div>

                            {season.air_date && (
                                <p style={{ fontSize: '0.95rem', margin: '0 0 1rem 0' }}>
                                    {season.name} se estrenó el {new Date(season.air_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}.
                                </p>
                            )}

                            {season.overview && (
                                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                    {season.overview}
                                </p>
                            )}
                        </div>
                    </div>
                )})}
            </div>
        </div>
    )
}
