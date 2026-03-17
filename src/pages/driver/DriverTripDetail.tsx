import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  TripDetail, getTripById, updateTripStatus,
  submitPod, TripStatus, SubmitPodPayload
} from '../../api/driver/driver'
import { STATUS_COLORS, STATUS_LABELS, STATUS_FLOW } from '../../api/driver/driver'
import { t } from 'i18next'

// ─── Constants (stable, defined outside component) ───────────────────────────
const STEPS: TripStatus[] = [
  'Assigned', 'CargoLoading', 'LoadingComplete', 'InTransit',
  'NearDestination', 'Unloading', 'UnloadingComplete', 'DeliveryCompleted',
]
const STEP_SHORT = (t: (k: string) => string): Record<string, string> => ({
  Assigned:          t('step_assigned'),
  CargoLoading:      t('step_cargo_loading'),
  LoadingComplete:   t('step_loading_complete'),
  InTransit:         t('step_in_transit'),
  NearDestination:   t('step_near_destination'),
  Unloading:         t('step_unloading'),
  UnloadingComplete: t('step_unloading_complete'),
  DeliveryCompleted: t('step_delivery_completed'),
})
const stepShort = STEP_SHORT(t)

const STATUS_TO_POD_FIELD: Partial<Record<string, keyof SubmitPodPayload>> = {
  CargoLoading: 'loadingArrivalTime',
  LoadingComplete: 'loadingEndTime',
  Unloading: 'unloadingArrivalTime',
  UnloadingComplete: 'unloadingEndTime',
}
const TABS = [
  { key: 'info'    as const, label_key: 'trip_details',      icon: '📋' },
  { key: 'loading' as const, label_key: 'loading_unloading', icon: '📦' },
  { key: 'cargo'   as const, label_key: 'cargo_items',       icon: '🏗️' },
  { key: 'history' as const, label_key: 'status_history',    icon: '🕒' },
]
type TabKey = 'info' | 'loading' | 'cargo' | 'history'

// ─── Tiny pure presentational helpers (stable, outside component) ─────────────
function InfoCell({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div style={{
      padding: '.65rem .75rem', background: 'var(--surface2)',
      borderRadius: 'var(--radius-sm)', gridColumn: full ? '1 / -1' : undefined
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.2rem' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '.83rem', wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
      <span>{icon}</span>
      <h2 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{title}</h2>
    </div>
  )
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)', ...style
    }}>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DriverTripDetail() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()

  const [trip, setTrip]               = useState<TripDetail | null>(null)
  const [loading, setLoading]         = useState(true)
  const [statusNote, setStatusNote]   = useState('')
  const [updating, setUpdating]       = useState(false)
  const [showPod, setShowPod]         = useState(false)
  const [activeTab, setActiveTab]     = useState<TabKey>('info')
  const [podForm, setPodForm]         = useState<SubmitPodPayload>({
    podNumber: '', remarks: '',
    loadingArrivalTime: null, loadingEndTime: null,
    unloadingArrivalTime: null, unloadingEndTime: null,
  })
  const [submittingPod, setSubmittingPod] = useState(false)
  const [cmrNumber, setCmrNumber]     = useState('')
  const [savingCmr, setSavingCmr]     = useState(false)
  const [isMobile, setIsMobile]       = useState(() => window.innerWidth <= 640)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toDatetimeLocal = useCallback((d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    getTripById(Number(id))
      .then(tr => {
        setTrip(tr)
        if ((tr as any).cmrNumber) setCmrNumber((tr as any).cmrNumber)
        // Always sync POD timestamps from server — overwrite local state
        setPodForm(prev => {
          const u = { ...prev }
          const map: Array<[string, keyof SubmitPodPayload]> = [
            ['loadingArrivalTime',   'loadingArrivalTime'],
            ['loadingEndTime',       'loadingEndTime'],
            ['unloadingArrivalTime', 'unloadingArrivalTime'],
            ['unloadingEndTime',     'unloadingEndTime'],
          ]
          map.forEach(([tripKey, podKey]) => {
            const raw = (tr as any)[tripKey]
            // Always overwrite from server so form stays in sync
            if (raw) u[podKey] = toDatetimeLocal(new Date(raw))
          })
          return u
        })
      })
      .catch(() => toast.error(t('failed_load_trip')))
      .finally(() => setLoading(false))
  }, [id, t, toDatetimeLocal])

  useEffect(() => { load() }, [load])

  const handleStatusUpdate = async (newStatus: TripStatus) => {
    setUpdating(true)
    try {
      // Stamp the matching timestamp right now so it lands on the server too
      const podField = STATUS_TO_POD_FIELD[newStatus]
      const nowStr   = toDatetimeLocal(new Date())

      // Build the payload — include the timestamp so the backend stores it immediately
      const payload: any = { status: newStatus, remarks: statusNote }
      if (podField) {
        const fieldToBackend: Record<string, string> = {
          loadingArrivalTime:   'loadingArrivalTime',
          loadingEndTime:       'loadingEndTime',
          unloadingArrivalTime: 'unloadingArrivalTime',
          unloadingEndTime:     'unloadingEndTime',
        }
        payload[fieldToBackend[podField]] = nowStr
      }

      await updateTripStatus(Number(id), payload)
      toast.success(t('status_updated'))
      setStatusNote('')

      // Also stamp locally so POD form shows it immediately before reload
      if (podField) {
        setPodForm(prev => ({ ...prev, [podField]: prev[podField] || nowStr }))
      }

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

  const handleSaveCmr = async () => {
    setSavingCmr(true)
    try {
      const { default: api } = await import('../../api/axios')
      await api.patch(`/trips/${id}/cmr`, { cmrNumber })
      toast.success(t('cmr_saved'))
    } catch { toast.error(t('error')) }
    finally { setSavingCmr(false) }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!trip) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontWeight: 600 }}>{t('trip_not_found')}</div>
    </div>
  )

  const lang             = i18n.language === 'bs' ? 'bs' : 'en'
  const nextStep         = STATUS_FLOW[trip.status as TripStatus]
  const isDone           = trip.status === 'DeliveryCompleted' || trip.status === 'Cancelled'
  const canSubmitPod     = ['UnloadingComplete', 'DeliveryCompleted'].includes(trip.status)
  const shouldAutoOpenPod = trip.status === 'UnloadingComplete' && !trip.podReceived
  const currentStepIdx   = STEPS.indexOf(trip.status as TripStatus)
  const sc               = STATUS_COLORS[trip.status] || '#64748b'
  const v                = trip.vehicle as any

  // ─── Shared content blocks (defined inside render but as plain JSX, NOT components)
  // This avoids the remount/focus-loss bug while keeping code organized.

  const tripInfoBlock = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem' }}>
        {trip.tripNumber && <InfoCell label={t('trip_number')} value={trip.tripNumber} />}
        <InfoCell label={t('distance')} value={trip.distanceKm ? `${trip.distanceKm} km` : '—'} />
        <InfoCell label={t('planned_departure')} value={trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : '—'} />
        <InfoCell label={t('expected_arrival')}  value={trip.expectedArrivalDate  ? new Date(trip.expectedArrivalDate).toLocaleString()  : '—'} />
        {trip.actualDepartureDate && <InfoCell label={t('actual_departure')} value={new Date(trip.actualDepartureDate).toLocaleString()} />}
        {trip.actualArrivalDate   && <InfoCell label={t('actual_arrival')}   value={new Date(trip.actualArrivalDate).toLocaleString()} />}
      </div>
      {trip.remarks && (
        <div style={{ marginTop: '.75rem', padding: '.65rem .85rem', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', fontSize: '.82rem', color: '#92400e', wordBreak: 'break-word' }}>
          📝 {trip.remarks}
        </div>
      )}
    </>
  )

  const vehicleBlock = v ? (
    <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 'var(--radius)', padding: '1rem', color: '#fff' }}>
      <div style={{ fontWeight: 800, fontSize: '.8rem', opacity: .7, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.75rem' }}>🚛 {t('vehicle')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem' }}>
        <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '.65rem .85rem' }}>
          <div style={{ opacity: .65, fontSize: '.68rem', marginBottom: '.2rem' }}>Registracija</div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '.04em' }}>{v.registrationNumber || '—'}</div>
        </div>
        {v.fleetName      && <VehicleCell label="Fleet"       value={v.fleetName} />}
        {v.type           && <VehicleCell label="Tip"         value={v.type} />}
        {v.capacity       && <VehicleCell label="Kapacitet"   value={`${v.capacity} t`} />}
        {v.ownershipType  && <VehicleCell label="Vlasništvo"  value={v.ownershipType} />}
        {v.ownerName      && <VehicleCell label="Vlasnik"     value={v.ownerName} />}
        {v.ownerPhone     && (
          <div style={{ background: 'rgba(255,255,255,.09)', borderRadius: 8, padding: '.55rem .75rem' }}>
            <div style={{ opacity: .65, fontSize: '.67rem', marginBottom: '.15rem' }}>Tel. vlasnika</div>
            <a href={`tel:${v.ownerPhone}`} style={{ fontWeight: 700, fontSize: '.82rem', color: '#7dd3fc', textDecoration: 'none' }}>📞 {v.ownerPhone}</a>
          </div>
        )}
      </div>
    </div>
  ) : null

  const cmrBlock = (
    <div style={{ display: 'flex', gap: '.65rem' }}>
      <input
        className="form-control"
        placeholder={t('enter_cmr_number')}
        value={cmrNumber}
        onChange={e => setCmrNumber(e.target.value)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <button className="btn btn-primary" disabled={savingCmr} style={{ flexShrink: 0, padding: '.55rem 1rem' }} onClick={handleSaveCmr}>
        {savingCmr ? '...' : t('save')}
      </button>
    </div>
  )

  // ── Status action block — plain JSX so textarea is never remounted ──
  const statusActionBlock = (!isDone && nextStep) ? (
    <>
      {STATUS_TO_POD_FIELD[nextStep.next] && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', padding: '.5rem .75rem', fontSize: '.75rem', color: '#1d4ed8', fontWeight: 600, marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
          ⏱️ {t('auto_fills_pod_time') || 'This will auto-fill the matching POD timestamp.'}
        </div>
      )}
      <div style={{ marginBottom: '.75rem' }}>
        <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('remarks_optional')}</label>
        <textarea
          className="form-control"
          rows={2}
          value={statusNote}
          onChange={e => setStatusNote(e.target.value)}
          placeholder={t('add_note')}
          style={{ resize: 'vertical' }}
        />
      </div>
      <button className="btn btn-primary" disabled={updating} onClick={() => handleStatusUpdate(nextStep.next)}
        style={{ width: '100%', padding: '.75rem', fontSize: '.95rem', borderRadius: 'var(--radius)' }}>
        {updating ? '...' : `${nextStep.emoji} ${t(nextStep.label)}`}
      </button>
    </>
  ) : null

  // ── POD block — plain JSX ──
  const podBlock = canSubmitPod ? (
    trip.podReceived ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
        <span style={{ fontSize: '1.4rem' }}>✅</span>
        <div>
          <div style={{ fontWeight: 700, color: '#16a34a' }}>{t('pod_received')}</div>
          <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{trip.podNumber}</div>
        </div>
      </div>
    ) : (
      <>
        {shouldAutoOpenPod && (
          <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', color: '#fff', borderRadius: 'var(--radius)', padding: '.75rem 1rem', fontSize: '.82rem', fontWeight: 600, marginBottom: '.75rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            🚀 {t('pod_ready_to_submit') || 'All timestamps filled — submit your POD.'}
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '.82rem', marginBottom: '.75rem' }}>{t('pod_not_submitted')}</p>
        <button
          className={(showPod || shouldAutoOpenPod) ? 'btn btn-outline' : 'btn btn-primary'}
          style={{ width: '100%', marginBottom: (showPod || shouldAutoOpenPod) ? '1rem' : 0 }}
          onClick={() => setShowPod(prev => !prev)}>
          {showPod ? t('cancel') : `📋 ${t('submit_pod')}`}
        </button>
        {(showPod || shouldAutoOpenPod) && (
          <form onSubmit={handlePodSubmit} style={{ marginTop: '.75rem' }}>
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('pod_number')} *</label>
              <input className="form-control" required value={podForm.podNumber}
                onChange={e => setPodForm(p => ({ ...p, podNumber: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '.75rem' }}>
              {([
                ['loadingArrivalTime',   t('loading_arrival'),   '⬆️ Dolazak na utovar'],
                ['loadingEndTime',       t('loading_end'),       '✅ Utovar završen'],
                ['unloadingArrivalTime', t('unloading_arrival'), '⬇️ Dolazak na istovar'],
                ['unloadingEndTime',     t('unloading_end'),     '✅ Istovar završen'],
              ] as [keyof SubmitPodPayload, string, string][]).map(([field, label, hint]) => (
                <div key={field}>
                  <label style={{ fontSize: '.78rem', fontWeight: 700, display: 'block', marginBottom: '.2rem' }}>{label}</label>
                  <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>{hint}</div>
                  <input type="datetime-local" className="form-control"
                    value={(podForm[field] as string) || ''}
                    onChange={e => setPodForm(p => ({ ...p, [field]: e.target.value || null }))} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('remarks_optional')}</label>
              <textarea className="form-control" rows={2} value={podForm.remarks}
                onChange={e => setPodForm(p => ({ ...p, remarks: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submittingPod} style={{ width: '100%', padding: '.7rem' }}>
              {submittingPod ? t('submitting') : `✅ ${t('submit_pod')}`}
            </button>
          </form>
        )}
      </>
    )
  ) : null

  const loadingUnloadingBlock = (
    <>
      {/* Loading */}
      <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: 'var(--radius-lg)', padding: '1.1rem', color: '#fff' }}>
        <div style={{ fontWeight: 800, fontSize: '.9rem', marginBottom: '.7rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>⬆️ {t('loading')}</div>
        <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '.75rem', marginBottom: '.75rem', fontWeight: 700, wordBreak: 'break-word' }}>📍 {trip.originLocation}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <div>
            <div style={{ opacity: .7, fontSize: '.68rem', marginBottom: '.15rem' }}>{t('planned_departure')}</div>
            <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : '—'}</div>
          </div>
          {trip.loadingArrivalTime && (
            <div>
              <div style={{ opacity: .7, fontSize: '.68rem', marginBottom: '.15rem' }}>⬆️ Dolazak na utovar</div>
              <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{new Date(trip.loadingArrivalTime).toLocaleString()}</div>
            </div>
          )}
          {trip.loadingEndTime && (
            <div>
              <div style={{ opacity: .7, fontSize: '.68rem', marginBottom: '.15rem' }}>✅ Utovar završen</div>
              <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{new Date(trip.loadingEndTime).toLocaleString()}</div>
            </div>
          )}
        </div>
        {trip.cargoItems?.length > 0 && (
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '.75rem', padding: '.75rem', background: 'rgba(255,255,255,.12)', borderRadius: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div>⚖️</div>
              <div style={{ fontWeight: 800 }}>{trip.cargoItems.reduce((s, c) => s + (c.weightTons || 0), 0).toFixed(2)} t</div>
              <div style={{ opacity: .7, fontSize: '.7rem' }}>{t('weight')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>📦</div>
              <div style={{ fontWeight: 800 }}>{trip.cargoItems.length}</div>
              <div style={{ opacity: .7, fontSize: '.7rem' }}>{t('items')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Unloading */}
      <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderRadius: 'var(--radius-lg)', padding: '1.1rem', color: '#fff' }}>
        <div style={{ fontWeight: 800, fontSize: '.9rem', marginBottom: '.7rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>⬇️ {t('unloading')}</div>
        <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '.75rem', marginBottom: '.75rem', fontWeight: 700, wordBreak: 'break-word' }}>🏁 {trip.destinationLocation}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
          <div>
            <div style={{ opacity: .7, fontSize: '.68rem', marginBottom: '.15rem' }}>{t('expected_arrival')}</div>
            <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : '—'}</div>
          </div>
          {trip.unloadingArrivalTime && (
            <div>
              <div style={{ opacity: .7, fontSize: '.68rem', marginBottom: '.15rem' }}>⬇️ Dolazak na istovar</div>
              <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{new Date(trip.unloadingArrivalTime).toLocaleString()}</div>
            </div>
          )}
          {trip.unloadingEndTime && (
            <div>
              <div style={{ opacity: .7, fontSize: '.68rem', marginBottom: '.15rem' }}>✅ Istovar završen</div>
              <div style={{ fontWeight: 600, fontSize: '.8rem' }}>{new Date(trip.unloadingEndTime).toLocaleString()}</div>
            </div>
          )}
        </div>
        {trip.podReceived && (
          <div style={{ marginTop: '.75rem', padding: '.65rem', background: 'rgba(255,255,255,.15)', borderRadius: 8, fontWeight: 700 }}>
            ✅ CMR/POD: {trip.podNumber}
          </div>
        )}
      </div>
    </>
  )

  const cargoBlock = (
    <>
      {trip.cargoItems?.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', color: '#fff', display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '.15rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>{trip.cargoItems.reduce((s, c) => s + (c.weightTons || 0), 0).toFixed(2)}</div>
            <div style={{ opacity: .8, fontSize: '.7rem', fontWeight: 600 }}>TONA</div>
          </div>
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.25)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>{trip.cargoItems.length}</div>
            <div style={{ opacity: .8, fontSize: '.7rem', fontWeight: 600 }}>{t('items').toUpperCase()}</div>
          </div>
        </div>
      )}
      {!trip.cargoItems?.length ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📭</div>
          <div style={{ fontWeight: 600 }}>{t('no_cargo')}</div>
        </div>
      ) : trip.cargoItems.map((c, idx) => (
        <div key={c.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.9rem', display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.82rem' }}>
            {idx + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: '.3rem', wordBreak: 'break-word' }}>{c.description}</div>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
              {c.type && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '.1rem .45rem', borderRadius: 999, fontSize: '.67rem', fontWeight: 700 }}>{c.type}</span>}
              {c.weightTons != null && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '.1rem .45rem', borderRadius: 999, fontSize: '.67rem', fontWeight: 700 }}>⚖️ {c.weightTons}t</span>}
            </div>
            <div style={{ fontSize: '.77rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '.18rem' }}>
              {c.consignor && <div>🏭 {t('consignor')}: <strong style={{ color: 'var(--text)' }}>{c.consignor}</strong></div>}
              {c.consignee && <div>📦 {t('consignee')}: <strong style={{ color: 'var(--text)' }}>{c.consignee}</strong></div>}
            </div>
            {c.specialInstructions && (
              <div style={{ marginTop: '.45rem', padding: '.45rem .65rem', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', fontSize: '.74rem', color: '#92400e', wordBreak: 'break-word' }}>
                ⚠️ {c.specialInstructions}
              </div>
            )}
          </div>
          <button onClick={() => { navigator.clipboard?.writeText([c.description, c.consignor, c.consignee].filter(Boolean).join('\n')); toast.success(t('copied')) }}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, padding: '.35rem .5rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '.78rem', flexShrink: 0, alignSelf: 'flex-start' }}>📋</button>
        </div>
      ))}
    </>
  )

  const historyBlock = (
    <>
      {!trip.statusHistory?.length ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{t('no_history')}</div>
      ) : [...trip.statusHistory].reverse().map(h => {
        const color = STATUS_COLORS[h.status] || '#64748b'
        return (
          <div key={h.id} style={{ display: 'flex', gap: '.65rem', alignItems: 'flex-start' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, marginTop: '.45rem' }} />
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.6rem .8rem', border: '1px solid var(--border)', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.35rem' }}>
                <span style={{ background: `${color}20`, color, padding: '.15rem .55rem', borderRadius: 999, fontSize: '.67rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {STATUS_LABELS[h.status]?.[lang] || h.status}
                </span>
                <span style={{ fontSize: '.67rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(h.changedAt).toLocaleString()}</span>
              </div>
              {h.remarks && <div style={{ marginTop: '.3rem', fontSize: '.79rem', color: 'var(--text)', wordBreak: 'break-word' }}>{h.remarks}</div>}
            </div>
          </div>
        )
      })}
    </>
  )

  // ─── Mobile accordion section ─────────────────────────────────────────────
  // Also defined as plain JSX wrapper (not a component) so inner state is preserved
  const mobileSection = (icon: string, title: string, key: TabKey, children: React.ReactNode) => {
    const open = activeTab === key
    return (
      <div key={key} style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: open ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}>
        <button
          onClick={() => setActiveTab(open ? 'info' : key)}
          style={{ width: '100%', padding: '.9rem 1rem', background: open ? sc : 'var(--surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: open ? '#fff' : 'var(--text)', transition: 'background .2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', fontWeight: 700, fontSize: '.9rem' }}>
            <span>{icon}</span> {title}
          </div>
          <span style={{ fontSize: '.75rem', opacity: .8, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </button>
        {open && (
          <div style={{ padding: '1rem', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .dtd-step-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: .25rem; }
        .dtd-step-inner { display: flex; align-items: flex-start; justify-content: space-between; min-width: 380px; gap: 0; }
        .dtd-step-item { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
        .dtd-step-item::after { content: ''; position: absolute; top: 11px; left: 50%; width: 100%; height: 2px; background: var(--border); z-index: 0; }
        .dtd-step-item.done::after { background: #22c55e; }
        .dtd-step-item:last-child::after { display: none; }
        .dtd-step-dot { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .6rem; font-weight: 800; z-index: 1; position: relative; background: var(--border); color: var(--text-muted); border: 2px solid transparent; flex-shrink: 0; }
        .dtd-step-dot.done { background: #22c55e; color: #fff; }
        .dtd-step-dot.active { color: #fff; }
        .dtd-step-lbl { font-size: .55rem; margin-top: .3rem; font-weight: 600; text-align: center; color: var(--text-muted); line-height: 1.2; }
        .dtd-desktop-tabs { display: flex; gap: .4rem; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: .25rem; margin-bottom: 1rem; scrollbar-width: none; }
        .dtd-desktop-tabs::-webkit-scrollbar { display: none; }
        .dtd-tab-btn { padding: .45rem .85rem; border-radius: 999px; cursor: pointer; font-size: .78rem; font-weight: 600; white-space: nowrap; display: flex; align-items: center; gap: .3rem; transition: all .15s; flex-shrink: 0; }
      `}</style>

      {/* Back */}
      <button onClick={() => nav('/driver/trips')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginBottom: '1rem', padding: 0, fontSize: '.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
        ← {t('my_trips')}
      </button>

      {/* Gradient header */}
      <div style={{ background: `linear-gradient(135deg, ${sc}dd, ${sc}99)`, borderRadius: 'var(--radius-lg)', padding: '1.25rem', color: '#fff', marginBottom: '1.25rem', boxShadow: `0 6px 20px ${sc}44`, overflow: 'hidden' }}>
        <div style={{ fontSize: '.68rem', opacity: .8, marginBottom: '.35rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
          {STATUS_LABELS[trip.status]?.[lang] || trip.status}
        </div>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '.4rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
          {trip.originLocation} → {trip.destinationLocation}
        </h1>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', fontSize: '.82rem', opacity: .85 }}>
          {trip.distanceKm && <span>📍 {trip.distanceKm} km</span>}
          {v?.registrationNumber && <span>🚛 {v.registrationNumber}</span>}
          {trip.tripNumber && <span>📄 {trip.tripNumber}</span>}
        </div>
      </div>

      {/* Step bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <div className="dtd-step-scroll">
          <div className="dtd-step-inner">
            {STEPS.map((step, idx) => {
              const isDoneStep = idx < currentStepIdx
              const isActive   = idx === currentStepIdx
              const dotColor   = isActive ? sc : isDoneStep ? '#22c55e' : undefined
              return (
                <div key={step} className={`dtd-step-item${isDoneStep ? ' done' : ''}`}>
                  <div className={`dtd-step-dot${isDoneStep ? ' done' : isActive ? ' active' : ''}`}
                    style={isActive ? { background: sc, borderColor: sc, boxShadow: `0 0 0 3px ${sc}33` } : {}}>
                    {isDoneStep ? '✓' : idx + 1}
                  </div>
                  <div className="dtd-step-lbl" style={dotColor ? { color: dotColor } : {}}>{stepShort[step]}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══ DESKTOP layout ══ */}
      {!isMobile && (
        <>
          <div className="dtd-desktop-tabs">
            {TABS.map(tab => (
              <button key={tab.key} className="dtd-tab-btn" onClick={() => setActiveTab(tab.key)} style={{
                background: activeTab === tab.key ? 'var(--primary)' : 'var(--surface)',
                color:      activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                border:     activeTab === tab.key ? 'none' : '1.5px solid var(--border)',
              }}>
                {tab.icon} {t(tab.label_key)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'info' && (
              <>
                <Card><SectionHeader icon="📋" title={t('trip_details')} />{tripInfoBlock}</Card>
                {vehicleBlock && <div>{vehicleBlock}</div>}
                <Card><SectionHeader icon="📄" title={`CMR ${t('number')}`} />{cmrBlock}</Card>
                {statusActionBlock && <Card><SectionHeader icon="🔄" title={t('update_status')} />{statusActionBlock}</Card>}
                {podBlock && <Card><SectionHeader icon="📋" title={t('proof_of_delivery')} />{podBlock}</Card>}
              </>
            )}
            {activeTab === 'loading' && (
              <Card style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingUnloadingBlock}
              </Card>
            )}
            {activeTab === 'cargo' && (
              <Card style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                <SectionHeader icon="🏗️" title={t('cargo_items')} />
                {cargoBlock}
              </Card>
            )}
            {activeTab === 'history' && (
              <Card style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
                <SectionHeader icon="🕒" title={t('status_history')} />
                {historyBlock}
              </Card>
            )}
          </div>
        </>
      )}

      {/* ══ MOBILE accordion layout ══ */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>

          {mobileSection('📋', t('trip_details'), 'info', (
            <>
              {tripInfoBlock}
              {vehicleBlock}
              <div>
                <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.5rem' }}>📄 CMR {t('number')}</div>
                {cmrBlock}
              </div>
              {statusActionBlock && (
                <div>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.5rem' }}>🔄 {t('update_status')}</div>
                  {statusActionBlock}
                </div>
              )}
              {podBlock && (
                <div>
                  <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.5rem' }}>📋 {t('proof_of_delivery')}</div>
                  {podBlock}
                </div>
              )}
            </>
          ))}

          {mobileSection('📦', t('loading_unloading'), 'loading', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              {loadingUnloadingBlock}
            </div>
          ))}

          {mobileSection('🏗️', t('cargo_items'), 'cargo', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {cargoBlock}
            </div>
          ))}

          {mobileSection('🕒', t('status_history'), 'history', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {historyBlock}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Small helper rendered outside main component (stable identity) ───────────
function VehicleCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.09)', borderRadius: 8, padding: '.55rem .75rem' }}>
      <div style={{ opacity: .65, fontSize: '.67rem', marginBottom: '.15rem' }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{value}</div>
    </div>
  )
}