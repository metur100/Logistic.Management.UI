import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  AlertTriangle, ArrowRight, CalendarDays, ChevronRight, Clock, MessageSquare,
  Navigation, Package, Route, ShieldAlert, Truck, User,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import type { Trip } from '../../lib/types'
import { formatDateTime, formatDistance, formatTons, mapsUrl, shortPlace, todayLabel } from '../../lib/format'
import {
  Badge, Card, EmptyState, PageHeader, PageLoader, Stat, StatusBadge,
} from '../../components/ui'
import { RouteLine } from '../../components/TripRow'

interface DriverStats {
  totalTrips: number
  completedTrips: number
  inProgressTrips: number
  totalDistanceKm: number
}

interface ActiveTrip {
  id: number
  originLocation: string
  destinationLocation: string
  status: string
  distanceKm?: number
  plannedDepartureDate?: string
  expectedArrivalDate?: string
  vehicleRegistration?: string
  cargoCount: number
  totalWeightTons: number
}

export default function DriverHome() {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [stats, setStats] = useState<DriverStats | null>(null)
  const [active, setActive] = useState<ActiveTrip | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get<DriverStats>('/trips/my-stats'),
      api.get<ActiveTrip | null>('/trips/my-active'),
      api.get<Trip[]>('/trips/my-trips'),
    ]).then(([s, a, tr]) => {
      setStats(s.data)
      setActive(a.data)
      setTrips(tr.data)
    }).catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false))
  }, [])

  const start = async () => {
    if (!active) return
    window.open(mapsUrl(active.originLocation, active.destinationLocation), '_blank', 'noopener')
    setStarting(true)
    try {
      await api.post(`/trips/${active.id}/start`)
      toast.success(t('driver.route_started'))
      const { data } = await api.get<ActiveTrip | null>('/trips/my-active')
      setActive(data)
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <PageLoader />

  const upcoming = trips
    .filter(tr => tr.status === 'Assigned')
    .sort((a, b) => new Date(a.plannedDepartureDate ?? a.createdAt).getTime() - new Date(b.plannedDepartureDate ?? b.createdAt).getTime())
    .slice(0, 4)

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${t('driver.portal')} · ${todayLabel(i18n.language)}`}
        title={t('driver.hello', { name: user?.fullName?.split(' ')[0] ?? '' })}
        description={t('driver.home_sub')}
        actions={<Link className="btn btn-outline" to="/driver/calendar"><CalendarDays /> {t('nav.calendar')}</Link>}
      />

      {active ? (
        <section className="driver-hero">
          <div className="eyebrow">{t('driver.active_trip')}</div>
          <h2>{active.originLocation.split(',')[0]} → {active.destinationLocation.split(',')[0]}</h2>
          <div className="route"><Route size={16} /> {active.vehicleRegistration ?? t('common.no_vehicle')} · {formatDistance(active.distanceKm, i18n.language)}</div>
          <div className="meta">
            <span><Badge tone="orange">{t(`status.${active.status}`, active.status)}</Badge></span>
            <span><Clock size={12} style={{ display: 'inline', verticalAlign: -2 }} /> {formatDateTime(active.expectedArrivalDate, i18n.language)}</span>
            <span><Package size={12} style={{ display: 'inline', verticalAlign: -2 }} /> {active.cargoCount} {t('common.items', { count: active.cargoCount })} · {formatTons(active.totalWeightTons)}</span>
          </div>
          <div className="actions">
            <button className="btn btn-accent" onClick={start} disabled={starting}>
              <Navigation size={16} /> {starting ? t('driver.starting') : t('driver.start_route')}
            </button>
            <button className="btn btn-outline" onClick={() => nav(`/driver/trips/${active.id}`)}>
              {t('driver.view_trip')} <ArrowRight size={15} />
            </button>
            <button className="btn btn-outline" onClick={() => nav('/driver/messages')}>
              <MessageSquare size={15} /> {t('nav.messages')}
            </button>
          </div>
        </section>
      ) : (
        <Card className="mb-3">
          <EmptyState
            icon={Route}
            title={t('driver.no_active')}
            text={t('driver.no_active_text')}
            action={<Link className="btn btn-outline btn-sm" to="/driver/trips">{t('nav.my_transports')} <ArrowRight size={14} /></Link>}
          />
        </Card>
      )}

      {stats && (
        <div className="stat-grid">
          <Stat icon={Route} tone="orange" label={t('driver.total_trips')} value={stats.totalTrips} />
          <Stat icon={ShieldAlert} tone="green" label={t('driver.completed')} value={stats.completedTrips} />
          <Stat icon={Truck} tone="blue" label={t('driver.in_progress')} value={stats.inProgressTrips} />
          <Stat icon={Navigation} tone="violet" label={t('driver.total_distance')} value={`${Math.round(stats.totalDistanceKm)} km`} />
        </div>
      )}

      <div className="grid grid-2">
        <Card title={t('driver.next_transports')} subtitle={t('driver.next_transports_sub')} actions={<Link to="/driver/trips" className="btn btn-ghost btn-sm">{t('common.view_all')} <ArrowRight size={13} /></Link>}>
          {upcoming.length === 0 ? (
            <p className="small muted">{t('driver.no_upcoming')}</p>
          ) : (
            <div className="list">
              {upcoming.map(trip => (
                <Link key={trip.id} to={`/driver/trips/${trip.id}`} className="list-row" style={{ padding: '12px 0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <CalendarDays size={15} className="muted" />
                  </div>
                  <div className="grow">
                    <div className="t"><RouteLine origin={shortPlace(trip.originLocation)} destination={shortPlace(trip.destinationLocation)} /></div>
                    <div className="s">{formatDateTime(trip.plannedDepartureDate, i18n.language)} · {trip.vehicle?.registrationNumber ?? '—'}</div>
                  </div>
                  <StatusBadge status={trip.status} />
                  <ChevronRight size={14} className="faint" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('driver.quick_actions')}>
            <div className="quick-grid">
              <Link className="quick-tile" to="/driver/trips">
                <span className="icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}><Route /></span>
                <span><span className="t">{t('nav.my_transports')}</span><span className="s">{t('driver.quick_trips')}</span></span>
              </Link>
              <Link className="quick-tile" to="/driver/messages">
                <span className="icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}><MessageSquare /></span>
                <span><span className="t">{t('nav.messages')}</span><span className="s">{t('driver.quick_messages')}</span></span>
              </Link>
              <Link className="quick-tile" to="/driver/incidents">
                <span className="icon" style={{ background: 'var(--red-soft)', color: 'var(--red)' }}><AlertTriangle /></span>
                <span><span className="t">{t('nav.incidents')}</span><span className="s">{t('driver.quick_incidents')}</span></span>
              </Link>
              <Link className="quick-tile" to="/driver/support">
                <span className="icon" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}><User /></span>
                <span><span className="t">{t('nav.support')}</span><span className="s">{t('driver.quick_support')}</span></span>
              </Link>
            </div>
          </Card>

          {active && (
            <Card title={t('driver.trip_progress')} subtitle={t('driver.trip_progress_sub')}>
              <div className="list">
                <div className="list-row"><div className="grow"><div className="t">{t('driver.last_status')}</div><div className="s">{formatDateTime(active.plannedDepartureDate, i18n.language)}</div></div><Badge tone="orange">{t(`status.${active.status}`, active.status)}</Badge></div>
                <div className="list-row"><div className="grow"><div className="t">{t('driver.eta')}</div><div className="s">{formatDateTime(active.expectedArrivalDate, i18n.language)}</div></div><Clock size={15} className="faint" /></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

