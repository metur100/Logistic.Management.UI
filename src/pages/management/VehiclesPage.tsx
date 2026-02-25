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
  const [modal, setModal] = useState<boolean>(false)
  const [form, setForm] = useState<VehicleForm>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

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
      const payload = {
        ...form,
        capacity: form.capacity ? parseFloat(form.capacity) : null
      }
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('vehicles')}</h1>
        <button className="btn btn-primary" onClick={openNew}>+ {t('add_vehicle')}</button>
      </div>

      {loading
        ? <div className="loading-spinner"><div className="spinner" /></div>
        : (
          <div className="card">
            {items.length === 0
              ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('no_vehicles')}</p>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        {[
                          t('registration'), t('fleet_name'), t('type'),
                          t('capacity'), t('ownership'), t('owner'),
                          t('owner_phone'), t('actions')
                        ].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#6b7280', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{v.registrationNumber}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{v.fleetName || '—'}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem' }}>
                              {v.type || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{v.capacity ? `${v.capacity}t` : '—'}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span style={{
                              background: v.ownershipType === 'Own' ? '#f0fdf4' : '#fef9c3',
                              color: v.ownershipType === 'Own' ? '#16a34a' : '#854d0e',
                              padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.8rem'
                            }}>
                              {v.ownershipType || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{v.ownerName || '—'}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{v.ownerPhone || '—'}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }} onClick={() => openEdit(v)}>
                                {t('edit')}
                              </button>
                              <button className="btn" style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', background: '#fee2e2', color: '#dc2626' }} onClick={() => del(v.id)}>
                                {t('remove')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
              {editId ? t('edit_vehicle') : t('new_vehicle')}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('registration_no')} *</label>
                  <input className="form-control" required value={form.registrationNumber} onChange={e => setField('registrationNumber', e.target.value)} placeholder="e.g. KCA 123A" />
                </div>
                <div className="form-group">
                  <label>{t('fleet_name')}</label>
                  <input className="form-control" value={form.fleetName} onChange={e => setField('fleetName', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('type')}</label>
                  <select className="form-control" value={form.type} onChange={e => setField('type', e.target.value)}>
                    {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('capacity_tons')}</label>
                  <input className="form-control" type="number" min="0" step="0.1" value={form.capacity} onChange={e => setField('capacity', e.target.value)} placeholder="e.g. 10" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('ownership')}</label>
                  <select className="form-control" value={form.ownershipType} onChange={e => setField('ownershipType', e.target.value)}>
                    {OWN_TYPES.map(ot => <option key={ot} value={ot}>{ot}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('owner_name')}</label>
                  <input className="form-control" value={form.ownerName} onChange={e => setField('ownerName', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('owner_phone')}</label>
                <input className="form-control" value={form.ownerPhone} onChange={e => setField('ownerPhone', e.target.value)} placeholder="e.g. +254700000000" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('saving') : editId ? t('update') : t('create')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>
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