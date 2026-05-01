import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { useMovieTitles } from '../hooks/useMovieTitles'

export default function EditProfile() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [email, setEmail] = useState('')
    const [backgroundMovieId, setBackgroundMovieId] = useState('')

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [loadingProfile, setLoadingProfile] = useState(false)
    const [loadingEmail, setLoadingEmail] = useState(false)
    const [loadingPassword, setLoadingPassword] = useState(false)

    const [profileMsg, setProfileMsg] = useState(null)
    const [emailMsg, setEmailMsg] = useState(null)
    const [passwordMsg, setPasswordMsg] = useState(null)

    const { isLoading } = useQuery({
        queryKey: ['edit-profile', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            setUsername(data.username || '')
            setBio(data.bio || '')
            setAvatarUrl(data.avatar_url || '')
            setEmail(user.email || '')
            const bgId = data.background_movie_id ? `${data.background_media_type || 'movie'}-${data.background_movie_id}` : ''
            setBackgroundMovieId(bgId)
            return data
        },
        enabled: !!user,
    })

    const { data: favoritesData } = useQuery({
        queryKey: ['profile-favorites', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('favorite_movies')
                .select('tmdb_movie_id, media_type')
                .eq('user_id', user.id)
                .order('added_at', { ascending: false })
            return data
        },
        enabled: !!user,
    })

    const favoriteItems = favoritesData?.map(f => ({ id: f.tmdb_movie_id, type: f.media_type || 'movie' })) || []
    const { titles } = useMovieTitles(favoriteItems)

    const handleSaveProfile = async () => {
        setLoadingProfile(true)
        setProfileMsg(null)

        let bgMovieId = null
        let bgMediaType = 'movie'
        if (backgroundMovieId) {
            const parts = backgroundMovieId.split('-')
            bgMediaType = parts[0]
            bgMovieId = parseInt(parts[1])
        }

        const { error } = await supabase
            .from('profiles')
            .update({ 
                username, 
                bio, 
                avatar_url: avatarUrl,
                background_movie_id: bgMovieId,
                background_media_type: bgMediaType
            })
            .eq('id', user.id)

        setLoadingProfile(false)
        if (error) {
            setProfileMsg({ type: 'error', text: error.message })
        } else {
            setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente.' })
        }
    }

    const handleSaveEmail = async () => {
        setLoadingEmail(true)
        setEmailMsg(null)

        const { error } = await supabase.auth.updateUser({ email })

        setLoadingEmail(false)
        if (error) {
            setEmailMsg({ type: 'error', text: error.message })
        } else {
            setEmailMsg({ type: 'success', text: 'Se ha enviado un email de confirmación a la nueva dirección.' })
        }
    }

    const handleSavePassword = async () => {
        setPasswordMsg(null)

        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' })
            return
        }
        if (newPassword.length < 6) {
            setPasswordMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' })
            return
        }

        setLoadingPassword(true)

        // Verificar contraseña actual
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: currentPassword,
        })

        if (signInError) {
            setPasswordMsg({ type: 'error', text: 'La contraseña actual es incorrecta.' })
            setLoadingPassword(false)
            return
        }

        // Cambiar contraseña
        const { error } = await supabase.auth.updateUser({ password: newPassword })

        setLoadingPassword(false)
        if (error) {
            setPasswordMsg({ type: 'error', text: error.message })
        } else {
            setPasswordMsg({ type: 'success', text: 'Contraseña cambiada correctamente.' })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        }
    }

    const msgBox = (msg) => msg && (
        <div style={{
            background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(229,27,35,0.1)',
            border: `1px solid ${msg.type === 'success' ? '#22c55e' : 'var(--accent)'}`,
            borderRadius: '4px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            color: msg.type === 'success' ? '#22c55e' : 'var(--accent)',
            marginTop: '1rem',
        }}>
            {msg.text}
        </div>
    )

    const inputStyle = {
        width: '100%',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        borderRadius: '4px',
        padding: '0.65rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        fontFamily: 'DM Sans, sans-serif',
    }

    const labelStyle = {
        display: 'block',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        color: 'var(--text-muted)',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
    }

    const sectionStyle = {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.75rem',
        marginBottom: '1.5rem',
    }

    const sectionTitle = (text) => (
        <h2 style={{
            fontFamily: 'Bebas Neue',
            fontSize: '1.2rem',
            letterSpacing: '0.08em',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        }}>
            <span style={{ display: 'inline-block', width: '4px', height: '1rem', background: 'var(--accent)', borderRadius: '2px' }} />
            {text}
        </h2>
    )

    const btnPrimary = (label, onClick, loading) => (
        <button
            onClick={onClick}
            disabled={loading}
            style={{
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.65rem 1.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '1.25rem',
            }}>
            {loading ? 'GUARDANDO...' : label}
        </button>
    )

    if (isLoading) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>
                Cargando...
            </div>
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', padding: '5rem 2rem 4rem 2rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <button
                        onClick={() => navigate(`/profile/${user.id}`)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>
                        ←
                    </button>
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em' }}>
                        EDITAR PERFIL
                    </h1>
                </div>

                {/* Sección 1: Perfil */}
                <div style={sectionStyle}>
                    {sectionTitle('Información del perfil')}

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', flexShrink: 0, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>URL del avatar</label>
                            <input
                                type="text"
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                                placeholder="https://..."
                                style={inputStyle}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                Pega la URL de una imagen (Gravatar, imgur, etc.)
                            </p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Nombre de usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Biografía</label>
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            rows={3}
                            placeholder="Cuéntanos algo sobre ti..."
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Película Favorita (Fondo de Perfil)</label>
                        <select
                            value={backgroundMovieId}
                            onChange={e => setBackgroundMovieId(e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">-- Sin fondo personalizado --</option>
                            {favoriteItems.map(item => {
                                const idKey = `${item.type}-${item.id}`
                                return (
                                    <option key={idKey} value={idKey}>
                                        {titles[idKey] || `${item.type === 'tv' ? 'Serie' : 'Película'} #${item.id}`}
                                    </option>
                                )
                            })}
                        </select>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Elige una película de tu lista de "Favoritas" para que su imagen adorne el fondo de tu perfil.
                        </p>
                    </div>

                    {btnPrimary('GUARDAR PERFIL', handleSaveProfile, loadingProfile)}
                    {msgBox(profileMsg)}
                </div>

                {/* Sección 2: Email */}
                <div style={sectionStyle}>
                    {sectionTitle('Correo electrónico')}

                    <label style={labelStyle}>Nuevo correo</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={inputStyle}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                        Se enviará un email de confirmación a la nueva dirección.
                    </p>

                    {btnPrimary('GUARDAR CORREO', handleSaveEmail, loadingEmail)}
                    {msgBox(emailMsg)}
                </div>

                {/* Sección 3: Contraseña */}
                <div style={sectionStyle}>
                    {sectionTitle('Cambiar contraseña')}

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Contraseña actual</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Nueva contraseña</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Repetir nueva contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            style={{ ...inputStyle, borderColor: confirmPassword && newPassword !== confirmPassword ? 'var(--accent)' : 'var(--border)' }}
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.4rem' }}>
                                Las contraseñas no coinciden
                            </p>
                        )}
                    </div>

                    {btnPrimary('CAMBIAR CONTRASEÑA', handleSavePassword, loadingPassword)}
                    {msgBox(passwordMsg)}
                </div>

            </div>
        </div>
    )
}