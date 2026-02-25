import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

export default function DriverLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); nav('/login') }

  const navLinks = [
    { to: '/driver', label: t('home'), icon: '🏠', end: true },
    { to: '/driver/trips', label: t('my_trips'), icon: '🚛' },
    { to: '/driver/fuel', label: t('fuel_requests'), icon: '⛽' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Top Bar */}
      <header style={{ background: '#1e3a5f', color: 'white', padding: '0 1.5rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', display: 'none' }} className="mobile-menu-btn">☰</button>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>🚛 {t('driver_portal')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
            <option value="en">EN</option>
            <option value="bs">BS</option>  {/* ← was "sw" */}
          </select>

          <span style={{ fontSize: '0.9rem', opacity: 0.85 }}>{user?.fullName}</span>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer' }}>
            {t('logout')}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{ width: '220px', background: 'white', minHeight: 'calc(100vh - 60px)', borderRight: '1px solid #e5e7eb', padding: '1rem 0', flexShrink: 0 }}>
          {navLinks.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1.25rem', textDecoration: 'none',
                color: isActive ? '#2563eb' : '#374151',
                background: isActive ? '#eff6ff' : 'transparent',
                borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400
              })}>
              <span>{link.icon}</span> {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowX: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}