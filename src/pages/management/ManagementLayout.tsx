import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function ManagementLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); toast.success(t('sign_out')); nav('/login') }

  const navItems = [
    { to: '/management', label: t('nav_dashboard'), end: true },
    { to: '/management/trips', label: t('nav_trips') },
    { to: '/management/cargo', label: t('nav_cargo') },
    { to: '/management/vehicles', label: t('nav_vehicles') },
    { to: '/management/users', label: t('nav_users') },
  ]

  const sidebarContent = (
    <>
      <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>🚛 {t('app_name')}</div>
          <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)', marginTop: '.25rem' }}>{t('management_portal')}</div>
        </div>
        <button onClick={() => setSidebarOpen(false)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }} className="sidebar-close">✕</button>
      </div>
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'block', padding: '.65rem 1.25rem',
              color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
              background: isActive ? 'rgba(59,79,216,.5)' : 'transparent',
              borderLeft: isActive ? '3px solid #3b4fd8' : '3px solid transparent',
              fontSize: '.9rem', transition: 'all .2s', textDecoration: 'none'
            })}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <LanguageSwitcher />
        <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.7)' }}>{user?.fullName} ({user?.role})</div>
        <button onClick={handleLogout} style={{ width: '100%', padding: '.5rem', background: 'rgba(239,68,68,.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, cursor: 'pointer' }}>{t('sign_out')}</button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar-desktop" style={{
        width: 240, background: '#1a1a2e', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100
      }}>
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 150
        }} />
      )}

      <aside className="sidebar-mobile" style={{
        width: 240, background: '#1a1a2e', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -260,
        height: '100vh', zIndex: 200,
        transition: 'left .3s ease'
      }}>
        {sidebarContent}
      </aside>

      <div className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: '#1a1a2e', color: '#fff', zIndex: 100,
        alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem'
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
        <span style={{ fontWeight: 700 }}>🚛 {t('app_name')}</span>
        <LanguageSwitcher />
      </div>

      <main style={{ marginLeft: 240, flex: 1, padding: '1.5rem', minHeight: '100vh' }} className="management-main">
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .management-main { margin-left: 0 !important; padding-top: 72px !important; }
        }
        @media (min-width: 769px) {
          .sidebar-mobile { display: none !important; }
        }
      `}</style>
    </div>
  )
}