import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function ReviewModal({ movie, onClose, onSuccess }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (rating === 0) {
            setError('Selecciona una puntuación')
            return
        }
        setLoading(true)
        setError('')

        // Gemini para moderar las reviews
        if (content.trim()) {
            try {
                console.log('Llamando a moderación con texto:', content.trim()) // ← añade esto
                const modResponse = await api.post('/api/moderation/check', { text: content.trim() })
                console.log('Respuesta moderación:', modResponse.data) // ← y esto
                if (!modResponse.data.approved) {
                    setError(`Reseña rechazada: ${modResponse.data.reason}`)
                    setLoading(false)
                    return
                }
            } catch (e) {
                console.error('Error moderación:', e) // ← y esto
            }
        }

        const { error: supabaseError } = await supabase
            .from('reviews')
            .insert({
                user_id: user.id,
                tmdb_movie_id: movie.id,
                rating,
                content: content.trim() || null,
            })

        if (supabaseError) {
            setError(supabaseError.message)
            setLoading(false)
            return
        }

        try {
            await api.post('/api/gamification/review', { userId: user.id })
        } catch (e) { /* vacios */ }

        setLoading(false)
        onSuccess?.()
        onClose()
    }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '2rem',
        width: '100%',
        maxWidth: '480px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.05em' }}>
            RESEÑA — {movie.title?.toUpperCase()}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(229,27,35,0.1)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '0.75rem', marginBottom: '1rem', color: 'var(--accent)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Puntuación
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: rating >= n ? 'var(--accent)' : 'var(--border)',
                    background: rating >= n ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  {n}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {rating}/10 — {['', 'Pésima', 'Muy mala', 'Mala', 'Regular', 'Mediocre', 'Bien', 'Buena', 'Muy buena', 'Excelente', 'Obra maestra'][rating]}
              </p>
            )}
          </div>

          {/* Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Reseña (opcional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="¿Qué te pareció la película?"
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: '4px',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.85rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? 'GUARDANDO...' : 'PUBLICAR RESEÑA'}
          </button>
        </form>
      </div>
    </div>
  )
}