import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Dialog } from 'primereact/dialog'
import { Rating } from 'primereact/rating'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'

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
        const modResponse = await api.post('/api/moderation/check', { text: content.trim() })
        if (!modResponse.data.approved) {
          setError(`Reseña rechazada: ${modResponse.data.reason}`)
          setLoading(false)
          return
        }
      } catch (err) {
        setError('Error al verificar la reseña. Por favor, inténtalo de nuevo más tarde.')
        setLoading(false)
        return
      }
    }

    const { error: supabaseError } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        tmdb_movie_id: movie.id,
        media_type: movie.media_type || 'movie',
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

  const headerElement = (
    <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.05em', margin: 0 }}>
      RESEÑA — {movie.title?.toUpperCase()}
    </h2>
  )

  return (
    <Dialog 
      visible={true} 
      onHide={onClose} 
      header={headerElement}
      style={{ width: '90vw', maxWidth: '480px', margin: '0 1rem' }}
      breakpoints={{ '640px': '95vw' }}
      draggable={false}
      resizable={false}
      className="review-dialog"
    >
      <div style={{ paddingTop: '1rem' }}>
        {error && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Message severity="error" text={error} style={{ width: '100%', justifyContent: 'flex-start' }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Puntuación
            </label>
            <Rating 
              value={rating} 
              onChange={(e) => setRating(e.value)} 
              stars={10} 
              cancel={false} 
              style={{ fontSize: '1.5rem' }}
            />
            {rating > 0 && (
              <p style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
                {rating}/10 — {['', 'Pésima', 'Muy mala', 'Mala', 'Regular', 'Mediocre', 'Bien', 'Buena', 'Muy buena', 'Excelente', 'Obra maestra'][rating]}
              </p>
            )}
          </div>

          {/* Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Reseña (opcional)
            </label>
            <InputTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="¿Qué te pareció la película?"
              style={{ width: '100%', fontSize: '0.9rem' }}
              autoResize
            />
          </div>

          <Button
            type="submit"
            label={loading ? 'GUARDANDO...' : 'PUBLICAR RESEÑA'}
            loading={loading}
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--accent)',
              borderColor: 'var(--accent)',
              fontWeight: 600,
              letterSpacing: '0.15em',
            }}
          />
        </form>
      </div>

      <style>{`
        .review-dialog .p-dialog-header {
          background: var(--bg-card);
          color: var(--text);
          border-bottom: 1px solid var(--border);
        }
        .review-dialog .p-dialog-content {
          background: var(--bg-card);
          color: var(--text);
        }
        .p-rating-item .p-rating-icon {
          color: var(--accent) !important;
        }
        .p-rating-item.p-rating-item-active .p-rating-icon {
            color: var(--accent) !important;
        }
      `}</style>
    </Dialog>
  )
}