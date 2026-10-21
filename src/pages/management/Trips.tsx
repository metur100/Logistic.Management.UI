import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Filter, Plus, Route, Search } from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Trip } from '../../lib/types'
import { TRIP_STATUSES, isActiveStatus } from '../../lib/status'
import {
  EmptyState, PageHeader, PageLoader, SearchInput, Segmented, Stat,
} from '../../components/ui'
import { TripRow } from '../../components/TripRow'

export default function Trips() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState<'all' | 'active' | 'done' | 'cancelled'>('all')
  const [status, setStatus] = useState('All')

  useEffect(() => {
    let active = true
    api.get<Trip[]>('/trips')
      .then(r => { if (active) setTrips(r.data) })
      .catch(err => { if (active) setError(apiError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const counts = useMemo(() => ({
    active: trips.filter(t => isActiveStatus(t.status)).length,
    delivered: trips.filter(t => t.status === 'DeliveryCompleted').length,
    cancelled: trips.filter(t => t.status === 'Cancelled').length,
  }), [trips])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trips.filter(trip => {
      if (group === 'active' && !isActiveStatus(trip.status)) return false
      if (group === 'done' && trip.status !== 'DeliveryCompleted') return false
      if (group === 'cancelled' && trip.status !== 'Cancelled') return false
      if (status !== 'All' && trip.status !== status) return false
      if (!q) return true
      return [trip.tripNumber, trip.originLocation, trip.destinationLocation, trip.driver?.fullName, trip.vehicle?.registrationNumber]
        .filter(Boolean).some(value => String(value).toLowerCase().includes(q))
    })
  }, [trips, group, status, search])

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('trips.eyebrow')}
        title={t('trips.title')}
        description={t('trips.subtitle')}
        actions={<button className="btn btn-primary" onClick={() => nav('/management/trips/new')}><Plus /> {t('trips.new')}</button>}
      />

      <div className="stat-grid cols-3">
        <Stat icon={Route} tone="orange" label={t('trips.active')} value={counts.active} />
        <Stat icon={Route} tone="green" label={t('trips.delivered')} value={counts.delivered} />
        <Stat icon={Route} label={t('trips.cancelled')} value={counts.cancelled} />
      </div>

      <div className="toolbar">
        <Segmented
          value={group}
          onChange={setGroup}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'active', label: t('trips.active') },
            { value: 'done', label: t('trips.delivered') },
            { value: 'cancelled', label: t('trips.cancelled') },
          ]}
        />
        <div className="spacer" />
        <SearchInput value={search} onChange={setSearch} placeholder={t('trips.search')} />
        <select className="select filter-select" value={status} onChange={e => setStatus(e.target.value)} aria-label={t('trips.filter_status')}>
          <option value="All">{t('trips.all_statuses')}</option>
          {TRIP_STATUSES.map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : (
        <div className="card">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Route}
              title={t('trips.empty')}
              text={t('trips.empty_text')}
              action={<button className="btn btn-outline btn-sm" onClick={() => nav('/management/trips/new')}><Plus /> {t('trips.new')}</button>}
            />
          ) : (
            <div className="trip-list">
              {filtered.map(trip => <TripRow key={trip.id} trip={trip} href={`/management/trips/${trip.id}`} />)}
            </div>
          )}
        </div>
      )}

      <div className="row mt-2 faint tiny" style={{ gap: 6 }}>
        <Filter size={12} /> {filtered.length} {t('trips.shown')}
        <Search size={12} style={{ marginLeft: 8 }} /> {t('trips.search_hint')}
      </div>
    </div>
  )
}

