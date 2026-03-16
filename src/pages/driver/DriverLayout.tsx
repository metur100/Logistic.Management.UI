import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function DriverLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnread = () => {
      api.get('/messages/unread-count')
        .then(r => setUnreadCount(r.data.count || 0))
        .catch(() => {})
    }
    fetchUnread()
    const iv = setInterval(fetchUnread, 30000)
    return () => clearInterval(iv)
  }, [])

  const handleLogout = () => { logout(); nav('/login') }

  const navLinks = [
    { to: '/driver',          label: t('home'),             icon: '🏠', end: true },
    { to: '/driver/trips',    label: t('my_trips'),         icon: '🚛' },
    { to: '/driver/incident',label: t('incidents'),        icon: '🚨' },
    { to: '/driver/events',   label: t('upcoming_events'),  icon: '📅' },
    { to: '/driver/messages', label: t('messages'),         icon: '💬', badge: unreadCount },
  ]

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,.1)',
        background: 'rgba(0,0,0,.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem'
          }}>🚛</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-.01em' }}>LogiTrack</div>
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>
              {t('driver_portal')}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '.75rem 0', overflowY: 'auto' }}>
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setMenuOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.7rem 1.25rem', textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
              background: isActive ? 'rgba(37,99,235,.4)' : 'transparent',
              borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
              fontWeight: isActive ? 600 : 400,
              fontSize: '.875rem', transition: 'all .15s',
              margin: '.1rem .5rem',
              borderRadius: '0 8px 8px 0',
            })}>
            <span style={{ fontSize: '1rem' }}>{link.icon}</span>
            <span style={{ flex: 1 }}>{link.label}</span>
            {link.badge ? (
              <span style={{
                background: '#ef4444', color: '#fff',
                borderRadius: 999, fontSize: '.65rem', fontWeight: 700,
                padding: '.1rem .45rem', minWidth: 18, textAlign: 'center'
              }}>
                {link.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* User + Footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          padding: '.75rem', background: 'rgba(255,255,255,.08)',
          borderRadius: 10, marginBottom: '.75rem'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '.9rem', flexShrink: 0, color: '#fff'
          }}>
            {user?.fullName?.[0]?.toUpperCase() || 'D'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontWeight: 600, fontSize: '.85rem',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)' }}>Driver</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <select
            value={i18n.language}
            onChange={e => i18n.changeLanguage(e.target.value)}
            style={{
              flex: 1, background: 'rgba(255,255,255,.1)', color: 'white',
              border: '1px solid rgba(255,255,255,.2)', borderRadius: 8,
              padding: '.35rem .5rem', cursor: 'pointer', fontSize: '.8rem'
            }}>
            <option value="en">🇬🇧 EN</option>
            <option value="bs">🇧🇦 BS</option>
          </select>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239,68,68,.2)', border: '1px solid rgba(239,68,68,.3)',
              color: '#fca5a5', padding: '.35rem .65rem', borderRadius: 8,
              cursor: 'pointer', fontSize: '.8rem', fontWeight: 600
            }}>
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="sidebar-desktop"
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)',
          color: '#fff', position: 'fixed', top: 0, left: 0,
          height: '100vh', zIndex: 100,
          display: 'flex', flexDirection: 'column'
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
            zIndex: 150, backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="sidebar-mobile"
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e3a5f 100%)',
          color: '#fff', position: 'fixed', top: 0,
          left: menuOpen ? 0 : -260, height: '100vh',
          zIndex: 200, transition: 'left .3s ease',
          display: 'flex', flexDirection: 'column'
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <header
        className="mobile-topbar"
        style={{
          display: 'none', position: 'fixed', top: 0, left: 0, right: 0,
          height: 56,
          background: 'linear-gradient(90deg, #0f172a, #1e3a5f)',
          color: '#fff', zIndex: 100,
          alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem'
        }}>
        <button
          onClick={() => setMenuOpen(true)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>
          ☰
        </button>
        <span style={{ fontWeight: 800, fontSize: '1rem' }}>🚛 LogiTrack</span>
        <div style={{ width: 36 }} />
      </header>

      {/* Main */}
      <main
        className="driver-main"
        style={{ marginLeft: 240, flex: 1, padding: '1.5rem', minHeight: '100vh' }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar   { display: flex !important; }
          .driver-main     { margin-left: 0 !important; padding-top: 72px !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}
