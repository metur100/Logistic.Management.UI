import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  Assigned: '#6366f1', CargoLoading: '#f59e0b', LoadingComplete: '#3b82f6',
  InTransit: '#8b5cf6', NearDestination: '#ec4899', Unloading: '#f97316',
  DeliveryCompleted: '#22c55e', Cancelled: '#ef4444'
}

interface Trip {
  id: number
  tripNumber: string
  status: string
  originLocation: string
  destinationLocation: string
  plannedDepartureDate?: string
  driver?: { fullName: string }
  vehicle?: { registrationNumber: string }
}

export default function Trips() {
  const { t } = useTranslation()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filter, setFilter] = useState<string>('')
  const nav = useNavigate()

  const load = useCallback(() => {
    const q = filter ? `?status=${filter}` : ''
    api.get(`/trips${q}`)
      .then(r => setTrips(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(() => toast.error(t('failed')))
  }, [filter, t])

  useEffect(() => { load() }, [load])

  const cancelTrip = async (id: number) => {
    if (!window.confirm(t('cancel_trip_confirm'))) return
    try {
      await api.put(`/trips/${id}/status`, { status: 'Cancelled', remarks: 'Cancelled by manager' })
      load()
      toast.success(t('trip_cancelled'))
    } catch {
      toast.error(t('error'))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('trips')}</h1>
        <Link to="/management/trips/new" className="btn btn-primary">{t('new_trip')}</Link>
      </div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <select className="form-control" style={{ maxWidth: 220 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">{t('all_statuses')}</option>
{Object.keys(STATUS_COLORS).map(s => (
  <option key={s} value={s}>{t(`status_${s}`)}</option>
))}

        </select>
      </div>
      <div className="card">
        {trips.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('no_trips')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('trip_number')}</th><th>{t('route')}</th><th>{t('driver')}</th>
                <th>{t('vehicle')}</th><th>{t('planned_departure')}</th><th>{t('status')}</th><th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(tr => (
                <tr key={tr.id}>
                  <td style={{ fontWeight: 600 }}>{tr.tripNumber}</td>
                  <td>{tr.originLocation}<br /><small style={{ color: '#64748b' }}>→ {tr.destinationLocation}</small></td>
                  <td>{tr.driver?.fullName || '—'}</td>
                  <td>{tr.vehicle?.registrationNumber || '—'}</td>
                  <td>{tr.plannedDepartureDate ? new Date(tr.plannedDepartureDate).toLocaleDateString() : '—'}</td>
                  <td>
                    <span style={{
                      padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600,
                      background: `${STATUS_COLORS[tr.status] ?? '#64748b'}20`,
                      color: STATUS_COLORS[tr.status] ?? '#64748b'
                    }}>
                      {t(`status_${tr.status}`)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                      <button className="btn btn-outline" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => nav(`/management/trips/${tr.id}`)}>{t('view')}</button>
                      <button className="btn btn-outline" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => nav(`/management/trips/${tr.id}/edit`)}>{t('edit')}</button>
                      {!['DeliveryCompleted', 'Cancelled'].includes(tr.status) && (
                        <button className="btn btn-danger" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => cancelTrip(tr.id)}>{t('cancel')}</button>
                      )}
                    </div>
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