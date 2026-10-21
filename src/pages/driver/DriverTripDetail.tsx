import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  AlertTriangle, ArrowRight, Check, CheckCircle2, Clock, FileText,
  Loader2, MessageSquare, Navigation, Package, Phone, Route as RouteIcon,
  Send, Truck, User,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import type { Trip } from '../../lib/types'
import {
  formatDateTime, formatDistance, formatTons, mapsUrl,
} from '../../lib/format'
import { TRIP_FLOW, TRIP_NEXT, tripProgress } from '../../lib/status'
import {
  Badge, Card, EmptyState, Field, Modal, PageHeader, PageLoader,
  StatusBadge,
} from '../../components/ui'

export default function DriverTripDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [podOpen, setPodOpen] = useState(false)
  const [pod, setPod] = useState({ number: '', remarks: '' })
  const [cmr, setCmr] = useState('')
  const [cmrSaving, setCmrSaving] = useState(false)

  const load = () => {
    api.get<Trip>(`/trips/${id}`)
      .then(r => { setTrip(r.data); setCmr(r.data.cmrNumber ?? '') })
      .catch(err => setError(apiError(err)))
  }
  useEffect(load, [id])

  const totalWeight = useMemo(
    () => trip?.cargoItems.reduce((sum, c) => sum + (c.weightTons ?? 0), 0) ?? 0,
    [trip],
  )

  const startRoute = async () => {
    if (!trip) return
    window.open(mapsUrl(trip.originLocation, trip.destinationLocation), '_blank', 'noopener')
    setBusy(true)
    try {
      await api.post(`/trips/${trip.id}/start`)
      toast.success(t('driver.route_started'))
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const advance = async () => {
    if (!trip) return
    const step = TRIP_NEXT[trip.status]
    if (!step) return
    if (step.next === 'InTransit') {
      window.open(mapsUrl(trip.originLocation, trip.destinationLocation), '_blank', 'noopener')
    }
    setBusy(true)
    try {
      await api.put(`/trips/${trip.id}/status`, { status: step.next, remarks: null })
      toast.success(t('driver.status_updated', { status: t(`status.${step.next}`) }))
      load()
      if (step.next === 'DeliveryCompleted') setPodOpen(true)
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const submitPod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trip) return
    setBusy(true)
    try {
      await api.put(`/trips/${trip.id}/pod`, {
        podNumber: pod.number.trim() || null,
        remarks: pod.remarks.trim() || null,
        loadingArrivalTime: trip.loadingArrivalTime,
        loadingEndTime: trip.loadingEndTime,
        unloadingArrivalTime: trip.unloadingArrivalTime,
        unloadingEndTime: trip.unloadingEndTime,
      })
      toast.success(t('driver.pod_saved'))
      setPodOpen(false)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  const saveCmr = async () => {
    if (!trip) return
    setCmrSaving(true)
    try {
      await api.patch(`/trips/${trip.id}/cmr`, { cmrNumber: cmr.trim() || null })
      toast.success(t('driver.cmr_saved'))
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setCmrSaving(false)
    }
  }

  if (error) return <div className="page"><PageHeader back={{ to: '/driver/trips', label: t('driver.back_trips') }} title={t('trip.not_found')} /><div className="alert error">{error}</div></div>
  if (!trip) return <PageLoader />

  const step = TRIP_NEXT[trip.status]
  const progress = tripProgress(trip.status)
  const closed = trip.status === 'DeliveryCompleted' || trip.status === 'Cancelled'

  return (
    <div className="page">
      <PageHeader
        back={{ to: '/driver/trips', label: t('driver.back_trips') }}
        eyebrow={`${trip.tripNumber} · ${formatDateTime(trip.plannedDepartureDate, i18n.language)}`}
        title={t('driver.trip_detail')}
        description={`${trip.originLocation.split(',')[0]} → ${trip.destinationLocation.split(',')[0]}`}
        actions={<StatusBadge status={trip.status} />}
      />

      <section className="trip-hero">
        <div className="eyebrow">{t('driver.your_route')}</div>
        <div className="hero-route">
          <h1>{trip.originLocation.split(',')[0]}</h1>
          <span className="arrow"><ArrowRight /></span>
          <h1>{trip.destinationLocation.split(',')[0]}</h1>
        </div>
        <div className="hero-meta">
          <span><Truck size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{trip.vehicle?.registrationNumber ?? '—'}</b></span>
          <span><RouteIcon size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{formatDistance(trip.distanceKm, i18n.language)}</b></span>
          <span><Package size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{trip.cargoItems.length} {t('common.items')}</b> · {formatTons(totalWeight)}</span>
          <span><Clock size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{formatDateTime(trip.expectedArrivalDate, i18n.language)}</b></span>
        </div>
        <div className="hero-actions">
          {!closed && (
            <button className="btn btn-accent" onClick={startRoute} disabled={busy}>
              <Navigation size={16} /> {t('driver.start_route')}
            </button>
          )}
          {!closed && step && (
            <button className="btn btn-outline" onClick={advance} disabled={busy}>
              {busy ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> : <Check size={16} />}
              {t(step.key)}
            </button>
          )}
          {trip.status === 'UnloadingComplete' && (
            <button className="btn btn-outline" onClick={() => setPodOpen(true)}><FileText size={16} /> {t('driver.pod')}</button>
          )}
        </div>
      </section>

      <div className="steps-caption">{t('trip.step_caption', { current: progress + 1, total: 8, status: t(`status.${trip.status}`) })}</div>
      <div className="steps mb-3">
        {TRIP_FLOW.map((s, index) => (
          <div key={s} className={`step ${index < progress ? 'done' : ''} ${index === progress && !closed ? 'current' : ''}`}>
            <div className="bar" />
            <div className="lbl">{t(`status.${s}`)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card
            title={t('driver.next_action')}
            subtitle={closed ? t('driver.trip_closed') : step ? t(step.key) : t('driver.no_action')}
          >
            {closed ? (
              <div className={`alert ${trip.status === 'DeliveryCompleted' ? 'success' : 'warn'}`}>
                <CheckCircle2 size={15} />
                <span>{trip.status === 'DeliveryCompleted' ? t('driver.delivered_note') : t('driver.cancelled_note')}</span>
              </div>
            ) : (
              <>
                <div className="row between mb-2">
                  <span className="small muted">{t('driver.current_status')}</span>
                  <Badge tone="orange">{t(`status.${trip.status}`, trip.status)}</Badge>
                </div>
                {step && (
                  <button className="btn btn-primary btn-block btn-lg" onClick={advance} disabled={busy}>
                    {busy ? <Loader2 size={17} style={{ animation: 'spin .7s linear infinite' }} /> : <ArrowRight size={17} />}
                    {t(step.key)}
                  </button>
                )}
                <div className="row mt-2" style={{ gap: 8 }}>
                  <Link className="btn btn-outline btn-sm" to={`/driver/incidents?trip=${trip.id}`}><AlertTriangle size={14} /> {t('driver.report_incident')}</Link>
                  <Link className="btn btn-ghost btn-sm" to="/driver/messages"><MessageSquare size={14} /> {t('driver.message_dispatch')}</Link>
                </div>
              </>
            )}
          </Card>

          <Card title={t('trip.route_and_schedule')}>
            <div className="info-grid">
              <div className="info-item"><div className="k">{t('trip.origin')}</div><div className="v">{trip.originLocation}</div></div>
              <div className="info-item"><div className="k">{t('trip.destination')}</div><div className="v">{trip.destinationLocation}</div></div>
              <div className="info-item"><div className="k">{t('trip.planned_departure')}</div><div className="v">{formatDateTime(trip.plannedDepartureDate, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.expected_arrival')}</div><div className="v">{formatDateTime(trip.expectedArrivalDate, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.actual_departure')}</div><div className="v sub">{formatDateTime(trip.actualDepartureDate, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.actual_arrival')}</div><div className="v sub">{formatDateTime(trip.actualArrivalDate, i18n.language)}</div></div>
            </div>
            <div className="divider" />
            <div className="row wrap" style={{ gap: 8 }}>
              <a className="btn btn-outline btn-sm" href={mapsUrl(trip.originLocation, trip.destinationLocation)} target="_blank" rel="noreferrer"><Navigation size={14} /> {t('driver.navigate')}</a>
              {trip.driver?.phone && <a className="btn btn-ghost btn-sm" href={`tel:${trip.driver.phone}`}><Phone size={14} /> {trip.driver.phone}</a>}
            </div>
            {trip.remarks && <div className="alert info mt-2"><FileText size={15} /><span>{trip.remarks}</span></div>}
          </Card>

          <Card title={t('trip.cargo_items')} subtitle={`${trip.cargoItems.length} ${t('common.items')} · ${formatTons(totalWeight)}`}>
            {trip.cargoItems.length === 0 ? <EmptyState icon={Package} title={t('trip.no_cargo')} /> : (
              <div>
                {trip.cargoItems.map(item => (
                  <div className="cargo-row" key={item.id}>
                    <div className="icon"><Package /></div>
                    <div className="grow">
                      <div className="t">{item.description}</div>
                      <div className="s">{item.consignor ?? '—'} → {item.consignee ?? '—'}</div>
                      {item.specialInstructions && <div className="s" style={{ color: 'var(--amber)' }}>{item.specialInstructions}</div>}
                    </div>
                    <div className="w">{formatTons(item.weightTons)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('driver.documents')} subtitle={t('driver.documents_sub')}>
            <div className="form-grid">
              <Field label={t('driver.cmr')}>
                <div className="row" style={{ gap: 6 }}>
                  <input className="input" value={cmr} onChange={e => setCmr(e.target.value)} placeholder="CMR-2026-00412" />
                  <button className="btn btn-outline" onClick={saveCmr} disabled={cmrSaving} aria-label={t('common.save')}>
                    {cmrSaving ? <Loader2 size={14} style={{ animation: 'spin .7s linear infinite' }} /> : <Send size={14} />}
                  </button>
                </div>
              </Field>
              <Field label={t('driver.pod')}>
                <div className="input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
                  <span className="small muted">{trip.podReceived ? `${trip.podNumber ?? '—'}` : t('driver.pod_missing')}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setPod({ number: trip.podNumber ?? '', remarks: '' }); setPodOpen(true) }}>{trip.podReceived ? t('common.edit') : t('driver.add_pod')}</button>
                </div>
              </Field>
            </div>
          </Card>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('driver.timeline')} subtitle={t('driver.timeline_sub')}>
            {!trip.statusHistory?.length ? <p className="small muted">{t('trip.no_history')}</p> : (
              <div className="timeline">
                {[...trip.statusHistory].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map(h => (
                  <div className={`timeline-item ${h.status === trip.status ? 'current' : 'done'}`} key={h.id}>
                    <span className="timeline-dot" />
                    <div className="t">{t(`status.${h.status}`, h.status)}</div>
                    {h.remarks && <div className="m">{h.remarks}</div>}
                    <div className="when">{formatDateTime(h.changedAt, i18n.language)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('driver.contacts')}>
            <div className="list">
              <div className="list-row">
                <div className="avatar orange">{user?.fullName?.[0] ?? 'D'}</div>
                <div className="grow"><div className="t">{t('driver.you')}</div><div className="s">{user?.fullName}</div></div>
                <User size={15} className="faint" />
              </div>
              <div className="list-row">
                <div className="grow"><div className="t">{t('driver.vehicle')}</div><div className="s">{trip.vehicle?.registrationNumber ?? '—'} · {trip.vehicle?.type ?? ''}</div></div>
                <Truck size={15} className="faint" />
              </div>
              <div className="list-row">
                <div className="grow"><div className="t">{t('driver.support')}</div><div className="s">{t('driver.support_sub')}</div></div>
                <Link className="btn btn-ghost btn-sm" to="/driver/support"><ArrowRight size={13} /></Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={podOpen}
        onClose={() => setPodOpen(false)}
        title={t('driver.pod_title')}
        description={t('driver.pod_text')}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setPodOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" type="submit" form="pod-form" disabled={busy || !pod.number.trim()}>
              {busy ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <FileText size={15} />}
              {t('driver.pod_submit')}
            </button>
          </>
        }
      >
        <form id="pod-form" onSubmit={submitPod}>
          <Field label={t('driver.pod_number')} required>
            <input className="input" value={pod.number} onChange={e => setPod(p => ({ ...p, number: e.target.value }))} placeholder="POD-88412" required autoFocus />
          </Field>
          <Field label={t('driver.pod_remarks')}>
            <textarea className="textarea" value={pod.remarks} onChange={e => setPod(p => ({ ...p, remarks: e.target.value }))} placeholder={t('driver.pod_remarks_placeholder')} />
          </Field>
        </form>
      </Modal>
    </div>
  )
}

