import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight, ArrowUpRight, CalendarClock, ChevronRight, Gauge,
  MessageSquare, Package, PackagePlus, Plus, Route, Truck, UserPlus, Users,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import type { DashboardData } from '../../lib/types'
import { formatDateTime, formatNumber, formatTons, lastMonthKeys, monthLabel, shortPlace, todayLabel } from '../../lib/format'
import { PageHeader, Card, Stat, StatusBadge, PageLoader, EmptyState, Badge } from '../../components/ui'
import { RouteLine } from '../../components/TripRow'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get<DashboardData>('/company/dashboard')
      .then(r => { if (active) setData(r.data) })
      .catch(err => { if (active) setError(apiError(err)) })
    return () => { active = false }
  }, [])

  if (!data && !error) return <PageLoader />
  if (!data) return <div className="page"><div className="alert error">{error}</div></div>

  const { stats } = data
  const maxMonth = Math.max(1, ...data.monthly.map(m => m.total))
  const monthSeries = lastMonthKeys(6).map(key => data.monthly.find(m => m.monthKey === key) ?? { monthKey: key, total: 0, delivered: 0 })
  const fleetReady = stats.vehiclesTotal ? Math.round((stats.vehiclesAvailable / stats.vehiclesTotal) * 100) : 0

  return (
    <div className="page">
      <PageHeader
        eyebrow={`${user?.companyName ?? ''} · ${todayLabel(i18n.language)}`}
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => nav('/management/calendar')}>
              <CalendarClock /> {t('dashboard.plan')}
            </button>
            <button className="btn btn-primary" onClick={() => nav('/management/trips/new')}>
              <Plus /> {t('dashboard.new_transport')}
            </button>
          </>
        }
      />

      <div className="stat-grid">
        <Stat icon={Route} tone="orange" label={t('dashboard.active_transports')} value={stats.activeTrips} hint={t('dashboard.of_total', { count: stats.tripsTotal })} onClick={() => nav('/management/trips')} />
        <Stat icon={Gauge} tone="green" label={t('dashboard.delivered_month')} value={stats.deliveredThisMonth} hint={t('dashboard.delivered_hint')} />
        <Stat icon={Truck} tone="blue" label={t('dashboard.fleet_ready')} value={`${stats.vehiclesAvailable}/${stats.vehiclesTotal}`} hint={`${fleetReady}% ${t('dashboard.available')}`} onClick={() => nav('/management/vehicles')} />
        <Stat icon={Users} tone="violet" label={t('dashboard.drivers')} value={stats.driversActive} hint={`${stats.driversInvited} ${t('dashboard.invited')}`} onClick={() => nav('/management/drivers')} />
      </div>

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card
            title={t('dashboard.live_operations')}
            subtitle={t('dashboard.live_sub')}
            actions={<Link to="/management/trips" className="btn btn-ghost btn-sm">{t('common.view_all')} <ArrowRight size={13} /></Link>}
            bodyClass=""
          >
            {data.activeTrips.length === 0 ? (
              <EmptyState icon={Route} title={t('dashboard.no_active')} text={t('dashboard.no_active_text')} action={<button className="btn btn-outline btn-sm" onClick={() => nav('/management/trips/new')}><Plus /> {t('dashboard.new_transport')}</button>} />
            ) : (
              <div>
                {data.activeTrips.map(trip => (
                  <Link key={trip.id} to={`/management/trips/${trip.id}`} className="ops-row">
                    <div className="ops-id">
                      <div className="mono">{trip.tripNumber}</div>
                      <div className="date">{formatDateTime(trip.plannedDepartureDate, i18n.language)}</div>
                    </div>
                    <div className="ops-main">
                      <RouteLine origin={shortPlace(trip.originLocation)} destination={shortPlace(trip.destinationLocation)} />
                      <div className="route-sub">
                        {trip.driverName && <span>{trip.driverName}</span>}
                        {trip.vehicleReg && <span>{trip.vehicleReg}</span>}
                        <span>{trip.cargoCount} {t('common.items')} · {formatTons(trip.weightTons)}</span>
                      </div>
                    </div>
                    <div className="ops-status">
                      <StatusBadge status={trip.status} />
                      {trip.distanceKm ? <div className="tiny faint">{formatNumber(trip.distanceKm, 0)} km</div> : null}
                    </div>
                    <ChevronRight size={15} className="ops-chev" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-2-eq">
            <Card title={t('dashboard.upcoming')} subtitle={t('dashboard.upcoming_sub')} actions={<Link to="/management/calendar" className="btn btn-ghost btn-sm">{t('nav.calendar')} <ArrowUpRight size={13} /></Link>}>
              {data.upcoming.length === 0 ? (
                <p className="small muted">{t('dashboard.no_upcoming')}</p>
              ) : (
                <div className="list">
                  {data.upcoming.map(trip => (
                    <Link key={trip.id} to={`/management/trips/${trip.id}`} className="list-row">
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <CalendarClock size={16} className="muted" />
                      </div>
                      <div className="grow">
                        <div className="t">{trip.destinationLocation.split(',')[0]}</div>
                        <div className="s">{trip.driverName ?? t('common.unassigned')} · {formatDateTime(trip.plannedDepartureDate, i18n.language)}</div>
                      </div>
                      <ChevronRight size={14} className="faint" />
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card title={t('dashboard.this_month')} subtitle={t('dashboard.volume')}>
              <div className="bar-chart">
                {data.monthly.length === 0 && <p className="small muted">{t('dashboard.no_data')}</p>}
                {monthSeries.map(m => (
                  <div className="bar-col" key={m.monthKey} title={`${m.total} / ${m.delivered}`}>
                    <div className="bars">
                      <div className="bar" style={{ height: `${Math.max(4, (m.total / maxMonth) * 100)}%` }} />
                      <div className="bar b2" style={{ height: `${Math.max(2, (m.delivered / maxMonth) * 100)}%` }} />
                    </div>
                    <div className="m">{monthLabel(m.monthKey, i18n.language)}</div>
                  </div>
                ))}
              </div>
              <div className="bar-legend mt-2">
                <span><i style={{ background: 'var(--surface-3)' }} /> {t('dashboard.total')}</span>
                <span><i style={{ background: 'var(--ink-800)' }} /> {t('dashboard.delivered')}</span>
              </div>
              <div className="divider" />
              <div className="row between">
                <span className="small muted">{t('dashboard.pending_assignment')}</span>
                <Badge tone={stats.pending ? 'amber' : 'slate'}>{stats.pending}</Badge>
              </div>
            </Card>
          </div>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('dashboard.fleet_readiness')} subtitle={t('dashboard.fleet_sub', { count: stats.vehiclesTotal })} actions={<Link to="/management/vehicles" className="btn btn-ghost btn-sm">{t('common.manage')}</Link>}>
            <div className="row between mb-2">
              <span className="small muted">{t('dashboard.available_now')}</span>
              <span className="strong small">{fleetReady}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-3)', overflow: 'hidden' }} className="mb-3">
              <div style={{ width: `${fleetReady}%`, height: '100%', background: 'var(--green)', borderRadius: 999 }} />
            </div>
            <div className="list">
              {data.fleet.slice(0, 5).map(v => (
                <div className="list-row" key={v.id}>
                  <div className="icon" style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>
                    <Truck size={15} className="muted" />
                  </div>
                  <div className="grow">
                    <div className="t">{v.registrationNumber}</div>
                    <div className="s">{v.type ?? t('common.vehicle')} · {v.capacity ? `${formatNumber(v.capacity, 0)} t` : '—'}</div>
                  </div>
                  <Badge tone={v.onTrip ? 'amber' : 'green'} dot>{v.onTrip ? t('dashboard.on_trip') : t('dashboard.available')}</Badge>
                </div>
              ))}
              {data.fleet.length === 0 && <p className="small muted">{t('dashboard.no_fleet')}</p>}
            </div>
          </Card>

          <Card title={t('dashboard.cargo')} subtitle={t('dashboard.cargo_sub')} actions={<Link to="/management/cargo" className="btn btn-ghost btn-sm">{t('common.manage')}</Link>}>
            <div className="grid grid-2-eq" style={{ gap: 10 }}>
              <div className="card pad" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
                <Package size={17} className="muted" />
                <div className="strong mt-2" style={{ fontSize: 20 }}>{stats.unassignedCargo}</div>
                <div className="tiny muted">{t('dashboard.unassigned_cargo')}</div>
              </div>
              <div className="card pad" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
                <Route size={17} className="muted" />
                <div className="strong mt-2" style={{ fontSize: 20 }}>{formatTons(stats.tonsInTransit)}</div>
                <div className="tiny muted">{t('dashboard.tons_in_transit')}</div>
              </div>
            </div>
            <div className="list mt-2">
              <Link to="/management/incidents" className="list-row">
                <div className="grow"><div className="t">{t('dashboard.open_incidents')}</div><div className="s">{t('dashboard.open_incidents_sub')}</div></div>
                <Badge tone={stats.openIncidents ? 'red' : 'slate'}>{stats.openIncidents}</Badge>
              </Link>
              <Link to="/management/messages" className="list-row">
                <div className="grow"><div className="t">{t('dashboard.unread_messages')}</div><div className="s">{t('dashboard.unread_messages_sub')}</div></div>
                <Badge tone={stats.unreadMessages ? 'orange' : 'slate'}>{stats.unreadMessages}</Badge>
              </Link>
              <Link to="/management/cargo" className="list-row">
                <div className="grow"><div className="t">{t('dashboard.cargo_items')}</div><div className="s">{t('dashboard.cargo_items_sub')}</div></div>
                <span className="mono small">{stats.cargoTotal}</span>
              </Link>
            </div>
          </Card>

          <Card title={t('dashboard.quick_actions')}>
            <div className="quick-grid">
              <button className="quick-tile" onClick={() => nav('/management/trips/new')}>
                <span className="icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}><Plus /></span>
                <span><span className="t">{t('dashboard.new_transport')}</span><span className="s">{t('dashboard.quick_trip_sub')}</span></span>
              </button>
              <button className="quick-tile" onClick={() => nav('/management/cargo')}>
                <span className="icon" style={{ background: 'var(--amber-soft)', color: 'var(--amber)' }}><PackagePlus /></span>
                <span><span className="t">{t('dashboard.add_cargo')}</span><span className="s">{t('dashboard.quick_cargo_sub')}</span></span>
              </button>
              <button className="quick-tile" onClick={() => nav('/management/drivers')}>
                <span className="icon" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}><UserPlus /></span>
                <span><span className="t">{t('dashboard.invite_driver')}</span><span className="s">{t('dashboard.quick_driver_sub')}</span></span>
              </button>
              <button className="quick-tile" onClick={() => nav('/management/messages')}>
                <span className="icon" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}><MessageSquare /></span>
                <span><span className="t">{t('dashboard.message_drivers')}</span><span className="s">{t('dashboard.quick_message_sub')}</span></span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


