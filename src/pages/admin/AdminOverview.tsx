import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import { getTickets } from '../../api/tickets'

interface User {
  id: number
  role: string
  isActive: boolean
}

interface Stats {
  total: number
  drivers: number
  managers: number
  admins: number
  blocked: number
  openTickets: number
}

export default function AdminOverview() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<Stats>({ total: 0, drivers: 0, managers: 0, admins: 0, blocked: 0, openTickets: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      getTickets(),
    ]).then(([usersRes, tickets]) => {
      const users: User[] = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data ?? [])
      const ticketList = Array.isArray(tickets) ? tickets : []

      setStats({
        total: users.length,
        drivers: users.filter(u => u.role === 'Driver').length,
        managers: users.filter(u => u.role === 'Manager').length,
        admins: users.filter(u => u.role === 'Admin').length,
        blocked: users.filter(u => !u.isActive).length,
        openTickets: ticketList.filter(tk => tk.status === 'Open' || tk.status === 'InProgress').length,
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: t('total_users'), value: stats.total, icon: '👥', color: '#4338ca', bg: '#eef2ff', path: '/admin/users' },
    { label: t('drivers'), value: stats.drivers, icon: '🚛', color: '#1e40af', bg: '#dbeafe', path: '/admin/users' },
    { label: t('managers'), value: stats.managers, icon: '📋', color: '#7e22ce', bg: '#f3e8ff', path: '/admin/users' },
    { label: t('admins'), value: stats.admins, icon: '🛡️', color: '#9d174d', bg: '#fce7f3', path: '/admin/users' },
    { label: t('blocked_users'), value: stats.blocked, icon: '🔒', color: '#dc2626', bg: '#fee2e2', path: '/admin/users' },
    { label: t('open_tickets'), value: stats.openTickets, icon: '🎫', color: '#d97706', bg: '#fffbeb', path: '/admin/tickets' },
  ]

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <style>{`
        .admin-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .85rem;
        }
        @media (max-width: 640px) {
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr); gap: .6rem; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.5rem',
        boxShadow: '0 6px 20px rgba(153,27,27,.3)',
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
          🛡️ {t('nav_overview')}
        </h1>
        <p style={{ opacity: .85, fontSize: '.82rem', margin: 0 }}>
          {t('admin_overview_subtitle')}
        </p>
      </div>

      {/* Stat cards */}
      <div className="admin-stat-grid" style={{ marginBottom: '1.5rem' }}>
        {statCards.map(c => (
          <div
            key={c.label}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => nav(c.path)}>
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>
                {c.value}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '.25rem' }}>
                {c.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem' }}>
          {t('quick_actions')}
        </h2>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => nav('/admin/users')}>
            👥 {t('manage_users')}
          </button>
          <button className="btn btn-outline" onClick={() => nav('/admin/tickets')}>
            🎫 {t('view_tickets')}
          </button>
          <button className="btn btn-outline" onClick={() => nav('/management')}>
            ↪️ {t('go_to_management')}
          </button>
        </div>
      </div>
    </div>
  )
}
