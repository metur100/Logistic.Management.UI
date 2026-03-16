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
    } finally { setSubmitting(false) }
  }

  const del = async (id: number) => {
    if (!window.confirm(t('confirm_deactivate_vehicle'))) return
    try { await api.delete(`/vehicles/${id}`); toast.success(t('vehicle_deactivated')); load() }
    catch { toast.error(t('error_deactivating_vehicle')) }
  }

  const setField = (key: keyof VehicleForm, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div>
      <style>{`
        .veh-table-wrap { display: block; }
        .veh-cards-wrap { display: none; }
        @media (max-width: 860px) {
          .veh-table-wrap { display: none; }
          .veh-cards-wrap { display: block; }
        }
        .veh-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          margin-bottom: .65rem;
          box-shadow: var(--shadow-sm);
        }
        .veh-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: .75rem;
          flex-wrap: wrap;
          margin-bottom: .5rem;
        }
        .veh-card-meta {
          display: flex;
          gap: .65rem;
          flex-wrap: wrap;
          font-size: .8rem;
          color: var(--text-muted);
          margin-bottom: .65rem;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.5rem',
        flexWrap: 'wrap', gap: '.75rem'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{t('vehicles')}</h1>
        <button className="btn btn-primary" onClick={openNew}>{t('add_vehicle')}</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card veh-table-wrap">
            {items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('no_vehicles')}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    {[t('registration'), t('fleet_name'), t('type'), t('capacity'),
                      t('ownership'), t('owner'), t('owner_phone'), t('actions')
                    ].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 700 }}>{v.registrationNumber}</td>
                      <td>{v.fleetName || '—'}</td>
                      <td>
                        <span style={{
                          background: '#eff6ff', color: '#2563eb',
                          padding: '.2rem .6rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 600
                        }}>
                          {v.type || '—'}
                        </span>
                      </td>
                      <td>{v.capacity ? `${v.capacity}t` : '—'}</td>
                      <td>
                        <span style={{
                          background: v.ownershipType === 'Own' ? '#f0fdf4' : '#fef9c3',
                          color: v.ownershipType === 'Own' ? '#16a34a' : '#854d0e',
                          padding: '.2rem .6rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 600
                        }}>
                          {v.ownershipType || '—'}
                        </span>
                      </td>
                      <td>{v.ownerName || '—'}</td>
                      <td>{v.ownerPhone || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '.3rem .6rem', fontSize: '.78rem' }}
                            onClick={() => openEdit(v)}>
                            {t('edit')}
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '.3rem .6rem', fontSize: '.78rem' }}
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
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                {t('no_vehicles')}
              </div>
            ) : items.map(v => (
              <div key={v.id} className="veh-card">
                <div className="veh-card-top">
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '.25rem' }}>
                      {v.registrationNumber}
                    </div>
                    {v.fleetName && (
                      <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{v.fleetName}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    {v.type && (
                      <span style={{
                        background: '#eff6ff', color: '#2563eb',
                        padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600
                      }}>{v.type}</span>
                    )}
                    {v.ownershipType && (
                      <span style={{
                        background: v.ownershipType === 'Own' ? '#f0fdf4' : '#fef9c3',
                        color: v.ownershipType === 'Own' ? '#16a34a' : '#854d0e',
                        padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600
                      }}>{v.ownershipType}</span>
                    )}
                  </div>
                </div>
                <div className="veh-card-meta">
                  {v.capacity && <span>⚖️ {v.capacity}t</span>}
                  {v.ownerName && <span>👤 {v.ownerName}</span>}
                  {v.ownerPhone && <span>📞 {v.ownerPhone}</span>}
                </div>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '.35rem .75rem', fontSize: '.8rem' }}
                    onClick={() => openEdit(v)}>
                    {t('edit')}
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '.35rem .75rem', fontSize: '.8rem' }}
                    onClick={() => del(v.id)}>
                    {t('remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {editId ? t('edit_vehicle') : t('new_vehicle')}
              </h2>
              <button onClick={() => setModal(false)} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('registration_no')} *</label>
                  <input className="form-control" required value={form.registrationNumber}
                    onChange={e => setField('registrationNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{t('fleet_name')}</label>
                  <input className="form-control" value={form.fleetName}
                    onChange={e => setField('fleetName', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('type')}</label>
                  <select className="form-control" value={form.type}
                    onChange={e => setField('type', e.target.value)}>
                    {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('capacity_tons')}</label>
                  <input className="form-control" type="number" min="0" step="0.1"
                    value={form.capacity} onChange={e => setField('capacity', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('ownership')}</label>
                  <select className="form-control" value={form.ownershipType}
                    onChange={e => setField('ownershipType', e.target.value)}>
                    {OWN_TYPES.map(ot => <option key={ot} value={ot}>{ot}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('owner_name')}</label>
                  <input className="form-control" value={form.ownerName}
                    onChange={e => setField('ownerName', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('owner_phone')}</label>
                <input className="form-control" value={form.ownerPhone}
                  onChange={e => setField('ownerPhone', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('saving') : editId ? t('update') : t('create')}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>
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
