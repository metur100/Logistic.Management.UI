import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver {
  fullName?: string
  phone?: string
  licenseNumber?: string
}

interface Vehicle {
  registrationNumber?: string
  fleetName?: string
  type?: string
  capacity?: number
}

interface CargoItem {
  id: number
  description: string
  cargoType?: string
  weightTons?: number
  consignor?: string
  consignee?: string
  specialInstructions?: string
}

interface StatusHistory {
  id: number
  status: string
  changedAt: string
  remarks?: string
}

interface Trip {
  id: number
  tripNumber: string
  status: string
  originLocation: string
  destinationLocation: string
  distanceKm?: number
  plannedDepartureDate?: string
  expectedArrivalDate?: string
  actualDepartureDate?: string
  actualArrivalDate?: string
  podNumber?: string
  podReceived?: boolean
  remarks?: string
  loadingArrivalTime?: string
  loadingEndTime?: string
  unloadingArrivalTime?: string
  unloadingEndTime?: string
  driver?: Driver
  vehicle?: Vehicle
  cargoItems?: CargoItem[]
  statusHistory?: StatusHistory[]
}

const STATUS_COLORS: Record<string, string> = {
  Assigned: '#6366f1', CargoLoading: '#f59e0b', LoadingComplete: '#3b82f6',
  InTransit: '#8b5cf6', NearDestination: '#ec4899', Unloading: '#f97316',
  DeliveryCompleted: '#22c55e', Cancelled: '#ef4444'
}

const STEPS = ['Assigned','CargoLoading','LoadingComplete','InTransit','NearDestination','Unloading','DeliveryCompleted']

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '.6rem 0', borderBottom: '1px solid var(--border)',
      gap: '1rem', flexWrap: 'wrap'
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, fontSize: '.875rem', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: '.95rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

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
    <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontWeight: 600 }}>{t('trip_not_found')}</div>
    </div>
  )

  const sc = STATUS_COLORS[trip.status] || '#64748b'
  const currentStepIdx = STEPS.indexOf(trip.status)

  return (
    <div>
      <style>{`
        .td-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .td-right-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        @media (max-width: 860px) {
          .td-grid {
            grid-template-columns: 1fr;
          }
        }
        .cargo-table-wrap { display: block; }
        .cargo-cards-wrap { display: none; }
        @media (max-width: 700px) {
          .cargo-table-wrap { display: none; }
          .cargo-cards-wrap { display: block; }
        }
      `}</style>

      {/* Back button */}
      <button
        onClick={() => nav('/management/trips')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', marginBottom: '1rem', padding: 0,
          fontSize: '.875rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '.35rem'
        }}>
        ← {t('back')}
      </button>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${sc}dd, ${sc}99)`,
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        color: '#fff', marginBottom: '1.5rem',
        boxShadow: `0 8px 24px ${sc}33`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '.72rem', opacity: .8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem' }}>
              {trip.status}
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.4rem' }}>
              {trip.tripNumber}
            </h1>
            <div style={{ fontSize: '.9rem', opacity: .85 }}>
              {trip.originLocation} → {trip.destinationLocation}
            </div>
            {trip.distanceKm && (
              <div style={{ fontSize: '.82rem', opacity: .75, marginTop: '.3rem' }}>
                📍 {trip.distanceKm} km
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}>
            <button
              className="btn"
              onClick={() => nav(`/management/trips/${id}/edit`)}
              style={{
                background: 'rgba(255,255,255,.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.35)',
                backdropFilter: 'blur(4px)'
              }}>
              ✏️ {t('edit')}
            </button>
          </div>
        </div>
      </div>

      {/* Step progress bar */}
      {trip.status !== 'Cancelled' && (
        <div className="card" style={{ marginBottom: '1.25rem', overflowX: 'auto' }}>
          <div className="step-bar">
            {STEPS.map((step, idx) => (
              <div key={step} className="step-item">
                <div className={`step-dot ${idx < currentStepIdx ? 'done' : idx === currentStepIdx ? 'active' : ''}`}>
                  {idx < currentStepIdx ? '✓' : idx + 1}
                </div>
                <div className="step-label" style={{ fontSize: '.65rem' }}>
                  {step.replace(/([A-Z])/g, ' $1').trim().split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="td-grid">

        {/* Trip info */}
        <SectionCard title={t('trip_info')} icon="📋">
          <InfoRow label={t('origin_label')} value={trip.originLocation} />
          <InfoRow label={t('destination_label')} value={trip.destinationLocation} />
          <InfoRow label={t('distance')} value={trip.distanceKm ? `${trip.distanceKm} km` : null} />
          <InfoRow label={t('planned_departure_detail')} value={trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : null} />
          <InfoRow label={t('expected_arrival_detail')} value={trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : null} />
          <InfoRow label={t('actual_departure')} value={trip.actualDepartureDate ? new Date(trip.actualDepartureDate).toLocaleString() : null} />
          <InfoRow label={t('actual_arrival')} value={trip.actualArrivalDate ? new Date(trip.actualArrivalDate).toLocaleString() : null} />
          {trip.podReceived && (
            <div style={{
              marginTop: '1rem', padding: '.75rem 1rem',
              background: '#f0fdf4', borderRadius: 'var(--radius-sm)',
              border: '1px solid #bbf7d0',
              display: 'flex', alignItems: 'center', gap: '.75rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '.85rem' }}>{t('pod_received')}</div>
                {trip.podNumber && <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{trip.podNumber}</div>}
              </div>
            </div>
          )}
          {trip.remarks && (
            <div style={{
              marginTop: '1rem', padding: '.75rem',
              background: '#fffbeb', borderRadius: 'var(--radius-sm)',
              border: '1px solid #fde68a', fontSize: '.875rem', color: '#92400e'
            }}>
              📝 {trip.remarks}
            </div>
          )}
        </SectionCard>

        {/* Right column */}
        <div className="td-right-col">

          {/* Driver & Vehicle */}
          <SectionCard title={t('driver_vehicle')} icon="👤">
            {trip.driver?.fullName ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.75rem', background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)', marginBottom: '.75rem'
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '.95rem', flexShrink: 0
                  }}>
                    {trip.driver.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{trip.driver.fullName}</div>
                    {trip.driver.phone && (
                      <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>📞 {trip.driver.phone}</div>
                    )}
                  </div>
                </div>
                <InfoRow label={t('license')} value={trip.driver.licenseNumber} />
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>—</p>
            )}
            {trip.vehicle?.registrationNumber && (
              <div style={{
                marginTop: '.75rem', padding: '.75rem',
                background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                display: 'flex', gap: '.75rem', alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.3rem' }}>🚛</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{trip.vehicle.registrationNumber}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {[trip.vehicle.fleetName, trip.vehicle.type, trip.vehicle.capacity ? `${trip.vehicle.capacity}t` : null]
                      .filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Loading times */}
          <SectionCard title={t('loading_times')} icon="⏱️">
            <InfoRow label={t('loading_arrival')} value={trip.loadingArrivalTime ? new Date(trip.loadingArrivalTime).toLocaleString() : null} />
            <InfoRow label={t('loading_end')} value={trip.loadingEndTime ? new Date(trip.loadingEndTime).toLocaleString() : null} />
            <InfoRow label={t('unloading_arrival')} value={trip.unloadingArrivalTime ? new Date(trip.unloadingArrivalTime).toLocaleString() : null} />
            <InfoRow label={t('unloading_end')} value={trip.unloadingEndTime ? new Date(trip.unloadingEndTime).toLocaleString() : null} />
            {!trip.loadingArrivalTime && !trip.loadingEndTime && !trip.unloadingArrivalTime && !trip.unloadingEndTime && (
              <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', textAlign: 'center', padding: '.5rem' }}>—</p>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Cargo */}
      {trip.cargoItems && trip.cargoItems.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📦</span>
            <h3 style={{ fontWeight: 700, fontSize: '.95rem' }}>
              {t('cargo_count', { count: trip.cargoItems.length })}
            </h3>
          </div>

          {/* Desktop table */}
          <div className="cargo-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('description')}</th>
                  <th>{t('type')}</th>
                  <th>{t('weight')}</th>
                  <th>{t('consignor')}</th>
                  <th>{t('consignee')}</th>
                  <th>{t('instructions')}</th>
                </tr>
              </thead>
              <tbody>
                {trip.cargoItems.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.description}</td>
                    <td>
                      {c.cargoType ? (
                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.15rem .55rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>
                          {c.cargoType}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{c.weightTons ? `${c.weightTons}t` : '—'}</td>
                    <td>{c.consignor || '—'}</td>
                    <td>{c.consignee || '—'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.specialInstructions || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="cargo-cards-wrap">
            {trip.cargoItems.map((c, idx) => (
              <div key={c.id} style={{
                background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                padding: '.85rem 1rem', marginBottom: '.6rem',
                border: '1px solid var(--border)',
                display: 'flex', gap: '.75rem', alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: '.3rem' }}>{c.description}</div>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                    {c.cargoType && (
                      <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.12rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600 }}>
                        {c.cargoType}
                      </span>
                    )}
                    {c.weightTons && (
                      <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '.12rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600 }}>
                        ⚖️ {c.weightTons}t
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                    {c.consignor && <div>🏭 {c.consignor}</div>}
                    {c.consignee && <div>📦 {c.consignee}</div>}
                    {c.specialInstructions && (
                      <div style={{
                        marginTop: '.4rem', padding: '.4rem .65rem',
                        background: '#fffbeb', borderRadius: 6,
                        border: '1px solid #fde68a', color: '#92400e'
                      }}>
                        ⚠️ {c.specialInstructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status history */}
      {trip.statusHistory && trip.statusHistory.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🕒</span>
            <h3 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('status_history')}</h3>
          </div>
          <div className="timeline">
            {[...trip.statusHistory].reverse().map(h => {
              const color = STATUS_COLORS[h.status] || '#64748b'
              return (
                <div key={h.id} className="timeline-item">
                  <div className="timeline-dot" style={{ background: color }} />
                  <div style={{
                    background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                    padding: '.75rem 1rem', border: '1px solid var(--border)', flex: 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem' }}>
                      <span style={{
                        background: `${color}20`, color,
                        padding: '.2rem .65rem', borderRadius: 999,
                        fontSize: '.72rem', fontWeight: 700
                      }}>
                        {h.status}
                      </span>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                    {h.remarks && (
                      <div style={{ marginTop: '.4rem', fontSize: '.85rem', color: 'var(--text)' }}>
                        {h.remarks}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
