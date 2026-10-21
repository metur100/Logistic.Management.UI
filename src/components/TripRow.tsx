import { Link } from 'react-router-dom'
import { ChevronRight, Package, Route, Truck, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Trip } from '../lib/types'
import { formatDate, formatDistance, formatNumber, shortPlace } from '../lib/format'
import { StatusBadge } from './ui'

export function RouteLine({
  origin,
  destination,
  light = false,
}: {
  origin: string
  destination: string
  light?: boolean
}) {
  return (
    <div className="route-line" style={light ? { color: '#fff' } : undefined}>
      <span className="place">{origin}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 12h14M13 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="place">{destination}</span>
    </div>
  )
}

export function TripRow({ trip, href, driverView = false }: { trip: Trip; href: string; driverView?: boolean }) {
  const { t, i18n } = useTranslation()
  const distance = formatDistance(trip.distanceKm, i18n.language)
  return (
    <Link className="trip-item" to={href}>
      <div className="id">
        <div className="mono">{trip.tripNumber}</div>
        <div className="date">{formatDate(trip.plannedDepartureDate ?? trip.createdAt, i18n.language)}</div>
      </div>
      <div>
        <RouteLine origin={shortPlace(trip.originLocation)} destination={shortPlace(trip.destinationLocation)} />
        <div className="route-sub">
          {!driverView && trip.driver && <span><User /> {trip.driver.fullName}</span>}
          {trip.vehicle && <span><Truck /> {trip.vehicle.registrationNumber}</span>}
          {trip.cargoItems?.length > 0 && <span><Package /> {trip.cargoItems.length} {t('common.items')}</span>}
          {trip.distanceKm ? <span><Route /> {distance}</span> : null}
        </div>
      </div>
      <div className="side">
        <StatusBadge status={trip.status} />
        <div className="small">{formatNumber(trip.cargoItems?.reduce((sum, c) => sum + (c.weightTons ?? 0), 0), 1)} t</div>
      </div>
      <div className="chev"><ChevronRight /></div>
    </Link>
  )
}
