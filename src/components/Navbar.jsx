import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tmdbService } from '../services/tmdb'
import { useTheme } from '../context/ThemeContext'
import { Button } from 'primereact/button'
import { supabase } from '../lib/supabase'
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const searchRef = useRef(null)
  const notifRef = useRef(null)

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20)
  })

  const { data: searchResults } = useQuery({
    queryKey: ['navbar-search', searchQuery],
    queryFn: () => tmdbService.searchMovies(searchQuery, 1),
    enabled: searchQuery.trim().length >= 2,
  })

  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      return data?.role
    },
    enabled: !!user,
  })

  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      return data || []
    },
    enabled: !!user,
  })

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    }
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notifId) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notifId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    },
    onError: (error) => {
      console.error('Error eliminando notificación:', error)
    }
  })

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  const movies = searchResults?.data?.results?.slice(0, 6) || []

  useEffect(() => {
    if (searchQuery.trim().length >= 2 && searchFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }, [searchQuery, searchFocused])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false)
        setSearchFocused(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowDropdown(false)
    }
  }

  const handleMovieClick = (movieId, mediaType = 'movie') => {
    navigate(`/${mediaType}/${movieId}`)
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && unreadCount > 0) {
      markAsReadMutation.mutate()
    }
  }

  const handleDeleteNotification = (e, notifId) => {
    e.stopPropagation() // Prevent triggering any other click events
    deleteNotificationMutation.mutate(notifId)
  }

  const navBg = theme === 'light' 
    ? (isScrolled ? 'rgba(248,249,250,0.85)' : 'transparent') 
    : (isScrolled ? 'rgba(10,10,10,0.85)' : 'transparent')
  const navBorder = isScrolled ? '1px solid var(--border)' : '1px solid transparent'
  const navBackdrop = isScrolled ? 'blur(12px)' : 'none'

  return (
    <motion.nav 
      animate={{ backgroundColor: navBg, borderBottom: navBorder, backdropFilter: navBackdrop }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '1530px',
        margin: '0 auto',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
      }}>

        {/* Logo */}
        <Link to="/" style={{ flexShrink: 0, textDecoration: 'none', display: 'inline-block' }} className="logo-glow">
          <span style={{ fontFamily: 'Bebas Neue', fontSize: '2.3rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>
            CINE<span style={{ color: 'var(--text)' }}>BYTE</span>
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: searchFocused ? 'center' : 'flex-start', position: 'relative' }}>
            <form onSubmit={handleSearch} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <motion.input
                type="text"
                placeholder="Buscar películas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                animate={{ width: searchFocused ? '100%' : '200px' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--text)',
                  borderRadius: showDropdown ? '4px 4px 0 0' : '20px',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxShadow: searchFocused ? '0 0 0 2px rgba(229,27,35,0.2)' : 'none',
                }}
              />
            </form>

            {/* Dropdown */}
            <AnimatePresence>
            {showDropdown && movies.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: searchFocused ? 0 : 'auto',
                  right: searchFocused ? 0 : 'auto',
                  width: searchFocused ? '100%' : '200px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--accent)',
              borderTop: 'none',
              borderRadius: '0 0 6px 6px',
              overflow: 'hidden',
              zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              transition: 'background-color 0.3s'
            }}>
              {movies.map(movie => {
                const title = movie.title || movie.name;
                const releaseDate = movie.release_date || movie.first_air_date;
                const mediaType = movie.media_type || 'movie';

                return (
                <div
                  key={movie.id}
                  onClick={() => handleMovieClick(movie.id, mediaType)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.15s, border-color 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,27,35,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      alt=""
                      style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '32px', height: '48px', background: 'var(--border)', borderRadius: '3px', flexShrink: 0, transition: 'background-color 0.3s' }} />
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text)', transition: 'color 0.3s' }}>
                      {title}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', transition: 'color 0.3s' }}>
                      {releaseDate?.split('-')[0]}
                      {movie.vote_average > 0 && ` · ★ ${movie.vote_average.toFixed(1)}`}
                    </p>
                  </div>
                </div>
              )})}

              {/* Ver todos */}
              <div
                onClick={handleSearch}
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,27,35,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                VER TODOS LOS RESULTADOS →
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
          <Button 
            className="theme-button-hover"
            icon={theme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'} 
            rounded 
            text 
            aria-label="Toggle Theme" 
            onClick={toggleTheme}
            style={{ color: 'var(--text-muted)', width: '2.5rem', height: '2.5rem', boxShadow: 'none', outline: 'none' }}
          />

          {user && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <Button 
                icon="pi pi-bell" 
                rounded 
                text 
                aria-label="Notifications" 
                onClick={handleToggleNotifications}
                style={{ color: 'var(--text-muted)', width: '2.5rem', height: '2.5rem', boxShadow: 'none', outline: 'none' }}
              />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '2px', right: '2px',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px', height: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '100%', right: 0,
                  width: '320px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  zIndex: 100,
                  marginTop: '0.5rem'
                }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notificaciones</h3>
                  </div>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {!notifications?.length ? (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No tienes notificaciones
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} style={{
                          padding: '1rem',
                          borderBottom: '1px solid var(--border)',
                          background: notif.is_read ? 'transparent' : 'rgba(229,27,35,0.05)',
                          transition: 'background 0.2s',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}>
                          <button 
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            style={{
                              position: 'absolute',
                              top: '0.75rem',
                              right: '0.75rem',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '50%',
                              transition: 'color 0.2s, background 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(229,27,35,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Eliminar notificación"
                          >
                            <i className="pi pi-times" style={{ fontSize: '0.75rem' }}></i>
                          </button>
                          
                          <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--text)', paddingRight: '1.5rem', lineHeight: '1.4' }}>
                            {notif.message}
                          </p>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link to="/" className="nav-link-glow" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 500, textDecoration: 'none' }}>
            INICIO
          </Link>
          <Link to="/search" className="nav-link-glow" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 500, textDecoration: 'none' }}>
            EXPLORAR
          </Link>

          {user && (
            <>
              {userRole === 'admin' && (
                <Link to="/admin" className="nav-link-glow" style={{ color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 700, textDecoration: 'none' }}>
                  ADMIN
                </Link>
              )}
              <Link to={`/profile/${user.id}`} className="nav-link-glow" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 500, textDecoration: 'none' }}>
                PERFIL
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.4rem 1rem',
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}>
                SALIR
              </button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  )
}