import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMyTrips, DriverTrip, STATUS_LABELS } from '../../api/driver/driver'

interface Event {
  date: string
  type: 'pickup' | 'delivery'
  location: string
  tripId: number
  tripNumber: string
  status: string
}

export default function DriverEvents() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [events, setEvents] = useState<Record<string, Event[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTrips().then((trips: DriverTrip[]) => {
      const evts: Event[] = []
      trips.forEach(tr => {
        if (tr.plannedDepartureDate) {
          evts.push({
            date: tr.plannedDepartureDate.slice(0, 10),
            type: 'pickup',
            location: tr.originLocation,
            tripId: tr.id,
            tripNumber: tr.tripNumber || `#${tr.id}`,
            status: tr.status,
          })
        }
        if ((tr as any).expectedArrivalDate) {
          evts.push({
            date: (tr as any).expectedArrivalDate.slice(0, 10),
            type: 'delivery',
            location: tr.destinationLocation,
            tripId: tr.id,
            tripNumber: tr.tripNumber || `#${tr.id}`,
            status: tr.status,
          })
        }
      })
      evts.sort((a, b) => a.date.localeCompare(b.date))
      const grouped: Record<string, Event[]> = {}
      evts.forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = []
        grouped[e.date].push(e)
      })
      setEvents(grouped)
    }).finally(() => setLoading(false))
  }, [])

  const lang = i18n.language === 'bs' ? 'bs' : 'en'

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>📅 {t('upcoming_events')}</h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.25rem' }}>{t('your_schedule')}</p>
      </div>

      {Object.keys(events).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <div style={{ fontWeight: 600 }}>{t('no_events')}</div>
        </div>
      ) : (
        Object.entries(events).map(([date, dayEvents]) => {
          const isToday = date === today
          const isPast = date < today
          return (
            <div key={date} style={{ marginBottom: '1.5rem', opacity: isPast ? .65 : 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                marginBottom: '.75rem'
              }}>
                <div style={{
                  fontWeight: 800, fontSize: '1rem',
                  color: isToday ? 'var(--primary)' : 'var(--text)'
                }}>
                  {isToday ? `🔵 ${t('today')}` : new Date(date + 'T00:00:00').toLocaleDateString(lang === 'bs' ? 'hr' : 'en', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </div>
                {isToday && (
                  <span style={{
                    background: 'var(--primary)', color: '#fff',
                    borderRadius: 999, padding: '.15rem .6rem',
                    fontSize: '.7rem', fontWeight: 700
                  }}>{t('today')}</span>
                )}
              </div>

              {dayEvents.map((ev, i) => (
                <div
                  key={i}
                  className="event-card"
                  onClick={() => nav(`/driver/trips/${ev.tripId}`)}>
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: ev.type === 'pickup' ? '#f0fdf4' : '#fef2f2',
                    fontSize: '1.4rem'
                  }}>
                    {ev.type === 'pickup' ? '⬆️' : '⬇️'}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>
                      {ev.type === 'pickup' ? t('pickup') : t('delivery')}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
                      📍 {ev.location}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-light)', marginTop: '.2rem' }}>
                      {ev.tripNumber}
                    </div>
                  </div>
                  {/* Status */}
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '.72rem', fontWeight: 700,
                      color: ev.type === 'pickup' ? 'var(--success)' : 'var(--danger)',
                      background: ev.type === 'pickup' ? '#f0fdf4' : '#fef2f2',
                      padding: '.2rem .6rem', borderRadius: 999
                    }}>
                      {STATUS_LABELS[ev.status]?.[lang] || ev.status}
                    </span>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-light)', marginTop: '.35rem' }}>→</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
