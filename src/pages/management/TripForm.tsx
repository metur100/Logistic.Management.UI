import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver {
  id: number
  fullName: string
  phone?: string
}

interface Vehicle {
  id: number
  registrationNumber: string
  type?: string
}

interface CargoItem {
  id: number
  description: string
  cargoType?: string
  weightTons?: number
  consignor?: string
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

export default function TripForm() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [cargoes, setCargoes] = useState<CargoItem[]>([])
  const [form, setForm] = useState<TripFormState>({
    driverId: '', vehicleId: '', originLocation: '', destinationLocation: '',
    distanceKm: '', plannedDepartureDate: '', expectedArrivalDate: '', remarks: '', cargoIds: []
  })

  useEffect(() => {
    api.get('/users?role=Driver').then(r => setDrivers(r.data))
    api.get('/vehicles').then(r => setVehicles(r.data))
    api.get('/cargo?unassigned=true').then(r => setCargoes(r.data))
    if (isEdit) api.get(`/trips/${id}`).then(r => {
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
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || t('error_saving_trip'))
    }
  }

  const toggleCargo = (cid: number) => {
    setForm(f => ({
      ...f,
      cargoIds: f.cargoIds.includes(cid)
        ? f.cargoIds.filter(x => x !== cid)
        : [...f.cargoIds, cid]
    }))
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        {isEdit ? t('edit_trip') : t('create_new_trip')}
      </h1>
      <form onSubmit={handleSubmit}>

        {/* Assignment */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('assignment')}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>{t('driver')}</label>
              <select className="form-control" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
                <option value="">{t('select_driver')}</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.phone || 'no phone'})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>{t('vehicle')}</label>
              <select className="form-control" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">{t('select_vehicle')}</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} – {v.type || 'N/A'}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('route')}</h2>
          <div className="form-row">
            <div className="form-group">
              <label>{t('origin')}</label>
              <input className="form-control" required value={form.originLocation} onChange={e => setForm({ ...form, originLocation: e.target.value })} placeholder="e.g. Sarajevo" />
            </div>
            <div className="form-group">
              <label>{t('destination')}</label>
              <input className="form-control" required value={form.destinationLocation} onChange={e => setForm({ ...form, destinationLocation: e.target.value })} placeholder="e.g. Mostar" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('distance_km')}</label>
              <input className="form-control" type="number" value={form.distanceKm} onChange={e => setForm({ ...form, distanceKm: e.target.value })} placeholder="e.g. 130" />
            </div>
            <div className="form-group">
              <label>{t('remarks')}</label>
              <input className="form-control" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('planned_departure_label')}</label>
              <input className="form-control" type="datetime-local" value={form.plannedDepartureDate} onChange={e => setForm({ ...form, plannedDepartureDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>{t('expected_arrival')}</label>
              <input className="form-control" type="datetime-local" value={form.expectedArrivalDate} onChange={e => setForm({ ...form, expectedArrivalDate: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Cargo */}
        {cargoes.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('assign_cargo')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '.75rem' }}>
              {cargoes.map(c => (
                <label key={c.id} style={{
                  display: 'flex', gap: '.75rem', alignItems: 'flex-start',
                  padding: '.75rem',
                  border: `2px solid ${form.cargoIds.includes(c.id) ? '#3b4fd8' : '#e2e8f0'}`,
                  borderRadius: 8, cursor: 'pointer',
                  background: form.cargoIds.includes(c.id) ? '#eef2ff' : '#fff'
                }}>
                  <input type="checkbox" checked={form.cargoIds.includes(c.id)} onChange={() => toggleCargo(c.id)} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.description}</div>
                    <div style={{ fontSize: '.8rem', color: '#64748b' }}>{c.cargoType} · {c.weightTons}t · {c.consignor}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary">{isEdit ? t('update_trip') : t('create_trip')}</button>
          <button type="button" className="btn btn-outline" onClick={() => nav('/management/trips')}>{t('cancel')}</button>
        </div>
      </form>
    </div>
  )
}