import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import api from '../../api/axios'

interface CargoItem {
  id: number
  description: string
  cargoType: string
  weightTons: number | null
  volumeCbm: number | null
  consignor: string
  consignee: string
  specialInstructions: string
  tripId: number | null
}

interface CargoFormState {
  description: string
  consignor: string
  consignee: string
  weightTons: string
  volumeCbm: string
  cargoType: string
  specialInstructions: string
}

const TYPES = ['General', 'Fragile', 'Hazardous', 'Perishable', 'Oversized']
const empty: CargoFormState = {
  description: '', consignor: '', consignee: '',
  weightTons: '', volumeCbm: '', cargoType: 'General', specialInstructions: ''
}

export default function CargoPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<CargoItem[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<CargoFormState>(empty)
  const [editId, setEditId] = useState<number | null>(null)

  const load = () =>
    api.get('/cargo').then(r => setItems(r.data)).catch(() => toast.error(t('failed')))
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setEditId(null); setModal(true) }
  const openEdit = (c: CargoItem) => {
    setForm({
      description: c.description,
      consignor: c.consignor || '',
      consignee: c.consignee || '',
      weightTons: c.weightTons?.toString() || '',
      volumeCbm: c.volumeCbm?.toString() || '',
      cargoType: c.cargoType || 'General',
      specialInstructions: c.specialInstructions || ''
    })
    setEditId(c.id)
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) await api.put(`/cargo/${editId}`, form)
      else await api.post('/cargo', form)
      toast.success(editId ? t('cargo_updated') : t('cargo_created'))
      setModal(false)
      load()
    } catch { toast.error(t('error')) }
  }

  const del = async (id: number) => {
    if (!confirm(t('delete_cargo_confirm'))) return
    try { await api.delete(`/cargo/${id}`); load(); toast.success(t('deleted')) }
    catch { toast.error(t('error')) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('cargo_management')}</h1>
        <button className="btn btn-primary" onClick={openNew}>{t('add_cargo')}</button>
      </div>
      <div className="card">
        {items.length === 0
          ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('no_cargo')}</p>
          : (
            <table>
              <thead>
                <tr>
                  <th>{t('description')}</th><th>{t('type')}</th><th>{t('weight')}</th>
                  <th>{t('consignor')}</th><th>{t('consignee')}</th><th>{t('trip')}</th>
                  <th>{t('instructions')}</th><th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.description}</td>
                    <td><span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{c.cargoType || '\u2014'}</span></td>
                    <td>{c.weightTons ? `${c.weightTons}t` : '\u2014'}</td>
                    <td>{c.consignor || '\u2014'}</td>
                    <td>{c.consignee || '\u2014'}</td>
                    <td>{c.tripId ? `#${c.tripId}` : <span style={{ color: '#22c55e', fontSize: '.8rem' }}>{t('unassigned')}</span>}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.specialInstructions || '\u2014'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => openEdit(c)}>{t('edit')}</button>
                        <button className="btn btn-danger" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => del(c.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>{editId ? t('edit_cargo') : t('new_cargo')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('description_required')}</label>
                <input className="form-control" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label>{t('consignor')}</label><input className="form-control" value={form.consignor} onChange={e => setForm({ ...form, consignor: e.target.value })} /></div>
                <div className="form-group"><label>{t('consignee')}</label><input className="form-control" value={form.consignee} onChange={e => setForm({ ...form, consignee: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>{t('weight_tons')}</label><input className="form-control" type="number" step="0.01" value={form.weightTons} onChange={e => setForm({ ...form, weightTons: e.target.value })} /></div>
                <div className="form-group"><label>{t('volume_cbm')}</label><input className="form-control" type="number" step="0.01" value={form.volumeCbm} onChange={e => setForm({ ...form, volumeCbm: e.target.value })} /></div>
              </div>
              <div className="form-group">
                <label>{t('cargo_type')}</label>
                <select className="form-control" value={form.cargoType} onChange={e => setForm({ ...form, cargoType: e.target.value })}>
                  {TYPES.map(tp => <option key={tp}>{tp}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('special_instructions')}</label>
                <textarea className="form-control" rows={3} value={form.specialInstructions} onChange={e => setForm({ ...form, specialInstructions: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary">{editId ? t('update') : t('create')}</button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}