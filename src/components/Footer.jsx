// Footer.jsx
export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
      marginTop: 'auto',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '2rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--accent)' }}>CINE</span>
            <span style={{ color: 'var(--text)' }}>BYTE</span>
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © 2026 CineByte — Red Social para Cinéfilos
          </p>
        </div>
        
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <p style={{ marginBottom: '0.25rem' }}>
            Datos proporcionados por{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              TMDB
            </a>
          </p>
          <p>Trabajo de Fin de Grado · Realizado por Vlad Constantinescu</p>
        </div>
      </div>
    </footer>
  )
}
