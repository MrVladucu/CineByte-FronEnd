import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function SessionTracker() {
    const { user } = useAuth()
    const sessionIdRef = useRef(null)
    const startTimeRef = useRef(Date.now())

    useEffect(() => {
        let intervalId = null

        async function startSession() {
            // Create a new session row
            const { data, error } = await supabase
                .from('site_sessions')
                .insert({ user_id: user?.id || null })
                .select('id')
                .single()

            if (!error && data) {
                sessionIdRef.current = data.id
                
                // Ping every 30 seconds
                intervalId = setInterval(async () => {
                    if (sessionIdRef.current) {
                        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
                        await supabase
                            .from('site_sessions')
                            .update({ 
                                last_ping: new Date().toISOString(),
                                duration_seconds: duration 
                            })
                            .eq('id', sessionIdRef.current)
                    }
                }, 30000)
            }
        }

        startSession()

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [user?.id]) // Restart session if user logs in/out

    return null // Invisible component
}