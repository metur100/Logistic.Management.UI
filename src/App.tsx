import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PageLoader } from './components/ui'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AcceptInvitePage from './pages/AcceptInvitePage'

import Shell from './components/Shell'
import Dashboard from './pages/management/Dashboard'
import Trips from './pages/management/Trips'
import TripForm from './pages/management/TripForm'
import TripDetail from './pages/management/TripDetail'
import CargoPage from './pages/management/CargoPage'
import VehiclesPage from './pages/management/VehiclesPage'
import DriversPage from './pages/management/DriversPage'
import MessagesPage from './pages/management/MessagesPage'
import IncidentsPage from './pages/management/IncidentsPage'
import CalendarPage from './pages/management/CalendarPage'
import SupportPage from './pages/management/SupportPage'
import SettingsPage from './pages/management/SettingsPage'

import AdminOverview from './pages/admin/AdminOverview'
import CompaniesPage from './pages/admin/CompaniesPage'
import CompanyDetailPage from './pages/admin/CompanyDetailPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminTicketsPage from './pages/admin/AdminTicketsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

import DriverHome from './pages/driver/DriverHome'
import DriverTrips from './pages/driver/DriverTrips'
import DriverTripDetail from './pages/driver/DriverTripDetail'
import DriverCalendar from './pages/driver/DriverCalendar'
import DriverMessages from './pages/driver/DriverMessages'
import DriverIncidents from './pages/driver/DriverIncidents'
import DriverSupport from './pages/driver/DriverSupport'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}><PageLoader /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'Admin') return <Navigate to="/admin" replace />
  if (user.role === 'Manager') return <Navigate to="/management" replace />
  if (user.role === 'Driver') return <Navigate to="/driver" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            className: 'toast-bar',
            success: { iconTheme: { primary: '#5ee2b3', secondary: '#101922' } },
            error: { iconTheme: { primary: '#ff8b80', secondary: '#101922' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route
            path="/management"
            element={<PrivateRoute roles={['Manager']}><Shell variant="management" /></PrivateRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="trips" element={<Trips />} />
            <Route path="trips/new" element={<TripForm />} />
            <Route path="trips/:id" element={<TripDetail />} />
            <Route path="trips/:id/edit" element={<TripForm />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="cargo" element={<CargoPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/admin"
            element={<PrivateRoute roles={['Admin']}><Shell variant="admin" /></PrivateRoute>}
          >
            <Route index element={<AdminOverview />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/:id" element={<CompanyDetailPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="tickets" element={<AdminTicketsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route
            path="/driver"
            element={<PrivateRoute roles={['Driver']}><Shell variant="driver" /></PrivateRoute>}
          >
            <Route index element={<DriverHome />} />
            <Route path="trips" element={<DriverTrips />} />
            <Route path="trips/:id" element={<DriverTripDetail />} />
            <Route path="calendar" element={<DriverCalendar />} />
            <Route path="messages" element={<DriverMessages />} />
            <Route path="incidents" element={<DriverIncidents />} />
            <Route path="support" element={<DriverSupport />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
