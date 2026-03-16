import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Management
import ManagementLayout from './pages/management/ManagementLayout'
import Dashboard from './pages/management/Dashboard'
import Trips from './pages/management/Trips'
import TripForm from './pages/management/TripForm'
import TripDetail from './pages/management/TripDetail'
import CargoPage from './pages/management/CargoPage'
import VehiclesPage from './pages/management/VehiclesPage'
import UsersPage from './pages/management/UsersPage'
import MessagesPage from './pages/management/MessagesPage'
import IncidentsPage from './pages/management/IncidentsPage'

// Driver
import DriverLayout from './pages/driver/DriverLayout'
import DriverHome from './pages/driver/DriverHome'
import DriverTrips from './pages/driver/DriverTrips'
import DriverTripDetail from './pages/driver/DriverTripDetail'
import DriverEvents from './pages/driver/DriverEvents'
import DriverMessages from './pages/driver/DriverMessages'
import DriverIncidentReport from './pages/driver/DriverIncidentReport'

// Auth
import LoginPage from './pages/LoginPage'

interface PrivateRouteProps {
  children: React.ReactNode
  roles?: string[]
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', flexDirection: 'column', gap: '1rem',
      background: 'var(--bg)'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid #e2e8f0',
        borderTopColor: '#2563eb',
        animation: 'spin .7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'Driver'
    ? <Navigate to="/driver" replace />
    : <Navigate to="/management" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }
          }}
        />
        <Routes>
          {/* ── Public ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* ── Management ─────────────────────────────────── */}
          <Route
            path="/management"
            element={
              <PrivateRoute roles={['Admin', 'Manager']}>
                <ManagementLayout />
              </PrivateRoute>
            }>
            <Route index                  element={<Dashboard />} />
            <Route path="trips"           element={<Trips />} />
            <Route path="trips/new"       element={<TripForm />} />
            <Route path="trips/:id"       element={<TripDetail />} />
            <Route path="trips/:id/edit"  element={<TripForm />} />
            <Route path="cargo"           element={<CargoPage />} />
            <Route path="vehicles"        element={<VehiclesPage />} />
            <Route path="users"           element={<UsersPage />} />
            <Route path="messages"        element={<MessagesPage />} />  
            <Route path="incidents"       element={<IncidentsPage />} />  
          </Route>

          {/* ── Driver ─────────────────────────────────────── */}
          <Route
            path="/driver"
            element={
              <PrivateRoute roles={['Driver']}>
                <DriverLayout />
              </PrivateRoute>
            }>
            <Route index                              element={<DriverHome />} />
            <Route path="trips"                       element={<DriverTrips />} />
            <Route path="trips/:id"                   element={<DriverTripDetail />} />
            <Route path="trips/:tripId/incident"      element={<DriverIncidentReport />} />  {/* ← NEW */}
            <Route path="events"                      element={<DriverEvents />} />           {/* ← NEW */}
            <Route path="messages"                    element={<DriverMessages />} />         {/* ← NEW */}
            <Route path="incident"                    element={<DriverIncidentReport />} />   {/* ← NEW (no tripId) */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
