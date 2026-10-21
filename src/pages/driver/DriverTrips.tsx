import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Route, Search, Truck } from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Trip } from '../../lib/types'
import { isActiveStatus } from '../../lib/status'
import {
  Card, EmptyState, PageHeader, PageLoader, SearchInput, Segmented, Stat,
} from '../../components/ui'
import { TripRow } from '../../components/TripRow'

export default function DriverTrips() {
  const { t } = useTranslation()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')

  useEffect(() => {
    api.get<Trip[]>('/trips')
      .then(r => setTrips(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => ({
    active: trips.filter(t => isActiveStatus(t.status)).length,
    done: trips.filter(t => t.status === 'DeliveryCompleted').length,
    km: Math.round(trips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0)),
  }), [trips])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trips.filter(trip => {
      if (filter === 'active' && !isActiveStatus(trip.status)) return false
      if (filter === 'done' && trip.status !== 'DeliveryCompleted') return false
      if (!q) return true
      return [trip.tripNumber, trip.originLocation, trip.destinationLocation, trip.vehicle?.registrationNumber]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    })
  }, [trips, filter, search])

  return (
    <div className="page">
      <PageHeader eyebrow={t('driver.trips_eyebrow')} title={t('driver.trips_title')} description={t('driver.trips_sub')} />

      <div className="stat-grid cols-3">
        <Stat icon={Route} tone="orange" label={t('driver.active')} value={stats.active} />
        <Stat icon={CheckCircle2} tone="green" label={t('driver.completed')} value={stats.done} />
        <Stat icon={Truck} tone="blue" label={t('driver.distance_done')} value={`${stats.km} km`} />
      </div>

      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'active', label: t('driver.active') },
            { value: 'done', label: t('driver.completed') },
          ]}
        />
        <div className="spacer" />
        <SearchInput value={search} onChange={setSearch} placeholder={t('trips.search')} />
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : (
        <Card>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title={t('trips.empty')} text={t('trips.empty_text')} />
          ) : (
            <div className="trip-list">
              {filtered.map(trip => <TripRow key={trip.id} trip={trip} href={`/driver/trips/${trip.id}`} driverView />)}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

