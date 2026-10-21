import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Ban, CarFront, CheckCircle2, Loader2, Pencil, Plus, Truck, User,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Vehicle } from '../../lib/types'
import { formatNumber } from '../../lib/format'
import {
  Badge, Card, ConfirmDialog, EmptyState, Field, Modal, PageHeader, PageLoader, Stat,
} from '../../components/ui'

const TYPES = ['Truck', 'Refrigerated', 'Tanker', 'Container', 'Flatbed', 'Mini Truck']
const OWNERSHIP = ['Own', 'Leased', 'Market']

const emptyForm = {
  registrationNumber: '',
  fleetName: '',
  type: 'Truck',
  capacity: '',
  ownershipType: 'Own',
  ownerName: '',
  ownerPhone: '',
}

export default function VehiclesPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'deactivate' | 'activate'>('deactivate')

  const load = () => {
    setLoading(true)
    api.get<Vehicle[]>('/vehicles')
      .then(r => setRows(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const stats = useMemo(() => ({
    total: rows.filter(v => v.isActive).length,
    onTrip: rows.reduce((sum, v) => sum + (v.activeTrips ?? 0), 0),
    capacity: rows.filter(v => v.isActive).reduce((sum, v) => sum + (v.capacity ?? 0), 0),
  }), [rows])

  const startCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const startEdit = (v: Vehicle) => {
    setEditId(v.id)
    setForm({
      registrationNumber: v.registrationNumber,
      fleetName: v.fleetName ?? '',
      type: v.type ?? 'Truck',
      capacity: v.capacity != null ? String(v.capacity) : '',
      ownershipType: v.ownershipType ?? 'Own',
      ownerName: v.ownerName ?? '',
      ownerPhone: v.ownerPhone ?? '',
    })
    setOpen(true)
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        registrationNumber: form.registrationNumber.trim(),
        fleetName: form.fleetName.trim() || null,
        type: form.type,
        capacity: form.capacity ? Number(form.capacity) : null,
        ownershipType: form.ownershipType,
        ownerName: form.ownerName.trim() || null,
        ownerPhone: form.ownerPhone.trim() || null,
      }
      if (editId) await api.put(`/vehicles/${editId}`, payload)
      else await api.post('/vehicles', payload)
      toast.success(editId ? t('fleet.updated') : t('fleet.created'))
      setOpen(false)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const runAction = async () => {
    if (!actionId) return
    try {
      await api.patch(`/vehicles/${actionId}/${actionType}`)
      toast.success(actionType === 'deactivate' ? t('fleet.deactivated') : t('fleet.activated'))
      setActionId(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
      setActionId(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('fleet.eyebrow')}
        title={t('fleet.title')}
        description={t('fleet.subtitle')}
        actions={<button className="btn btn-primary" onClick={startCreate}><Plus /> {t('fleet.new')}</button>}
      />

      <div className="stat-grid cols-3">
        <Stat icon={Truck} tone="blue" label={t('fleet.active')} value={stats.total} />
        <Stat icon={CarFront} tone="amber" label={t('fleet.on_trip')} value={stats.onTrip} hint={t('fleet.on_trip_hint')} />
        <Stat icon={CheckCircle2} tone="green" label={t('fleet.capacity')} value={`${formatNumber(stats.capacity, 0)} t`} />
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : rows.length === 0 ? (
        <Card>
          <EmptyState icon={Truck} title={t('fleet.empty')} text={t('fleet.empty_text')} action={<button className="btn btn-outline btn-sm" onClick={startCreate}><Plus /> {t('fleet.new')}</button>} />
        </Card>
      ) : (
        <div className="grid grid-3">
          {rows.map(v => (
            <article className="company-card" key={v.id} style={{ gap: 12 }}>
              <div className="top">
                <div className="icon" style={{ width: 42, height: 42, borderRadius: 10, background: v.isActive ? 'var(--blue-soft)' : 'var(--surface-3)', color: v.isActive ? 'var(--blue)' : 'var(--faint)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Truck size={20} />
                </div>
                <div className="grow">
                  <div className="name">{v.registrationNumber}</div>
                  <div className="loc">{v.type ?? t('common.vehicle')}{v.fleetName ? ` · ${v.fleetName}` : ''}</div>
                </div>
                <Badge tone={v.isActive ? 'green' : 'slate'} dot>{v.isActive ? t('common.active') : t('common.inactive')}</Badge>
              </div>

              <div className="metrics">
                <div className="metric"><div className="v">{v.capacity ? formatNumber(v.capacity, 0) : '—'}</div><div className="k">{t('fleet.capacity_tons')}</div></div>
                <div className="metric"><div className="v">{v.activeTrips ?? 0}</div><div className="k">{t('fleet.active_trips')}</div></div>
                <div className="metric"><div className="v">{v.totalTrips ?? 0}</div><div className="k">{t('fleet.total_trips')}</div></div>
                <div className="metric"><div className="v" style={{ fontSize: 12 }}>{v.ownershipType ?? '—'}</div><div className="k">{t('fleet.ownership')}</div></div>
              </div>

              {(v.ownerName || v.ownerPhone) && (
                <div className="row tiny muted"><User size={12} /> {v.ownerName ?? '—'} {v.ownerPhone ? `· ${v.ownerPhone}` : ''}</div>
              )}

              <div className="row" style={{ gap: 6, paddingTop: 2 }}>
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(v)}><Pencil size={13} /> {t('common.edit')}</button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setActionId(v.id); setActionType(v.isActive ? 'deactivate' : 'activate') }}
                >
                  {v.isActive ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                  {v.isActive ? t('common.deactivate') : t('common.activate')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? t('fleet.edit') : t('fleet.new')}
        description={t('fleet.form_sub')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setOpen(false)} type="button">{t('common.cancel')}</button>
            <button className="btn btn-primary" type="submit" form="vehicle-form" disabled={saving || !form.registrationNumber.trim()}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : null}
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </>
        }
      >
        <form id="vehicle-form" onSubmit={save}>
          <div className="form-grid">
            <Field label={t('fleet.registration')} required>
              <input className="input" value={form.registrationNumber} onChange={set('registrationNumber')} placeholder="A12-M-345" required autoFocus />
            </Field>
            <Field label={t('fleet.fleet_name')}>
              <input className="input" value={form.fleetName} onChange={set('fleetName')} placeholder="Sarajevo 01" />
            </Field>
            <Field label={t('fleet.type')}>
              <select className="select" value={form.type} onChange={set('type')}>
                {TYPES.map(type => <option key={type} value={type}>{t(`vehicle_type.${type.toLowerCase().replace(' ', '_')}`, type)}</option>)}
              </select>
            </Field>
            <Field label={t('fleet.capacity_tons')}>
              <input className="input" type="number" step="0.1" min="0" value={form.capacity} onChange={set('capacity')} placeholder="24" />
            </Field>
            <Field label={t('fleet.ownership')}>
              <select className="select" value={form.ownershipType} onChange={set('ownershipType')}>
                {OWNERSHIP.map(type => <option key={type} value={type}>{t(`ownership.${type.toLowerCase()}`, type)}</option>)}
              </select>
            </Field>
            <Field label={t('fleet.owner_name')}>
              <input className="input" value={form.ownerName} onChange={set('ownerName')} placeholder="TransLog d.o.o." />
            </Field>
            <Field label={t('fleet.owner_phone')} className="span-2">
              <input className="input" value={form.ownerPhone} onChange={set('ownerPhone')} placeholder="+387 33 555 120" />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={actionId !== null}
        onClose={() => setActionId(null)}
        onConfirm={runAction}
        danger={actionType === 'deactivate'}
        title={actionType === 'deactivate' ? t('fleet.deactivate_title') : t('fleet.activate_title')}
        text={actionType === 'deactivate' ? t('fleet.deactivate_text') : t('fleet.activate_text')}
        confirmLabel={actionType === 'deactivate' ? t('common.deactivate') : t('common.activate')}
      />
    </div>
  )
}


