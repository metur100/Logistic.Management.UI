import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'

interface Trip {
  id: number
  tripNumber: string
  status: string
  originLocation: string
  destinationLocation: string
  driver?: { fullName: string }
  vehicle?: { registrationNumber: string }
  plannedDepartureDate?: string
}

interface Stats {
  trips: number; active: number; delivered: number
  vehicles: number; drivers: number; pending: number
}

const STATUS_COLORS: Record<string, string> = {
  Assigned: '#6366f1', CargoLoading: '#f59e0b', LoadingComplete: '#3b82f6',
  InTransit: '#8b5cf6', NearDestination: '#ec4899', Unloading: '#f97316',
  DeliveryCompleted: '#22c55e', Cancelled: '#ef4444'
}

export default function Dashboard() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<Stats>({ trips: 0, active: 0, delivered: 0, vehicles: 0, drivers: 0, pending: 0 })
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/trips'),
      api.get('/vehicles'),
      api.get('/users?role=Driver'),
    ]).then(([trips, vehicles, drivers]) => {
      const tr: Trip[] = Array.isArray(trips.data) ? trips.data : (trips.data?.data ?? [])
      const vArr = Array.isArray(vehicles.data) ? vehicles.data : (vehicles.data?.data ?? [])
      const dArr = Array.isArray(drivers.data) ? drivers.data : (drivers.data?.data ?? [])

      const breakdown: Record<string, number> = {}
      tr.forEach(x => { breakdown[x.status] = (breakdown[x.status] || 0) + 1 })

      setStats({
        trips: tr.length,
        active: tr.filter(x => !['DeliveryCompleted', 'Cancelled'].includes(x.status)).length,
        delivered: tr.filter(x => x.status === 'DeliveryCompleted').length,
        pending: tr.filter(x => x.status === 'Assigned').length,
        vehicles: vArr.length,
        drivers: dArr.length,
      })
      setStatusBreakdown(breakdown)
      setRecentTrips(tr.slice(0, 6))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: t('total_trips'),  value: stats.trips,     icon: '🚛', color: '#2563eb', bg: '#eff6ff', path: '/management/trips' },
    { label: t('active_trips'), value: stats.active,    icon: '▶️', color: '#d97706', bg: '#fffbeb', path: '/management/trips' },
    { label: t('delivered'),    value: stats.delivered, icon: '✅', color: '#16a34a', bg: '#f0fdf4', path: '/management/trips' },
    { label: t('pending'),      value: stats.pending,   icon: '⏳', color: '#7c3aed', bg: '#f5f3ff', path: '/management/trips' },
    { label: t('vehicles'),     value: stats.vehicles,  icon: '🚗', color: '#0891b2', bg: '#ecfeff', path: '/management/vehicles' },
    { label: t('drivers'),      value: stats.drivers,   icon: '👤', color: '#db2777', bg: '#fdf2f8', path: '/management/users' },
  ]

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <style>{`
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: .75rem;
        }
        .dash-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .75rem;
          margin-bottom: 1.25rem;
        }
        .dash-bottom {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1.25rem;
          align-items: start;
        }
        .dash-stat-card {
          background: var(--surface);
          border-radius: var(--radius);
          padding: .85rem 1rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: .65rem;
          cursor: pointer;
          transition: box-shadow .2s, transform .2s;
          min-width: 0;
        }
        .dash-stat-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-2px);
        }
        .dash-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        .dash-stat-value {
          font-size: 1.45rem;
          font-weight: 800;
          line-height: 1;
        }
        .dash-stat-label {
          font-size: .68rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: .2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .trip-row {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .75rem .9rem;
          background: var(--surface2);
          border-radius: var(--radius-sm);
          cursor: pointer;
          border: 1px solid var(--border);
          transition: all .15s;
          min-width: 0;
        }
        .trip-row:hover {
          background: #fff;
          box-shadow: var(--shadow-sm);
        }
        .trip-number {
          font-weight: 700;
          font-size: .8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: .1rem;
        }
        .trip-route {
          font-size: .72rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .trip-status-badge {
          padding: .18rem .5rem;
          border-radius: 999px;
          font-size: .65rem;
          font-weight: 700;
          white-space: nowrap;
          display: block;
          text-align: center;
        }
        .trip-driver {
          font-size: .65rem;
          color: var(--text-muted);
          margin-top: .2rem;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 90px;
        }
        .breakdown-bar-bg {
          height: 5px;
          background: var(--border);
          border-radius: 999px;
          overflow: hidden;
        }
        .breakdown-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width .5s ease;
        }
        @media (max-width: 1100px) {
          .dash-bottom {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .dash-stat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: .6rem;
          }
          .dash-stat-card {
            padding: .75rem .8rem;
            gap: .5rem;
          }
          .dash-stat-icon {
            width: 34px;
            height: 34px;
            font-size: 1rem;
          }
          .dash-stat-value {
            font-size: 1.2rem;
          }
          .dash-stat-label {
            font-size: .62rem;
          }
          .dash-bottom {
            gap: .85rem;
          }
        }
        @media (max-width: 360px) {
          .dash-stat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: .5rem;
          }
          .dash-stat-card {
            flex-direction: column;
            align-items: flex-start;
            gap: .4rem;
            padding: .7rem .75rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="dash-header">
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '.15rem' }}>
              {t('dashboard')} 📊
            </h1>
            <p style={{ opacity: .75, fontSize: '.8rem' }}>
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <button
            className="btn"
            onClick={() => nav('/management/trips/new')}
            style={{
              background: 'rgba(255,255,255,.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,.3)',
              fontSize: '.85rem',
              padding: '.5rem 1rem'
            }}>
            {t('new_trip')}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="dash-stat-grid">
        {statCards.map(c => (
          <div
            key={c.label}
            className="dash-stat-card"
            onClick={() => nav(c.path)}>
            <div className="dash-stat-icon" style={{ background: c.bg, color: c.color }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="dash-stat-value" style={{ color: c.color }}>
                {c.value}
              </div>
              <div className="dash-stat-label">
                {c.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="dash-bottom">

        {/* Recent trips */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1rem',
            flexWrap: 'wrap', gap: '.5rem'
          }}>
            <h2 style={{ fontSize: '.95rem', fontWeight: 700 }}>{t('recent_trips')}</h2>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '.75rem', padding: '.3rem .65rem' }}
              onClick={() => nav('/management/trips')}>
              {t('view_all')} →
            </button>
          </div>

          {recentTrips.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '.875rem' }}>
              {t('no_trips_yet')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {recentTrips.map(tr => {
                const sc = STATUS_COLORS[tr.status] || '#64748b'
                return (
                  <div
                    key={tr.id}
                    className="trip-row"
                    onClick={() => nav(`/management/trips/${tr.id}`)}
                    style={{ borderLeft: `3px solid ${sc}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="trip-number">{tr.tripNumber}</div>
                      <div className="trip-route">
                        {tr.originLocation} → {tr.destinationLocation}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right', maxWidth: 100 }}>
                      <span
                        className="trip-status-badge"
                        style={{ background: `${sc}18`, color: sc }}>
                        {tr.status}
                      </span>
                      <div className="trip-driver">
                        {tr.driver?.fullName || '—'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card" style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '1rem' }}>
            {t('status_breakdown')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const sc = STATUS_COLORS[status] || '#64748b'
              const pct = stats.trips > 0 ? Math.round((count / stats.trips) * 100) : 0
              return (
                <div key={status}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '.25rem', fontSize: '.75rem'
                  }}>
                    <span style={{ fontWeight: 600, color: sc, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                      {status}
                    </span>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="breakdown-bar-bg">
                    <div
                      className="breakdown-bar-fill"
                      style={{ width: `${pct}%`, background: sc }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(statusBreakdown).length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem', fontSize: '.85rem' }}>
                {t('no_data')}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
