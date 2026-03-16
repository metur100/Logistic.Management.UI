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

const STEPS = [
  'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading', 'DeliveryCompleted'
]

const STEP_SHORT: Record<string, string> = {
  Assigned: 'Asgn', CargoLoading: 'Load', LoadingComplete: 'Lded',
  InTransit: 'Transit', NearDestination: 'Near', Unloading: 'Unlod',
  DeliveryCompleted: 'Done'
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '.5rem',
      padding: '.5rem 0',
      borderBottom: '1px solid var(--border)',
      alignItems: 'start'
    }}>
      <span style={{
        color: 'var(--text-muted)',
        fontSize: '.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.04em',
        paddingTop: '.05rem'
      }}>
        {label}
      </span>
      <span style={{
        fontWeight: 600,
        fontSize: '.8rem',
        textAlign: 'right',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}>
        {value}
      </span>
    </div>
  )
}

function SectionCard({ title, icon, children }: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
      boxShadow: 'var(--shadow-sm)',
      minWidth: 0,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '.5rem', marginBottom: '.85rem'
      }}>
        <span style={{ fontSize: '.95rem' }}>{icon}</span>
        <h3 style={{ fontWeight: 700, fontSize: '.88rem', margin: 0 }}>{title}</h3>
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
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', textAlign: 'center',
      padding: '3rem 1rem', color: 'var(--text-muted)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
      <div style={{ fontWeight: 600 }}>{t('trip_not_found')}</div>
    </div>
  )

  const sc = STATUS_COLORS[trip.status] || '#64748b'
  const currentStepIdx = STEPS.indexOf(trip.status)

  const fmt = (dt?: string) =>
    dt ? new Date(dt).toLocaleString(undefined, {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }) : null

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .td-section-stack {
          display: flex;
          flex-direction: column;
          gap: .85rem;
          margin-bottom: .85rem;
        }
        .td-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .85rem;
          margin-bottom: .85rem;
        }
        .cargo-table-wrap { display: block; overflow-x: auto; }
        .cargo-cards-wrap { display: none; }
        .td-timeline-item {
          display: flex;
          gap: .65rem;
          align-items: flex-start;
          margin-bottom: .65rem;
        }
        .td-timeline-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: .4rem;
        }
        @media (max-width: 640px) {
          .td-two-col {
            grid-template-columns: 1fr;
          }
          .cargo-table-wrap { display: none; }
          .cargo-cards-wrap { display: block; }
        }
      `}</style>

      {/* Back */}
      <button
        onClick={() => nav('/management/trips')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', marginBottom: '.85rem', padding: 0,
          fontSize: '.85rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '.3rem'
        }}>
       {t('back')}
      </button>

      {/* Gradient header */}
      <div style={{
        background: `linear-gradient(135deg, ${sc}ee, ${sc}99)`,
        borderRadius: 'var(--radius)',
        padding: '1rem',
        color: '#fff',
        marginBottom: '.85rem',
        boxShadow: `0 4px 16px ${sc}33`,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '.75rem',
          flexWrap: 'nowrap'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '.65rem', opacity: .85, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.07em',
              marginBottom: '.25rem'
            }}>
              {trip.status}
            </div>
            <div style={{
              fontSize: '1rem', fontWeight: 800,
              marginBottom: '.3rem',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {trip.tripNumber}
            </div>
            <div style={{
              fontSize: '.78rem', opacity: .9,
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {trip.originLocation} → {trip.destinationLocation}
            </div>
            {trip.distanceKm && (
              <div style={{ fontSize: '.72rem', opacity: .75, marginTop: '.2rem' }}>
                📍 {trip.distanceKm} km
              </div>
            )}
          </div>
          <button
            onClick={() => nav(`/management/trips/${id}/edit`)}
            style={{
              background: 'rgba(255,255,255,.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,.4)',
              borderRadius: 8,
              padding: '.4rem .75rem',
              cursor: 'pointer',
              fontSize: '.78rem',
              fontWeight: 700,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}>
            ✏️ {t('edit')}
          </button>
        </div>
      </div>

      {/* Step bar — horizontal scroll on mobile */}
      {trip.status !== 'Cancelled' && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '.85rem 1rem',
          marginBottom: '.85rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling']
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            minWidth: 360,
            gap: 0
          }}>
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIdx
              const isActive = idx === currentStepIdx
              const dotColor = isDone || isActive ? sc : 'var(--border)'
              const textColor = isActive ? sc : isDone ? '#22c55e' : 'var(--text-muted)'
              return (
                <div key={step} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', position: 'relative'
                }}>
                  {/* Connector line */}
                  {idx < STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 13, left: '50%', right: '-50%',
                      height: 2,
                      background: idx < currentStepIdx ? '#22c55e' : 'var(--border)',
                      zIndex: 0
                    }} />
                  )}
                  {/* Dot */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: isDone ? '#22c55e' : isActive ? sc : 'var(--surface2)',
                    border: `2px solid ${isDone ? '#22c55e' : isActive ? sc : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.65rem', fontWeight: 800,
                    color: isDone || isActive ? '#fff' : 'var(--text-muted)',
                    zIndex: 1, position: 'relative',
                    flexShrink: 0
                  }}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  {/* Label */}
                  <div style={{
                    fontSize: '.58rem', fontWeight: 600,
                    color: textColor, marginTop: '.3rem',
                    textAlign: 'center', lineHeight: 1.2
                  }}>
                    {STEP_SHORT[step] || step}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Trip info + Driver/Vehicle/Loading — stacked on mobile */}
      <div className="td-two-col">
        <SectionCard title={t('trip_info')} icon="📋">
          <InfoRow label={t('origin_label')}             value={trip.originLocation} />
          <InfoRow label={t('destination_label')}        value={trip.destinationLocation} />
          <InfoRow label={t('distance')}                 value={trip.distanceKm ? `${trip.distanceKm} km` : null} />
          <InfoRow label={t('planned_departure_detail')} value={fmt(trip.plannedDepartureDate)} />
          <InfoRow label={t('expected_arrival_detail')}  value={fmt(trip.expectedArrivalDate)} />
          <InfoRow label={t('actual_departure')}         value={fmt(trip.actualDepartureDate)} />
          <InfoRow label={t('actual_arrival')}           value={fmt(trip.actualArrivalDate)} />

          {trip.podReceived && (
            <div style={{
              marginTop: '.75rem', padding: '.6rem .8rem',
              background: '#f0fdf4', borderRadius: 8,
              border: '1px solid #bbf7d0',
              display: 'flex', alignItems: 'center', gap: '.6rem'
            }}>
              <span>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '.78rem' }}>
                  {t('pod_received')}
                </div>
                {trip.podNumber && (
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                    {trip.podNumber}
                  </div>
                )}
              </div>
            </div>
          )}

          {trip.remarks && (
            <div style={{
              marginTop: '.75rem', padding: '.6rem .8rem',
              background: '#fffbeb', borderRadius: 8,
              border: '1px solid #fde68a',
              fontSize: '.78rem', color: '#92400e',
              wordBreak: 'break-word'
            }}>
              📝 {trip.remarks}
            </div>
          )}
        </SectionCard>

        <div className="td-section-stack">
          {/* Driver & Vehicle */}
          <SectionCard title={t('driver_vehicle')} icon="👤">
            {trip.driver?.fullName ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  padding: '.6rem', background: 'var(--surface2)',
                  borderRadius: 8, marginBottom: '.6rem'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '.82rem', flexShrink: 0
                  }}>
                    {trip.driver.fullName[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '.82rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {trip.driver.fullName}
                    </div>
                    {trip.driver.phone && (
                      <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                        📞 {trip.driver.phone}
                      </div>
                    )}
                  </div>
                </div>
                <InfoRow label={t('license')} value={trip.driver.licenseNumber} />
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>—</p>
            )}

            {trip.vehicle?.registrationNumber && (
              <div style={{
                marginTop: '.6rem', padding: '.6rem',
                background: 'var(--surface2)', borderRadius: 8,
                display: 'flex', gap: '.6rem', alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🚛</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: '.82rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {trip.vehicle.registrationNumber}
                  </div>
                  <div style={{
                    fontSize: '.72rem', color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {[trip.vehicle.fleetName, trip.vehicle.type,
                      trip.vehicle.capacity ? `${trip.vehicle.capacity}t` : null]
                      .filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Loading times */}
          <SectionCard title={t('loading_times')} icon="⏱️">
            <InfoRow label={t('loading_arrival')}   value={fmt(trip.loadingArrivalTime)} />
            <InfoRow label={t('loading_end')}        value={fmt(trip.loadingEndTime)} />
            <InfoRow label={t('unloading_arrival')} value={fmt(trip.unloadingArrivalTime)} />
            <InfoRow label={t('unloading_end')}     value={fmt(trip.unloadingEndTime)} />
            {!trip.loadingArrivalTime && !trip.loadingEndTime &&
              !trip.unloadingArrivalTime && !trip.unloadingEndTime && (
                <p style={{ color: 'var(--text-muted)', fontSize: '.78rem', textAlign: 'center', padding: '.4rem' }}>—</p>
              )}
          </SectionCard>
        </div>
      </div>

      {/* Cargo */}
      {trip.cargoItems && trip.cargoItems.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1rem',
          marginBottom: '.85rem', boxShadow: 'var(--shadow-sm)',
          width: '100%', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>📦</span>
            <h3 style={{ fontWeight: 700, fontSize: '.88rem', margin: 0 }}>
              {t('cargo_count', { count: trip.cargoItems.length })}
            </h3>
          </div>

          {/* Desktop table */}
          <div className="cargo-table-wrap">
            <table style={{ minWidth: 480, width: '100%' }}>
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
                      {c.cargoType
                        ? <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.7rem', fontWeight: 600 }}>{c.cargoType}</span>
                        : '—'}
                    </td>
                    <td>{c.weightTons ? `${c.weightTons}t` : '—'}</td>
                    <td>{c.consignor || '—'}</td>
                    <td>{c.consignee || '—'}</td>
                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                background: 'var(--surface2)', borderRadius: 8,
                padding: '.75rem .85rem', marginBottom: '.5rem',
                border: '1px solid var(--border)',
                display: 'flex', gap: '.6rem', alignItems: 'flex-start'
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                  color: '#fff', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 800, fontSize: '.75rem', flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem', marginBottom: '.2rem', wordBreak: 'break-word' }}>
                    {c.description}
                  </div>
                  <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.2rem' }}>
                    {c.cargoType && (
                      <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.08rem .4rem', borderRadius: 999, fontSize: '.65rem', fontWeight: 600 }}>
                        {c.cargoType}
                      </span>
                    )}
                    {c.weightTons && (
                      <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '.08rem .4rem', borderRadius: 999, fontSize: '.65rem', fontWeight: 600 }}>
                        ⚖️ {c.weightTons}t
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                    {c.consignor && <div>🏭 {c.consignor}</div>}
                    {c.consignee && <div>📦 {c.consignee}</div>}
                    {c.specialInstructions && (
                      <div style={{
                        marginTop: '.3rem', padding: '.3rem .5rem',
                        background: '#fffbeb', borderRadius: 6,
                        border: '1px solid #fde68a', color: '#92400e',
                        wordBreak: 'break-word'
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
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1rem',
          boxShadow: 'var(--shadow-sm)',
          width: '100%', boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.9rem' }}>
            <span>🕒</span>
            <h3 style={{ fontWeight: 700, fontSize: '.88rem', margin: 0 }}>{t('status_history')}</h3>
          </div>
          {[...trip.statusHistory].reverse().map(h => {
            const color = STATUS_COLORS[h.status] || '#64748b'
            return (
              <div key={h.id} className="td-timeline-item">
                <div className="td-timeline-dot" style={{ background: color }} />
                <div style={{
                  background: 'var(--surface2)', borderRadius: 8,
                  padding: '.6rem .8rem', border: '1px solid var(--border)',
                  flex: 1, minWidth: 0
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '.35rem'
                  }}>
                    <span style={{
                      background: `${color}20`, color,
                      padding: '.15rem .55rem', borderRadius: 999,
                      fontSize: '.65rem', fontWeight: 700, whiteSpace: 'nowrap'
                    }}>
                      {h.status}
                    </span>
                    <span style={{ fontSize: '.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(h.changedAt).toLocaleString(undefined, {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {h.remarks && (
                    <div style={{
                      marginTop: '.3rem', fontSize: '.75rem',
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
  )
}