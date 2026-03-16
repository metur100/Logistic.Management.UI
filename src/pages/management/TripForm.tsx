import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver { id: number; fullName: string; phone?: string }
interface Vehicle { id: number; registrationNumber: string; type?: string }
interface CargoItem {
  id: number; description: string
  cargoType?: string; weightTons?: number; consignor?: string
}

interface TripFormState {
  driverId: string
  vehicleId: string
  originLocation: string
  destinationLocation: string
  distanceKm: string
  plannedDepartureDate: string
  expectedArrivalDate: string
  remarks: string
  cargoIds: number[]
}

const empty: TripFormState = {
  driverId: '', vehicleId: '', originLocation: '', destinationLocation: '',
  distanceKm: '', plannedDepartureDate: '', expectedArrivalDate: '', remarks: '', cargoIds: []
}

export default function TripForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [cargoes, setCargoes] = useState<CargoItem[]>([])
  const [form, setForm] = useState<TripFormState>(empty)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/users?role=Driver').then(r => setDrivers(r.data)).catch(() => {})
    api.get('/vehicles').then(r => setVehicles(r.data)).catch(() => {})
    api.get('/cargo?unassigned=true').then(r => setCargoes(r.data)).catch(() => {})

    if (isEdit) {
      api.get(`/trips/${id}`).then(r => {
        const tr = r.data
        setForm({
          driverId: tr.driverId || '',
          vehicleId: tr.vehicleId || '',
          originLocation: tr.originLocation,
          destinationLocation: tr.destinationLocation,
          distanceKm: tr.distanceKm || '',
          plannedDepartureDate: tr.plannedDepartureDate?.slice(0, 16) || '',
          expectedArrivalDate: tr.expectedArrivalDate?.slice(0, 16) || '',
          remarks: tr.remarks || '',
          cargoIds: tr.cargoItems?.map((c: CargoItem) => c.id) || []
        })
      }).catch(() => toast.error(t('failed_load')))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      ...form,
      driverId: form.driverId || null,
      vehicleId: form.vehicleId || null,
      distanceKm: form.distanceKm || null,
      plannedDepartureDate: form.plannedDepartureDate || null,
      expectedArrivalDate: form.expectedArrivalDate || null
    }
    try {
      if (isEdit) await api.put(`/trips/${id}`, payload)
      else await api.post('/trips', payload)
      toast.success(isEdit ? t('trip_updated') : t('trip_created'))
      nav('/management/trips')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || t('error_saving_trip'))
    } finally { setSubmitting(false) }
  }

  const toggleCargo = (cid: number) =>
    setForm(f => ({
      ...f,
      cargoIds: f.cargoIds.includes(cid)
        ? f.cargoIds.filter(x => x !== cid)
        : [...f.cargoIds, cid]
    }))

  const set = (key: keyof TripFormState, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div>
      <style>{`
        .tf-section {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .tf-section-title {
          display: flex;
          align-items: center;
          gap: .6rem;
          font-weight: 700;
          font-size: .95rem;
          margin-bottom: 1.25rem;
          padding-bottom: .75rem;
          border-bottom: 1px solid var(--border);
        }
        .cargo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: .75rem;
        }
        @media (max-width: 500px) {
          .cargo-grid { grid-template-columns: 1fr; }
          .tf-section { padding: 1rem; }
        }
      `}</style>

      {/* Back */}
      <button
        onClick={() => nav('/management/trips')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', marginBottom: '1rem', padding: 0,
          fontSize: '.875rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '.35rem'
        }}>
        {t('back')}
      </button>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        color: '#fff', marginBottom: '1.5rem',
        boxShadow: '0 8px 24px rgba(29,78,216,.25)'
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.2rem' }}>
          {isEdit ? `✏️ ${t('edit_trip')}` : `🚛 ${t('create_new_trip')}`}
        </h1>
        <p style={{ opacity: .8, fontSize: '.875rem' }}>
          {isEdit ? t('edit_trip') : t('create_new_trip')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Assignment */}
        <div className="tf-section">
          <div className="tf-section-title">
            <span>👤</span> {t('assignment')}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('driver')}</label>
              <select
                className="form-control"
                value={form.driverId}
                onChange={e => set('driverId', e.target.value)}>
                <option value="">{t('select_driver')}</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}{d.phone ? ` · ${d.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('vehicle')}</label>
              <select
                className="form-control"
                value={form.vehicleId}
                onChange={e => set('vehicleId', e.target.value)}>
                <option value="">{t('select_vehicle')}</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber}{v.type ? ` – ${v.type}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected driver/vehicle preview */}
          {(form.driverId || form.vehicleId) && (
            <div style={{
              display: 'flex', gap: '.75rem', flexWrap: 'wrap',
              marginTop: '.5rem'
            }}>
              {form.driverId && (() => {
                const d = drivers.find(x => String(x.id) === String(form.driverId))
                return d ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '.6rem',
                    padding: '.6rem .9rem', background: '#eff6ff',
                    borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe'
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '.8rem'
                    }}>
                      {d.fullName[0]}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#1e40af' }}>{d.fullName}</span>
                  </div>
                ) : null
              })()}
              {form.vehicleId && (() => {
                const v = vehicles.find(x => String(x.id) === String(form.vehicleId))
                return v ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '.6rem',
                    padding: '.6rem .9rem', background: '#f0fdf4',
                    borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0'
                  }}>
                    <span style={{ fontSize: '1.1rem' }}>🚛</span>
                    <span style={{ fontWeight: 600, fontSize: '.85rem', color: '#166534' }}>{v.registrationNumber}</span>
                  </div>
                ) : null
              })()}
            </div>
          )}
        </div>

        {/* Route */}
        <div className="tf-section">
          <div className="tf-section-title">
            <span>🗺️</span> {t('route')}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('origin')} *</label>
              <input
                className="form-control"
                required
                placeholder="e.g. Sarajevo"
                value={form.originLocation}
                onChange={e => set('originLocation', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('destination')} *</label>
              <input
                className="form-control"
                required
                placeholder="e.g. Mostar"
                value={form.destinationLocation}
                onChange={e => set('destinationLocation', e.target.value)}
              />
            </div>
          </div>

          {/* Route preview */}
          {(form.originLocation || form.destinationLocation) && (
            <div style={{
              padding: '.75rem 1rem', background: 'var(--surface2)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              fontSize: '.875rem', fontWeight: 600, marginBottom: '.75rem',
              display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap'
            }}>
              <span style={{ color: '#16a34a' }}>📍 {form.originLocation || '—'}</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ color: '#dc2626' }}>🏁 {form.destinationLocation || '—'}</span>
              {form.distanceKm && (
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: 400 }}>
                  {form.distanceKm} km
                </span>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>{t('distance_km')}</label>
              <input
                className="form-control"
                type="number"
                placeholder="e.g. 130"
                value={form.distanceKm}
                onChange={e => set('distanceKm', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('remarks')}</label>
              <input
                className="form-control"
                value={form.remarks}
                onChange={e => set('remarks', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('planned_departure_label')}</label>
              <input
                className="form-control"
                type="datetime-local"
                value={form.plannedDepartureDate}
                onChange={e => set('plannedDepartureDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('expected_arrival')}</label>
              <input
                className="form-control"
                type="datetime-local"
                value={form.expectedArrivalDate}
                onChange={e => set('expectedArrivalDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cargo */}
        {cargoes.length > 0 && (
          <div className="tf-section">
            <div className="tf-section-title">
              <span>📦</span> {t('assign_cargo')}
              {form.cargoIds.length > 0 && (
                <span style={{
                  marginLeft: 'auto', background: 'var(--primary)',
                  color: '#fff', borderRadius: 999,
                  padding: '.15rem .6rem', fontSize: '.72rem', fontWeight: 700
                }}>
                  {form.cargoIds.length} {t('items')}
                </span>
              )}
            </div>
            <div className="cargo-grid">
              {cargoes.map(c => {
                const selected = form.cargoIds.includes(c.id)
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex', gap: '.75rem', alignItems: 'flex-start',
                      padding: '.85rem 1rem', cursor: 'pointer',
                      border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: selected ? 'var(--primary-light)' : 'var(--surface2)',
                      transition: 'all .15s'
                    }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCargo(c.id)}
                      style={{ marginTop: 3, accentColor: 'var(--primary)', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '.875rem', marginBottom: '.2rem' }}>
                        {c.description}
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                        {c.cargoType && (
                          <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '.1rem .45rem', borderRadius: 999, fontWeight: 600 }}>
                            {c.cargoType}
                          </span>
                        )}
                        {c.weightTons && <span>⚖️ {c.weightTons}t</span>}
                        {c.consignor && <span>🏭 {c.consignor}</span>}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingBottom: '2rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ padding: '.75rem 2rem', fontSize: '1rem' }}>
            {submitting
              ? t('saving')
              : isEdit ? `✏️ ${t('update_trip')}` : `🚛 ${t('create_trip')}`}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => nav('/management/trips')}
            style={{ padding: '.75rem 1.5rem' }}>
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
