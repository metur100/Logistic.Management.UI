import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyStats, getMyActiveTrip, DriverStats, DriverActiveTrip } from '../../api/driver/driver'

export default function DriverHome() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [activeTrip, setActiveTrip] = useState<DriverActiveTrip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyStats(),
      getMyActiveTrip()
    ]).then(([statsRes, activeRes]) => {
      setStats(statsRes)
      setActiveTrip(activeRes)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('welcome_driver')}</h1>

      {/* Active Trip Banner */}
      {activeTrip && (
        <div
          onClick={() => nav(`/driver/trips/${activeTrip.id}`)}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: 'white', borderRadius: '0.75rem', padding: '1.5rem',
            marginBottom: '1.5rem', cursor: 'pointer'
          }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>🚛 {t('active_trip')}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {activeTrip.originLocation} → {activeTrip.destinationLocation}
          </div>
          <div style={{ opacity: 0.85, marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {activeTrip.distanceKm ? `${activeTrip.distanceKm} km · ` : ''}{t('tap_to_view')}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {([
            { label: t('total_trips'),    value: stats.totalTrips,        icon: '🚛' },
            { label: t('completed'),      value: stats.completedTrips,    icon: '✅' },
            { label: t('in_progress'),    value: stats.inProgressTrips,   icon: '🔄' },
            { label: t('total_distance'), value: `${stats.totalDistanceKm || 0} km`, icon: '📍' },
          ]).map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('quick_actions')}</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => nav('/driver/trips')}>
            {t('view_my_trips')}
          </button>
          <button className="btn btn-secondary" onClick={() => nav('/driver/fuel')}>
            ⛽ {t('request_fuel')}
          </button>
        </div>
      </div>
    </div>
  )
}
