import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ArrowRight, CircleSlash, Copy, ExternalLink, Navigation, Package, Pencil,
  Route as RouteIcon, Truck, User,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Trip } from '../../lib/types'
import { formatDateTime, formatDistance, formatNumber, formatTons, mapsUrl } from '../../lib/format'
import { TRIP_FLOW, tripProgress } from '../../lib/status'
import {
  Card, ConfirmDialog, EmptyState, PageHeader, PageLoader, StatusBadge,
} from '../../components/ui'
import DocumentUpload from '../../components/DocumentUpload'

export default function TripDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const load = () => {
    api.get<Trip>(`/trips/${id}`)
      .then(r => setTrip(r.data))
      .catch(err => setError(apiError(err)))
  }

  useEffect(() => { load() }, [id])

  const totalWeight = useMemo(
    () => trip?.cargoItems.reduce((sum, c) => sum + (c.weightTons ?? 0), 0) ?? 0,
    [trip],
  )

  const startRoute = async () => {
    if (!trip) return
    window.open(mapsUrl(trip.originLocation, trip.destinationLocation), '_blank', 'noopener')
    try {
      await api.post(`/trips/${trip.id}/start`)
      toast.success(t('trip.route_started'))
      load()
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  const cancelTrip = async () => {
    if (!trip) return
    setBusy(true)
    try {
      await api.put(`/trips/${trip.id}/status`, { status: 'Cancelled', remarks: t('trip.cancelled_by_management') })
      toast.success(t('trip.cancelled'))
      setConfirmCancel(false)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="page"><PageHeader back={{ to: '/management/trips', label: t('trip.back_to_trips') }} title={t('trip.not_found')} /><div className="alert error">{error}</div></div>
  if (!trip) return <PageLoader />

  const progress = tripProgress(trip.status)
  const canStart = ['Assigned', 'CargoLoading', 'LoadingComplete'].includes(trip.status)
  const canCancel = !['DeliveryCompleted', 'Cancelled'].includes(trip.status)

  return (
    <div className="page">
      <PageHeader
        back={{ to: '/management/trips', label: t('trip.back_to_trips') }}
        eyebrow={`${t('trip.eyebrow')} · ${trip.tripNumber}`}
        title={t('trip.detail_title')}
        description={`${trip.originLocation.split(',')[0]} → ${trip.destinationLocation.split(',')[0]}`}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => window.open(mapsUrl(trip.originLocation, trip.destinationLocation), '_blank', 'noopener')}><ExternalLink /> {t('trip.open_maps')}</button>
            <Link className="btn btn-primary" to={`/management/trips/${trip.id}/edit`}><Pencil /> {t('common.edit')}</Link>
          </>
        }
      />

      <section className="trip-hero">
        <div className="hero-top">
          <div>
            <div className="eyebrow">{trip.tripNumber} · {formatDateTime(trip.plannedDepartureDate, i18n.language)}</div>
            <div className="hero-route">
              <h1>{trip.originLocation.split(',')[0]}</h1>
              <span className="arrow"><ArrowRight /></span>
              <h1>{trip.destinationLocation.split(',')[0]}</h1>
            </div>
            <div className="hero-meta">
              <span><User size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{trip.driver?.fullName ?? t('common.unassigned')}</b></span>
              <span><Truck size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{trip.vehicle?.registrationNumber ?? '—'}</b></span>
              <span><RouteIcon size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{formatDistance(trip.distanceKm, i18n.language)}</b></span>
              <span><Package size={13} style={{ display: 'inline', verticalAlign: -2 }} /> <b>{trip.cargoItems.length} {t('common.items', { count: trip.cargoItems.length })}</b> · {formatTons(totalWeight)}</span>
            </div>
          </div>
          <div><StatusBadge status={trip.status} /></div>
        </div>
        <div className="hero-actions">
          {canStart && <button className="btn btn-accent" onClick={startRoute}><Navigation /> {t('trip.start_route')}</button>}
          {canCancel && <button className="btn btn-outline" onClick={() => setConfirmCancel(true)}><CircleSlash /> {t('trip.cancel_transport')}</button>}
          <Link className="btn btn-outline" to={`/management/trips/${trip.id}/edit`}><Pencil /> {t('common.edit')}</Link>
        </div>
      </section>

      <div className="steps-caption">{t('trip.step_caption', { current: progress + 1, total: 8, status: t(`status.${trip.status}`) })}</div>
      <div className="steps mb-3">
        {TRIP_FLOW.map((step, index) => (
          <div key={step} className={`step ${index < progress ? 'done' : ''} ${index === progress && trip.status !== 'Cancelled' ? 'current' : ''}`}>
            <div className="bar" />
            <div className="lbl">{t(`status.${step}`)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('trip.route_and_schedule')} subtitle={t('trip.route_schedule_sub')}>
            <div className="info-grid">
              <div className="info-item"><div className="k">{t('trip.origin')}</div><div className="v">{trip.originLocation}</div></div>
              <div className="info-item"><div className="k">{t('trip.destination')}</div><div className="v">{trip.destinationLocation}</div></div>
              <div className="info-item"><div className="k">{t('trip.distance')}</div><div className="v num">{formatDistance(trip.distanceKm, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.duration')}</div><div className="v num">{trip.estimatedDurationMinutes ? `${trip.estimatedDurationMinutes} min` : '—'}</div></div>
              <div className="info-item"><div className="k">{t('trip.planned_departure')}</div><div className="v">{formatDateTime(trip.plannedDepartureDate, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.expected_arrival')}</div><div className="v">{formatDateTime(trip.expectedArrivalDate, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.actual_departure')}</div><div className="v sub">{formatDateTime(trip.actualDepartureDate, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.actual_arrival')}</div><div className="v sub">{formatDateTime(trip.actualArrivalDate, i18n.language)}</div></div>
            </div>
            <div className="divider" />
            <div className="info-grid three">
              <div className="info-item"><div className="k">{t('trip.loading_start')}</div><div className="v sub">{formatDateTime(trip.loadingArrivalTime, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.loading_end')}</div><div className="v sub">{formatDateTime(trip.loadingEndTime, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.unloading_start')}</div><div className="v sub">{formatDateTime(trip.unloadingArrivalTime, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.unloading_end')}</div><div className="v sub">{formatDateTime(trip.unloadingEndTime, i18n.language)}</div></div>
              <div className="info-item"><div className="k">{t('trip.cmr')}</div><div className="v sub">{trip.cmrNumber ?? '—'}</div></div>
              <div className="info-item"><div className="k">{t('trip.pod')}</div><div className="v sub">{trip.podReceived ? `${t('trip.received')} · ${trip.podNumber ?? '—'}` : t('trip.not_received')}</div></div>
            </div>
          </Card>

          <Card title={t('trip.cargo_items')} subtitle={`${trip.cargoItems.length} ${t('common.items', { count: trip.cargoItems.length })} · ${formatTons(totalWeight)}`}>
            {trip.cargoItems.length === 0 ? (
              <EmptyState icon={Package} title={t('trip.no_cargo')} />
            ) : (
              <div>
                {trip.cargoItems.map(item => (
                  <div className="cargo-row" key={item.id}>
                    <div className="icon"><Package /></div>
                    <div className="grow">
                      <div className="t">{item.description}</div>
                      <div className="s">{item.consignor ?? '—'} → {item.consignee ?? '—'} {item.cargoType ? `· ${t(`cargo_type.${item.cargoType.toLowerCase()}`, item.cargoType)}` : ''}</div>
                      {item.specialInstructions && <div className="s" style={{ color: 'var(--amber)' }}>{item.specialInstructions}</div>}
                    </div>
                    <div className="w">{formatTons(item.weightTons)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('trip.documents')} subtitle={t('trip.documents_sub')}>
            <DocumentUpload
              tripId={trip.id}
              type="cmr"
              title={t('trip.cmr_image')}
              url={trip.cmrImageUrl}
              thumbUrl={trip.cmrImageThumbUrl}
              onChanged={load}
            />
            <DocumentUpload
              tripId={trip.id}
              type="delivery-note"
              title={t('trip.delivery_note_image')}
              url={trip.deliveryNoteImageUrl}
              thumbUrl={trip.deliveryNoteImageThumbUrl}
              onChanged={load}
            />
          </Card>

          {trip.remarks && (
            <Card title={t('trip.notes')} subtitle={t('trip.notes_sub')}>
              <p className="small" style={{ lineHeight: 1.65 }}>{trip.remarks}</p>
            </Card>
          )}
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('trip.assignment')}>
            <div className="list">
              <div className="list-row">
                <div className="avatar orange">{trip.driver?.fullName?.[0]?.toUpperCase() ?? '—'}</div>
                <div className="grow">
                  <div className="t">{trip.driver?.fullName ?? t('trip.no_driver')}</div>
                  <div className="s">{trip.driver?.phone ?? trip.driver?.email ?? t('trip.driver_unassigned')}</div>
                </div>
                <User size={15} className="faint" />
              </div>
              <div className="list-row">
                <div className="icon" style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}><Truck size={16} className="muted" /></div>
                <div className="grow">
                  <div className="t">{trip.vehicle?.registrationNumber ?? t('trip.no_vehicle')}</div>
                  <div className="s">{trip.vehicle?.type ? t(`vehicle_type.${trip.vehicle.type.toLowerCase().replace(' ', '_')}`, trip.vehicle.type) : '—'} {trip.vehicle?.capacity ? `· ${formatNumber(trip.vehicle.capacity, 0)} t` : ''}</div>
                </div>
              </div>
            </div>
            <div className="divider" />
            <div className="row between">
              <span className="small muted">{t('trip.number')}</span>
              <div className="row" style={{ gap: 6 }}>
                <span className="mono small">{trip.tripNumber}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => { navigator.clipboard.writeText(trip.tripNumber); toast.success(t('common.copied')) }} aria-label={t('common.copy')}><Copy size={14} /></button>
              </div>
            </div>
          </Card>

          <Card title={t('trip.status_history')} subtitle={t('trip.status_history_sub')}>
            {!trip.statusHistory?.length ? (
              <p className="small muted">{t('trip.no_history')}</p>
            ) : (
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
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelTrip}
        busy={busy}
        danger
        title={t('trip.cancel_confirm_title')}
        text={t('trip.cancel_confirm_text')}
        confirmLabel={t('trip.cancel_transport')}
      />
    </div>
  )
}
