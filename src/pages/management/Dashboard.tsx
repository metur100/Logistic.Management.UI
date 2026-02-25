import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'

interface Trip {
  id: number
  tripNumber: string
  originLocation: string
  destinationLocation: string
  status: string
  driver?: { fullName: string }
  vehicle?: { registrationNumber: string }
}

interface Stats {
  trips: number
  active: number
  delivered: number
  vehicles: number
  drivers: number
  pendingFuel: number
}

const STATUS_COLORS: Record<string, string> = {
  Assigned: '#6366f1', CargoLoading: '#f59e0b', LoadingComplete: '#3b82f6',
  InTransit: '#8b5cf6', NearDestination: '#ec4899', Unloading: '#f97316',
  DeliveryCompleted: '#22c55e', Cancelled: '#ef4444'
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats>({ trips: 0, active: 0, delivered: 0, vehicles: 0, drivers: 0, pendingFuel: 0 })
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/trips'),
      api.get('/vehicles'),
      api.get('/users?role=Driver'),
      api.get('/fuelrequests?status=Pending'),
    ]).then(([trips, vehicles, drivers, fuel]) => {
      const tr: Trip[] = Array.isArray(trips.data) ? trips.data : (trips.data?.data ?? [])
      const vArr = Array.isArray(vehicles.data) ? vehicles.data : (vehicles.data?.data ?? [])
      const dArr = Array.isArray(drivers.data) ? drivers.data : (drivers.data?.data ?? [])
      const fArr = Array.isArray(fuel.data) ? fuel.data : (fuel.data?.data ?? [])
      setStats({
        trips: tr.length,
        active: tr.filter(x => !['DeliveryCompleted', 'Cancelled'].includes(x.status)).length,
        delivered: tr.filter(x => x.status === 'DeliveryCompleted').length,
        vehicles: vArr.length,
        drivers: dArr.length,
        pendingFuel: fArr.length
      })
      setRecentTrips(tr.slice(0, 5))
    }).catch(console.error)
  }, [])

  const statusColor = (s: string) => STATUS_COLORS[s] || '#64748b'

  const cards = [
    { label: t('total_trips'), value: stats.trips, icon: '\uD83D\uDE9B', color: '#3b4fd8' },
    { label: t('active_trips'), value: stats.active, icon: '\u25B6\uFE0F', color: '#f59e0b' },
    { label: t('delivered'), value: stats.delivered, icon: '\u2705', color: '#22c55e' },
    { label: t('vehicles'), value: stats.vehicles, icon: '\uD83D\uDE9A', color: '#8b5cf6' },
    { label: t('drivers'), value: stats.drivers, icon: '\uD83D\uDC64', color: '#ec4899' },
    { label: t('pending_fuel'), value: stats.pendingFuel, icon: '\u26FD', color: '#ef4444' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{t('dashboard')}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(c => (
          <div key={c.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{c.value}</div>
              <div style={{ fontSize: '.8rem', color: '#64748b' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{t('recent_trips')}</h2>
        {recentTrips.length === 0
          ? <p style={{ color: '#64748b' }}>{t('no_trips_yet')}</p>
          : (
            <table>
              <thead>
                <tr>
                  <th>{t('trip_number')}</th>
                  <th>{t('route')}</th>
                  <th>{t('driver')}</th>
                  <th>{t('vehicle')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map(tr => (
                  <tr key={tr.id}>
                    <td style={{ fontWeight: 600 }}>{tr.tripNumber}</td>
                    <td>{tr.originLocation} \u2192 {tr.destinationLocation}</td>
                    <td>{tr.driver?.fullName || '\u2014'}</td>
                    <td>{tr.vehicle?.registrationNumber || '\u2014'}</td>
                    <td>
                      <span style={{ padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600, background: `${statusColor(tr.status)}20`, color: statusColor(tr.status) }}>
                        {t(`status_${tr.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}