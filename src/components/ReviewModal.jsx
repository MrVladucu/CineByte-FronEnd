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
    <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ display: 'inline-block', width: '4px', height: '1.4rem', background: 'var(--accent)', borderRadius: '2px' }} />
      RESEÑA — {movie.title?.toUpperCase()}
    </h2>
  )

  return (
    <Dialog 
      visible={true} 
      onHide={onClose} 
      header={headerElement}
      style={{ width: '90vw', maxWidth: '520px', margin: '0 1rem' }}
      breakpoints={{ '640px': '95vw' }}
      draggable={false}
      resizable={false}
      className="review-dialog"
      dismissableMask={true}
    >
      <div style={{ paddingTop: '1.5rem' }}>
        {error && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Message severity="error" text={error} style={{ width: '100%', justifyContent: 'flex-start', borderRadius: '8px' }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Puntuación
            </label>
            <Rating 
              value={rating} 
              onChange={(e) => setRating(e.value)} 
              stars={10} 
              cancel={false} 
              style={{ fontSize: '1.6rem' }}
            />
            {rating > 0 && (
              <p style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: '0.75rem', fontWeight: 600 }}>
                {rating}/10 — {['', 'Pésima', 'Muy mala', 'Mala', 'Regular', 'Mediocre', 'Bien', 'Buena', 'Muy buena', 'Excelente', 'Obra maestra'][rating]}
              </p>
            )}
          </div>

          {/* Content */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Reseña (opcional)
            </label>
            <InputTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="¿Qué te pareció la historia? ¿Y las actuaciones? Escribe tus impresiones aquí..."
              style={{ 
                width: '100%', 
                fontSize: '0.95rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: '8px',
                padding: '1rem',
                lineHeight: '1.6',
                outline: 'none',
                boxShadow: 'none'
              }}
              className="custom-textarea"
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
              fontWeight: 700,
              letterSpacing: '0.15em',
              padding: '1rem',
              borderRadius: '8px',
              marginTop: '0.5rem',
              transition: 'background 0.2s, transform 0.1s'
            }}
            className="hover:scale-[1.02] active:scale-95"
          />
        </form>
      </div>

      <style>{`
        .review-dialog {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          border: 1px solid var(--border);
        }
        .review-dialog .p-dialog-header {
          background: var(--bg-card);
          color: var(--text);
          border-bottom: 1px solid var(--border);
          padding: 1.5rem 2rem 1.25rem 2rem;
        }
        .review-dialog .p-dialog-content {
          background: var(--bg-card);
          color: var(--text);
          padding: 0 2rem 2rem 2rem;
        }
        .review-dialog .p-dialog-header-icon {
          color: var(--text-muted);
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          transition: background-color 0.2s, color 0.2s;
        }
        .review-dialog .p-dialog-header-icon:hover {
          background: var(--bg-elevated);
          color: var(--text);
        }
        .p-rating-item .p-rating-icon {
          color: var(--border) !important;
          transition: color 0.2s;
        }
        .p-rating-item:hover .p-rating-icon {
          color: var(--accent-hover) !important;
        }
        .p-rating-item.p-rating-item-active .p-rating-icon {
            color: var(--accent) !important;
        }
        .custom-textarea:focus {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 1px var(--accent) !important;
        }
      `}</style>
    </Dialog>
  )
}