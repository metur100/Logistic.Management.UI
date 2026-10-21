import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ArrowRight, Calculator, Check, ExternalLink, Loader2, MapPin,
  Package, Plus, Route as RouteIcon, Save, Truck, User,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Cargo, Driver, RouteDistance, Trip, Vehicle } from '../../lib/types'
import { formatDistance, formatNumber, formatTons, fromDateTimeInput, mapsUrl, toDateTimeInput } from '../../lib/format'
import { Card, Field, PageHeader, PageLoader } from '../../components/ui'

export default function TripForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const nav = useNavigate()
  const { t } = useTranslation()

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [cargo, setCargo] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [measuring, setMeasuring] = useState(false)
  const [routeInfo, setRouteInfo] = useState<RouteDistance | null>(null)

  const [form, setForm] = useState({
    driverId: '',
    vehicleId: '',
    origin: '',
    destination: '',
    distance: '',
    duration: '',
    planned: '',
    expected: '',
    remarks: '',
  })
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    let active = true
    const calls: Promise<unknown>[] = [
      api.get<Driver[]>('/company/drivers').then(r => { if (active) setDrivers(r.data) }),
      api.get<Vehicle[]>('/vehicles').then(r => { if (active) setVehicles(r.data) }),
      api.get<Cargo[]>('/cargo').then(r => { if (active) setCargo(r.data) }),
    ]
    if (editing) {
      calls.push(api.get<Trip>(`/trips/${id}`).then(r => {
        if (!active) return
        const trip = r.data
        setForm({
          driverId: trip.driverId ? String(trip.driverId) : '',
          vehicleId: trip.vehicleId ? String(trip.vehicleId) : '',
          origin: trip.originLocation,
          destination: trip.destinationLocation,
          distance: trip.distanceKm ? String(trip.distanceKm) : '',
          duration: trip.estimatedDurationMinutes ? String(trip.estimatedDurationMinutes) : '',
          planned: toDateTimeInput(trip.plannedDepartureDate),
          expected: toDateTimeInput(trip.expectedArrivalDate),
          remarks: trip.remarks ?? '',
        })
        setSelected(trip.cargoItems.map(c => c.id))
      }))
    }
    Promise.all(calls)
      .catch(err => { if (active) setError(apiError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editing, id])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const activeDrivers = useMemo(() => drivers.filter(d => d.status === 'Active' || d.id === Number(form.driverId)), [drivers, form.driverId])
  const activeVehicles = useMemo(() => vehicles.filter(v => v.isActive || v.id === Number(form.vehicleId)), [vehicles, form.vehicleId])

  const availableCargo = useMemo(
    () => cargo.filter(c => !c.tripId || selected.includes(c.id) || (editing && String(c.tripId) === id)),
    [cargo, selected, editing, id],
  )

  const selectedCargo = useMemo(() => cargo.filter(c => selected.includes(c.id)), [cargo, selected])
  const totalWeight = selectedCargo.reduce((sum, c) => sum + (c.weightTons ?? 0), 0)
  const vehicle = vehicles.find(v => String(v.id) === form.vehicleId)
  const overCapacity = vehicle?.capacity ? totalWeight > vehicle.capacity : false
  const driver = drivers.find(d => String(d.id) === form.driverId)

  const toggleCargo = (cargoId: number) => {
    setSelected(prev => prev.includes(cargoId) ? prev.filter(x => x !== cargoId) : [...prev, cargoId])
  }

  const measureRoute = async (silent = false) => {
    const origin = form.origin.trim()
    const destination = form.destination.trim()
    if (origin.length < 2 || destination.length < 2) return
    setMeasuring(true)
    try {
      const { data } = await api.get<RouteDistance>('/routing/distance', { params: { origin, destination } })
      setRouteInfo(data)
      setForm(prev => {
        const next = { ...prev, distance: String(data.distanceKm), duration: String(data.durationMinutes) }
        if (prev.planned && !prev.expected) {
          const planned = new Date(prev.planned)
          if (!Number.isNaN(planned.getTime())) {
            next.expected = toDateTimeInput(new Date(planned.getTime() + data.durationMinutes * 60000).toISOString())
          }
        }
        return next
      })
      if (!silent) toast.success(t('trip.route_measured', { km: data.distanceKm }))
    } catch (err) {
      if (!silent) toast.error(apiError(err, t('trip.route_failed')))
    } finally {
      setMeasuring(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.origin.trim() || !form.destination.trim()) { setError(t('trip.route_required')); return }
    if (selected.length === 0) { setError(t('trip.cargo_required')); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        driverId: form.driverId ? Number(form.driverId) : null,
        vehicleId: form.vehicleId ? Number(form.vehicleId) : null,
        originLocation: form.origin.trim(),
        destinationLocation: form.destination.trim(),
        distanceKm: form.distance ? Number(form.distance) : null,
        estimatedDurationMinutes: form.duration ? Number(form.duration) : null,
        plannedDepartureDate: fromDateTimeInput(form.planned),
        expectedArrivalDate: fromDateTimeInput(form.expected),
        remarks: form.remarks.trim() || null,
        cargoIds: selected,
      }
      if (editing) {
        await api.put(`/trips/${id}`, payload)
        toast.success(t('trip.updated'))
        nav(`/management/trips/${id}`)
      } else {
        const { data } = await api.post<Trip>('/trips', payload)
        toast.success(t('trip.created'))
        nav(`/management/trips/${data.id}`)
      }
    } catch (err) {
      setError(apiError(err, t('trip.save_failed')))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page narrow">
      <PageHeader
        back={{ to: editing ? `/management/trips/${id}` : '/management/trips', label: t('trip.back_to_trips') }}
        eyebrow={editing ? t('trip.edit_eyebrow') : t('trip.new_eyebrow')}
        title={editing ? t('trip.edit_title') : t('trip.new_title')}
        description={t('trip.form_sub')}
      />

      {error && <div className="alert error mb-3">{error}</div>}

      <form onSubmit={submit}>
        <div className="grid grid-2">
          <div className="stack" style={{ gap: 16 }}>
            <Card title={t('trip.route')} subtitle={t('trip.route_sub')}>
              <div className="form-grid">
                <Field label={t('trip.origin')} required>
                  <div className="input-wrap">
                    <MapPin />
                    <input className="input" value={form.origin} onChange={set('origin')} placeholder="Sarajevo, Bosnia and Herzegovina" required />
                  </div>
                </Field>
                <Field label={t('trip.destination')} required>
                  <div className="input-wrap">
                    <MapPin />
                    <input
                      className="input"
                      value={form.destination}
                      onChange={set('destination')}
                      onBlur={() => { if (!form.distance) measureRoute(true) }}
                      placeholder="Mostar, Bosnia and Herzegovina"
                      required
                    />
                  </div>
                </Field>
              </div>

              <div className="row wrap" style={{ marginBottom: 14 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => measureRoute(false)} disabled={measuring || form.origin.length < 2 || form.destination.length < 2}>
                  {measuring ? <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> : <Calculator size={14} />}
                  {measuring ? t('trip.measuring') : t('trip.measure')}
                </button>
                {form.origin && form.destination && (
                  <a className="btn btn-ghost btn-sm" href={mapsUrl(form.origin, form.destination)} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> {t('trip.open_maps')}
                  </a>
                )}
                {routeInfo?.source === 'estimate' && <span className="tiny faint">{t('trip.estimate_note')}</span>}
              </div>

              <div className="form-grid three">
                <Field label={t('trip.distance_km')} hint={routeInfo ? `${routeInfo.originLabel.split(',')[0]} → ${routeInfo.destinationLabel.split(',')[0]}` : undefined}>
                  <input className="input" type="number" min="0" step="0.1" value={form.distance} onChange={set('distance')} placeholder="0" />
                </Field>
                <Field label={t('trip.duration_min')}>
                  <input className="input" type="number" min="0" step="1" value={form.duration} onChange={set('duration')} placeholder="0" />
                </Field>
                <Field label={t('trip.route_source')}>
                  <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)' }}>
                    <RouteIcon size={14} className="muted" />
                    <span className="small muted">{routeInfo ? (routeInfo.source === 'osrm' ? t('trip.real_route') : t('trip.estimated')) : t('trip.not_measured')}</span>
                  </div>
                </Field>
              </div>

              <div className="form-grid">
                <Field label={t('trip.planned_departure')}>
                  <input className="input" type="datetime-local" value={form.planned} onChange={set('planned')} />
                </Field>
                <Field label={t('trip.expected_arrival')} hint={t('trip.expected_hint')}>
                  <input className="input" type="datetime-local" value={form.expected} onChange={set('expected')} />
                </Field>
              </div>
            </Card>

            <Card title={t('trip.assignment')} subtitle={t('trip.assignment_sub')}>
              <div className="form-grid">
                <Field label={t('trip.driver')}>
                  <select className="select" value={form.driverId} onChange={set('driverId')}>
                    <option value="">{t('trip.no_driver')}</option>
                    {activeDrivers.map(d => <option key={d.id} value={d.id}>{d.fullName} · @{d.username}</option>)}
                  </select>
                  {driver && <span className="hint">{driver.phone ?? driver.email ?? ''}</span>}
                </Field>
                <Field label={t('trip.vehicle')}>
                  <select className="select" value={form.vehicleId} onChange={set('vehicleId')}>
                    <option value="">{t('trip.no_vehicle')}</option>
                    {activeVehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} · {v.type ?? t('common.vehicle')}{v.capacity ? ` · ${formatNumber(v.capacity, 0)} t` : ''}</option>)}
                  </select>
                  {vehicle?.capacity ? <span className="hint">{t('trip.capacity', { value: formatNumber(vehicle.capacity, 0) })}</span> : null}
                </Field>
              </div>
              <div className="alert info mt-1">
                <User size={15} />
                <span>{t('trip.assignment_note')}</span>
              </div>
            </Card>

            <Card title={t('trip.cargo')} subtitle={t('trip.cargo_sub')} actions={<Link to="/management/cargo" className="btn btn-ghost btn-sm"><Plus size={13} /> {t('trip.manage_cargo')}</Link>}>
              {availableCargo.length === 0 ? (
                <div className="empty" style={{ padding: '26px 12px' }}>
                  <div className="ico"><Package /></div>
                  <h3>{t('trip.no_cargo_available')}</h3>
                  <p>{t('trip.no_cargo_available_text')}</p>
                  <Link to="/management/cargo" className="btn btn-outline btn-sm"><Plus /> {t('trip.add_cargo')}</Link>
                </div>
              ) : (
                <div className="stack-sm">
                  {availableCargo.map(item => {
                    const checked = selected.includes(item.id)
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggleCargo(item.id)}
                        className="row"
                        style={{
                          width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 9,
                          border: `1px solid ${checked ? 'var(--accent-line)' : 'var(--line)'}`,
                          background: checked ? 'var(--accent-soft)' : 'var(--surface)',
                          gap: 11,
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--line-strong)'}`,
                          background: checked ? 'var(--accent)' : 'var(--surface)', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0,
                        }}>
                          {checked && <Check size={13} />}
                        </span>
                        <span className="grow">
                          <span className="strong" style={{ fontSize: 12.5, display: 'block' }}>{item.description}</span>
                          <span className="tiny muted">{item.consignor ? `${item.consignor} → ` : ''}{item.consignee ?? '—'} · {item.cargoType ?? 'General'}</span>
                        </span>
                        <span className="mono small nowrap">{formatTons(item.weightTons)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="row between mt-2 small">
                <span className="muted">{selected.length} {t('common.items')} {t('common.selected')}</span>
                <span className={overCapacity ? 'badge badge-red' : 'strong'}>{formatTons(totalWeight)}</span>
              </div>
              {overCapacity && <div className="alert warn mt-2">{t('trip.over_capacity', { value: formatNumber(vehicle?.capacity, 0) })}</div>}
            </Card>

            <Card title={t('trip.notes')} subtitle={t('trip.notes_sub')}>
              <textarea className="textarea" value={form.remarks} onChange={set('remarks')} placeholder={t('trip.notes_placeholder')} maxLength={2000} />
            </Card>
          </div>

          <div className="card pad" style={{ position: 'sticky', top: 18 }}>
            <div className="eyebrow">{t('trip.summary')}</div>
            <h2 style={{ marginTop: 6 }}>{editing ? t('trip.edit_title') : t('trip.new_title')}</h2>
            <div className="divider" />
            <div className="stack-sm small">
              <div className="row between"><span className="muted">{t('trip.route')}</span><span className="strong text-right">{form.origin ? form.origin.split(',')[0] : '—'} → {form.destination ? form.destination.split(',')[0] : '—'}</span></div>
              <div className="row between"><span className="muted">{t('trip.distance')}</span><span className="strong">{form.distance ? formatDistance(Number(form.distance)) : '—'}</span></div>
              <div className="row between"><span className="muted">{t('trip.duration')}</span><span className="strong">{form.duration ? `${form.duration} min` : '—'}</span></div>
              <div className="row between"><span className="muted">{t('trip.driver')}</span><span className="strong text-right">{driver?.fullName ?? '—'}</span></div>
              <div className="row between"><span className="muted">{t('trip.vehicle')}</span><span className="strong">{vehicle?.registrationNumber ?? '—'}</span></div>
              <div className="row between"><span className="muted">{t('trip.cargo')}</span><span className="strong">{selected.length} · {formatTons(totalWeight)}</span></div>
            </div>
            <div className="divider" />
            <button className="btn btn-primary btn-block btn-lg" disabled={saving}>
              {saving ? <Loader2 size={17} style={{ animation: 'spin .7s linear infinite' }} /> : editing ? <Save size={17} /> : <ArrowRight size={17} />}
              {saving ? t('common.saving') : editing ? t('trip.save_changes') : t('trip.create')}
            </button>
            <Link to={editing ? `/management/trips/${id}` : '/management/trips'} className="btn btn-ghost btn-block mt-1">
              <ArrowLeft size={15} /> {t('common.cancel')}
            </Link>
            <div className="alert info mt-3">
              <Truck size={15} />
              <span>{t('trip.summary_note')}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

