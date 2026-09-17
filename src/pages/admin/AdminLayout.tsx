import { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import LanguageSwitcher from '../../components/LanguageSwitcher'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); toast.success(t('sign_out')); nav('/login') }

  const navItems = [
    { to: '/admin', label: t('nav_overview'), end: true, icon: '🛡️' },
    { to: '/admin/users', label: t('nav_users'), icon: '👥' },
    { to: '/admin/tickets', label: t('support_tickets'), icon: '🎫' },
  ]

  const SidebarContent = () => (
    <>
      {/* Admin banner */}
      <div style={{
        padding: '.5rem .9rem',
        background: 'repeating-linear-gradient(135deg, #7f1d1d, #7f1d1d 10px, #991b1b 10px, #991b1b 20px)',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '.65rem', fontWeight: 800, letterSpacing: '.12em',
          color: '#fecaca', textTransform: 'uppercase'
        }}>
          🛡️ {t('admin_panel')}
        </span>
      </div>

      {/* Logo */}
      <div style={{
        padding: '1.5rem 1.25rem',
        borderBottom: '1px solid rgba(255,255,255,.08)',
        background: 'rgba(0,0,0,.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(244,63,94,.4)'
          }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-.01em' }}>LogiTrack</div>
            <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', marginTop: '.1rem' }}>
              {t('admin_panel')}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '.75rem .5rem', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink
            key={item.to} to={item.to} end={item.end}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '.75rem',
              padding: '.65rem .85rem', textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,.55)',
              background: isActive ? 'rgba(244,63,94,.35)' : 'transparent',
              borderRadius: 10,
              fontWeight: isActive ? 600 : 400,
              fontSize: '.875rem',
              transition: 'all .15s',
              marginBottom: '.15rem',
              borderLeft: isActive ? '3px solid #fb7185' : '3px solid transparent',
            })}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
          </NavLink>
        ))}

        <div style={{ margin: '.9rem .35rem', borderTop: '1px solid rgba(255,255,255,.1)' }} />

        <Link
          to="/management"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: '.75rem',
            padding: '.65rem .85rem', textDecoration: 'none',
            color: '#fcd34d',
            background: 'rgba(245,158,11,.12)',
            border: '1px solid rgba(245,158,11,.3)',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '.875rem',
          }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>↪️</span>
          <span style={{ flex: 1 }}>{t('go_to_management')}</span>
        </Link>
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.75rem',
          padding: '.75rem', background: 'rgba(255,255,255,.07)',
          borderRadius: 10, marginBottom: '.75rem'
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '.85rem', flexShrink: 0
          }}>
            {user?.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)' }}>{user?.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <LanguageSwitcher />
          <button onClick={handleLogout} style={{
            flex: 1, padding: '.4rem', background: 'rgba(239,68,68,.15)',
            color: '#fca5a5', border: '1px solid rgba(239,68,68,.25)',
            borderRadius: 8, cursor: 'pointer', fontSize: '.8rem', fontWeight: 600
          }}>{t('sign_out')}</button>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop" style={{
        width: 248, background: 'linear-gradient(180deg, #1c1017 0%, #2e1015 100%)',
        color: '#fff', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
          zIndex: 150, backdropFilter: 'blur(2px)'
        }} />
      )}

      {/* Mobile sidebar */}
      <aside className="sidebar-mobile" style={{
        width: 248, background: 'linear-gradient(180deg, #1c1017 0%, #2e1015 100%)',
        color: '#fff', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -268,
        height: '100vh', zIndex: 200, transition: 'left .3s ease'
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile topbar */}
      <div className="mobile-topbar" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: 'linear-gradient(90deg, #1c1017, #2e1015)',
        color: '#fff', zIndex: 100,
        alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem'
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{
          background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer'
        }}>☰</button>
        <span style={{ fontWeight: 800 }}>🛡️ {t('admin_panel')}</span>
        <LanguageSwitcher />
      </div>

      <main style={{
        marginLeft: 248,
        flex: 1,
        minWidth: 0,
        width: 'calc(100vw - 248px)',
        maxWidth: 'calc(100vw - 248px)',
        overflowX: 'hidden',
        padding: '1.5rem',
        minHeight: '100vh',
        background: 'var(--bg)',
        boxSizing: 'border-box',
      }} className="admin-main">
        <Outlet />
      </main>

      <style>{`
  @media (max-width: 768px) {
    .sidebar-desktop { display: none !important; }
    .mobile-topbar { display: flex !important; }
    .admin-main {
      margin-left: 0 !important;
      padding-top: 72px !important;
      width: 100vw !important;
      max-width: 100vw !important;
    }
  }
  @media (min-width: 769px) {
    .sidebar-mobile { display: none !important; }
  }
`}</style>

    </div>
  )
}
