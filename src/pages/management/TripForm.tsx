import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver  { id: number; fullName: string; phone?: string; licenseNumber?: string }
interface Vehicle { id: number; registrationNumber: string; fleetName?: string; type?: string }
interface Cargo   { id: number; description: string; weightTons?: number; cargoType?: string; tripId?: number | null }

type PanelMode = 'none' | 'driver' | 'vehicle' | 'cargo'

export default function TripForm() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const isEdit = Boolean(id)

  const [drivers,  setDrivers]  = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [cargoes,  setCargoes]  = useState<Cargo[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [panel,    setPanel]    = useState<PanelMode>('none')

  const [form, setForm] = useState({
    driverId:             '',
    vehicleId:            '',
    originLocation:       '',
    destinationLocation:  '',
    distanceKm:           '',
    plannedDepartureDate: '',
    expectedArrivalDate:  '',
    remarks:              '',
    cargoIds:             [] as number[],
  })

  const [newDriver, setNewDriver] = useState({
    fullName: '', username: '', password: '', phone: '', licenseNumber: ''
  })
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: '', fleetName: '', type: '',
    capacity: '', ownershipType: '', ownerName: '', ownerPhone: ''
  })
  const [newCargo, setNewCargo] = useState({
    description: '', consignor: '', consignee: '',
    weightTons: '', cargoType: '', specialInstructions: ''
  })
  const [creating, setCreating] = useState(false)

  const loadAll = () =>
    Promise.all([
      api.get('/users?role=Driver'),
      api.get('/vehicles'),
      api.get('/cargo'),
    ]).then(([d, v, c]) => {
      setDrivers(Array.isArray(d.data) ? d.data : [])
      setVehicles(Array.isArray(v.data) ? v.data : [])
      setCargoes(Array.isArray(c.data) ? c.data : [])
    }).catch(() => toast.error(t('error_loading_data')))

  useEffect(() => {
    setLoading(true)
    loadAll().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    api.get(`/trips/${id}`).then(r => {
      const tr = r.data
      setForm({
        driverId:             tr.driverId?.toString() ?? '',
        vehicleId:            tr.vehicleId?.toString() ?? '',
        originLocation:       tr.originLocation ?? '',
        destinationLocation:  tr.destinationLocation ?? '',
        distanceKm:           tr.distanceKm?.toString() ?? '',
        plannedDepartureDate: tr.plannedDepartureDate
          ? new Date(tr.plannedDepartureDate).toISOString().slice(0, 16) : '',
        expectedArrivalDate: tr.expectedArrivalDate
          ? new Date(tr.expectedArrivalDate).toISOString().slice(0, 16) : '',
        remarks:  tr.remarks ?? '',
        cargoIds: (tr.cargoItems ?? []).map((c: Cargo) => c.id),
      })
    }).catch(() => toast.error(t('failed_load_trip')))
  }, [id])

  // ── Inline create handlers ───────────────────────────────────────
  const createDriver = async () => {
    if (!newDriver.fullName || !newDriver.username || !newDriver.password) {
      toast.error(t('required')); return
    }
    setCreating(true)
    try {
      const r = await api.post('/users', { ...newDriver, role: 'Driver' })
      const created: Driver = r.data
      setDrivers(prev => [...prev, created])
      setForm(f => ({ ...f, driverId: created.id.toString() }))
      setNewDriver({ fullName: '', username: '', password: '', phone: '', licenseNumber: '' })
      setPanel('none')
      toast.success(t('saved'))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error'))
    } finally { setCreating(false) }
  }

  const createVehicle = async () => {
    if (!newVehicle.registrationNumber) { toast.error(t('required')); return }
    setCreating(true)
    try {
      const r = await api.post('/vehicles', {
        ...newVehicle,
        capacity: newVehicle.capacity ? Number(newVehicle.capacity) : null
      })
      const created: Vehicle = r.data
      setVehicles(prev => [...prev, created])
      setForm(f => ({ ...f, vehicleId: created.id.toString() }))
      setNewVehicle({ registrationNumber: '', fleetName: '', type: '', capacity: '', ownershipType: '', ownerName: '', ownerPhone: '' })
      setPanel('none')
      toast.success(t('saved'))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error'))
    } finally { setCreating(false) }
  }

  const createCargo = async () => {
    if (!newCargo.description) { toast.error(t('required')); return }
    setCreating(true)
    try {
      const r = await api.post('/cargo', {
        ...newCargo,
        weightTons: newCargo.weightTons ? Number(newCargo.weightTons) : null
      })
      const created: Cargo = r.data
      setCargoes(prev => [...prev, created])
      setForm(f => ({ ...f, cargoIds: [...f.cargoIds, created.id] }))
      setNewCargo({ description: '', consignor: '', consignee: '', weightTons: '', cargoType: '', specialInstructions: '' })
      setPanel('none')
      toast.success(t('saved'))
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error'))
    } finally { setCreating(false) }
  }

  const removeCargo = (cargoId: number) =>
    setForm(f => ({ ...f, cargoIds: f.cargoIds.filter(x => x !== cargoId) }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.cargoIds.length === 0) { toast.error(t('cargo_required_for_trip')); return }
    setSaving(true)
    const payload = {
      driverId:            form.driverId  ? Number(form.driverId)  : null,
      vehicleId:           form.vehicleId ? Number(form.vehicleId) : null,
      originLocation:      form.originLocation,
      destinationLocation: form.destinationLocation,
      distanceKm:          form.distanceKm ? Number(form.distanceKm) : null,
      plannedDepartureDate: form.plannedDepartureDate || null,
      expectedArrivalDate:  form.expectedArrivalDate  || null,
      remarks:             form.remarks || null,
      cargoIds:            form.cargoIds,
    }
    try {
      if (isEdit) { await api.put(`/trips/${id}`, payload); toast.success(t('trip_updated')) }
      else        { await api.post('/trips', payload);       toast.success(t('trip_created')) }
      nav('/management/trips')
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error_saving_trip'))
    } finally { setSaving(false) }
  }

  // Cargo available in dropdown = unassigned OR already selected on this trip
  const dropdownCargoes = cargoes.filter(c =>
    !c.tripId || form.cargoIds.includes(c.id)
  )
  // Unselected ones for the dropdown
  const selectableCargoes = dropdownCargoes.filter(c => !form.cargoIds.includes(c.id))
  // Currently selected cargo objects
  const selectedCargoes = cargoes.filter(c => form.cargoIds.includes(c.id))

  const selectedDriver  = drivers.find(d => d.id.toString() === form.driverId)
  const selectedVehicle = vehicles.find(v => v.id.toString() === form.vehicleId)
  const selectedWeight  = selectedCargoes.reduce((s, c) => s + (c.weightTons || 0), 0)

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '1rem',
    marginBottom: '1rem', boxShadow: 'var(--shadow-sm)'
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.35rem'
  }
  const panelStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '.75rem'
  }
  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid var(--border)', margin: '1rem 0'
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .tf-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        @media (max-width: 600px) { .tf-grid-2 { grid-template-columns: 1fr; } }
        .create-btn {
          display: flex; align-items: center; gap: .4rem;
          padding: .32rem .7rem; border-radius: 999px;
          border: 1.5px dashed var(--border);
          background: none; cursor: pointer;
          font-size: .78rem; font-weight: 600;
          color: var(--primary); transition: all .15s; white-space: nowrap;
        }
        .create-btn:hover, .create-btn.active {
          border-color: var(--primary); background: var(--primary-light);
        }
        .selected-badge {
          display: flex; align-items: center; gap: .5rem;
          padding: .45rem .75rem;
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: var(--radius-sm);
          font-size: .82rem; font-weight: 600; color: #1d4ed8;
          margin-bottom: .5rem;
        }
        .cargo-tag {
          display: flex; align-items: center; gap: .4rem;
          padding: .3rem .65rem;
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 999px; font-size: .78rem; font-weight: 600;
          color: #1d4ed8;
        }
        .cargo-tag button {
          background: none; border: none; cursor: pointer;
          color: #93c5fd; font-size: .85rem; line-height: 1;
          padding: 0; display: flex; align-items: center;
        }
        .cargo-tag button:hover { color: #dc2626; }
      `}</style>

      {/* Back */}
      <button onClick={() => nav('/management/trips')} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--primary)', marginBottom: '1rem', padding: 0,
        fontSize: '.875rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '.35rem'
      }}>
        ← {t('trips')}
      </button>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: '0 6px 20px rgba(29,78,216,.25)'
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          🚛 {isEdit ? t('edit_trip') : t('create_new_trip')}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* ── Route ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>📍</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('route')}</h2>
          </div>
          <div className="tf-grid-2">
            <div>
              <label style={labelStyle}>{t('origin')}</label>
              <input className="form-control" required
                value={form.originLocation}
                onChange={e => setForm({ ...form, originLocation: e.target.value })}
                placeholder="e.g. Sarajevo" />
            </div>
            <div>
              <label style={labelStyle}>{t('destination')}</label>
              <input className="form-control" required
                value={form.destinationLocation}
                onChange={e => setForm({ ...form, destinationLocation: e.target.value })}
                placeholder="e.g. Mostar" />
            </div>
            <div>
              <label style={labelStyle}>{t('distance_km')}</label>
              <input className="form-control" type="number" min="0"
                value={form.distanceKm}
                onChange={e => setForm({ ...form, distanceKm: e.target.value })}
                placeholder="km" />
            </div>
          </div>
        </div>

        {/* ── Assignment ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>👤</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('assignment')}</h2>
          </div>

          {/* ── DRIVER ── */}
          <div style={{ marginBottom: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.45rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{t('driver')}</label>
              <button type="button"
                className={`create-btn${panel === 'driver' ? ' active' : ''}`}
                onClick={() => setPanel(p => p === 'driver' ? 'none' : 'driver')}>
                {panel === 'driver' ? `✕ ${t('cancel')}` : `+ ${t('new_user')}`}
              </button>
            </div>

            {selectedDriver && (
              <div className="selected-badge">
                <span style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#60a5fa,#a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: '.75rem', flexShrink: 0
                }}>
                  {selectedDriver.fullName[0].toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selectedDriver.fullName}</div>
                  {selectedDriver.phone && (
                    <div style={{ fontSize: '.7rem', opacity: .7 }}>{selectedDriver.phone}</div>
                  )}
                </div>
              </div>
            )}

            <select className="form-control"
              value={form.driverId}
              onChange={e => setForm({ ...form, driverId: e.target.value })}>
              <option value="">{t('select_driver')}</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>

            {panel === 'driver' && (
              <div style={panelStyle}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.75rem', color: 'var(--primary)' }}>
                  ➕ {t('new_user')}
                </div>
                <div className="tf-grid-2">
                  <div>
                    <label style={labelStyle}>{t('full_name_required')}</label>
                    <input className="form-control"
                      value={newDriver.fullName}
                      onChange={e => setNewDriver({ ...newDriver, fullName: e.target.value })}
                      placeholder="Full name" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('username_required')}</label>
                    <input className="form-control"
                      value={newDriver.username}
                      onChange={e => setNewDriver({ ...newDriver, username: e.target.value })}
                      placeholder="username" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('password_required')}</label>
                    <input className="form-control" type="password"
                      value={newDriver.password}
                      onChange={e => setNewDriver({ ...newDriver, password: e.target.value })}
                      placeholder="••••••" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('phone')}</label>
                    <input className="form-control"
                      value={newDriver.phone}
                      onChange={e => setNewDriver({ ...newDriver, phone: e.target.value })}
                      placeholder="+387..." />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('license_no')}</label>
                    <input className="form-control"
                      value={newDriver.licenseNumber}
                      onChange={e => setNewDriver({ ...newDriver, licenseNumber: e.target.value })}
                      placeholder="License no." />
                  </div>
                </div>
                <button type="button" className="btn btn-primary"
                  disabled={creating} onClick={createDriver}
                  style={{ marginTop: '.75rem', width: '100%' }}>
                  {creating ? t('saving') : `✅ ${t('create')} ${t('driver')}`}
                </button>
              </div>
            )}
          </div>

          <div style={dividerStyle} />

          {/* ── VEHICLE ── */}
          <div style={{ marginBottom: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.45rem' }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{t('vehicle')}</label>
              <button type="button"
                className={`create-btn${panel === 'vehicle' ? ' active' : ''}`}
                onClick={() => setPanel(p => p === 'vehicle' ? 'none' : 'vehicle')}>
                {panel === 'vehicle' ? `✕ ${t('cancel')}` : `+ ${t('new_vehicle')}`}
              </button>
            </div>

            {selectedVehicle && (
              <div className="selected-badge">
                <span style={{ fontSize: '1.1rem' }}>🚛</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selectedVehicle.registrationNumber}</div>
                  {selectedVehicle.fleetName && (
                    <div style={{ fontSize: '.7rem', opacity: .7 }}>{selectedVehicle.fleetName}</div>
                  )}
                </div>
              </div>
            )}

            <select className="form-control"
              value={form.vehicleId}
              onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">{t('select_vehicle')}</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registrationNumber}</option>
              ))}
            </select>

            {panel === 'vehicle' && (
              <div style={panelStyle}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.75rem', color: 'var(--primary)' }}>
                  ➕ {t('new_vehicle')}
                </div>
                <div className="tf-grid-2">
                  <div>
                    <label style={labelStyle}>{t('registration_no_required')}</label>
                    <input className="form-control"
                      value={newVehicle.registrationNumber}
                      onChange={e => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                      placeholder="e.g. A12-345" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('fleet_name_label')}</label>
                    <input className="form-control"
                      value={newVehicle.fleetName}
                      onChange={e => setNewVehicle({ ...newVehicle, fleetName: e.target.value })}
                      placeholder="Fleet name" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('vehicle_type')}</label>
                    <input className="form-control"
                      value={newVehicle.type}
                      onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value })}
                      placeholder="Truck, Van..." />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('capacity_tons')}</label>
                    <input className="form-control" type="number" min="0"
                      value={newVehicle.capacity}
                      onChange={e => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                      placeholder="tons" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('ownership_label')}</label>
                    <select className="form-control"
                      value={newVehicle.ownershipType}
                      onChange={e => setNewVehicle({ ...newVehicle, ownershipType: e.target.value })}>
                      <option value="">—</option>
                      <option value="Own">Own</option>
                      <option value="Leased">Leased</option>
                      <option value="Rented">Rented</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('owner_name')}</label>
                    <input className="form-control"
                      value={newVehicle.ownerName}
                      onChange={e => setNewVehicle({ ...newVehicle, ownerName: e.target.value })}
                      placeholder="Owner name" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('owner_phone')}</label>
                    <input className="form-control"
                      value={newVehicle.ownerPhone}
                      onChange={e => setNewVehicle({ ...newVehicle, ownerPhone: e.target.value })}
                      placeholder="+387..." />
                  </div>
                </div>
                <button type="button" className="btn btn-primary"
                  disabled={creating} onClick={createVehicle}
                  style={{ marginTop: '.75rem', width: '100%' }}>
                  {creating ? t('saving') : `✅ ${t('create')} ${t('vehicle')}`}
                </button>
              </div>
            )}
          </div>

          <div style={dividerStyle} />

          {/* ── CARGO ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.45rem', flexWrap: 'wrap', gap: '.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>📦 {t('assign_cargo')}</label>
                <span style={{
                  background: form.cargoIds.length === 0 ? '#fef2f2' : '#f0fdf4',
                  color:      form.cargoIds.length === 0 ? '#dc2626' : '#16a34a',
                  padding: '.1rem .45rem', borderRadius: 999,
                  fontSize: '.65rem', fontWeight: 700
                }}>
                </span>
                {selectedWeight > 0 && (
                  <span style={{
                    background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                    padding: '.1rem .45rem', borderRadius: 999, fontSize: '.65rem', fontWeight: 700
                  }}>
                    ⚖️ {selectedWeight.toFixed(2)} t
                  </span>
                )}
              </div>
              <button type="button"
                className={`create-btn${panel === 'cargo' ? ' active' : ''}`}
                onClick={() => setPanel(p => p === 'cargo' ? 'none' : 'cargo')}>
                {panel === 'cargo' ? `✕ ${t('cancel')}` : `+ ${t('new_cargo')}`}
              </button>
            </div>

            {/* Selected cargo tags */}
            {selectedCargoes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '.6rem' }}>
                {selectedCargoes.map(c => (
                  <div key={c.id} className="cargo-tag">
                    <span>📦</span>
                    <span>{c.description}</span>
                    {c.weightTons != null && (
                      <span style={{ opacity: .7, fontSize: '.7rem' }}>· {c.weightTons}t</span>
                    )}
                    <button type="button" onClick={() => removeCargo(c.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Cargo dropdown — only shows unselected ones */}
            <select
              className="form-control"
              value=""
              onChange={e => {
                const val = Number(e.target.value)
                if (val && !form.cargoIds.includes(val))
                  setForm(f => ({ ...f, cargoIds: [...f.cargoIds, val] }))
              }}>
              <option value="">
                {selectableCargoes.length === 0
                  ? t('no_cargo')
                  : `— ${t('assign_cargo')} —`}
              </option>
              {selectableCargoes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.description}
                  {c.weightTons != null ? ` · ${c.weightTons}t` : ''}
                  {c.cargoType ? ` [${c.cargoType}]` : ''}
                </option>
              ))}
            </select>

            {/* Inline create cargo */}
            {panel === 'cargo' && (
              <div style={panelStyle}>
                <div style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.75rem', color: 'var(--primary)' }}>
                  ➕ {t('new_cargo')}
                </div>
                <div className="tf-grid-2">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('description_required')}</label>
                    <input className="form-control"
                      value={newCargo.description}
                      onChange={e => setNewCargo({ ...newCargo, description: e.target.value })}
                      placeholder="Cargo description" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('consignor')}</label>
                    <input className="form-control"
                      value={newCargo.consignor}
                      onChange={e => setNewCargo({ ...newCargo, consignor: e.target.value })}
                      placeholder="Sender" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('consignee')}</label>
                    <input className="form-control"
                      value={newCargo.consignee}
                      onChange={e => setNewCargo({ ...newCargo, consignee: e.target.value })}
                      placeholder="Receiver" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('weight_tons')}</label>
                    <input className="form-control" type="number" min="0" step="0.01"
                      value={newCargo.weightTons}
                      onChange={e => setNewCargo({ ...newCargo, weightTons: e.target.value })}
                      placeholder="tons" />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('cargo_type')}</label>
                    <input className="form-control"
                      value={newCargo.cargoType}
                      onChange={e => setNewCargo({ ...newCargo, cargoType: e.target.value })}
                      placeholder="General, Fragile..." />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>{t('special_instructions')}</label>
                    <textarea className="form-control" rows={2}
                      value={newCargo.specialInstructions}
                      onChange={e => setNewCargo({ ...newCargo, specialInstructions: e.target.value })}
                      placeholder={t('special_instructions')} />
                  </div>
                </div>
                <button type="button" className="btn btn-primary"
                  disabled={creating} onClick={createCargo}
                  style={{ marginTop: '.75rem', width: '100%' }}>
                  {creating ? t('saving') : `✅ ${t('create')} & ${t('assign_cargo')}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Schedule ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>📅</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('planned_departure')}</h2>
          </div>
          <div className="tf-grid-2">
            <div>
              <label style={labelStyle}>{t('planned_departure_label')}</label>
              <input type="datetime-local" className="form-control"
                value={form.plannedDepartureDate}
                onChange={e => setForm({ ...form, plannedDepartureDate: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>{t('expected_arrival')}</label>
              <input type="datetime-local" className="form-control"
                value={form.expectedArrivalDate}
                onChange={e => setForm({ ...form, expectedArrivalDate: e.target.value })} />
            </div>
          </div>
        </div>

        {/* ── Remarks ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.65rem' }}>
            <span>📝</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('remarks')}</h2>
          </div>
          <textarea className="form-control" rows={3}
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            placeholder={t('add_note')} />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={saving || form.cargoIds.length === 0}
          style={{
            width: '100%', padding: '.85rem',
            fontSize: '1rem', fontWeight: 800,
            borderRadius: 'var(--radius)', border: 'none',
            background: form.cargoIds.length === 0
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #1d4ed8, #6d28d9)',
            color:  form.cargoIds.length === 0 ? '#94a3b8' : '#fff',
            cursor: form.cargoIds.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: form.cargoIds.length === 0 ? 'none' : '0 4px 14px rgba(29,78,216,.3)',
            transition: 'all .2s'
          }}>
          {saving
            ? t('saving')
            : isEdit
              ? `✅ ${t('update_trip')}`
              : `🚛 ${t('create_trip')}`}
        </button>
      </form>
    </div>
  )
}
