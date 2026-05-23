import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Suspense, lazy, useEffect } from 'react'
import Footer from './components/Footer'
import AdminRoute from './components/AdminRoute'
import SessionTracker from './components/SessionTracker'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Movie = lazy(() => import('./pages/Movie'))
const Actor = lazy(() => import('./pages/Actor'))
const Profile = lazy(() => import('./pages/Profile'))
const Search = lazy(() => import('./pages/Search'))
const AllSeasons = lazy(() => import('./pages/AllSeasons'))
const SeasonDetails = lazy(() => import('./pages/SeasonDetails'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function ProtectedRoute({ children }) {
    const { user } = useAuth()
    return user ? children : <Navigate to="/login" />
}

function PageLoader() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: 'var(--accent)',
                        animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
            </div>
        </div>
    )
}

function AnimatedRoutes() {
    const location = useLocation()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

    return (
        <div key={location.pathname} className="page-transition-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/movie/:id" element={<ProtectedRoute><Movie type="movie" /></ProtectedRoute>} />
                    <Route path="/tv/:id" element={<ProtectedRoute><Movie type="tv" /></ProtectedRoute>} />
                    <Route path="/tv/:id/seasons" element={<ProtectedRoute><AllSeasons /></ProtectedRoute>} />
                    <Route path="/tv/:id/season/:seasonNumber" element={<ProtectedRoute><SeasonDetails /></ProtectedRoute>} />
                    <Route path="/actor/:id" element={<ProtectedRoute><Actor /></ProtectedRoute>} />
                    <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                    <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                </Routes>
            </Suspense>
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <SessionTracker />
                <AnimatedRoutes />
                <Footer />
            </div>
        </BrowserRouter>
    )
}