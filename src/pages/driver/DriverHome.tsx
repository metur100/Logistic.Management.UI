import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyStats, getMyActiveTrip, DriverStats, DriverActiveTrip } from '../../api/driver/driver'
import { STATUS_LABELS } from '../../api/driver/driver'

export default function DriverHome() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [activeTrip, setActiveTrip] = useState<DriverActiveTrip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyStats(), getMyActiveTrip()])
      .then(([s, a]) => { setStats(s); setActiveTrip(a) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  const lang = i18n.language === 'bs' ? 'bs' : 'en'

  const statCards = stats ? [
    { label: t('total_trips'), value: stats.totalTrips, icon: '🚛', color: '#2563eb', bg: '#eff6ff' },
    { label: t('completed'), value: stats.completedTrips, icon: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: t('in_progress'), value: stats.inProgressTrips, icon: '🔄', color: '#d97706', bg: '#fffbeb' },
    { label: t('total_distance'), value: `${stats.totalDistanceKm || 0} km`, icon: '📍', color: '#7c3aed', bg: '#f5f3ff' },
  ] : []

  return (
    <div>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '.25rem' }}>
              {t('welcome_driver')} 👋
            </h1>
            <p style={{ opacity: .75, fontSize: '.9rem' }}>
              {new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            className="btn"
            onClick={() => nav('/driver/events')}
            style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.3)' }}>
            📅 {t('upcoming_events')}
          </button>
        </div>
      </div>

      {/* Active Trip */}
      {activeTrip && (
        <div
          onClick={() => nav(`/driver/trips/${activeTrip.id}`)}
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
            color: 'white', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', marginBottom: '1.5rem', cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(37,99,235,.35)',
            position: 'relative', overflow: 'hidden'
          }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,.07)'
          }} />
          <div style={{ fontSize: '.75rem', opacity: .75, marginBottom: '.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            🚛 {t('active_trip')}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.5rem' }}>
            {activeTrip.originLocation} → {activeTrip.destinationLocation}
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,.2)', borderRadius: 999,
              padding: '.2rem .75rem', fontSize: '.78rem', fontWeight: 600
            }}>
              {STATUS_LABELS[activeTrip.status]?.[lang] || activeTrip.status}
            </span>
            {activeTrip.distanceKm && (
              <span style={{ opacity: .8, fontSize: '.85rem' }}>📍 {activeTrip.distanceKm} km</span>
            )}
            <span style={{ opacity: .7, fontSize: '.8rem', marginLeft: 'auto' }}>
              {t('tap_to_view')} →
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem', marginBottom: '1.5rem'
        }}>
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>{t('quick_actions')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '.75rem' }}>
          {[
            { label: t('view_my_trips'), icon: '🚛', path: '/driver/trips', color: '#2563eb' },
            { label: t('upcoming_events'), icon: '📅', path: '/driver/events', color: '#7c3aed' },
            { label: t('messages'), icon: '💬', path: '/driver/messages', color: '#db2777' },
          ].map(a => (
            <button
              key={a.path}
              onClick={() => nav(a.path)}
              style={{
                background: 'var(--surface2)', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '1rem',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all .18s', display: 'flex', flexDirection: 'column', gap: '.5rem'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = a.color
                ;(e.currentTarget as HTMLButtonElement).style.background = '#fff'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
              }}>
              <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
