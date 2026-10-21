import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight, Building2, ChevronRight, Gauge, LifeBuoy, Package,
  Route, ShieldCheck, Truck, Users, AlertTriangle,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { AdminOverview as AdminOverviewData } from '../../lib/types'
import { formatDate, formatNumber, lastMonthKeys, monthLabel } from '../../lib/format'
import {
  Badge, Card, EmptyState, PageHeader, PageLoader, Stat,
} from '../../components/ui'

export default function AdminOverview() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [data, setData] = useState<AdminOverviewData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<AdminOverviewData>('/admin/overview')
      .then(r => setData(r.data))
      .catch(err => setError(apiError(err)))
  }, [])

  if (error) return <div className="page"><div className="alert error">{error}</div></div>
  if (!data) return <PageLoader />

  const { stats } = data
  const maxMonth = Math.max(1, ...data.monthly.map(m => m.total))
  const monthSeries = lastMonthKeys(6).map(key => data.monthly.find(m => m.monthKey === key) ?? { monthKey: key, total: 0, delivered: 0 })

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('admin.overview_eyebrow')}
        title={t('admin.overview_title')}
        description={t('admin.overview_sub')}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => nav('/admin/tickets')}><LifeBuoy /> {t('admin.support_queue')}</button>
            <button className="btn btn-primary" onClick={() => nav('/admin/companies')}><Building2 /> {t('admin.companies')}</button>
          </>
        }
      />

      <div className="hero-strip">
        <div className="left">
          <div className="mark"><ShieldCheck /></div>
          <div>
            <h2>{t('admin.platform_access')}</h2>
            <p>{t('admin.platform_access_sub')}</p>
          </div>
        </div>
        <Badge tone="violet" dot>{t('admin.read_only')}</Badge>
      </div>

      <div className="stat-grid">
        <Stat icon={Building2} tone="orange" label={t('admin.companies')} value={stats.companiesTotal} hint={`${stats.companiesActive} ${t('admin.active')}`} onClick={() => nav('/admin/companies')} />
        <Stat icon={Users} tone="violet" label={t('admin.drivers')} value={stats.drivers} hint={`${stats.managers} ${t('admin.managers')}`} onClick={() => nav('/admin/users')} />
        <Stat icon={Truck} tone="blue" label={t('admin.vehicles')} value={stats.vehicles} hint={t('admin.vehicles_hint')} />
        <Stat icon={Package} tone="amber" label={t('admin.cargo')} value={stats.cargoItems} hint={`${formatNumber(stats.cargoTons, 1)} t`} />
        <Stat icon={Route} tone="green" label={t('admin.transports')} value={stats.tripsTotal} hint={`${stats.tripsActive} ${t('admin.active')}`} />
        <Stat icon={Gauge} tone="green" label={t('admin.delivered_month')} value={stats.tripsMonth} hint={`${stats.tripsDelivered} ${t('admin.total')}`} />
        <Stat icon={LifeBuoy} tone={stats.openTickets ? 'red' : 'slate'} label={t('admin.open_tickets')} value={stats.openTickets} onClick={() => nav('/admin/tickets')} />
        <Stat icon={AlertTriangle} tone={stats.openIncidents ? 'red' : 'slate'} label={t('admin.open_incidents')} value={stats.openIncidents} hint={t('admin.incidents_hint')} />
      </div>

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('admin.platform_volume')} subtitle={t('admin.platform_volume_sub')}>
            <div className="bar-chart">
              {monthSeries.map(m => (
                <div className="bar-col" key={m.monthKey} title={`${m.total} / ${m.delivered}`}>
                  <div className="bars">
                    <div className="bar" style={{ height: `${Math.max(3, (m.total / maxMonth) * 100)}%` }} />
                    <div className="bar b2" style={{ height: `${Math.max(2, (m.delivered / maxMonth) * 100)}%` }} />
                  </div>
                  <div className="m">{monthLabel(m.monthKey, i18n.language)}</div>
                </div>
              ))}
            </div>
            <div className="bar-legend mt-2">
              <span><i style={{ background: 'var(--surface-3)' }} /> {t('admin.transports')}</span>
              <span><i style={{ background: 'var(--ink-800)' }} /> {t('admin.delivered')}</span>
            </div>
          </Card>

          <Card title={t('admin.top_companies')} subtitle={t('admin.top_companies_sub')} actions={<Link to="/admin/companies" className="btn btn-ghost btn-sm">{t('common.view_all')} <ArrowUpRight size={13} /></Link>}>
            {data.topCompanies.length === 0 ? <EmptyState icon={Building2} title={t('admin.no_companies')} /> : (
              <div className="list">
                {data.topCompanies.map(company => (
                  <Link key={company.id} to={`/admin/companies/${company.id}`} className="list-row">
                    <div className="grow">
                      <div className="t">{company.name}</div>
                      <div className="s">{company.city ?? '—'} · {company.drivers} {t('admin.drivers_short')} · {company.vehicles} {t('admin.vehicles_short')}</div>
                    </div>
                    <div className="text-right">
                      <div className="mono small">{company.trips} {t('admin.trips_short')}</div>
                      <div className="tiny faint">{company.activeTrips} {t('admin.active')}</div>
                    </div>
                    <ChevronRight size={14} className="faint" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('admin.recent_registrations')} subtitle={t('admin.recent_registrations_sub')}>
            {data.recentCompanies.length === 0 ? <p className="small muted">{t('admin.no_companies')}</p> : (
              <div className="list">
                {data.recentCompanies.map(company => (
                  <Link key={company.id} to={`/admin/companies/${company.id}`} className="list-row">
                    <div className="grow">
                      <div className="t">{company.name}</div>
                      <div className="s">{company.city ?? company.country ?? '—'} · {formatDate(company.createdAt, i18n.language)}</div>
                    </div>
                    <Badge tone={company.status === 'Active' ? 'green' : 'red'} dot>{company.status === 'Active' ? t('admin.active') : t('admin.suspended')}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('admin.recent_tickets')} subtitle={t('admin.recent_tickets_sub')} actions={<Link to="/admin/tickets" className="btn btn-ghost btn-sm">{t('admin.support_queue')} <ArrowUpRight size={13} /></Link>}>
            {data.recentTickets.length === 0 ? <p className="small muted">{t('support.empty')}</p> : (
              <div className="list">
                {data.recentTickets.map(ticket => (
                  <Link key={ticket.id} to="/admin/tickets" className="list-row">
                    <div className="grow">
                      <div className="t">{ticket.subject}</div>
                      <div className="s">{ticket.companyName ?? '—'} · {formatDate(ticket.createdAt, i18n.language)}</div>
                    </div>
                    <Badge tone={ticket.status === 'Open' ? 'red' : ticket.status === 'Resolved' ? 'green' : 'amber'}>{t(`support.status_${ticket.status}`, ticket.status)}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card title={t('admin.quick_links')}>
            <div className="quick-grid">
              <Link className="quick-tile" to="/admin/companies"><span className="icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent-dark)' }}><Building2 /></span><span><span className="t">{t('admin.companies')}</span><span className="s">{t('admin.companies_sub')}</span></span></Link>
              <Link className="quick-tile" to="/admin/users"><span className="icon" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}><Users /></span><span><span className="t">{t('admin.users')}</span><span className="s">{t('admin.users_sub')}</span></span></Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

