import { useState, useEffect, JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DriverTrip, getMyTrips, STATUS_COLORS, STATUS_LABELS } from '../../api/driver/driver'

const FILTERS: string[] = [
  'All', 'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading', 'DeliveryCompleted', 'Cancelled'
]

export default function DriverTrips(): JSX.Element {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filter, setFilter] = useState<string>('All')

  useEffect(() => {
    getMyTrips()
      .then(setTrips)
      .finally(() => setLoading(false))
  }, [])

  const lang: 'bs' | 'en' = i18n.language === 'bs' ? 'bs' : 'en'
  const filtered: DriverTrip[] = filter === 'All' ? trips : trips.filter(tr => tr.status === filter)

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('my_trips')}</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '0.35rem 0.9rem',
              borderRadius: '9999px',
              border: '1px solid #e5e7eb',
              background: filter === s ? '#2563eb' : 'white',
              color: filter === s ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}
          >
            {s === 'All' ? t('all') : (STATUS_LABELS[s]?.[lang] ?? s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(trip => (
            <div
              key={trip.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => nav(`/driver/trips/${trip.id}`)}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
                    {trip.originLocation} → {trip.destinationLocation}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {trip.distanceKm ? `${trip.distanceKm} km · ` : ''}
                    {trip.plannedDepartureDate
                      ? new Date(trip.plannedDepartureDate).toLocaleDateString()
                      : t('no_date')}
                  </div>
                  {trip.vehicleRegistration && (
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      🚗 {trip.vehicleRegistration}
                    </div>
                  )}
                </div>
                <span style={{
                  background: STATUS_COLORS[trip.status] ?? '#6b7280',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap'
                }}>
                  {STATUS_LABELS[trip.status]?.[lang] ?? trip.status}
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
              {t('no_trips_found')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}