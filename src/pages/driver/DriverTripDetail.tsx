import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { TripDetail } from '../../api/driver/driver'
import { getTripById, updateTripStatus, submitPod, TripStatus, SubmitPodPayload } from '../../api/driver/driver'
import { STATUS_COLORS, STATUS_LABELS, STATUS_FLOW } from '../../api/driver/driver'

export default function DriverTripDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()

  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [showPod, setShowPod] = useState(false)
  const [podForm, setPodForm] = useState<SubmitPodPayload>({
    podNumber: '',
    remarks: '',
    loadingArrivalTime: null,
    loadingEndTime: null,
    unloadingArrivalTime: null,
    unloadingEndTime: null,
  })
  const [submittingPod, setSubmittingPod] = useState(false)

  const load = () => {
    setLoading(true)
    getTripById(Number(id))
      .then(setTrip)
      .catch(() => toast.error(t('failed_load_trip')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  const handleStatusUpdate = async (newStatus: TripStatus) => {
    setUpdating(true)
    try {
      await updateTripStatus(Number(id), { status: newStatus, remarks: statusNote })
      toast.success(t('status_updated'))
      setStatusNote('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error_updating_status'))
    } finally {
      setUpdating(false)
    }
  }

  const handlePodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingPod(true)
    try {
      await submitPod(Number(id), podForm)
      toast.success(t('pod_submitted'))
      setShowPod(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error_submitting_pod'))
    } finally {
      setSubmittingPod(false)
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!trip) return <div style={{ padding: '2rem', color: '#6b7280' }}>{t('trip_not_found')}</div>

  const lang = i18n.language === 'bs' ? 'bs' : 'en'
  const nextStep = STATUS_FLOW[trip.status as TripStatus]
  const isDone = trip.status === 'DeliveryCompleted' || trip.status === 'Cancelled'
  const canSubmitPod = trip.status === 'Unloading' || trip.status === 'DeliveryCompleted'

  return (
    <div>
      {/* Back */}
      <button onClick={() => nav('/driver/trips')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', marginBottom: '1rem', padding: 0, fontSize: '0.95rem' }}>
        ← {t('my_trips')}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            {trip.originLocation} → {trip.destinationLocation}
          </h1>
          <span style={{
            background: STATUS_COLORS[trip.status] || '#6b7280',
            color: 'white', padding: '0.25rem 0.75rem',
            borderRadius: '9999px', fontSize: '0.85rem'
          }}>
            {STATUS_LABELS[trip.status]?.[lang] || trip.status}
          </span>
        </div>
      </div>

      {/* Trip Info */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('trip_details')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
          {([
            [t('vehicle'),           trip.vehicle?.registrationNo || '—'],
            [t('distance'),          trip.distanceKm ? `${trip.distanceKm} km` : '—'],
            [t('planned_departure'), trip.plannedDepartureDate  ? new Date(trip.plannedDepartureDate).toLocaleString()  : '—'],
            [t('expected_arrival'),  trip.expectedArrivalDate   ? new Date(trip.expectedArrivalDate).toLocaleString()   : '—'],
            trip.actualDepartureDate && [t('actual_departure'), new Date(trip.actualDepartureDate).toLocaleString()],
            trip.actualArrivalDate   && [t('actual_arrival'),   new Date(trip.actualArrivalDate).toLocaleString()],
          ] as [string, string][]).filter(Boolean).map(([label, val]) => (
            <div key={label}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{label}</div>
              <div style={{ fontWeight: 500 }}>{val}</div>
            </div>
          ))}
        </div>
        {trip.remarks && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
            📝 {trip.remarks}
          </div>
        )}
      </div>

      {/* Status Action */}
      {!isDone && nextStep && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('update_status')}</h2>
          <div className="form-group">
            <label>{t('remarks_optional')}</label>
            <textarea className="form-control" rows={2} value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder={t('add_note')} />
          </div>
          <button className="btn btn-primary" disabled={updating}
            onClick={() => handleStatusUpdate(nextStep.next)}>
            {nextStep.emoji} {t(nextStep.label)}
          </button>
        </div>
      )}

      {/* POD */}
      {canSubmitPod && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>{t('proof_of_delivery')}</h2>
          {trip.podReceived ? (
            <div style={{ color: '#16a34a', fontWeight: 600 }}>✅ {t('pod_received')} — {trip.podNumber}</div>
          ) : (
            <>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.75rem' }}>{t('pod_not_submitted')}</p>
              <button className="btn btn-primary" onClick={() => setShowPod(!showPod)}>
                {showPod ? t('cancel') : t('submit_pod')}
              </button>
              {showPod && (
                <form onSubmit={handlePodSubmit} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>{t('pod_number')} *</label>
                    <input className="form-control" required
                      value={podForm.podNumber}
                      onChange={e => setPodForm({ ...podForm, podNumber: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {([
                      ['loadingArrivalTime',   t('loading_arrival')],
                      ['loadingEndTime',       t('loading_end')],
                      ['unloadingArrivalTime', t('unloading_arrival')],
                      ['unloadingEndTime',     t('unloading_end')],
                    ] as [keyof SubmitPodPayload, string][]).map(([field, label]) => (
                      <div className="form-group" key={field}>
                        <label>{label}</label>
                        <input type="datetime-local" className="form-control"
                          value={(podForm[field] as string) || ''}
                          onChange={e => setPodForm({ ...podForm, [field]: e.target.value || null })} />
                      </div>
                    ))}
                  </div>
                  <div className="form-group">
                    <label>{t('remarks_optional')}</label>
                    <textarea className="form-control" rows={2}
                      value={podForm.remarks}
                      onChange={e => setPodForm({ ...podForm, remarks: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submittingPod}>
                    {submittingPod ? t('submitting') : t('submit_pod')}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* Cargo Items */}
      {trip.cargoItems?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('cargo_items')} ({trip.cargoItems.length})</h2>
          {trip.cargoItems.map(c => (
            <div key={c.id} style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontWeight: 500 }}>{c.description}</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.2rem' }}>
                {c.weightTons != null && `${c.weightTons}t`}
                {c.consignee && ` · ${t('consignee')}: ${c.consignee}`}
                {c.type && ` · ${c.type}`}
              </div>
              {c.specialInstructions && (
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem' }}>📋 {c.specialInstructions}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status History */}
      {trip.statusHistory?.length > 0 && (
        <div className="card">
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('status_history')}</h2>
          {[...trip.statusHistory].reverse().map(h => (
            <div key={h.id} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: STATUS_COLORS[h.status] || '#6b7280',
                marginTop: '0.3rem', flexShrink: 0
              }} />
              <div>
                <div style={{ fontWeight: 500 }}>{STATUS_LABELS[h.status]?.[lang] || h.status}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(h.changedAt).toLocaleString()}</div>
                {h.remarks && <div style={{ fontSize: '0.85rem', color: '#374151' }}>{h.remarks}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
