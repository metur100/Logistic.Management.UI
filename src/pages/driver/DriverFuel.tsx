import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getMyFuelRequests, createFuelRequest, getMyTrips, FuelRequest, DriverTrip, ACTIVE_STATUSES, STATUS_COLORS } from '../../api/driver/driver'

export default function DriverFuel() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<FuelRequest[]>([])
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tripId: '', litersRequested: '', remarks: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      getMyFuelRequests(),
      getMyTrips()
    ]).then(([fuelRes, tripsRes]) => {
      // Safely handle both plain array and wrapped { data: [...] } API responses
      const fuelArray: FuelRequest[] = Array.isArray(fuelRes)
        ? fuelRes
        : (fuelRes as { data?: FuelRequest[] })?.data ?? []

      const tripsArray: DriverTrip[] = Array.isArray(tripsRes)
        ? tripsRes
        : (tripsRes as { data?: DriverTrip[] })?.data ?? []

      setRequests(fuelArray)
      setTrips(tripsArray.filter(tr => (ACTIVE_STATUSES as string[]).includes(tr.status)))
    }).catch(() => {
      setRequests([])
      setTrips([])
      toast.error(t('error_loading_data'))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createFuelRequest({
        tripId: form.tripId ? parseInt(form.tripId) : null,
        litersRequested: parseFloat(form.litersRequested),
        remarks: form.remarks,
        pumpName: '',
        route: '',
      })
      toast.success(t('fuel_request_submitted'))
      setShowForm(false)
      setForm({ tripId: '', litersRequested: '', remarks: '' })
      load()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || t('error_submitting_fuel_request'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('fuel_requests')}</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('cancel') : `+ ${t('new_request')}`}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('new_fuel_request')}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('trip')} ({t('optional')})</label>
              <select className="form-control" value={form.tripId}
                onChange={e => setForm({ ...form, tripId: e.target.value })}>
                <option value="">{t('select_trip')}</option>
                {trips.map(tr => (
                  <option key={tr.id} value={tr.id}>
                    {tr.originLocation} → {tr.destinationLocation}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('amount_liters')} *</label>
              <input type="number" className="form-control" required min="1" step="0.5"
                value={form.litersRequested}
                onChange={e => setForm({ ...form, litersRequested: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('reason')}</label>
              <textarea className="form-control" rows={3}
                value={form.remarks}
                onChange={e => setForm({ ...form, remarks: e.target.value })}
                placeholder={t('explain_fuel_need')} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t('submitting') : t('submit_request')}
            </button>
          </form>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(req => (
            <div key={req.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>⛽ {req.litersRequested} L</span>
                    <span style={{
                      background: STATUS_COLORS[req.status] ?? '#6b7280',
                      color: 'white', padding: '0.2rem 0.6rem',
                      borderRadius: '9999px', fontSize: '0.8rem'
                    }}>
                      {req.status}
                    </span>
                  </div>
                  {req.tripRoute && (
                    <div style={{ fontSize: '0.9rem', color: '#374151' }}>🚛 {req.tripRoute}</div>
                  )}
                  {req.remarks && (
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>{req.remarks}</div>
                  )}
                  {req.managerNote && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '0.375rem', fontSize: '0.85rem', color: '#374151' }}>
                      💬 {t('manager_note')}: {req.managerNote}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                    {new Date(req.requestedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
              {t('no_fuel_requests_yet')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}