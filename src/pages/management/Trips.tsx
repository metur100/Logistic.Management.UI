
// ─── Trips.tsx ──────────────────────────────────────────────────────────────
// (paste into separate file: src/pages/management/Trips.tsx)

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_COLORS2: Record<string, string> = {
  Assigned: '#6366f1', CargoLoading: '#f59e0b', LoadingComplete: '#3b82f6',
  InTransit: '#8b5cf6', NearDestination: '#ec4899', Unloading: '#f97316',
  DeliveryCompleted: '#22c55e', Cancelled: '#ef4444'
}
const STATUS_ICONS2: Record<string, string> = {
  Assigned: '📋', CargoLoading: '📦', LoadingComplete: '✅',
  InTransit: '🚛', NearDestination: '📍', Unloading: '🏗️',
  DeliveryCompleted: '🎉', Cancelled: '❌'
}

interface TripRow {
  id: number; tripNumber: string; status: string
  originLocation: string; destinationLocation: string
  plannedDepartureDate?: string
  driver?: { fullName: string }
  vehicle?: { registrationNumber: string }
  cargoItems?: { id: number; description: string; weightTons?: number }[]
}

export default function Trips() {
  const { t } = useTranslation()
  const [trips, setTrips] = useState<TripRow[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    const q = filter ? `?status=${filter}` : ''
    api.get(`/trips${q}`)
      .then(r => setTrips(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
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
    (tr.driver?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ width:'100%', maxWidth:'100%', overflowX:'hidden', boxSizing:'border-box' }}>
      <style>{`
        .trips-table-wrap { display:block; overflow-x:auto; }
        .trips-cards-wrap { display:none; }
        @media (max-width: 860px) {
          .trips-table-wrap { display:none; }
          .trips-cards-wrap { display:block; }
        }
        .trip-card {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius); padding:1rem; margin-bottom:.65rem;
          box-shadow:var(--shadow-sm); transition:box-shadow .15s;
          display:flex; flex-direction:column; gap:.55rem;
        }
        .trip-card:hover { box-shadow:var(--shadow); }
        .trips-toolbar { display:flex; gap:.65rem; flex-wrap:wrap; align-items:center; }
        .trips-toolbar input  { flex:2; min-width:0; }
        .trips-toolbar select { flex:1; min-width:120px; }
        @media (max-width: 500px) {
          .trips-toolbar { flex-direction:column; }
          .trips-toolbar input, .trips-toolbar select { width:100%; flex:unset; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background:'linear-gradient(135deg, #1d4ed8, #6d28d9)',
        borderRadius:'var(--radius-lg)', padding:'1.25rem 1.5rem',
        color:'#fff', marginBottom:'1.25rem',
        boxShadow:'0 6px 20px rgba(29,78,216,.25)',
        display:'flex', justifyContent:'space-between',
        alignItems:'center', flexWrap:'wrap', gap:'1rem'
      }}>
        <div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:800, marginBottom:'.15rem' }}>🚛 {t('trips')}</h1>
          <p style={{ opacity:.8, fontSize:'.82rem', margin:0 }}>{trips.length} {t('trips').toLowerCase()}</p>
        </div>
        <button onClick={() => nav('/management/trips/new')} style={{
          background:'rgba(255,255,255,.2)', color:'#fff',
          border:'1px solid rgba(255,255,255,.35)',
          borderRadius:10, padding:'.55rem 1.1rem',
          cursor:'pointer', fontWeight:700, fontSize:'.875rem', whiteSpace:'nowrap'
        }}>{t('new_trip')}</button>
      </div>

      {/* Toolbar */}
      <div style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'.85rem 1rem',
        marginBottom:'1rem', boxShadow:'var(--shadow-sm)'
      }}>
        <div className="trips-toolbar">
          <input className="form-control"
            placeholder={`🔍 ${t('search_trips')}...`}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ margin:0 }} />
          <select className="form-control"
            value={filter} onChange={e => setFilter(e.target.value)}
            style={{ margin:0 }}>
            <option value="">{t('all_statuses')}</option>
            {Object.keys(STATUS_COLORS2).map(s => (
              <option key={s} value={s}>{STATUS_ICONS2[s]} {t(`status_${s}`)}</option>
            ))}
          </select>
        </div>
        {filter && (
          <div style={{ marginTop:'.65rem', display:'flex', alignItems:'center', gap:'.5rem' }}>
            <span style={{ fontSize:'.75rem', color:'var(--text-muted)' }}>{t('filtering_by')}:</span>
            <span style={{
              background:`${STATUS_COLORS2[filter]}20`, color:STATUS_COLORS2[filter],
              padding:'.2rem .65rem', borderRadius:999, fontSize:'.72rem', fontWeight:700,
              display:'inline-flex', alignItems:'center', gap:'.3rem'
            }}>
              {STATUS_ICONS2[filter]} {t(`status_${filter}`)}
            </span>
            <button onClick={() => setFilter('')} style={{
              background:'none', border:'none', cursor:'pointer',
              color:'var(--text-muted)', fontSize:'.75rem', padding:'.1rem .3rem'
            }}>✕ {t('clear')}</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="trips-table-wrap" style={{
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:'var(--radius)', boxShadow:'var(--shadow-sm)', overflow:'hidden'
          }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🔍</div>
                <div style={{ fontWeight:600 }}>{t('no_trips')}</div>
              </div>
            ) : (
              <table style={{ width:'100%' }}>
                <thead>
                  <tr>
                    <th>{t('trip_number')}</th>
                    <th>{t('route')}</th>
                    <th>{t('driver')}</th>
                    <th>{t('vehicle')}</th>
                    <th>{t('cargo')}</th>
                    <th>{t('planned_departure')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tr => {
                    const sc = STATUS_COLORS2[tr.status] ?? '#64748b'
                    const cargoCount = tr.cargoItems?.length ?? 0
                    const totalW = (tr.cargoItems ?? []).reduce((s,c) => s+(c.weightTons||0),0)
                    return (
                      <tr key={tr.id} style={{ cursor:'pointer' }}
                        onClick={() => nav(`/management/trips/${tr.id}`)}>
                        <td style={{ fontWeight:800 }}>{tr.tripNumber}</td>
                        <td>
                          <div style={{ fontWeight:600, fontSize:'.875rem' }}>{tr.originLocation}</div>
                          <div style={{ color:'var(--text-muted)', fontSize:'.78rem' }}>→ {tr.destinationLocation}</div>
                        </td>
                        <td>{tr.driver?.fullName || '—'}</td>
                        <td>{tr.vehicle?.registrationNumber || '—'}</td>
                        <td>
                          {cargoCount > 0 ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:'.15rem' }}>
                              <span style={{  }}> {cargoCount} {t('items')}</span>
                              {totalW > 0 && (
                                <span style={{  }}> {totalW.toFixed(1)}t</span>
                              )}
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize:'.82rem' }}>
                          {tr.plannedDepartureDate ? new Date(tr.plannedDepartureDate).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span style={{
                            padding:'.2rem .65rem', borderRadius:999, fontSize:'.72rem', fontWeight:700,
                            background:`${sc}20`, color:sc,
                            display:'inline-flex', alignItems:'center', gap:'.25rem'
                          }}>
                            {STATUS_ICONS2[tr.status]} {t(`status_${tr.status}`)}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                            <button className="btn btn-outline"
                              style={{ padding:'.3rem .6rem', fontSize:'.75rem' }}
                              onClick={() => nav(`/management/trips/${tr.id}`)}>👁️ {t('view')}</button>
                            <button className="btn btn-outline"
                              style={{ padding:'.3rem .6rem', fontSize:'.75rem' }}
                              onClick={() => nav(`/management/trips/${tr.id}/edit`)}>✏️ {t('edit')}</button>
                            {!['DeliveryCompleted','Cancelled'].includes(tr.status) && (
                              <button className="btn btn-danger"
                                style={{ padding:'.3rem .6rem', fontSize:'.75rem' }}
                                onClick={() => cancelTrip(tr.id)}>❌ {t('cancel')}</button>
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
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:'var(--radius)', textAlign:'center',
                padding:'3rem 1rem', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🔍</div>
                <div style={{ fontWeight:600 }}>{t('no_trips')}</div>
              </div>
            ) : filtered.map(tr => {
              const sc = STATUS_COLORS2[tr.status] ?? '#64748b'
              const cargoCount = tr.cargoItems?.length ?? 0
              const totalW = (tr.cargoItems ?? []).reduce((s,c) => s+(c.weightTons||0),0)
              return (
                <div key={tr.id} className="trip-card" style={{ borderLeft:`4px solid ${sc}` }}>

                  {/* Top row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'.75rem' }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:'.95rem', marginBottom:'.2rem',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {tr.tripNumber}
                      </div>
                      <div style={{ fontSize:'.82rem', color:'var(--text-muted)',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {tr.originLocation} → {tr.destinationLocation}
                      </div>
                    </div>
                    <span style={{
                      padding:'.22rem .65rem', borderRadius:999, fontSize:'.68rem', fontWeight:700,
                      background:`${sc}20`, color:sc, whiteSpace:'nowrap', flexShrink:0,
                      display:'inline-flex', alignItems:'center', gap:'.25rem'
                    }}>
                      {STATUS_ICONS2[tr.status]} {t(`status_${tr.status}`)}
                    </span>
                  </div>

                  {/* Meta chips */}
                  <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                    {tr.driver?.fullName && (
                      <span style={{ background:'var(--surface2)', color:'var(--text-muted)',
                        padding:'.15rem .5rem', borderRadius:999, fontSize:'.72rem', fontWeight:600 }}>
                        👤 {tr.driver.fullName}
                      </span>
                    )}
                    {tr.vehicle?.registrationNumber && (
                      <span style={{ background:'var(--surface2)', color:'var(--text-muted)',
                        padding:'.15rem .5rem', borderRadius:999, fontSize:'.72rem', fontWeight:600 }}>
                        🚛 {tr.vehicle.registrationNumber}
                      </span>
                    )}
                    {cargoCount > 0 && (
                      <span style={{ background:'#eff6ff', color:'#2563eb',
                        padding:'.15rem .5rem', borderRadius:999, fontSize:'.72rem', fontWeight:600 }}>
                        📦 {cargoCount} {t('items')}{totalW > 0 ? ` · ⚖️ ${totalW.toFixed(1)}t` : ''}
                      </span>
                    )}
                    {tr.plannedDepartureDate && (
                      <span style={{ background:'var(--surface2)', color:'var(--text-muted)',
                        padding:'.15rem .5rem', borderRadius:999, fontSize:'.72rem', fontWeight:600 }}>
                        📅 {new Date(tr.plannedDepartureDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'.5rem' }}>
                    <button className="btn btn-outline"
                      style={{ flex:1, padding:'.4rem', fontSize:'.8rem' }}
                      onClick={() => nav(`/management/trips/${tr.id}`)}>👁️ {t('view')}</button>
                    <button className="btn btn-outline"
                      style={{ flex:1, padding:'.4rem', fontSize:'.8rem' }}
                      onClick={() => nav(`/management/trips/${tr.id}/edit`)}>✏️ {t('edit')}</button>
                    {!['DeliveryCompleted','Cancelled'].includes(tr.status) && (
                      <button className="btn btn-danger"
                        style={{ flex:1, padding:'.4rem', fontSize:'.8rem' }}
                        onClick={() => cancelTrip(tr.id)}>❌ {t('cancel')}</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}