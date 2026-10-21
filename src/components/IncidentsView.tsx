import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  AlertTriangle, CheckCircle2, Loader2, MapPin, Plus, ShieldAlert,
} from 'lucide-react'
import api, { apiError } from '../api/axios'
import type { Incident, Trip } from '../lib/types'
import { formatDateTime } from '../lib/format'
import {
  Badge, Card, EmptyState, Field, Modal, PageHeader, PageLoader, Segmented, Stat,
} from '../components/ui'

const TYPES = ['Breakdown', 'Accident', 'Delay', 'Road Closure', 'Cargo Damage', 'Weather', 'Border Delay', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High']

export default function IncidentsView({ role }: { role: 'manager' | 'driver' }) {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()
  const [rows, setRows] = useState<Incident[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'Open' | 'Resolved'>('all')
  const [reportOpen, setReportOpen] = useState(false)
  const [resolveTarget, setResolveTarget] = useState<Incident | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tripId: params.get('trip') ?? '',
    type: 'Breakdown',
    severity: 'Medium',
    location: '',
    description: '',
  })
  const [resolution, setResolution] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get<Incident[]>('/incidents'),
      role === 'driver' ? api.get<Trip[]>('/trips/my-trips') : api.get<Trip[]>('/trips'),
    ]).then(([inc, tr]) => {
      setRows(inc.data)
      setTrips(tr.data)
    }).catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [role])

  const stats = useMemo(() => ({
    open: rows.filter(i => i.status === 'Open').length,
    high: rows.filter(i => i.severity === 'High' && i.status === 'Open').length,
    resolved: rows.filter(i => i.status === 'Resolved').length,
  }), [rows])

  const filtered = useMemo(
    () => rows.filter(i => filter === 'all' || i.status === filter),
    [rows, filter],
  )

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/incidents', {
        tripId: form.tripId ? Number(form.tripId) : null,
        type: form.type,
        severity: form.severity,
        location: form.location.trim() || null,
        description: form.description.trim(),
      })
      toast.success(t('incidents.reported'))
      setReportOpen(false)
      setForm({ tripId: '', type: 'Breakdown', severity: 'Medium', location: '', description: '' })
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const resolve = async () => {
    if (!resolveTarget) return
    setSaving(true)
    try {
      await api.put(`/incidents/${resolveTarget.id}/resolve`, { resolution: resolution.trim() || null })
      toast.success(t('incidents.resolved'))
      setResolveTarget(null)
      setResolution('')
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const activeTrips = trips.filter(t => !['DeliveryCompleted', 'Cancelled'].includes(t.status))

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('incidents.eyebrow')}
        title={t('incidents.title')}
        description={role === 'driver' ? t('incidents.driver_sub') : t('incidents.manager_sub')}
        actions={<button className="btn btn-primary" onClick={() => setReportOpen(true)}><Plus /> {t('incidents.report')}</button>}
      />

      <div className="stat-grid cols-3">
        <Stat icon={ShieldAlert} tone={stats.open ? 'orange' : 'green'} label={t('incidents.open')} value={stats.open} />
        <Stat icon={AlertTriangle} tone={stats.high ? 'red' : 'slate'} label={t('incidents.high_open')} value={stats.high} />
        <Stat icon={CheckCircle2} tone="green" label={t('incidents.resolved')} value={stats.resolved} />
      </div>

      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'Open', label: t('incidents.open') },
            { value: 'Resolved', label: t('incidents.resolved') },
          ]}
        />
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldAlert} title={t('incidents.empty')} text={t('incidents.empty_text')} action={<button className="btn btn-outline btn-sm" onClick={() => setReportOpen(true)}><Plus /> {t('incidents.report')}</button>} />
        </Card>
      ) : (
        <div className="stack">
          {filtered.map(incident => (
            <article className="card pad" key={incident.id}>
              <div className="row wrap between mb-2">
                <div className="row" style={{ gap: 8 }}>
                  <Badge tone={incident.severity === 'High' ? 'red' : incident.severity === 'Medium' ? 'amber' : 'slate'} dot>
                    {t(`severity.${incident.severity.toLowerCase()}`, incident.severity)}
                  </Badge>
                  <Badge tone={incident.status === 'Open' ? 'orange' : 'green'}>{t(`incidents.status_${incident.status.toLowerCase()}`, incident.status)}</Badge>
                  <span className="small strong">{t(`incident_type.${incident.type.replace(/ /g, '_').toLowerCase()}`, incident.type)}</span>
                </div>
                <span className="tiny faint">{formatDateTime(incident.reportedAt, i18n.language)}</span>
              </div>
              <p className="small" style={{ lineHeight: 1.65 }}>{incident.description}</p>
              <div className="row wrap small muted mt-2" style={{ gap: 12 }}>
                {incident.tripNumber && <span className="mono tiny">{incident.tripNumber}</span>}
                {incident.route && <span>{incident.route}</span>}
                {incident.location && <span className="inline"><MapPin size={12} /> {incident.location}</span>}
                {incident.reporterName && <span>{incident.reporterName}</span>}
              </div>
              {incident.resolution && (
                <div className="alert success mt-2">
                  <CheckCircle2 size={15} />
                  <span>{incident.resolution}</span>
                </div>
              )}
              {role === 'manager' && incident.status === 'Open' && (
                <div className="row mt-2">
                  <button className="btn btn-outline btn-sm" onClick={() => { setResolveTarget(incident); setResolution('') }}>
                    <CheckCircle2 size={13} /> {t('incidents.mark_resolved')}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={t('incidents.report')}
        description={t('incidents.report_sub')}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setReportOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" type="submit" form="incident-form" disabled={saving || !form.description.trim()}>
              {saving && <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} />}
              {saving ? t('common.sending') : t('incidents.submit')}
            </button>
          </>
        }
      >
        <form id="incident-form" onSubmit={submitReport}>
          <div className="form-grid">
            <Field label={t('incidents.trip')} className="span-2">
              <select className="select" value={form.tripId} onChange={e => setForm(p => ({ ...p, tripId: e.target.value }))}>
                <option value="">{t('incidents.no_trip')}</option>
                {activeTrips.map(trip => <option key={trip.id} value={trip.id}>{trip.tripNumber} · {trip.originLocation.split(',')[0]} → {trip.destinationLocation.split(',')[0]}</option>)}
              </select>
            </Field>
            <Field label={t('incidents.type')}>
              <select className="select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {TYPES.map(type => <option key={type} value={type}>{t(`incident_type.${type.replace(/ /g, '_').toLowerCase()}`, type)}</option>)}
              </select>
            </Field>
            <Field label={t('incidents.severity')}>
              <select className="select" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                {SEVERITIES.map(s => <option key={s} value={s}>{t(`severity.${s.toLowerCase()}`, s)}</option>)}
              </select>
            </Field>
            <Field label={t('incidents.location')} className="span-2">
              <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="A1 highway, km 145" />
            </Field>
            <Field label={t('incidents.description')} required className="span-2">
              <textarea className="textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t('incidents.description_placeholder')} required />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={resolveTarget !== null}
        onClose={() => setResolveTarget(null)}
        title={t('incidents.resolve_title')}
        description={resolveTarget ? `${resolveTarget.type} · ${resolveTarget.tripNumber ?? ''}` : undefined}
        size="small"
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setResolveTarget(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={resolve} disabled={saving}>
              {saving && <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} />}
              {t('incidents.mark_resolved')}
            </button>
          </>
        }
      >
        <Field label={t('incidents.resolution')} hint={t('incidents.resolution_hint')}>
          <textarea className="textarea" value={resolution} onChange={e => setResolution(e.target.value)} placeholder={t('incidents.resolution_placeholder')} />
        </Field>
      </Modal>
    </div>
  )
}


