import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  AlertTriangle, Building2, CalendarDays, Home, LayoutDashboard, LifeBuoy,
  LogOut, Menu, MessageSquare, Package, Route, Settings, ShieldCheck,
  Truck, Users, X, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Avatar, LanguageSelect, Logo } from './ui'

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: boolean }

export default function Shell({ variant }: { variant: 'management' | 'admin' | 'driver' }) {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    if (variant === 'admin' || !user) return
    let active = true
    const load = () => api.get('/messages/unread-count')
      .then(r => { if (active) setUnread(r.data?.count ?? 0) })
      .catch(() => { })
    load()
    const id = window.setInterval(load, 30000)
    return () => { active = false; window.clearInterval(id) }
  }, [variant, user])

  const managementNav: NavItem[] = [
    { to: '/management', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/management/trips', label: t('nav.transports'), icon: Route },
    { to: '/management/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/management/cargo', label: t('nav.cargo'), icon: Package },
    { to: '/management/vehicles', label: t('nav.fleet'), icon: Truck },
    { to: '/management/drivers', label: t('nav.drivers'), icon: Users },
    { to: '/management/messages', label: t('nav.messages'), icon: MessageSquare, badge: true },
    { to: '/management/incidents', label: t('nav.incidents'), icon: AlertTriangle },
    { to: '/management/support', label: t('nav.support'), icon: LifeBuoy },
  ]

  const adminNav: NavItem[] = [
    { to: '/admin', label: t('nav.overview'), icon: LayoutDashboard, end: true },
    { to: '/admin/companies', label: t('nav.companies'), icon: Building2 },
    { to: '/admin/users', label: t('nav.users'), icon: Users },
    { to: '/admin/tickets', label: t('nav.support'), icon: LifeBuoy },
  ]

  const driverNav: NavItem[] = [
    { to: '/driver', label: t('nav.home'), icon: Home, end: true },
    { to: '/driver/trips', label: t('nav.my_transports'), icon: Route },
    { to: '/driver/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/driver/messages', label: t('nav.messages'), icon: MessageSquare, badge: true },
    { to: '/driver/incidents', label: t('nav.incidents'), icon: AlertTriangle },
  ]

  const items = variant === 'management' ? managementNav : variant === 'admin' ? adminNav : driverNav
  const settingsTo = variant === 'management' ? '/management/settings' : variant === 'admin' ? '/admin/settings' : '/driver/support'
  const settingsLabel = variant === 'driver' ? t('nav.support') : t('nav.settings')
  const SettingsIcon = variant === 'driver' ? LifeBuoy : Settings

  const handleLogout = () => {
    logout()
    toast.success(t('auth.signed_out'))
    nav('/login', { replace: true })
  }

  const roleLabel = user?.role === 'Admin' ? t('role.admin')
    : user?.role === 'Manager' ? t('role.manager') : t('role.driver')

  const navList = (
    <>
      <div className="nav-label">{variant === 'admin' ? t('nav.platform') : t('nav.workspace')}</div>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon />
          <span className="truncate">{item.label}</span>
          {item.badge && unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
        </NavLink>
      ))}
      <div className="nav-label">{variant === 'admin' ? t('nav.system') : t('nav.account')}</div>
      <NavLink to={settingsTo} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <SettingsIcon />
        <span>{settingsLabel}</span>
      </NavLink>
    </>
  )

  return (
    <div className="app-shell">
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <Logo />
          <div className="workspace-chip">
            {variant === 'admin' ? (
              <>
                <div className="eyebrow">Platform</div>
                <span className="admin-mark"><ShieldCheck size={12} /> {t('role.admin')}</span>
              </>
            ) : (
              <>
                <div className="eyebrow">{variant === 'driver' ? t('nav.driver_portal') : t('nav.company')}</div>
                <strong title={user?.companyName ?? ''}>{user?.companyName ?? t('common.company')}</strong>
              </>
            )}
          </div>

          <nav className="side-nav">{navList}</nav>

          <div className="sidebar-foot">
            <div className="user-card">
              <Avatar name={user?.fullName} tone={variant === 'admin' ? 'violet' : 'orange'} />
              <div className="meta">
                <strong>{user?.fullName}</strong>
                <span>{roleLabel}</span>
              </div>
              <button className="logout-btn" onClick={() => setOpen(false)} aria-label="Close menu" style={{ display: 'none' }}>
                <X size={15} />
              </button>
            </div>
            <div className="sidebar-actions">
              <LanguageSelect dark />
              <button className="logout-btn" onClick={handleLogout} aria-label={t('auth.sign_out')} title={t('auth.sign_out')}>
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <Logo />
          <div className="top-actions">
            <LanguageSelect dark />
            <button className="icon-btn" onClick={() => nav(settingsTo)} aria-label={settingsLabel}>
              <SettingsIcon />
            </button>
          </div>
        </header>

        <main className={`${variant === 'driver' ? 'has-bottom-nav' : ''}`}>
          <Outlet />
        </main>

        {variant === 'driver' && (
          <nav className="driver-bottom-nav">
            {driverNav.slice(0, 5).map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'active' : ''}>
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}

