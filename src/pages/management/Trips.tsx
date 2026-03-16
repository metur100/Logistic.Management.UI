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
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
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
    } catch { toast.error(t('error')) }
  }

  const filtered = trips.filter(tr =>
    !search ||
    tr.tripNumber.toLowerCase().includes(search.toLowerCase()) ||
    tr.originLocation.toLowerCase().includes(search.toLowerCase()) ||
    tr.destinationLocation.toLowerCase().includes(search.toLowerCase()) ||
    tr.driver?.fullName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <style>{`
        .trips-toolbar {
          display: flex;
          gap: .75rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .trips-toolbar select,
        .trips-toolbar input {
          flex: 1;
          min-width: 140px;
          max-width: 240px;
        }
        @media (max-width: 600px) {
          .trips-toolbar select,
          .trips-toolbar input { max-width: 100%; width: 100%; }
        }
        .trip-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          margin-bottom: .65rem;
          display: flex;
          flex-direction: column;
          gap: .5rem;
          cursor: default;
          box-shadow: var(--shadow-sm);
          transition: box-shadow .15s;
        }
        .trip-card:hover { box-shadow: var(--shadow); }
        .trip-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: .75rem;
          flex-wrap: wrap;
        }
        .trip-card-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: .8rem;
          color: var(--text-muted);
        }
        .trip-card-actions {
          display: flex;
          gap: .4rem;
          flex-wrap: wrap;
          margin-top: .25rem;
        }
        .trips-table-wrap { display: block; }
        .trips-cards-wrap { display: none; }
        @media (max-width: 860px) {
          .trips-table-wrap { display: none; }
          .trips-cards-wrap { display: block; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.5rem',
        flexWrap: 'wrap', gap: '.75rem'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('trips')}</h1>
        <Link to="/management/trips/new" className="btn btn-primary">{t('new_trip')}</Link>
      </div>

      {/* Toolbar */}
      <div className="card trips-toolbar" style={{ marginBottom: '1rem' }}>
        <input
          className="form-control"
          placeholder={`🔍 ${t('search_trips')}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          value={filter}
          onChange={e => setFilter(e.target.value)}>
          <option value="">{t('all_statuses')}</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{t(`status_${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="card trips-table-wrap">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_trips')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('trip_number')}</th>
                <th>{t('route')}</th>
                <th>{t('driver')}</th>
                <th>{t('vehicle')}</th>
                <th>{t('planned_departure')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tr => {
                const sc = STATUS_COLORS[tr.status] ?? '#64748b'
                return (
                  <tr key={tr.id}>
                    <td style={{ fontWeight: 700 }}>{tr.tripNumber}</td>
                    <td>
                      {tr.originLocation}
                      <br />
                      <small style={{ color: 'var(--text-muted)' }}>→ {tr.destinationLocation}</small>
                    </td>
                    <td>{tr.driver?.fullName || '—'}</td>
                    <td>{tr.vehicle?.registrationNumber || '—'}</td>
                    <td>
                      {tr.plannedDepartureDate
                        ? new Date(tr.plannedDepartureDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '.2rem .65rem', borderRadius: 999,
                        fontSize: '.72rem', fontWeight: 700,
                        background: `${sc}20`, color: sc
                      }}>
                        {t(`status_${tr.status}`)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '.3rem .6rem', fontSize: '.78rem' }}
                          onClick={() => nav(`/management/trips/${tr.id}`)}>
                          {t('view')}
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '.3rem .6rem', fontSize: '.78rem' }}
                          onClick={() => nav(`/management/trips/${tr.id}/edit`)}>
                          {t('edit')}
                        </button>
                        {!['DeliveryCompleted', 'Cancelled'].includes(tr.status) && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '.3rem .6rem', fontSize: '.78rem' }}
                            onClick={() => cancelTrip(tr.id)}>
                            {t('cancel')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="trips-cards-wrap">
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {t('no_trips')}
          </div>
        ) : filtered.map(tr => {
          const sc = STATUS_COLORS[tr.status] ?? '#64748b'
          return (
            <div key={tr.id} className="trip-card" style={{ borderLeft: `4px solid ${sc}` }}>
              <div className="trip-card-top">
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.95rem', marginBottom: '.2rem' }}>
                    {tr.tripNumber}
                  </div>
                  <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                    {tr.originLocation} → {tr.destinationLocation}
                  </div>
                </div>
                <span style={{
                  padding: '.25rem .75rem', borderRadius: 999,
                  fontSize: '.72rem', fontWeight: 700,
                  background: `${sc}20`, color: sc, whiteSpace: 'nowrap'
                }}>
                  {t(`status_${tr.status}`)}
                </span>
              </div>
              <div className="trip-card-meta">
                {tr.driver?.fullName && <span>👤 {tr.driver.fullName}</span>}
                {tr.vehicle?.registrationNumber && <span>🚛 {tr.vehicle.registrationNumber}</span>}
                {tr.plannedDepartureDate && (
                  <span>📅 {new Date(tr.plannedDepartureDate).toLocaleDateString()}</span>
                )}
              </div>
              <div className="trip-card-actions">
                <button
                  className="btn btn-outline"
                  style={{ padding: '.35rem .75rem', fontSize: '.8rem' }}
                  onClick={() => nav(`/management/trips/${tr.id}`)}>
                  {t('view')}
                </button>
                <button
                  className="btn btn-outline"
                  style={{ padding: '.35rem .75rem', fontSize: '.8rem' }}
                  onClick={() => nav(`/management/trips/${tr.id}/edit`)}>
                  {t('edit')}
                </button>
                {!['DeliveryCompleted', 'Cancelled'].includes(tr.status) && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '.35rem .75rem', fontSize: '.8rem' }}
                    onClick={() => cancelTrip(tr.id)}>
                    {t('cancel')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
