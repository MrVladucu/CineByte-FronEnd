import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Movie from './pages/Movie'
import Actor from './pages/Actor'
import Profile from './pages/Profile'
import Search from './pages/Search'
import AllSeasons from './pages/AllSeasons'
import SeasonDetails from './pages/SeasonDetails'
import Footer from './components/Footer'
import EditProfile from './pages/EditProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminRoute from './components/AdminRoute'
import SessionTracker from './components/SessionTracker'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
    </div>
  )
}

export default function App() {
    console.log('App renderizando')

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

