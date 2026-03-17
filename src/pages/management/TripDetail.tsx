// ─── TripDetail.tsx (Management) ────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { t } from 'i18next'

interface Driver  { fullName?: string; phone?: string; licenseNumber?: string }
interface Vehicle { registrationNumber?: string; fleetName?: string; type?: string; capacity?: number }
interface CargoItem {
  id: number; description: string; cargoType?: string
  weightTons?: number; consignor?: string; consignee?: string; specialInstructions?: string
}
interface StatusHistory { id: number; status: string; changedAt: string; remarks?: string }
interface Trip {
  id: number; tripNumber: string; status: string
  originLocation: string; destinationLocation: string; distanceKm?: number
  plannedDepartureDate?: string; expectedArrivalDate?: string
  actualDepartureDate?: string; actualArrivalDate?: string
  podNumber?: string; podReceived?: boolean; remarks?: string; cmrNumber?: string
  loadingArrivalTime?: string; loadingEndTime?: string
  unloadingArrivalTime?: string; unloadingEndTime?: string
  driver?: Driver; vehicle?: Vehicle
  cargoItems?: CargoItem[]; statusHistory?: StatusHistory[]
}

// ─ Status constants ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Assigned:          '#6366f1',
  CargoLoading:      '#f59e0b',
  LoadingComplete:   '#3b82f6',
  InTransit:         '#8b5cf6',
  NearDestination:   '#ec4899',
  Unloading:         '#f97316',
  UnloadingComplete: '#14b8a6',   // ← added
  DeliveryCompleted: '#22c55e',
  Cancelled:         '#ef4444',
}
const STATUS_LABELS: Record<string, string> = {
  Assigned:          'Assigned',
  CargoLoading:      'Cargo Loading',
  LoadingComplete:   'Loading Complete',
  InTransit:         'In Transit',
  NearDestination:   'Near Destination',
  Unloading:         'Unloading',
  UnloadingComplete: 'Unloading Complete',  // ← added
  DeliveryCompleted: 'Delivered',
  Cancelled:         'Cancelled',
}
const STEPS = [
  'Assigned', 'CargoLoading', 'LoadingComplete', 'InTransit',
  'NearDestination', 'Unloading', 'UnloadingComplete', 'DeliveryCompleted',  // ← added
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

// ─ Pure helpers ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem',
      padding: '.55rem 0', borderBottom: '1px solid var(--border)', alignItems: 'start',
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, fontSize: '.85rem', textAlign: 'right', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {value}
      </span>
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)',
      minWidth: 0, width: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─ Main component ──────────────────────────────────────────────────────────────────
export default function TripDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/trips/${id}`)
      .then(r => setTrip(r.data))
      .catch(() => toast.error(t('failed_load')))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!trip) return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontWeight: 600 }}>{t('trip_not_found')}</div>
    </div>
  )

  const sc = STATUS_COLORS[trip.status] || '#64748b'
  const currentStepIdx = STEPS.indexOf(trip.status)
  const fmt = (dt?: string) => dt ? new Date(dt).toLocaleString(undefined, {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  }) : null
  const totalWeight = (trip.cargoItems ?? []).reduce((s, c) => s + (c.weightTons || 0), 0)

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        /*
         * iOS Safari auto-zoom fix:
         * Any input/select/textarea with font-size < 16px causes iOS to zoom in.
         * Setting font-size: 16px on those elements prevents this.
         * We do it in CSS so we don't have to touch every element inline.
         */
        input, select, textarea { font-size: 16px !important; }

        /* Layout */
        .td-three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .85rem; margin-bottom: .85rem; }
        .cargo-table-wrap { display: block; overflow-x: auto; }
        .cargo-cards-wrap { display: none; }
        .td-timeline-item { display: flex; gap: .65rem; align-items: flex-start; margin-bottom: .65rem; }
        .td-timeline-dot  { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: .45rem; }
        .step-lbl { font-size: .72rem; font-weight: 600; text-align: center; line-height: 1.2; margin-top: .3rem; }

        @media (max-width: 860px) { .td-three-col { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .td-three-col { grid-template-columns: 1fr; }
          .cargo-table-wrap { display: none; }
          .cargo-cards-wrap { display: block; }
          .step-lbl { font-size: .65rem; }
        }
      `}</style>

      {/* Back */}
      <button onClick={() => nav('/management/trips')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--primary)', marginBottom: '.85rem', padding: 0,
        fontSize: '1rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '.3rem',
      }}>{t('back')}</button>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${sc}ee, ${sc}99)`,
        borderRadius: 'var(--radius)', padding: '1rem', color: '#fff',
        marginBottom: '.85rem', boxShadow: `0 4px 16px ${sc}33`,
        width: '100%', boxSizing: 'border-box', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Status badge */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,.22)', borderRadius: 999,
              padding: '.2rem .7rem', fontSize: '.78rem', fontWeight: 800,
              letterSpacing: '.04em', marginBottom: '.35rem', whiteSpace: 'nowrap',
            }}>
              {t(`status_${trip.status}`)}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.tripNumber}
            </div>
            <div style={{ fontSize: '.85rem', opacity: .9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {trip.originLocation} → {trip.destinationLocation}
            </div>
            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.4rem', flexWrap: 'wrap' }}>
              {trip.distanceKm && <span style={{ fontSize: '.8rem', opacity: .85 }}>📍 {trip.distanceKm} km</span>}
              {(trip.cargoItems?.length ?? 0) > 0 && <span style={{ fontSize: '.8rem', opacity: .85 }}>📦 {trip.cargoItems!.length} cargo</span>}
              {totalWeight > 0 && <span style={{ fontSize: '.8rem', opacity: .85 }}>⚖️ {totalWeight.toFixed(2)} t</span>}
            </div>
          </div>
          <button onClick={() => nav(`/management/trips/${id}/edit`)} style={{
            background: 'rgba(255,255,255,.2)', color: '#fff',
            border: '1px solid rgba(255,255,255,.4)', borderRadius: 8,
            padding: '.5rem .85rem', cursor: 'pointer', fontSize: '.88rem',
            fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
          }}>✏️ {t('edit')}</button>
        </div>
      </div>

      {/* Step bar */}
      {trip.status !== 'Cancelled' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '.85rem 1rem',
          marginBottom: '.85rem', overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', minWidth: 420, gap: 0 }}>
            {STEPS.map((step, idx) => {
              const isDone   = idx < currentStepIdx
              const isActive = idx === currentStepIdx
              const textColor = isActive ? sc : isDone ? '#22c55e' : 'var(--text-muted)'
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {idx < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', top: 13, left: '50%', right: '-50%',
                      height: 2, background: idx < currentStepIdx ? '#22c55e' : 'var(--border)', zIndex: 0,
                    }} />
                  )}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: isDone ? '#22c55e' : isActive ? sc : 'var(--surface2)',
                    border: `2px solid ${isDone ? '#22c55e' : isActive ? sc : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.75rem', fontWeight: 800,
                    color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                    zIndex: 1, position: 'relative', flexShrink: 0,
                    boxShadow: isActive ? `0 0 0 3px ${sc}33` : 'none',
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="step-lbl" style={{ color: textColor }}>{stepShort[step]}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 3-col: Trip Info | Driver & Vehicle | Loading Times ── */}
      <div className="td-three-col">

        {/* Trip Info */}
        <SectionCard title={t('trip_info')} icon="📋">
          <InfoRow label={t('origin_label')}             value={trip.originLocation} />
          <InfoRow label={t('destination_label')}        value={trip.destinationLocation} />
          <InfoRow label={t('distance')}                 value={trip.distanceKm ? `${trip.distanceKm} km` : null} />
          <InfoRow label={t('planned_departure_detail')} value={fmt(trip.plannedDepartureDate)} />
          <InfoRow label={t('expected_arrival_detail')}  value={fmt(trip.expectedArrivalDate)} />
          <InfoRow label={t('actual_departure')}         value={fmt(trip.actualDepartureDate)} />
          <InfoRow label={t('actual_arrival')}           value={fmt(trip.actualArrivalDate)} />
          {trip.cmrNumber && (
            <InfoRow label="CMR" value={trip.cmrNumber} />
          )}
          {trip.podReceived && (
            <div style={{ marginTop: '.75rem', padding: '.6rem .8rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '.85rem' }}>{t('pod_received')}</div>
                {trip.podNumber && <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{trip.podNumber}</div>}
              </div>
            </div>
          )}
          {trip.remarks && (
            <div style={{ marginTop: '.75rem', padding: '.6rem .8rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', fontSize: '.85rem', color: '#92400e', wordBreak: 'break-word' }}>
              📝 {trip.remarks}
            </div>
          )}
        </SectionCard>

        {/* Driver & Vehicle */}
        <SectionCard title={t('driver_vehicle')} icon="👤">
          {trip.driver?.fullName ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem', background: 'var(--surface2)', borderRadius: 8, marginBottom: '.6rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '.9rem', flexShrink: 0,
                }}>
                  {trip.driver.fullName[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trip.driver.fullName}
                  </div>
                  {trip.driver.phone && (
                    <a href={`tel:${trip.driver.phone}`} style={{ fontSize: '.82rem', color: 'var(--primary)', textDecoration: 'none' }}>
                      📞 {trip.driver.phone}
                    </a>
                  )}
                </div>
              </div>
              <InfoRow label={t('license')} value={trip.driver.licenseNumber} />
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', padding: '.5rem' }}>—</p>
          )}
          {trip.vehicle?.registrationNumber ? (
            <div style={{ marginTop: '.6rem', padding: '.6rem', background: 'var(--surface2)', borderRadius: 8, display: 'flex', gap: '.6rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🚛</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {trip.vehicle.registrationNumber}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[trip.vehicle.fleetName, trip.vehicle.type, trip.vehicle.capacity ? `${trip.vehicle.capacity}t` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', padding: '.5rem', marginTop: '.5rem' }}>—</p>
          )}
        </SectionCard>

        {/* Loading Times */}
        <SectionCard title={t('loading_times')} icon="⏱️">
          <InfoRow label={t('loading_arrival')}   value={fmt(trip.loadingArrivalTime)} />
          <InfoRow label={t('loading_end')}        value={fmt(trip.loadingEndTime)} />
          <InfoRow label={t('unloading_arrival')} value={fmt(trip.unloadingArrivalTime)} />
          <InfoRow label={t('unloading_end')}     value={fmt(trip.unloadingEndTime)} />
          {!trip.loadingArrivalTime && !trip.loadingEndTime && !trip.unloadingArrivalTime && !trip.unloadingEndTime && (
            <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', padding: '.4rem' }}>—</p>
          )}
        </SectionCard>
      </div>

      {/* ── Cargo ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '.85rem',
        boxShadow: 'var(--shadow-sm)', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span>📦</span>
            <h3 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>
              {t('cargo_count', { count: trip.cargoItems?.length ?? 0 })}
            </h3>
          </div>
          {totalWeight > 0 && (
            <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '.25rem .7rem', borderRadius: 999, fontSize: '.82rem', fontWeight: 700 }}>
              ⚖️ {t('total')}: {totalWeight.toFixed(2)} t
            </span>
          )}
        </div>

        {(!trip.cargoItems || trip.cargoItems.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '.35rem' }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{t('no_cargo')}</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="cargo-table-wrap">
              <table style={{ minWidth: 520, width: '100%' }}>
                <thead>
                  <tr>
                    <th>#</th><th>{t('description')}</th><th>{t('type')}</th>
                    <th>{t('weight')}</th><th>{t('consignor')}</th>
                    <th>{t('consignee')}</th><th>{t('instructions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.cargoItems!.map((c, idx) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '.85rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{c.description}</td>
                      <td>{c.cargoType ? <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 600 }}>{c.cargoType}</span> : '—'}</td>
                      <td style={{ fontSize: '.85rem' }}>{c.weightTons ? `${c.weightTons}t` : '—'}</td>
                      <td style={{ fontSize: '.85rem' }}>{c.consignor || '—'}</td>
                      <td style={{ fontSize: '.85rem' }}>{c.consignee || '—'}</td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '.82rem', color: 'var(--text-muted)' }}>{c.specialInstructions || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="cargo-cards-wrap">
              {trip.cargoItems!.map((c, idx) => (
                <div key={c.id} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.75rem .85rem', marginBottom: '.5rem', border: '1px solid var(--border)', display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.88rem', flexShrink: 0 }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.25rem', wordBreak: 'break-word' }}>{c.description}</div>
                    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.25rem' }}>
                      {c.cargoType && <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.1rem .45rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 600 }}>{c.cargoType}</span>}
                      {c.weightTons != null && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '.1rem .45rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 600 }}>⚖️ {c.weightTons}t</span>}
                    </div>
                    <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
                      {c.consignor && <div>🏭 <strong>{t('consignor')}:</strong> {c.consignor}</div>}
                      {c.consignee && <div>📦 <strong>{t('consignee')}:</strong> {c.consignee}</div>}
                      {c.specialInstructions && (
                        <div style={{ marginTop: '.3rem', padding: '.3rem .5rem', background: '#fffbeb', borderRadius: 6, border: '1px solid #fde68a', color: '#92400e', wordBreak: 'break-word', fontSize: '.82rem' }}>
                          ⚠️ {c.specialInstructions}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {totalWeight > 0 && (
                <div style={{ textAlign: 'right', padding: '.5rem .25rem', fontWeight: 800, color: '#16a34a', fontSize: '.9rem' }}>
                  ⚖️ {t('total')}: {totalWeight.toFixed(2)} t
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Status history ── */}
      {(trip.statusHistory?.length ?? 0) > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', boxShadow: 'var(--shadow-sm)', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
            <span>🕒</span>
            <h3 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{t('status_history')}</h3>
          </div>
          {[...trip.statusHistory!].reverse().map(h => {
            const color = STATUS_COLORS[h.status] || '#64748b'
            return (
              <div key={h.id} className="td-timeline-item">
                <div className="td-timeline-dot" style={{ background: color }} />
                <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '.6rem .8rem', border: '1px solid var(--border)', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.35rem' }}>
                    <span style={{ background: `${color}20`, color, padding: '.18rem .6rem', borderRadius: 999, fontSize: '.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {t(`status_${h.status}`)}
                    </span>
                    <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(h.changedAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {h.remarks && <div style={{ marginTop: '.3rem', fontSize: '.82rem', color: 'var(--text)', wordBreak: 'break-word' }}>{h.remarks}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}