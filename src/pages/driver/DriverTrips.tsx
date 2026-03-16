import { useState, useEffect, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DriverTrip, getMyTrips, STATUS_COLORS, STATUS_LABELS } from '../../api/driver/driver'

const FILTERS = ['All','Assigned','CargoLoading','LoadingComplete','InTransit','NearDestination','Unloading','DeliveryCompleted','Cancelled']

export default function DriverTrips(): JSX.Element {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMyTrips().then(setTrips).finally(() => setLoading(false))
  }, [])

  const lang: 'bs' | 'en' = i18n.language === 'bs' ? 'bs' : 'en'

  const filtered = trips
    .filter(tr => filter === 'All' || tr.status === filter)
    .filter(tr =>
      !search ||
      tr.originLocation.toLowerCase().includes(search.toLowerCase()) ||
      tr.destinationLocation.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>🚛 {t('my_trips')}</h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.25rem' }}>
          {trips.length} {t('trips_total')}
        </p>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <input
          className="form-control"
          placeholder={`🔍 ${t('search_trips')}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '.3rem .85rem', borderRadius: 999,
              border: filter === s ? 'none' : '1.5px solid var(--border)',
              background: filter === s
                ? (s === 'All' ? 'var(--primary)' : (STATUS_COLORS[s] || 'var(--primary)'))
                : 'var(--surface)',
              color: filter === s ? 'white' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '.75rem', fontWeight: 600,
              whiteSpace: 'nowrap', transition: 'all .15s'
            }}>
            {s === 'All' ? t('all') : (STATUS_LABELS[s]?.[lang] ?? s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {filtered.map(trip => {
            const sc = STATUS_COLORS[trip.status] ?? '#64748b'
            const isActive = !['DeliveryCompleted', 'Cancelled'].includes(trip.status)
            return (
              <div
                key={trip.id}
                onClick={() => nav(`/driver/trips/${trip.id}`)}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${isActive ? sc + '44' : 'var(--border)'}`,
                  borderLeft: `4px solid ${sc}`,
                  borderRadius: 'var(--radius)',
                  padding: '1.1rem 1.25rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all .18s',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '.3rem' }}>
                    {trip.originLocation} → {trip.destinationLocation}
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {trip.distanceKm && <span>📍 {trip.distanceKm} km</span>}
                    {trip.plannedDepartureDate && (
                      <span>📅 {new Date(trip.plannedDepartureDate).toLocaleDateString()}</span>
                    )}
                    {trip.vehicleRegistration && <span>🚛 {trip.vehicleRegistration}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.4rem' }}>
                  <span style={{
                    background: `${sc}20`, color: sc,
                    padding: '.25rem .75rem', borderRadius: 999,
                    fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap'
                  }}>
                    {STATUS_LABELS[trip.status]?.[lang] ?? trip.status}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: '.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {t('tap_to_view')} →
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
              <div style={{ fontWeight: 600 }}>{t('no_trips_found')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
