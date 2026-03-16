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

const TYPE_META: Record<string, { color: string; bg: string; icon: string }> = {
  General:    { color: '#3730a3', bg: '#e0e7ff', icon: '📦' },
  Fragile:    { color: '#9d174d', bg: '#fce7f3', icon: '🔮' },
  Hazardous:  { color: '#92400e', bg: '#fef3c7', icon: '⚠️' },
  Perishable: { color: '#065f46', bg: '#d1fae5', icon: '🌡️' },
  Oversized:  { color: '#1e40af', bg: '#dbeafe', icon: '📐' },
}

const empty: CargoFormState = {
  description: '', consignor: '', consignee: '',
  weightTons: '', volumeCbm: '', cargoType: 'General', specialInstructions: ''
}

function TypeBadge({ type }: { type: string }) {
  const m = TYPE_META[type] || { color: '#3730a3', bg: '#e0e7ff', icon: '📦' }
  return (
    <span style={{
      background: m.bg, color: m.color,
      padding: '.18rem .55rem', borderRadius: 999,
      fontSize: '.72rem', fontWeight: 700,
      display: 'inline-flex', alignItems: 'center', gap: '.25rem'
    }}>
      {m.icon} {type || '—'}
    </span>
  )
}

export default function CargoPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<CargoItem[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<CargoFormState>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
    setSubmitting(true)
    try {
      if (editId) await api.put(`/cargo/${editId}`, form)
      else await api.post('/cargo', form)
      toast.success(editId ? t('cargo_updated') : t('cargo_created'))
      setModal(false)
      load()
    } catch { toast.error(t('error')) }
    finally { setSubmitting(false) }
  }

  const del = async (id: number) => {
    if (!confirm(t('delete_cargo_confirm'))) return
    try { await api.delete(`/cargo/${id}`); load(); toast.success(t('deleted')) }
    catch { toast.error(t('error')) }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .cargo-table-wrap { display: block; overflow-x: auto; }
        .cargo-cards-wrap { display: none; }
        @media (max-width: 800px) {
          .cargo-table-wrap { display: none; }
          .cargo-cards-wrap { display: block; }
        }
        .cargo-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          margin-bottom: .65rem;
          box-shadow: var(--shadow-sm);
          transition: box-shadow .15s;
        }
        .cargo-card:hover { box-shadow: var(--shadow); }
        .cargo-modal-overlay {
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
        .cargo-modal-box {
          background: var(--surface);
          border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem;
          width: 100%;
          max-width: 560px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
          animation: slideUp .22s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 640px) {
          .cargo-modal-overlay {
            align-items: center;
            padding: 1rem;
          }
          .cargo-modal-box {
            border-radius: 20px;
            max-height: 90vh;
          }
        }
        .cargo-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .75rem;
        }
        @media (max-width: 480px) {
          .cargo-form-row { grid-template-columns: 1fr; }
          .cargo-modal-box { padding: 1.25rem 1rem; }
        }
        .cargo-type-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: .5rem;
        }
        @media (max-width: 480px) {
          .cargo-type-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .cargo-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .25rem;
          padding: .55rem .35rem;
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
        .cargo-type-btn.active {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
        }
        .cargo-type-btn:hover:not(.active) {
          border-color: var(--text-muted);
          background: var(--surface);
        }
        .modal-drag-handle {
          width: 40px; height: 4px;
          background: var(--border);
          border-radius: 999px;
          margin: 0 auto .75rem;
        }
      `}</style>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.5rem',
        boxShadow: '0 6px 20px rgba(29,78,216,.25)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
            📦 {t('cargo_management')}
          </h1>
          <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>
            {items.length} {t('items')}
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
           {t('add_cargo')}
        </button>
      </div>

      {/* Desktop table */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }} className="cargo-table-wrap">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
            <div style={{ fontWeight: 600 }}>{t('no_cargo')}</div>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{t('description')}</th>
                <th>{t('type')}</th>
                <th>{t('weight')}</th>
                <th>{t('consignor')}</th>
                <th>{t('consignee')}</th>
                <th>{t('trip')}</th>
                <th>{t('instructions')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.description}</td>
                  <td><TypeBadge type={c.cargoType} /></td>
                  <td>{c.weightTons ? `${c.weightTons}t` : '—'}</td>
                  <td>{c.consignor || '—'}</td>
                  <td>{c.consignee || '—'}</td>
                  <td>
                    {c.tripId
                      ? <span style={{ fontWeight: 600, color: 'var(--primary)' }}>#{c.tripId}</span>
                      : <span style={{ color: '#22c55e', fontSize: '.78rem', fontWeight: 600 }}>{t('unassigned')}</span>}
                  </td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.specialInstructions
                      ? <span style={{ color: '#92400e' }}>⚠️ {c.specialInstructions}</span>
                      : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '.3rem .6rem', fontSize: '.75rem' }}
                        onClick={() => openEdit(c)}>
                        {t('edit')}
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '.3rem .6rem', fontSize: '.75rem' }}
                        onClick={() => del(c.id)}>
                        {t('delete')}
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
      <div className="cargo-cards-wrap">
        {items.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', textAlign: 'center',
            padding: '3rem 1rem', color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
            <div style={{ fontWeight: 600 }}>{t('no_cargo')}</div>
          </div>
        ) : items.map(c => (
          <div key={c.id} className="cargo-card">
            {/* Top row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: '.75rem', marginBottom: '.6rem'
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontWeight: 800, fontSize: '.95rem', marginBottom: '.35rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {c.description}
                </div>
                <TypeBadge type={c.cargoType} />
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {c.tripId
                  ? <span style={{
                      fontWeight: 700, fontSize: '.8rem',
                      color: 'var(--primary)',
                      background: 'var(--primary-light)',
                      padding: '.2rem .6rem', borderRadius: 999
                    }}>
                      Trip #{c.tripId}
                    </span>
                  : <span style={{
                      color: '#16a34a', fontSize: '.75rem', fontWeight: 700,
                      background: '#f0fdf4', padding: '.2rem .6rem', borderRadius: 999
                    }}>
                      {t('unassigned')}
                    </span>}
              </div>
            </div>

            {/* Meta chips */}
            <div style={{
              display: 'flex', gap: '.4rem', flexWrap: 'wrap',
              marginBottom: c.specialInstructions ? '.6rem' : '.65rem'
            }}>
              {c.weightTons != null && (
                <span style={{
                  background: '#f0fdf4', color: '#16a34a',
                  padding: '.15rem .5rem', borderRadius: 999,
                  fontSize: '.72rem', fontWeight: 600
                }}>
                  ⚖️ {c.weightTons}t
                </span>
              )}
              {c.consignor && (
                <span style={{
                  background: 'var(--surface2)', color: 'var(--text-muted)',
                  padding: '.15rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600
                }}>
                  🏭 {c.consignor}
                </span>
              )}
              {c.consignee && (
                <span style={{
                  background: 'var(--surface2)', color: 'var(--text-muted)',
                  padding: '.15rem .5rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 600
                }}>
                  📦 {c.consignee}
                </span>
              )}
            </div>

            {/* Special instructions */}
            {c.specialInstructions && (
              <div style={{
                fontSize: '.78rem', color: '#92400e',
                background: '#fffbeb', borderRadius: 8,
                padding: '.5rem .75rem', marginBottom: '.65rem',
                border: '1px solid #fde68a', wordBreak: 'break-word'
              }}>
                ⚠️ {c.specialInstructions}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '.4rem', fontSize: '.8rem', textAlign: 'center' }}
                onClick={() => openEdit(c)}>
                ✏️ {t('edit')}
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, padding: '.4rem', fontSize: '.8rem', textAlign: 'center' }}
                onClick={() => del(c.id)}>
                🗑️ {t('delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      {modal && (
        <div
          className="cargo-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="cargo-modal-box">

            {/* Drag handle (mobile only) */}
            <div className="modal-drag-handle" />

            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.25rem'
            }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>
                  {editId ? `✏️ ${t('edit_cargo')}` : `📦 ${t('new_cargo')}`}
                </h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {editId ? t('edit_cargo') : t('add_cargo')}
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%', width: 34, height: 34,
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '.9rem', flexShrink: 0
                }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Description */}
              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700 }}>
                  {t('description_required')}
                </label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Washing machines"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Cargo type — visual selector */}
              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>
                  {t('cargo_type')}
                </label>
                <div className="cargo-type-grid">
                  {TYPES.map(tp => {
                    const m = TYPE_META[tp]
                    const isActive = form.cargoType === tp
                    return (
                      <button
                        key={tp}
                        type="button"
                        className={`cargo-type-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, cargoType: tp })}
                        style={isActive ? {
                          borderColor: m.color,
                          background: m.bg,
                          color: m.color
                        } : {}}>
                        <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                        {tp}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Consignor / Consignee */}
              <div className="cargo-form-row">
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('consignor')}</label>
                  <input
                    className="form-control"
                    placeholder="Sender"
                    value={form.consignor}
                    onChange={e => setForm({ ...form, consignor: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('consignee')}</label>
                  <input
                    className="form-control"
                    placeholder="Receiver"
                    value={form.consignee}
                    onChange={e => setForm({ ...form, consignee: e.target.value })}
                  />
                </div>
              </div>

              {/* Weight / Volume */}
              <div className="cargo-form-row">
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('weight_tons')}</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.weightTons}
                    onChange={e => setForm({ ...form, weightTons: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('volume_cbm')}</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.volumeCbm}
                    onChange={e => setForm({ ...form, volumeCbm: e.target.value })}
                  />
                </div>
              </div>

              {/* Special instructions */}
              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('special_instructions')}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Any special handling notes..."
                  value={form.specialInstructions}
                  onChange={e => setForm({ ...form, specialInstructions: e.target.value })}
                />
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 1, padding: '.7rem', fontSize: '.9rem', fontWeight: 700 }}>
                  {submitting
                    ? t('saving')
                    : editId ? `✏️ ${t('update')}` : `📦 ${t('create')}`}
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
