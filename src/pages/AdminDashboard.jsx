import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    
    // Fetch generic counts
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const [usersRes, reviewsRes, visitsRes] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('reviews').select('*', { count: 'exact', head: true }),
                supabase.from('site_sessions').select('duration_seconds')
            ])

            const sessions = visitsRes.data || []
            const totalVisits = sessions.length
            const totalDuration = sessions.reduce((acc, curr) => acc + curr.duration_seconds, 0)
            const avgSessionMinutes = totalVisits > 0 ? (totalDuration / totalVisits / 60).toFixed(1) : 0

            return {
                users: usersRes.count || 0,
                reviews: reviewsRes.count || 0,
                visits: totalVisits,
                avgSessionMinutes
            }
        }
    })

    // Fetch recent reviews
    const { data: recentReviews } = useQuery({
        queryKey: ['admin-recent-reviews'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, user_id, rating, content, created_at, tmdb_movie_id, media_type, profiles!reviews_user_id_fkey(username)')
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (error) {
                console.error('Error fetching recent reviews:', error)
            }
            return data || []
        }
    })

    const deleteReviewMutation = useMutation({
        mutationFn: async ({ id, userId, reason }) => {
            // Delete the review
            const { error: deleteError } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id)
            
            if (deleteError) throw deleteError

            // Create notification for the user
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: 'REVIEW_DELETED',
                    message: `Tu reseña ha sido eliminada por un administrador. Motivo: ${reason}`
                })
            
            if (notifError) throw notifError
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-recent-reviews'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            alert('Reseña eliminada y usuario notificado.')
        },
        onError: (error) => {
            console.error('Error eliminando reseña:', error)
            alert('Hubo un error al eliminar la reseña.')
        }
    })

    const handleDeleteReview = (review) => {
        const reason = window.prompt("Escribe el motivo de la eliminación para notificar al usuario:")
        if (reason) {
            deleteReviewMutation.mutate({ id: review.id, userId: review.user_id, reason })
        }
    }

    const StatCard = ({ title, value, icon, color }) => (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `rgba(${color}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${color})`, fontSize: '1.8rem' }}>
                <i className={`pi ${icon}`} style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{title}</p>
                <p style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', lineHeight: 1, margin: 0 }}>{value}</p>
            </div>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem 4rem 2rem' }}>
                <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '3rem', letterSpacing: '0.08em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'inline-block', width: '4px', height: '2.5rem', background: 'var(--accent)', borderRadius: '2px' }} />
                    PANEL DE ADMINISTRACIÓN
                </h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    <StatCard title="Visitas Totales" value={stats?.visits || 0} icon="pi-eye" color="59, 130, 246" />
                    <StatCard title="Tiempo Medio (min)" value={stats?.avgSessionMinutes || 0} icon="pi-clock" color="168, 85, 247" />
                    <StatCard title="Total Usuarios" value={stats?.users || 0} icon="pi-users" color="34, 197, 94" />
                    <StatCard title="Total Reseñas" value={stats?.reviews || 0} icon="pi-comments" color="229, 27, 35" />
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                        <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.05em', margin: 0 }}>ÚLTIMAS RESEÑAS PUBLICADAS</h2>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        {!recentReviews?.length ? (
                            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay reseñas todavía.</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Usuario</th>
                                        <th style={{ padding: '1rem' }}>Puntuación</th>
                                        <th style={{ padding: '1rem' }}>Contenido</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Fecha</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentReviews.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{r.profiles?.username}</td>
                                            <td style={{ padding: '1rem' }}><span style={{ background: 'rgba(229,27,35,0.1)', color: 'var(--accent)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>★ {r.rating}</span></td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.content || 'Sin texto'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => navigate(`/${r.media_type || 'movie'}/${r.tmdb_movie_id}`)}
                                                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', marginRight: '0.5rem' }}
                                                >
                                                    <i className="pi pi-eye" style={{ marginRight: '0.4rem' }}></i>
                                                    Ver
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteReview(r)}
                                                    style={{ background: 'rgba(229,27,35,0.1)', color: 'var(--accent)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                                                    disabled={deleteReviewMutation.isPending}
                                                >
                                                    <i className="pi pi-trash" style={{ marginRight: '0.4rem' }}></i>
                                                    Borrar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}