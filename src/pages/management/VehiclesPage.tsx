import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Vehicle {
  id: number
  registrationNumber: string
  fleetName?: string
  type?: string
  capacity?: number
  ownershipType?: string
  ownerName?: string
  ownerPhone?: string
}

interface VehicleForm {
  registrationNumber: string
  fleetName: string
  type: string
  capacity: string
  ownershipType: string
  ownerName: string
  ownerPhone: string
}

const empty: VehicleForm = {
  registrationNumber: '', fleetName: '', type: 'Truck',
  capacity: '', ownershipType: 'Own', ownerName: '', ownerPhone: ''
}

const TYPES = ['Truck', 'Container', 'Tanker', 'Refrigerated', 'Flatbed', 'Mini Truck']
const OWN_TYPES = ['Own', 'Market', 'Leased']

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  Truck:        { icon: '🚛', color: '#1e40af', bg: '#dbeafe' },
  Container:    { icon: '📦', color: '#065f46', bg: '#d1fae5' },
  Tanker:       { icon: '🛢️', color: '#92400e', bg: '#fef3c7' },
  Refrigerated: { icon: '❄️', color: '#0e7490', bg: '#cffafe' },
  Flatbed:      { icon: '🚚', color: '#6d28d9', bg: '#ede9fe' },
  'Mini Truck': { icon: '🚐', color: '#be185d', bg: '#fce7f3' },
}

const OWN_META: Record<string, { color: string; bg: string }> = {
  Own:    { color: '#16a34a', bg: '#f0fdf4' },
  Market: { color: '#854d0e', bg: '#fef9c3' },
  Leased: { color: '#1d4ed8', bg: '#eff6ff' },
}

function TypeBadge({ type }: { type?: string }) {
  if (!type) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const m = TYPE_META[type] || { icon: '🚛', color: '#1e40af', bg: '#dbeafe' }
  return (
    <span style={{
      background: m.bg, color: m.color,
      padding: '.18rem .55rem', borderRadius: 999,
      fontSize: '.72rem', fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: '.25rem'
    }}>
      {m.icon} {type}
    </span>
  )
}

function OwnBadge({ type }: { type?: string }) {
  if (!type) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  const m = OWN_META[type] || { color: '#64748b', bg: 'var(--surface2)' }
  return (
    <span style={{
      background: m.bg, color: m.color,
      padding: '.18rem .55rem', borderRadius: 999,
      fontSize: '.72rem', fontWeight: 700
    }}>
      {type}
    </span>
  )
}

export default function VehiclesPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Vehicle[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<VehicleForm>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vehicles')
      .then(r => setItems(r.data))
      .catch(() => toast.error(t('failed_to_load_vehicles')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setEditId(null); setModal(true) }

  const openEdit = (v: Vehicle) => {
    setForm({
      registrationNumber: v.registrationNumber,
      fleetName: v.fleetName || '',
      type: v.type || 'Truck',
      capacity: v.capacity != null ? String(v.capacity) : '',
      ownershipType: v.ownershipType || 'Own',
      ownerName: v.ownerName || '',
      ownerPhone: v.ownerPhone || ''
    })
    setEditId(v.id)
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = { ...form, capacity: form.capacity ? parseFloat(form.capacity) : null }
      if (editId) await api.put(`/vehicles/${editId}`, payload)
      else await api.post('/vehicles', payload)
      toast.success(editId ? t('vehicle_updated') : t('vehicle_created'))
      setModal(false)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || t('error_saving_vehicle'))
    } finally {
      setSubmitting(false)
    }
  }

  const del = async (id: number) => {
    if (!window.confirm(t('confirm_deactivate_vehicle'))) return
    try {
      await api.delete(`/vehicles/${id}`)
      toast.success(t('vehicle_deactivated'))
      load()
    } catch {
      toast.error(t('error_deactivating_vehicle'))
    }
  }

  const setField = (key: keyof VehicleForm, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .veh-table-wrap { display: block; overflow-x: auto; }
        .veh-cards-wrap { display: none; }
        @media (max-width: 860px) {
          .veh-table-wrap { display: none; }
          .veh-cards-wrap { display: block; }
        }
        .veh-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          margin-bottom: .65rem;
          box-shadow: var(--shadow-sm);
          transition: box-shadow .15s;
        }
        .veh-card:hover { box-shadow: var(--shadow); }
        .veh-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.55);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 999;
          padding: 0;
          backdrop-filter: blur(3px);
        }
        .veh-modal-box {
          background: var(--surface);
          border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem;
          width: 100%;
          max-width: 560px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
          animation: vehSlideUp .22s ease;
        }
        @keyframes vehSlideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 640px) {
          .veh-modal-overlay { align-items: center; padding: 1rem; }
          .veh-modal-box { border-radius: 20px; max-height: 90vh; }
        }
        .veh-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .75rem;
        }
        @media (max-width: 480px) {
          .veh-form-row { grid-template-columns: 1fr; }
          .veh-modal-box { padding: 1.25rem 1rem; }
        }
        .veh-type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .5rem;
          margin-bottom: .25rem;
        }
        .veh-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .25rem;
          padding: .6rem .35rem;
          border-radius: 10px;
          border: 2px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          transition: all .15s;
          font-size: .68rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.2;
        }
        .veh-type-btn:hover:not(.active) {
          border-color: var(--text-muted);
          background: var(--surface);
        }
        .own-type-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .5rem;
        }
        .own-type-btn {
          padding: .55rem .5rem;
          border-radius: 10px;
          border: 2px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          transition: all .15s;
          font-size: .78rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
        }
        .own-type-btn:hover:not(.active) {
          border-color: var(--text-muted);
        }
        .modal-drag-handle {
          width: 40px;
          height: 4px;
          background: var(--border);
          border-radius: 999px;
          margin: 0 auto .75rem;
        }
      `}</style>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2, #1d4ed8)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.5rem',
        boxShadow: '0 6px 20px rgba(8,145,178,.25)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
            🚛 {t('vehicles')}
          </h1>
          <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>
            {items.length} {t('vehicles').toLowerCase()}
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            background: 'rgba(255,255,255,.2)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.35)',
            borderRadius: 10, padding: '.55rem 1.1rem',
            cursor: 'pointer', fontWeight: 700,
            fontSize: '.875rem', whiteSpace: 'nowrap'
          }}>
           {t('add_vehicle')}
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {/* Desktop table */}
          <div
            className="veh-table-wrap"
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden'
            }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚫</div>
                <div style={{ fontWeight: 600 }}>{t('no_vehicles')}</div>
              </div>
            ) : (
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {[
                      t('registration'), t('fleet_name'), t('type'), t('capacity'),
                      t('ownership'), t('owner'), t('owner_phone'), t('actions')
                    ].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 800 }}>{v.registrationNumber}</td>
                      <td>{v.fleetName || '—'}</td>
                      <td><TypeBadge type={v.type} /></td>
                      <td>{v.capacity ? `${v.capacity}t` : '—'}</td>
                      <td><OwnBadge type={v.ownershipType} /></td>
                      <td>{v.ownerName || '—'}</td>
                      <td>{v.ownerPhone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '.3rem .6rem', fontSize: '.75rem' }}
                            onClick={() => openEdit(v)}>
                            {t('edit')}
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '.3rem .6rem', fontSize: '.75rem' }}
                            onClick={() => del(v.id)}>
                            {t('remove')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile cards */}
          <div className="veh-cards-wrap">
            {items.length === 0 ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', textAlign: 'center',
                padding: '3rem 1rem', color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚫</div>
                <div style={{ fontWeight: 600 }}>{t('no_vehicles')}</div>
              </div>
            ) : items.map(v => {
              const tm = TYPE_META[v.type || ''] || { icon: '🚛', color: '#1e40af', bg: '#dbeafe' }
              return (
                <div key={v.id} className="veh-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem', marginBottom: '.65rem' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: tm.bg, color: tm.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}>
                      {tm.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 800, fontSize: '1rem', marginBottom: '.2rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {v.registrationNumber}
                      </div>
                      {v.fleetName && (
                        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                          {v.fleetName}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        <TypeBadge type={v.type} />
                        <OwnBadge type={v.ownershipType} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.65rem' }}>
                    {v.capacity != null && (
                      <span style={{
                        background: 'var(--surface2)', color: 'var(--text-muted)',
                        padding: '.15rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600
                      }}>
                        ⚖️ {v.capacity}t
                      </span>
                    )}
                    {v.ownerName && (
                      <span style={{
                        background: 'var(--surface2)', color: 'var(--text-muted)',
                        padding: '.15rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600
                      }}>
                        👤 {v.ownerName}
                      </span>
                    )}
                    {v.ownerPhone && (
                      <span style={{
                        background: 'var(--surface2)', color: 'var(--text-muted)',
                        padding: '.15rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600
                      }}>
                        📞 {v.ownerPhone}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }}
                      onClick={() => openEdit(v)}>
                      ✏️ {t('edit')}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }}
                      onClick={() => del(v.id)}>
                      🗑️ {t('remove')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="veh-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="veh-modal-box">

            <div className="modal-drag-handle" />

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.25rem'
            }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>
                  {editId ? `✏️ ${t('edit_vehicle')}` : `🚛 ${t('new_vehicle')}`}
                </h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {editId ? t('edit_vehicle') : t('add_vehicle')}
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.9rem', flexShrink: 0
                }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="veh-form-row">
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>
                    {t('registration_no')} *
                  </label>
                  <input
                    className="form-control"
                    required
                    placeholder="e.g. KCA-123A"
                    value={form.registrationNumber}
                    onChange={e => setField('registrationNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('fleet_name')}</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Flota"
                    value={form.fleetName}
                    onChange={e => setField('fleetName', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>
                  {t('type')}
                </label>
                <div className="veh-type-grid">
                  {TYPES.map(tp => {
                    const m = TYPE_META[tp] || { icon: '🚛', color: '#1e40af', bg: '#dbeafe' }
                    const isActive = form.type === tp
                    return (
                      <button
                        key={tp}
                        type="button"
                        className={`veh-type-btn${isActive ? ' active' : ''}`}
                        onClick={() => setField('type', tp)}
                        style={isActive ? { borderColor: m.color, background: m.bg, color: m.color } : {}}>
                        <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
                        {tp}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('capacity_tons')}</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 25"
                  value={form.capacity}
                  onChange={e => setField('capacity', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>
                  {t('ownership')}
                </label>
                <div className="own-type-grid">
                  {OWN_TYPES.map(ot => {
                    const m = OWN_META[ot] || { color: '#64748b', bg: 'var(--surface2)' }
                    const isActive = form.ownershipType === ot
                    return (
                      <button
                        key={ot}
                        type="button"
                        className={`own-type-btn${isActive ? ' active' : ''}`}
                        onClick={() => setField('ownershipType', ot)}
                        style={isActive ? { borderColor: m.color, background: m.bg, color: m.color } : {}}>
                        {ot}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="veh-form-row">
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('owner_name')}</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Madi doo"
                    value={form.ownerName}
                    onChange={e => setField('ownerName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('owner_phone')}</label>
                  <input
                    className="form-control"
                    placeholder="e.g. +387 61 123 456"
                    value={form.ownerPhone}
                    onChange={e => setField('ownerPhone', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 1, padding: '.7rem', fontSize: '.9rem', fontWeight: 700 }}>
                  {submitting
                    ? t('saving')
                    : editId ? `✏️ ${t('update')}` : `🚛 ${t('create')}`}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModal(false)}
                  style={{ padding: '.7rem 1.25rem', fontSize: '.9rem' }}>
                  {t('cancel')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}
