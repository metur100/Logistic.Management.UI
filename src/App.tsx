import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ManagementLayout from './pages/management/ManagementLayout'
import DriverTripDetail from './pages/driver/DriverTripDetail'
import Trips from './pages/management/Trips'
import TripForm from './pages/management/TripForm'
import TripDetail from './pages/management/TripDetail'
import CargoPage from './pages/management/CargoPage'

import UsersPage from './pages/management/UsersPage'
import DriverLayout from './pages/driver/DriverLayout'
import DriverHome from './pages/driver/DriverHome'

import LoginPage from './pages/LoginPage'
import Dashboard from './pages/management/Dashboard'
import VehiclesPage from './pages/management/VehiclesPage'
import DriverTrips from './pages/driver/DriverTrips'

interface PrivateRouteProps {
  children: React.ReactNode
  roles?: string[]
}

function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>
      Loading...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'Driver' ? <Navigate to="/driver" replace /> : <Navigate to="/management" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/management" element={<PrivateRoute roles={['Admin', 'Manager']}><ManagementLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="trips" element={<Trips />} />
            <Route path="trips/new" element={<TripForm />} />
            <Route path="trips/:id" element={<TripDetail />} />
            <Route path="trips/:id/edit" element={<TripForm />} />
            <Route path="cargo" element={<CargoPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
          <Route path="/driver" element={<PrivateRoute roles={['Driver']}><DriverLayout /></PrivateRoute>}>
            <Route index element={<DriverHome />} />
            <Route path="trips" element={<DriverTrips />} />
            <Route path="trips/:id" element={<DriverTripDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}