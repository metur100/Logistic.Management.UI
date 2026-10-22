import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  AlertTriangle, Building2, CheckCircle2, Gauge, LifeBuoy, Mail, MapPin, Package,
  Phone, Route, ShieldCheck, ShieldOff, Truck, Users,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { CompanyDetail } from '../../lib/types'
import { formatDate, formatDateTime, formatDistance, formatNumber, formatTons, lastMonthKeys, monthLabel } from '../../lib/format'
import {
  Badge, Card, ConfirmDialog, DataTable, EmptyState, PageHeader, PageLoader, Stat,
  type Column,
} from '../../components/ui'

export default function CompanyDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<CompanyDetail | null>(null)
  const [error, setError] = useState('')
  const [action, setAction] = useState<'suspend' | 'activate' | 'verify' | 'unverify' | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    api.get<CompanyDetail>(`/admin/companies/${id}`)
      .then(r => setData(r.data))
      .catch(err => setError(apiError(err)))
  }
  useEffect(load, [id])

  const maxMonth = useMemo(() => Math.max(1, ...(data?.monthly.map(m => m.total) ?? [1])), [data])
  const monthSeries = useMemo(() => lastMonthKeys(6).map(key => data?.monthly.find(m => m.monthKey === key) ?? { monthKey: key, total: 0, delivered: 0 }), [data])

  const runAction = async () => {
    if (!action) return
    setBusy(true)
    try {
      if (action === 'suspend' || action === 'activate') {
        await api.patch(`/admin/companies/${id}/status`, { status: action === 'suspend' ? 'Suspended' : 'Active' })
      } else {
        await api.patch(`/admin/companies/${id}/verify`, { isVerified: action === 'verify' })
      }
      toast.success(t('admin.company_updated'))
      setAction(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="page"><PageHeader back={{ to: '/admin/companies', label: t('admin.back_companies') }} title={t('admin.company_not_found')} /><div className="alert error">{error}</div></div>
  if (!data) return <PageLoader />

  const { company, counts } = data

  const driverColumns: Column<CompanyDetail['drivers'][number]>[] = [
    { key: 'name', header: t('admin.driver'), label: t('admin.driver'), cell: d => <div><div className="cell-main">{d.fullName}</div><div className="cell-sub">@{d.username} · {d.email ?? '—'}</div></div> },
    { key: 'status', header: t('admin.status'), label: t('admin.status'), cell: d => <Badge tone={d.status === 'Active' ? 'green' : d.status === 'Invited' ? 'amber' : 'red'}>{t(`drivers.status_${d.status.toLowerCase()}`, d.status)}</Badge> },
    { key: 'trips', header: t('admin.trips_short'), label: t('admin.trips_short'), cell: d => <span className="mono">{d.trips}</span> },
    { key: 'login', header: t('admin.last_login'), label: t('admin.last_login'), hideOnMobile: true, cell: d => <span className="small muted">{formatDate(d.lastLoginAt, i18n.language)}</span> },
  ]

  const vehicleColumns: Column<CompanyDetail['vehicles'][number]>[] = [
    { key: 'reg', header: t('fleet.registration'), label: t('fleet.registration'), cell: v => <div><div className="cell-main">{v.registrationNumber}</div><div className="cell-sub">{v.type ? t(`vehicle_type.${v.type.toLowerCase().replace(' ', '_')}`, v.type) : '—'}</div></div> },
    { key: 'capacity', header: t('fleet.capacity'), label: t('fleet.capacity'), cell: v => <span className="mono">{v.capacity ? `${formatNumber(v.capacity, 0)} t` : '—'}</span> },
    { key: 'owner', header: t('fleet.ownership'), label: t('fleet.ownership'), hideOnMobile: true, cell: v => <span className="small">{v.ownershipType ? t(`ownership.${v.ownershipType.toLowerCase()}`, v.ownershipType) : '—'}</span> },
    { key: 'status', header: t('admin.status'), label: t('admin.status'), cell: v => <Badge tone={v.isActive ? 'green' : 'slate'}>{v.isActive ? t('common.active') : t('common.inactive')}</Badge> },
  ]

  const tripColumns: Column<CompanyDetail['recentTrips'][number]>[] = [
    { key: 'trip', header: t('admin.transport'), label: t('admin.transport'), cell: tr => <div><div className="cell-main">{tr.tripNumber}</div><div className="cell-sub">{tr.originLocation.split(',')[0]} → {tr.destinationLocation.split(',')[0]}</div></div> },
    { key: 'driver', header: t('admin.driver'), label: t('admin.driver'), hideOnMobile: true, cell: tr => <span className="small">{tr.driverName ?? '—'}</span> },
    { key: 'status', header: t('admin.status'), label: t('admin.status'), cell: tr => <Badge tone={tr.status === 'DeliveryCompleted' ? 'green' : tr.status === 'Cancelled' ? 'red' : 'amber'}>{t(`status.${tr.status}`, tr.status)}</Badge> },
    { key: 'distance', header: t('trip.distance'), label: t('trip.distance'), cell: tr => <span className="mono small">{formatDistance(tr.distanceKm, i18n.language)}</span> },
    { key: 'weight', header: t('admin.weight'), label: t('admin.weight'), hideOnMobile: true, cell: tr => <span className="mono small">{formatTons(tr.weightTons)}</span> },
  ]

  const cargoColumns: Column<CompanyDetail['cargo'][number]>[] = [
    { key: 'desc', header: t('cargo.description'), label: t('cargo.description'), cell: c => <div><div className="cell-main">{c.description}</div><div className="cell-sub">{c.consignor ?? '—'} → {c.consignee ?? '—'}</div></div> },
    { key: 'type', header: t('cargo.type'), label: t('cargo.type'), hideOnMobile: true, cell: c => <Badge tone="slate">{c.cargoType ? t(`cargo_type.${c.cargoType.toLowerCase()}`, c.cargoType) : '—'}</Badge> },
    { key: 'weight', header: t('cargo.weight'), label: t('cargo.weight'), cell: c => <span className="mono">{formatTons(c.weightTons)}</span> },
    { key: 'trip', header: t('cargo.assignment'), label: t('cargo.assignment'), cell: c => c.tripId ? <Badge tone="blue">{c.tripNumber}</Badge> : <Badge tone="amber">{t('cargo.unassigned')}</Badge> },
  ]

  return (
    <div className="page">
      <PageHeader
        back={{ to: '/admin/companies', label: t('admin.back_companies') }}
        eyebrow={t('admin.company_detail_eyebrow')}
        title={company.name}
        description={`${company.city ?? ''}${company.country ? `, ${company.country}` : ''} · ${t('admin.since')} ${formatDate(company.createdAt, i18n.language)}`}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setAction(company.isVerified ? 'unverify' : 'verify')}>
              <ShieldCheck /> {company.isVerified ? t('admin.unverify') : t('admin.verify')}
            </button>
            <button
              className={`btn ${company.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
              onClick={() => setAction(company.status === 'Active' ? 'suspend' : 'activate')}
            >
              {company.status === 'Active' ? <ShieldOff /> : <CheckCircle2 />}
              {company.status === 'Active' ? t('admin.suspend') : t('admin.activate')}
            </button>
          </>
        }
      />

      <div className="hero-strip">
        <div className="left">
          <div className="mark"><Building2 /></div>
          <div>
            <h2>{company.name}</h2>
            <p>{t('admin.read_only_company')}</p>
          </div>
        </div>
        <div className="row wrap" style={{ gap: 6 }}>
          <Badge tone={company.status === 'Active' ? 'green' : 'red'} dot>{company.status === 'Active' ? t('admin.active') : t('admin.suspended')}</Badge>
          {company.isVerified && <Badge tone="blue"><ShieldCheck size={10} /> {t('admin.verified')}</Badge>}
        </div>
      </div>

      <div className="stat-grid">
        <Stat icon={Users} tone="violet" label={t('admin.drivers')} value={counts.drivers} hint={`${counts.driversActive} ${t('admin.active')}`} />
        <Stat icon={Truck} tone="blue" label={t('admin.vehicles')} value={counts.vehicles} />
        <Stat icon={Package} tone="amber" label={t('admin.cargo')} value={counts.cargo} hint={`${formatTons(counts.cargoTons)}`} />
        <Stat icon={Route} tone="green" label={t('admin.transports')} value={counts.trips} hint={`${counts.tripsActive} ${t('admin.active')}`} />
        <Stat icon={Gauge} tone="green" label={t('admin.delivered')} value={counts.tripsDelivered} />
        <Stat icon={Package} tone="amber" label={t('admin.unassigned_cargo')} value={counts.cargoUnassigned} />
        <Stat icon={LifeBuoy} tone={counts.openTickets ? 'red' : 'slate'} label={t('admin.open_tickets')} value={counts.openTickets} />
        <Stat icon={AlertTriangle} tone={counts.openIncidents ? 'red' : 'slate'} label={t('admin.open_incidents')} value={counts.openIncidents} />
      </div>

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('admin.company_profile')} subtitle={t('admin.company_profile_sub')}>
            <div className="info-grid">
              <div className="info-item"><div className="k">{t('auth.company_name')}</div><div className="v">{company.name}</div></div>
              <div className="info-item"><div className="k">{t('settings.legal_name')}</div><div className="v sub">{company.legalName ?? '—'}</div></div>
              <div className="info-item"><div className="k">{t('settings.tax_id')}</div><div className="v sub">{company.taxId ?? '—'}</div></div>
              <div className="info-item"><div className="k">{t('settings.email')}</div><div className="v sub inline"><Mail size={12} /> {company.email ?? '—'}</div></div>
              <div className="info-item"><div className="k">{t('settings.phone')}</div><div className="v sub inline"><Phone size={12} /> {company.phone ?? '—'}</div></div>
              <div className="info-item"><div className="k">{t('settings.address')}</div><div className="v sub inline"><MapPin size={12} /> {company.address ?? '—'}</div></div>
            </div>
          </Card>

          <Card title={t('admin.transport_volume')} subtitle={t('admin.transport_volume_sub')}>
            <div className="bar-chart">
              {monthSeries.map(m => (
                <div className="bar-col" key={m.monthKey}>
                  <div className="bars">
                    <div className="bar" style={{ height: `${Math.max(3, (m.total / maxMonth) * 100)}%` }} />
                    <div className="bar b2" style={{ height: `${Math.max(2, (m.delivered / maxMonth) * 100)}%` }} />
                  </div>
                  <div className="m">{monthLabel(m.monthKey, i18n.language)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={t('admin.recent_transports')} subtitle={t('admin.recent_transports_sub')}>
            <DataTable rows={data.recentTrips} columns={tripColumns} rowKey={tr => tr.id} empty={<EmptyState icon={Route} title={t('trips.empty')} />} />
          </Card>

          <Card title={t('admin.cargo_recent')} subtitle={t('admin.cargo_recent_sub')}>
            <DataTable rows={data.cargo} columns={cargoColumns} rowKey={c => c.id} empty={<EmptyState icon={Package} title={t('cargo.empty')} />} />
          </Card>

        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('admin.team')} subtitle={`${data.drivers.length} ${t('admin.drivers_short')}`}>
            <DataTable rows={data.drivers} columns={driverColumns} rowKey={d => d.id} empty={<EmptyState icon={Users} title={t('drivers.empty')} />} />
          </Card>

          <Card title={t('admin.fleet')} subtitle={`${data.vehicles.length} ${t('admin.vehicles_short')}`}>
            <DataTable rows={data.vehicles} columns={vehicleColumns} rowKey={v => v.id} empty={<EmptyState icon={Truck} title={t('fleet.empty')} />} />
          </Card>

          <Card title={t('admin.incidents')} subtitle={t('admin.incidents_sub')}>
            {data.incidents.length === 0 ? <EmptyState icon={AlertTriangle} title={t('incidents.empty')} /> : (
              <div className="list">
                {data.incidents.map(inc => (
                  <div className="list-row" key={inc.id}>
                    <div className="grow">
                      <div className="t">{t(`incident_type.${inc.type.replace(/ /g, '_').toLowerCase()}`, inc.type)} {inc.tripNumber ? `· ${inc.tripNumber}` : ''}</div>
                      <div className="s">{inc.description}</div>
                      <div className="tiny faint mt-1">{formatDateTime(inc.reportedAt, i18n.language)} · {inc.reporterName ?? '—'}</div>
                    </div>
                    <Badge tone={inc.status === 'Open' ? 'red' : 'green'}>{t(`incidents.status_${inc.status.toLowerCase()}`, inc.status)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        busy={busy}
        danger={action === 'suspend' || action === 'unverify'}
        title={
          action === 'suspend' ? t('admin.suspend_title') : action === 'activate' ? t('admin.activate_title')
            : action === 'verify' ? t('admin.verify_title') : t('admin.unverify_title')
        }
        text={
          action === 'suspend' ? t('admin.suspend_text', { name: company.name })
            : action === 'activate' ? t('admin.activate_text', { name: company.name })
              : action === 'verify' ? t('admin.verify_text', { name: company.name }) : t('admin.unverify_text', { name: company.name })
        }
        confirmLabel={
          action === 'suspend' ? t('admin.suspend') : action === 'activate' ? t('admin.activate')
            : action === 'verify' ? t('admin.verify') : t('admin.unverify')
        }
      />
    </div>
  )
}

