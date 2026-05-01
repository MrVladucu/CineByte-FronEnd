import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Navbar from './Navbar'

export default function AdminRoute({ children }) {
    const { user } = useAuth()
    const [isAdmin, setIsAdmin] = useState(null) // null = loading
    
    useEffect(() => {
        if (!user) {
            setIsAdmin(false)
            return
        }
        
        async function checkRole() {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()
            
            setIsAdmin(data?.role === 'admin')
        }
        
        checkRole()
    }, [user])

    if (isAdmin === null) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
                <Navbar />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-muted)' }}>Comprobando permisos...</div>
            </div>
        )
    }

    return isAdmin ? children : <Navigate to="/" />
}
