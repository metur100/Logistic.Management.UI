import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  TripDetail, getTripById, updateTripStatus,
  submitPod, TripStatus, SubmitPodPayload
} from '../../api/driver/driver'
import { STATUS_COLORS, STATUS_LABELS, STATUS_FLOW } from '../../api/driver/driver'

const STEPS: TripStatus[] = [
  'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading', 'DeliveryCompleted'
]

const STEP_SHORT: Record<string, string> = {
  Assigned: 'Asgn', CargoLoading: 'Load', LoadingComplete: 'Lded',
  InTransit: 'Go', NearDestination: 'Near', Unloading: 'Unlod',
  DeliveryCompleted: 'Done'
}

export default function DriverTripDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [trip, setTrip] = useState<TripDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [showPod, setShowPod] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'cargo' | 'history' | 'loading'>('info')
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
      .then(tr => {
        setTrip(tr)
        if ((tr as any).cmrNumber) setCmrNumber((tr as any).cmrNumber)
      })
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
  if (!trip) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontWeight: 600 }}>{t('trip_not_found')}</div>
    </div>
  )

  const lang = i18n.language === 'bs' ? 'bs' : 'en'
  const nextStep = STATUS_FLOW[trip.status as TripStatus]
  const isDone = trip.status === 'DeliveryCompleted' || trip.status === 'Cancelled'
  const canSubmitPod = trip.status === 'Unloading' || trip.status === 'DeliveryCompleted'
  const currentStepIdx = STEPS.indexOf(trip.status as TripStatus)
  const sc = STATUS_COLORS[trip.status] || '#64748b'

  const TABS = [
    { key: 'info',    label: t('trip_details'),      icon: '📋' },
    { key: 'loading', label: t('loading_unloading'),  icon: '📦' },
    { key: 'cargo',   label: t('cargo_items'),        icon: '🏗️' },
    { key: 'history', label: t('status_history'),     icon: '🕒' },
  ] as const

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .dtd-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .65rem;
        }
        .dtd-pod-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .65rem;
        }
        .dtd-load-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .65rem;
        }
        @media (max-width: 480px) {
          .dtd-info-grid { grid-template-columns: 1fr; }
          .dtd-pod-grid  { grid-template-columns: 1fr; }
          .dtd-load-grid { grid-template-columns: 1fr; }
        }
        .dtd-step-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: .25rem;
        }
        .dtd-step-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          min-width: 340px;
          gap: 0;
        }
        .dtd-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        .dtd-step-item::after {
          content: '';
          position: absolute;
          top: 11px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: var(--border);
          z-index: 0;
        }
        .dtd-step-item.done::after  { background: #22c55e; }
        .dtd-step-item:last-child::after { display: none; }
        .dtd-step-dot {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: .6rem; font-weight: 800;
          z-index: 1; position: relative;
          background: var(--border); color: var(--text-muted);
          border: 2px solid transparent;
          flex-shrink: 0;
        }
        .dtd-step-dot.done   { background: #22c55e; color: #fff; }
        .dtd-step-dot.active { color: #fff; border-color: currentColor; }
        .dtd-step-lbl {
          font-size: .55rem; margin-top: .3rem;
          font-weight: 600; text-align: center;
          color: var(--text-muted); line-height: 1.2;
        }
        .dtd-tab-bar {
          display: flex;
          gap: .4rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: .25rem;
          margin-bottom: 1rem;
          scrollbar-width: none;
        }
        .dtd-tab-bar::-webkit-scrollbar { display: none; }
        .dtd-tab-btn {
          padding: .45rem .85rem;
          border-radius: 999px;
          cursor: pointer;
          font-size: .78rem;
          font-weight: 600;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: .3rem;
          transition: all .15s;
          flex-shrink: 0;
        }
        .cargo-card-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          box-shadow: var(--shadow-sm);
          display: flex;
          gap: .85rem;
          align-items: flex-start;
        }
        .timeline-item {
          display: flex;
          gap: .75rem;
          align-items: flex-start;
          margin-bottom: .75rem;
        }
        .timeline-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: .45rem;
        }
      `}</style>

      {/* Back */}
      <button
        onClick={() => nav('/driver/trips')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', marginBottom: '1rem', padding: 0,
          fontSize: '.875rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '.35rem'
        }}>
        ← {t('my_trips')}
      </button>

      {/* Gradient header */}
      <div style={{
        background: `linear-gradient(135deg, ${sc}dd, ${sc}99)`,
        borderRadius: 'var(--radius-lg)', padding: '1.25rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: `0 6px 20px ${sc}44`,
        overflow: 'hidden'
      }}>
        <div style={{
          fontSize: '.68rem', opacity: .8, marginBottom: '.35rem',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em'
        }}>
          {STATUS_LABELS[trip.status]?.[lang] || trip.status}
        </div>
        <h1 style={{
          fontSize: '1.15rem', fontWeight: 800, marginBottom: '.4rem',
          wordBreak: 'break-word', lineHeight: 1.3
        }}>
          {trip.originLocation} → {trip.destinationLocation}
        </h1>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', fontSize: '.82rem', opacity: .85 }}>
          {trip.distanceKm && <span>📍 {trip.distanceKm} km</span>}
          {trip.vehicle?.registrationNo && <span>🚛 {trip.vehicle.registrationNo}</span>}
        </div>
      </div>

      {/* Step bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '1rem',
        marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="dtd-step-scroll">
          <div className="dtd-step-inner">
            {STEPS.map((step, idx) => {
              const isDoneStep = idx < currentStepIdx
              const isActive = idx === currentStepIdx
              const dotColor = isActive ? sc : isDoneStep ? '#22c55e' : undefined
              return (
                <div
                  key={step}
                  className={`dtd-step-item${isDoneStep ? ' done' : ''}`}>
                  <div
                    className={`dtd-step-dot${isDoneStep ? ' done' : isActive ? ' active' : ''}`}
                    style={isActive ? {
                      background: sc, borderColor: sc,
                      boxShadow: `0 0 0 3px ${sc}33`
                    } : {}}>
                    {isDoneStep ? '✓' : idx + 1}
                  </div>
                  <div className="dtd-step-lbl" style={dotColor ? { color: dotColor } : {}}>
                    {STEP_SHORT[step]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="dtd-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className="dtd-tab-btn"
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              border: activeTab === tab.key ? 'none' : '1.5px solid var(--border)',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Info ── */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Trip details grid */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
              <span>📋</span>
              <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('trip_details')}</h2>
            </div>
            <div className="dtd-info-grid">
              {([
                [t('vehicle'),           trip.vehicle?.registrationNo || '—'],
                [t('distance'),          trip.distanceKm ? `${trip.distanceKm} km` : '—'],
                [t('planned_departure'), trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : '—'],
                [t('expected_arrival'),  trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : '—'],
                trip.actualDepartureDate && [t('actual_departure'), new Date(trip.actualDepartureDate).toLocaleString()],
                trip.actualArrivalDate   && [t('actual_arrival'),   new Date(trip.actualArrivalDate).toLocaleString()],
              ] as [string, string][]).filter(Boolean).map(([label, val]) => (
                <div key={label} style={{
                  padding: '.65rem .75rem',
                  background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{
                    color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem'
                  }}>
                    {label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', wordBreak: 'break-word' }}>{val}</div>
                </div>
              ))}
            </div>
            {trip.remarks && (
              <div style={{
                marginTop: '.85rem', padding: '.65rem .85rem',
                background: '#fffbeb', borderRadius: 'var(--radius-sm)',
                border: '1px solid #fde68a', fontSize: '.82rem', color: '#92400e',
                wordBreak: 'break-word'
              }}>
                📝 {trip.remarks}
              </div>
            )}
          </div>

          {/* CMR */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
              <span>📄</span>
              <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>CMR {t('number')}</h2>
            </div>
            <div style={{ display: 'flex', gap: '.65rem' }}>
              <input
                className="form-control"
                placeholder={t('enter_cmr_number')}
                value={cmrNumber}
                onChange={e => setCmrNumber(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />
              <button
                className="btn btn-primary"
                disabled={savingCmr}
                style={{ flexShrink: 0, padding: '.55rem 1rem' }}
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

          {/* Status action */}
          {!isDone && nextStep && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
                <span>🔄</span>
                <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('update_status')}</h2>
              </div>
              <div style={{ marginBottom: '.75rem' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>
                  {t('remarks_optional')}
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder={t('add_note')}
                />
              </div>
              <button
                className="btn btn-primary"
                disabled={updating}
                onClick={() => handleStatusUpdate(nextStep.next)}
                style={{ width: '100%', padding: '.75rem', fontSize: '.95rem', borderRadius: 'var(--radius)' }}>
                {updating ? '...' : `${nextStep.emoji} ${t(nextStep.label)}`}
              </button>
            </div>
          )}

          {/* POD */}
          {canSubmitPod && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
                <span>📋</span>
                <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('proof_of_delivery')}</h2>
              </div>

              {trip.podReceived ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '1rem', background: '#f0fdf4',
                  borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#16a34a' }}>{t('pod_received')}</div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{trip.podNumber}</div>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '.82rem', marginBottom: '.75rem' }}>
                    {t('pod_not_submitted')}
                  </p>
                  <button
                    className={showPod ? 'btn btn-outline' : 'btn btn-primary'}
                    style={{ width: '100%', marginBottom: showPod ? '1rem' : 0 }}
                    onClick={() => setShowPod(!showPod)}>
                    {showPod ? t('cancel') : `📋 ${t('submit_pod')}`}
                  </button>

                  {showPod && (
                    <form onSubmit={handlePodSubmit}>
                      <div style={{ marginBottom: '.75rem' }}>
                        <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>
                          {t('pod_number')} *
                        </label>
                        <input
                          className="form-control"
                          required
                          value={podForm.podNumber}
                          onChange={e => setPodForm({ ...podForm, podNumber: e.target.value })}
                        />
                      </div>
                      <div className="dtd-pod-grid">
                        {([
                          ['loadingArrivalTime',   t('loading_arrival')],
                          ['loadingEndTime',        t('loading_end')],
                          ['unloadingArrivalTime', t('unloading_arrival')],
                          ['unloadingEndTime',     t('unloading_end')],
                        ] as [keyof SubmitPodPayload, string][]).map(([field, label]) => (
                          <div key={field}>
                            <label style={{ fontSize: '.78rem', fontWeight: 700, display: 'block', marginBottom: '.35rem' }}>
                              {label}
                            </label>
                            <input
                              type="datetime-local"
                              className="form-control"
                              value={(podForm[field] as string) || ''}
                              onChange={e => setPodForm({ ...podForm, [field]: e.target.value || null })}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ margin: '.75rem 0' }}>
                        <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>
                          {t('remarks_optional')}
                        </label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={podForm.remarks}
                          onChange={e => setPodForm({ ...podForm, remarks: e.target.value })}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingPod}
                        style={{ width: '100%', padding: '.7rem' }}>
                        {submittingPod ? t('submitting') : `✅ ${t('submit_pod')}`}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Loading/Unloading ── */}
      {activeTab === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* NAKLAD */}
          <div style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            borderRadius: 'var(--radius-lg)', padding: '1.25rem', color: '#fff'
          }}>
            <div style={{
              fontWeight: 800, fontSize: '1rem', marginBottom: '.85rem',
              textTransform: 'uppercase', letterSpacing: '.05em'
            }}>
              ⬆️ {t('loading')} (NAKLAD)
            </div>
            <div style={{
              background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius-sm)',
              padding: '.85rem', marginBottom: '.85rem',
              fontWeight: 700, fontSize: '.95rem', wordBreak: 'break-word'
            }}>
              📍 {trip.originLocation}
            </div>
            <div className="dtd-load-grid">
              <div>
                <div style={{ opacity: .7, fontSize: '.7rem', marginBottom: '.2rem' }}>{t('planned_departure')}</div>
                <div style={{ fontWeight: 600, fontSize: '.82rem' }}>
                  {trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : '—'}
                </div>
              </div>
              {trip.loadingArrivalTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.7rem', marginBottom: '.2rem' }}>{t('loading_arrival')}</div>
                  <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{new Date(trip.loadingArrivalTime).toLocaleString()}</div>
                </div>
              )}
              {trip.loadingEndTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.7rem', marginBottom: '.2rem' }}>{t('loading_end')}</div>
                  <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{new Date(trip.loadingEndTime).toLocaleString()}</div>
                </div>
              )}
            </div>
            {trip.cargoItems?.length > 0 && (
              <div style={{
                display: 'flex', gap: '1.5rem', marginTop: '.85rem',
                padding: '.85rem', background: 'rgba(255,255,255,.12)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem' }}>⚖️</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                    {trip.cargoItems.reduce((s, c) => s + (c.weightTons || 0), 0).toFixed(2)} t
                  </div>
                  <div style={{ opacity: .7, fontSize: '.72rem' }}>{t('weight')}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem' }}>📦</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{trip.cargoItems.length}</div>
                  <div style={{ opacity: .7, fontSize: '.72rem' }}>{t('items')}</div>
                </div>
              </div>
            )}
          </div>

          {/* RAZKLAD */}
          <div style={{
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            borderRadius: 'var(--radius-lg)', padding: '1.25rem', color: '#fff'
          }}>
            <div style={{
              fontWeight: 800, fontSize: '1rem', marginBottom: '.85rem',
              textTransform: 'uppercase', letterSpacing: '.05em'
            }}>
              ⬇️ {t('unloading')} (RAZKLAD)
            </div>
            <div style={{
              background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius-sm)',
              padding: '.85rem', marginBottom: '.85rem',
              fontWeight: 700, fontSize: '.95rem', wordBreak: 'break-word'
            }}>
              🏁 {trip.destinationLocation}
            </div>
            <div className="dtd-load-grid">
              <div>
                <div style={{ opacity: .7, fontSize: '.7rem', marginBottom: '.2rem' }}>{t('expected_arrival')}</div>
                <div style={{ fontWeight: 600, fontSize: '.82rem' }}>
                  {trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : '—'}
                </div>
              </div>
              {trip.unloadingArrivalTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.7rem', marginBottom: '.2rem' }}>{t('unloading_arrival')}</div>
                  <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{new Date(trip.unloadingArrivalTime).toLocaleString()}</div>
                </div>
              )}
              {trip.unloadingEndTime && (
                <div>
                  <div style={{ opacity: .7, fontSize: '.7rem', marginBottom: '.2rem' }}>{t('unloading_end')}</div>
                  <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{new Date(trip.unloadingEndTime).toLocaleString()}</div>
                </div>
              )}
            </div>
            {trip.podReceived && (
              <div style={{
                marginTop: '.85rem', padding: '.75rem',
                background: 'rgba(255,255,255,.15)', borderRadius: 'var(--radius-sm)',
                fontWeight: 700, fontSize: '.875rem'
              }}>
                ✅ CMR/POD: {trip.podNumber}
              </div>
            )}
          </div>

          {/* Vehicle */}
          {trip.vehicle && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
                <span>🚛</span>
                <h3 style={{ fontWeight: 700, fontSize: '.9rem' }}>{t('vehicle')}</h3>
              </div>
              <div style={{
                display: 'inline-block', padding: '.6rem 1.1rem',
                background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                fontWeight: 800, fontSize: '.95rem'
              }}>
                {trip.vehicle.registrationNo}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Cargo ── */}
      {activeTab === 'cargo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          {!trip.cargoItems?.length ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', textAlign: 'center',
              padding: '3rem 1rem', color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontWeight: 600 }}>{t('no_cargo')}</div>
            </div>
          ) : trip.cargoItems.map((c, idx) => (
            <div key={c.id} className="cargo-card-item">
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                color: '#fff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: '.85rem'
              }}>
                {idx + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: '.9rem', marginBottom: '.3rem',
                  wordBreak: 'break-word'
                }}>
                  {c.description}
                </div>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                  {c.type && (
                    <span style={{
                      background: '#eff6ff', color: '#2563eb',
                      padding: '.12rem .5rem', borderRadius: 999,
                      fontSize: '.68rem', fontWeight: 700
                    }}>{c.type}</span>
                  )}
                  {c.weightTons != null && (
                    <span style={{
                      background: '#f0fdf4', color: '#16a34a',
                      padding: '.12rem .5rem', borderRadius: 999,
                      fontSize: '.68rem', fontWeight: 700
                    }}>⚖️ {c.weightTons}t</span>
                  )}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '.2rem' }}>
                  {c.consignee && (
                    <div>📦 {t('consignee')}: <strong style={{ color: 'var(--text)' }}>{c.consignee}</strong></div>
                  )}
                  {c.consignor && (
                    <div>🏭 {t('consignor')}: <strong style={{ color: 'var(--text)' }}>{c.consignor}</strong></div>
                  )}
                </div>
                {c.specialInstructions && (
                  <div style={{
                    marginTop: '.5rem', padding: '.5rem .7rem',
                    background: '#fffbeb', borderRadius: 'var(--radius-sm)',
                    border: '1px solid #fde68a', fontSize: '.75rem', color: '#92400e',
                    wordBreak: 'break-word'
                  }}>
                    ⚠️ {c.specialInstructions}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const text = [c.description, c.consignee].filter(Boolean).join('\n')
                  navigator.clipboard?.writeText(text)
                  toast.success(t('copied'))
                }}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '.4rem .55rem', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '.8rem', flexShrink: 0,
                  alignSelf: 'flex-start'
                }}>
                📋
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: History ── */}
      {activeTab === 'history' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <span>🕒</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('status_history')}</h2>
          </div>
          {!trip.statusHistory?.length ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {t('no_history')}
            </div>
          ) : (
            <div>
              {[...trip.statusHistory].reverse().map(h => {
                const color = STATUS_COLORS[h.status] || '#64748b'
                return (
                  <div key={h.id} className="timeline-item">
                    <div className="timeline-dot" style={{ background: color }} />
                    <div style={{
                      background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                      padding: '.65rem .85rem', border: '1px solid var(--border)',
                      flex: 1, minWidth: 0
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexWrap: 'wrap', gap: '.4rem'
                      }}>
                        <span style={{
                          background: `${color}20`, color,
                          padding: '.18rem .6rem', borderRadius: 999,
                          fontSize: '.68rem', fontWeight: 700, whiteSpace: 'nowrap'
                        }}>
                          {STATUS_LABELS[h.status]?.[lang] || h.status}
                        </span>
                        <span style={{ fontSize: '.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(h.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {h.remarks && (
                        <div style={{
                          marginTop: '.35rem', fontSize: '.8rem',
                          color: 'var(--text)', wordBreak: 'break-word'
                        }}>
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
