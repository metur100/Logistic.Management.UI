import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { TripDetail, getTripById, updateTripStatus, submitPod, TripStatus, SubmitPodPayload } from '../../api/driver/driver'
import { STATUS_COLORS, STATUS_LABELS, STATUS_FLOW } from '../../api/driver/driver'

const STEPS: TripStatus[] = ['Assigned','CargoLoading','LoadingComplete','InTransit','NearDestination','Unloading','DeliveryCompleted']

export default function DriverTripDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [showPod, setShowPod] = useState(false)
  const [activeTab, setActiveTab] = useState<'info'|'cargo'|'history'|'loading'>('info')
  const [podForm, setPodForm] = useState<SubmitPodPayload>({
    podNumber: '', remarks: '',
    loadingArrivalTime: null, loadingEndTime: null,
    unloadingArrivalTime: null, unloadingEndTime: null,
  })
  const [submittingPod, setSubmittingPod] = useState(false)
  const [cmrNumber, setCmrNumber] = useState('')
  const [savingCmr, setSavingCmr] = useState(false)

  const load = () => {
    setLoading(true)
    getTripById(Number(id))
      .then(tr => { setTrip(tr); if ((tr as any).cmrNumber) setCmrNumber((tr as any).cmrNumber) })
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
    } finally { setUpdating(false) }
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
    } finally { setSubmittingPod(false) }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!trip) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>{t('trip_not_found')}</div>

  const lang = i18n.language === 'bs' ? 'bs' : 'en'
  const nextStep = STATUS_FLOW[trip.status as TripStatus]
  const isDone = trip.status === 'DeliveryCompleted' || trip.status === 'Cancelled'
  const canSubmitPod = trip.status === 'Unloading' || trip.status === 'DeliveryCompleted'
  const currentStepIdx = STEPS.indexOf(trip.status as TripStatus)
  const sc = STATUS_COLORS[trip.status] || '#64748b'

  return (
    <div>
      {/* Back */}
      <button onClick={() => nav('/driver/trips')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--primary)', marginBottom: '1rem', padding: 0,
        fontSize: '.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem'
      }}>
        ← {t('my_trips')}
      </button>

      {/* Header card */}
      <div style={{
        background: `linear-gradient(135deg, ${sc}dd, ${sc}99)`,
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        color: 'white', marginBottom: '1.5rem',
        boxShadow: `0 8px 24px ${sc}44`
      }}>
        <div style={{ fontSize: '.75rem', opacity: .8, marginBottom: '.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {STATUS_LABELS[trip.status]?.[lang] || trip.status}
        </div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.5rem' }}>
          {trip.originLocation} → {trip.destinationLocation}
        </h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '.85rem', opacity: .85 }}>
          {trip.distanceKm && <span>📍 {trip.distanceKm} km</span>}
          {trip.vehicle?.registrationNo && <span>🚛 {trip.vehicle.registrationNo}</span>}
        </div>
      </div>

      {/* Step bar */}
      <div className="card" style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
        <div className="step-bar">
          {STEPS.map((step, idx) => (
            <div key={step} className="step-item">
              <div className={`step-dot ${idx < currentStepIdx ? 'done' : idx === currentStepIdx ? 'active' : ''}`}>
                {idx < currentStepIdx ? '✓' : idx + 1}
              </div>
              <div className="step-label">{STATUS_LABELS[step]?.[lang]?.split(' ')[0] || step}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '.25rem' }}>
        {([
          { key: 'info', label: t('trip_details'), icon: '📋' },
          { key: 'loading', label: t('loading_unloading'), icon: '📦' },
          { key: 'cargo', label: t('cargo_items'), icon: '🏗️' },
          { key: 'history', label: t('status_history'), icon: '🕒' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '.45rem 1rem', borderRadius: 999,
              border: activeTab === tab.key ? 'none' : '1.5px solid var(--border)',
              background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
              whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '.35rem'
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>{t('trip_details')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', fontSize: '.875rem' }}>
              {([
                [t('vehicle'), trip.vehicle?.registrationNo || '—'],
                [t('distance'), trip.distanceKm ? `${trip.distanceKm} km` : '—'],
                [t('planned_departure'), trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : '—'],
                [t('expected_arrival'), trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : '—'],
                trip.actualDepartureDate && [t('actual_departure'), new Date(trip.actualDepartureDate).toLocaleString()],
                trip.actualArrivalDate && [t('actual_arrival'), new Date(trip.actualArrivalDate).toLocaleString()],
              ] as [string, string][]).filter(Boolean).map(([label, val]) => (
                <div key={label} style={{ padding: '.75rem', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.25rem' }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            {trip.remarks && (
              <div style={{ marginTop: '1rem', padding: '.75rem', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', fontSize: '.875rem' }}>
                📝 {trip.remarks}
              </div>
            )}
          </div>

          {/* CMR Number */}
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>📄 CMR {t('number')}</h2>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <input
                className="form-control"
                placeholder={t('enter_cmr_number')}
                value={cmrNumber}
                onChange={e => setCmrNumber(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                disabled={savingCmr}
                onClick={async () => {
                  setSavingCmr(true)
                  try {
                    const { default: api } = await import('../../api/axios')
                    await api.patch(`/trips/${id}/cmr`, { cmrNumber })
                    toast.success(t('cmr_saved'))
                  } catch { toast.error(t('error')) }
                  finally { setSavingCmr(false) }
                }}>
                {savingCmr ? '...' : t('save')}
              </button>
            </div>
          </div>

          {/* Status Action */}
          {!isDone && nextStep && (
            <div className="card">
              <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>{t('update_status')}</h2>
              <div className="form-group">
                <label>{t('remarks_optional')}</label>
                <textarea className="form-control" rows={2} value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder={t('add_note')} />
              </div>
              <button className="btn btn-primary" disabled={updating}
                onClick={() => handleStatusUpdate(nextStep.next)}
                style={{ width: '100%', padding: '.75rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
                {nextStep.emoji} {t(nextStep.label)}
              </button>
            </div>
          )}

          {/* POD */}
          {canSubmitPod && (
            <div className="card">
              <h2 style={{ fontWeight: 700, marginBottom: '.75rem', fontSize: '1rem' }}>{t('proof_of_delivery')}</h2>
              {trip.podReceived ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '1rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)',
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>{t('pod_received')}</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>{trip.podNumber}</div>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: '.75rem' }}>{t('pod_not_submitted')}</p>
                  <button className="btn btn-primary" onClick={() => setShowPod(!showPod)}>
                    {showPod ? t('cancel') : `📋 ${t('submit_pod')}`}
                  </button>
                  {showPod && (
                    <form onSubmit={handlePodSubmit} style={{ marginTop: '1rem' }}>
                      <div className="form-group">
                        <label>{t('pod_number')} *</label>
                        <input className="form-control" required value={podForm.podNumber}
                          onChange={e => setPodForm({ ...podForm, podNumber: e.target.value })} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                        {([
                          ['loadingArrivalTime', t('loading_arrival')],
                          ['loadingEndTime', t('loading_end')],
                          ['unloadingArrivalTime', t('unloading_arrival')],
                          ['unloadingEndTime', t('unloading_end')],
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
                      <button type="submit" className="btn btn-primary" disabled={submittingPod} style={{ width: '100%' }}>
                        {submittingPod ? t('submitting') : t('submit_pod')}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Loading/Unloading */}
      {activeTab === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Loading (NAKLAD) */}
          <div style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem', color: 'white'
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              ⬆️ {t('loading')} (NAKLAD)
            </div>
            <div style={{
              background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius)',
              padding: '1rem', marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{trip.originLocation}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', fontSize: '.875rem' }}>
              <div>
                <div style={{ opacity: .7, fontSize: '.75rem', marginBottom: '.2rem' }}>{t('planned_departure')}</div>
                <div style={{ fontWeight: 600 }}>{trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : '—'}</div>
              </div>
              {trip.loadingArrivalTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.75rem', marginBottom: '.2rem' }}>{t('loading_arrival')}</div>
                  <div style={{ fontWeight: 600 }}>{new Date(trip.loadingArrivalTime).toLocaleString()}</div>
                </div>
              )}
              {trip.loadingEndTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.75rem', marginBottom: '.2rem' }}>{t('loading_end')}</div>
                  <div style={{ fontWeight: 600 }}>{new Date(trip.loadingEndTime).toLocaleString()}</div>
                </div>
              )}
            </div>
            {/* Weight / Volume summary */}
            {trip.cargoItems?.length > 0 && (
              <div style={{
                display: 'flex', gap: '1.5rem', marginTop: '1rem',
                padding: '1rem', background: 'rgba(255,255,255,.12)', borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>⚖️</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    {trip.cargoItems.reduce((s, c) => s + (c.weightTons || 0), 0).toFixed(2)} t
                  </div>
                  <div style={{ opacity: .7, fontSize: '.75rem' }}>{t('weight')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>📦</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{trip.cargoItems.length}</div>
                  <div style={{ opacity: .7, fontSize: '.75rem' }}>{t('items')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery (RAZKLAD) */}
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem', color: 'white'
          }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
              ⬇️ {t('unloading')} (RAZKLAD)
            </div>
            <div style={{
              background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius)',
              padding: '1rem', marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{trip.destinationLocation}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', fontSize: '.875rem' }}>
              <div>
                <div style={{ opacity: .7, fontSize: '.75rem', marginBottom: '.2rem' }}>{t('expected_arrival')}</div>
                <div style={{ fontWeight: 600 }}>{trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : '—'}</div>
              </div>
              {trip.unloadingArrivalTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.75rem', marginBottom: '.2rem' }}>{t('unloading_arrival')}</div>
                  <div style={{ fontWeight: 600 }}>{new Date(trip.unloadingArrivalTime).toLocaleString()}</div>
                </div>
              )}
              {trip.unloadingEndTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.75rem', marginBottom: '.2rem' }}>{t('unloading_end')}</div>
                  <div style={{ fontWeight: 600 }}>{new Date(trip.unloadingEndTime).toLocaleString()}</div>
                </div>
              )}
            </div>
            {/* POD badge */}
            {trip.podReceived && (
              <div style={{
                marginTop: '1rem', padding: '.75rem',
                background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius-sm)',
                fontWeight: 700
              }}>
                ✅ CMR/POD: {trip.podNumber}
              </div>
            )}
          </div>

          {/* Vehicle info */}
          {trip.vehicle && (
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '.75rem', fontSize: '.95rem' }}>🚛 {t('vehicle')}</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '.75rem 1.25rem', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                  {trip.vehicle.registrationNo}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Tab: Cargo / Stops */}
      {activeTab === 'cargo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {trip.cargoItems?.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontWeight: 600 }}>{t('no_cargo')}</div>
            </div>
          ) : (
            trip.cargoItems.map((c, idx) => (
              <div key={c.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', gap: '1rem', alignItems: 'flex-start'
              }}>
                {/* Stop number */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, fontSize: '.9rem',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.35rem' }}>
                    {c.description}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
                    {c.type && (
                      <span style={{
                        background: '#eff6ff', color: '#2563eb',
                        padding: '.15rem .6rem', borderRadius: 999,
                        fontSize: '.72rem', fontWeight: 700
                      }}>{c.type}</span>
                    )}
                    {c.weightTons != null && (
                      <span style={{
                        background: '#f0fdf4', color: '#16a34a',
                        padding: '.15rem .6rem', borderRadius: 999,
                        fontSize: '.72rem', fontWeight: 700
                      }}>⚖️ {c.weightTons}t</span>
                    )}
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                    {c.consignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span>📦</span>
                        <span>{t('consignee')}: <strong>{c.consignee}</strong></span>
                      </div>
                    )}
                    {c.consignor && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                        <span>🏭</span>
                        <span>{t('consignor')}: <strong>{c.consignor}</strong></span>
                      </div>
                    )}
                  </div>
                  {c.specialInstructions && (
                    <div style={{
                      marginTop: '.65rem', padding: '.6rem .85rem',
                      background: '#fffbeb', borderRadius: 'var(--radius-sm)',
                      border: '1px solid #fde68a',
                      fontSize: '.8rem', color: '#92400e'
                    }}>
                      ⚠️ {c.specialInstructions}
                    </div>
                  )}
                </div>
                {/* Copy address button */}
                <button
                  onClick={() => {
                    const text = [c.description, c.consignee].filter(Boolean).join('\n')
                    navigator.clipboard?.writeText(text)
                    toast.success(t('copied'))
                  }}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '.4rem .6rem', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '.8rem', flexShrink: 0
                  }}
                  title={t('copy')}>
                  📋
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="card">
          <h2 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>{t('status_history')}</h2>
          {trip.statusHistory?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {t('no_history')}
            </div>
          ) : (
            <div className="timeline">
              {[...trip.statusHistory].reverse().map(h => {
                const color = STATUS_COLORS[h.status] || '#64748b'
                return (
                  <div key={h.id} className="timeline-item">
                    <div className="timeline-dot" style={{ color, background: color }} />
                    <div style={{
                      background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                      padding: '.85rem 1rem', border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                        <span style={{
                          background: `${color}20`, color,
                          padding: '.2rem .65rem', borderRadius: 999,
                          fontSize: '.75rem', fontWeight: 700
                        }}>
                          {STATUS_LABELS[h.status]?.[lang] || h.status}
                        </span>
                        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                          {new Date(h.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {h.remarks && (
                        <div style={{ marginTop: '.5rem', fontSize: '.85rem', color: 'var(--text)' }}>
                          {h.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
