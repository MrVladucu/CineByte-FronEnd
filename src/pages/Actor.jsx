import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../components/Navbar'
import MovieCard from '../components/Moviecard'
import { tmdbService } from '../services/tmdb'
import { Skeleton } from 'primereact/skeleton'
import { motion } from 'framer-motion'

function ScrollReveal({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    )
}

export default function Actor() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [isBioExpanded, setIsBioExpanded] = useState(false)

    const { data: personData, isLoading: personLoading } = useQuery({
        queryKey: ['person', id],
        queryFn: () => tmdbService.getPersonDetails(id),
    })

    const { data: creditsData, isLoading: creditsLoading } = useQuery({
        queryKey: ['person-credits', id],
        queryFn: () => tmdbService.getPersonCombinedCredits(id),
    })

    if (personLoading || creditsLoading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ width: '100%', maxWidth: '1280px', margin: '100px auto 0 auto', padding: '2rem', display: 'flex', gap: '3rem' }}>
                    <div style={{ flex: 1 }}>
                        <Skeleton width="50%" height="4rem" style={{ marginBottom: '2rem' }} />
                        <Skeleton width="100%" height="1.5rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="100%" height="1.5rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="80%" height="1.5rem" style={{ marginBottom: '3rem' }} />
                        <Skeleton width="30%" height="2rem" style={{ marginBottom: '1rem' }} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Skeleton width="150px" height="225px" borderRadius="8px" />
                            <Skeleton width="150px" height="225px" borderRadius="8px" />
                            <Skeleton width="150px" height="225px" borderRadius="8px" />
                        </div>
                    </div>
                    <div style={{ width: '300px', flexShrink: 0 }}>
                        <Skeleton width="100%" height="450px" borderRadius="12px" style={{ marginBottom: '2rem' }} />
                        <Skeleton width="60%" height="2rem" style={{ marginBottom: '1rem' }} />
                        <Skeleton width="80%" height="1.5rem" style={{ marginBottom: '0.5rem' }} />
                        <Skeleton width="70%" height="1.5rem" />
                    </div>
                </div>
            </div>
        )
    }

    const person = personData?.data
    const credits = creditsData?.data
    const externalIds = person?.external_ids

    if (!person) return null

    const profileUrl = person.profile_path
        ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
        : null

    // Sort credits by popularity for "Known For"
    const knownFor = credits?.cast
        ?.sort((a, b) => b.popularity - a.popularity)
        ?.slice(0, 8) || []

    // Sort credits by date descending for "Acting History"
    const actingHistory = credits?.cast
        ?.filter(c => c.release_date || c.first_air_date)
        ?.sort((a, b) => {
            const dateA = new Date(b.release_date || b.first_air_date)
            const dateB = new Date(a.release_date || a.first_air_date)
            return dateA - dateB
        }) || []

    // Calculate age
    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const ageDifMs = Date.now() - new Date(birthday).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const getGender = (genderId) => {
        switch(genderId) {
            case 1: return 'Mujer';
            case 2: return 'Hombre';
            case 3: return 'No binario';
            default: return 'No especificado';
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <Navbar />

            <div style={{ width: '100%', maxWidth: '1400px', margin: '100px auto 0 auto', padding: '0 2rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                
                {/* Main Content (now on the left) */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                    style={{ flex: 1, minWidth: '0' }}
                >
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(3rem, 5vw, 4rem)', lineHeight: 1, marginBottom: '1.5rem' }}>
                        {person.name}
                    </h1>

                    {person.biography && (
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
                                BIOGRAFÍA
                            </h2>
                            {(() => {
                                const paragraphs = person.biography.split('\n\n').filter(p => p.trim() !== '');
                                const isLong = paragraphs.length > 2;
                                const displayBio = (isLong && !isBioExpanded) ? paragraphs.slice(0, 2).join('\n\n') + '...' : person.biography;

                                return (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-line', marginBottom: '0.5rem' }}>
                                            {displayBio}
                                        </p>
                                        {isLong && !isBioExpanded && (
                                            <button 
                                                onClick={() => setIsBioExpanded(true)}
                                                style={{ 
                                                    background: 'transparent', 
                                                    border: 'none', 
                                                    color: 'var(--accent)', 
                                                    fontWeight: 600, 
                                                    fontSize: '1rem', 
                                                    cursor: 'pointer', 
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontFamily: 'inherit'
                                                }}
                                                className="hover:underline"
                                            >
                                                Leer Más <i className="pi pi-angle-right" style={{ fontSize: '0.8rem', marginTop: '0.1rem' }}></i>
                                            </button>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    )}

                    {knownFor.length > 0 && (
                        <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
                                CONOCIDO/A POR
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.5rem' }}>
                                {knownFor.map(movie => (
                                    <MovieCard key={movie.id + movie.media_type} movie={movie} type={movie.media_type || 'movie'} />
                                ))}
                            </div>
                        </div>
                    )}

                    {actingHistory.length > 0 && (
                        <ScrollReveal>
                        <div>
                            <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.08em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ display: 'inline-block', width: '4px', height: '1.2rem', background: 'var(--accent)', borderRadius: '2px' }} />
                                FILMOGRAFƛA
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', padding: '1px', borderRadius: '8px', overflow: 'hidden' }}>
                                {actingHistory.map(credit => {
                                    const year = (credit.release_date || credit.first_air_date)?.split('-')[0] || '----';
                                    const title = credit.title || credit.name;
                                    const role = credit.character || '';

                                    return (
                                        <div key={credit.credit_id} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem', 
                                            background: 'var(--bg-elevated)', 
                                            padding: '1rem 1.5rem',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(229, 27, 35, 0.05)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                        >
                                            <span style={{ width: '60px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{year}</span>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{title}</p>
                                                {role && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>como {role}</p>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        </ScrollReveal>
                    )}
                </motion.div>

                {/* Sidebar */}
                <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                    style={{ width: '300px', flexShrink: 0 }}
                >
                    {profileUrl ? (
                        <motion.img 
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            src={profileUrl} 
                            alt={person.name} 
                            style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', marginBottom: '1.5rem', border: '1px solid var(--border)' }} 
                        />
                    ) : (
                        <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg-elevated)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                            👤
                        </div>
                    )}

                    {/* Social Links */}
                    {externalIds && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', fontSize: '1.5rem' }}>
                            {externalIds.facebook_id && (
                                <a href={`https://facebook.com/${externalIds.facebook_id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--accent)'} onMouseOut={e => e.target.style.color='var(--text)'}>
                                    <i className="pi pi-facebook"></i>
                                </a>
                            )}
                            {externalIds.twitter_id && (
                                <a href={`https://twitter.com/${externalIds.twitter_id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--accent)'} onMouseOut={e => e.target.style.color='var(--text)'}>
                                    <i className="pi pi-twitter"></i>
                                </a>
                            )}
                            {externalIds.instagram_id && (
                                <a href={`https://instagram.com/${externalIds.instagram_id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--accent)'} onMouseOut={e => e.target.style.color='var(--text)'}>
                                    <i className="pi pi-instagram"></i>
                                </a>
                            )}

                        </div>
                    )}

                    <h3 style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.05em', marginBottom: '1rem' }}>Info. Personal</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>Conocido/a por</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{person.known_for_department}</p>
                        </div>
                        
                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>Créditos Conocidos</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{credits?.cast?.length || 0}</p>
                        </div>

                        <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>Género</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{getGender(person.gender)}</p>
                        </div>

                        {person.birthday && (
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>Fecha de nacimiento</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {new Date(person.birthday).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} 
                                    {person.deathday ? '' : ` (${calculateAge(person.birthday)} años)`}
                                </p>
                            </div>
                        )}

                        {person.deathday && (
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>Fecha de fallecimiento</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {new Date(person.deathday).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        )}

                        {person.place_of_birth && (
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>Lugar de nacimiento</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{person.place_of_birth}</p>
                            </div>
                        )}

                        {person.also_known_as && person.also_known_as.length > 0 && (
                            <div>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem' }}>También conocido/a como</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {person.also_known_as.slice(0, 5).map((name, i) => (
                                        <p key={i} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{name}</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </div>
    )
}
