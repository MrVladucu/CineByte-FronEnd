import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>

      {/* Left panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          <Link to="/">
            <span style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
              CINE<span style={{ color: 'var(--text)' }}>BYTE</span>
            </span>
          </Link>

          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', marginTop: '2rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            BIENVENIDO
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Inicia sesión para continuar
          </p>

          {error && (
            <div style={{ background: 'rgba(229,27,35,0.1)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--accent)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: '4px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  borderRadius: '4px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  outline: 'none',
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
                marginTop: '0.5rem',
                transition: 'opacity 0.2s',
              }}>
              {loading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1.5rem', textAlign: 'center' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a0000 0%, #0a0a0a 50%, #1a0000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }} className="hidden md:flex">
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'var(--accent)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.15,
        }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'Bebas Neue', fontSize: '4rem', lineHeight: 1, color: 'white', opacity: 0.08, letterSpacing: '0.1em' }}>
            DESCUBRE<br />VALORA<br />COMPARTE
          </p>
        </div>
      </div>

    </div>
  )
}