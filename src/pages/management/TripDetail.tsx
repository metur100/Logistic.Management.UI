import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver {
  fullName?: string
  phone?: string
  licenseNumber?: string
}

interface Vehicle {
  registrationNumber?: string
  fleetName?: string
  type?: string
  capacity?: number
}

interface CargoItem {
  id: number
  description: string
  cargoType?: string
  weightTons?: number
  consignor?: string
  consignee?: string
  specialInstructions?: string
}

interface StatusHistory {
  id: number
  status: string
  changedAt: string
  remarks?: string
}

interface Trip {
  id: number
  tripNumber: string
  status: string
  originLocation: string
  destinationLocation: string
  distanceKm?: number
  plannedDepartureDate?: string
  expectedArrivalDate?: string
  actualDepartureDate?: string
  actualArrivalDate?: string
  podNumber?: string
  podReceived?: boolean
  remarks?: string
  loadingArrivalTime?: string
  loadingEndTime?: string
  unloadingArrivalTime?: string
  unloadingEndTime?: string
  driver?: Driver
  vehicle?: Vehicle
  cargoItems?: CargoItem[]
  statusHistory?: StatusHistory[]
}

const STATUS_COLORS: Record<string, string> = {
  Assigned: '#6366f1',
  CargoLoading: '#f59e0b',
  LoadingComplete: '#3b82f6',
  InTransit: '#8b5cf6',
  NearDestination: '#ec4899',
  Unloading: '#f97316',
  DeliveryCompleted: '#22c55e',
  Cancelled: '#ef4444'
}

interface InfoRowProps {
  label: string
  value?: string | number | null
}

function InfoRow({ label, value }: InfoRowProps) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem', flexWrap: 'wrap' }}>
      <span style={{ color: '#64748b', fontSize: '.9rem' }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: '.9rem', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function TripDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)

  const load = () =>
    api.get(`/trips/${id}`).then(r => setTrip(r.data)).catch(() => toast.error(t('failed_load')))

  useEffect(() => { load() }, [id])

  if (!trip) return <div style={{ padding: '2rem', color: '#64748b' }}>{t('loading')}</div>

  const sc = STATUS_COLORS[trip.status] || '#64748b'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button onClick={() => nav('/management/trips')} style={{ background: 'none', border: 'none', color: '#3b4fd8', cursor: 'pointer', marginBottom: '.5rem', fontSize: '.9rem' }}>
            {t('back')}
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{trip.tripNumber}</h1>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '.4rem 1rem', borderRadius: 999, fontWeight: 600, background: `${sc}20`, color: sc }}>{trip.status}</span>
          <button className="btn btn-outline" onClick={() => nav(`/management/trips/${id}/edit`)}>{t('edit')}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('trip_info')}</h3>
          <InfoRow label={t('origin_label')} value={trip.originLocation} />
          <InfoRow label={t('destination_label')} value={trip.destinationLocation} />
          <InfoRow label={t('distance')} value={trip.distanceKm ? `${trip.distanceKm} km` : null} />
          <InfoRow label={t('planned_departure_detail')} value={trip.plannedDepartureDate ? new Date(trip.plannedDepartureDate).toLocaleString() : null} />
          <InfoRow label={t('expected_arrival_detail')} value={trip.expectedArrivalDate ? new Date(trip.expectedArrivalDate).toLocaleString() : null} />
          <InfoRow label={t('actual_departure')} value={trip.actualDepartureDate ? new Date(trip.actualDepartureDate).toLocaleString() : null} />
          <InfoRow label={t('actual_arrival')} value={trip.actualArrivalDate ? new Date(trip.actualArrivalDate).toLocaleString() : null} />
          <InfoRow label={t('pod_number')} value={trip.podNumber} />
          <InfoRow label={t('pod_received')} value={trip.podReceived ? t('yes') : t('no')} />
          <InfoRow label={t('remarks')} value={trip.remarks} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('driver_vehicle')}</h3>
            <InfoRow label={t('driver')} value={trip.driver?.fullName} />
            <InfoRow label={t('driver_phone')} value={trip.driver?.phone} />
            <InfoRow label={t('license')} value={trip.driver?.licenseNumber} />
            <InfoRow label={t('vehicle')} value={trip.vehicle?.registrationNumber} />
            <InfoRow label={t('fleet')} value={trip.vehicle?.fleetName} />
            <InfoRow label={t('vehicle_type')} value={trip.vehicle?.type} />
            <InfoRow label={t('capacity')} value={trip.vehicle?.capacity ? `${trip.vehicle.capacity}t` : null} />
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('loading_times')}</h3>
            <InfoRow label={t('loading_arrival')} value={trip.loadingArrivalTime ? new Date(trip.loadingArrivalTime).toLocaleString() : null} />
            <InfoRow label={t('loading_end')} value={trip.loadingEndTime ? new Date(trip.loadingEndTime).toLocaleString() : null} />
            <InfoRow label={t('unloading_arrival')} value={trip.unloadingArrivalTime ? new Date(trip.unloadingArrivalTime).toLocaleString() : null} />
            <InfoRow label={t('unloading_end')} value={trip.unloadingEndTime ? new Date(trip.unloadingEndTime).toLocaleString() : null} />
          </div>
        </div>
      </div>

      {trip.cargoItems && trip.cargoItems.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('cargo_count', { count: trip.cargoItems.length })}</h3>
          <table>
            <thead>
              <tr>
                <th>{t('description')}</th><th>{t('type')}</th><th>{t('weight')}</th>
                <th>{t('consignor')}</th><th>{t('consignee')}</th><th>{t('instructions')}</th>
              </tr>
            </thead>
            <tbody>
              {trip.cargoItems.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.description}</td>
                  <td>{c.cargoType || '—'}</td>
                  <td>{c.weightTons ? `${c.weightTons}t` : '—'}</td>
                  <td>{c.consignor || '—'}</td>
                  <td>{c.consignee || '—'}</td>
                  <td>{c.specialInstructions || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trip.statusHistory && trip.statusHistory.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{t('status_history')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {[...trip.statusHistory].reverse().map(h => (
              <div key={h.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '.75rem', background: '#f8fafc', borderRadius: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600, background: `${STATUS_COLORS[h.status] || '#64748b'}20`, color: STATUS_COLORS[h.status] || '#64748b', whiteSpace: 'nowrap' }}>{h.status}</span>
                <div>
                  <div style={{ fontSize: '.85rem', color: '#64748b' }}>{new Date(h.changedAt).toLocaleString()}</div>
                  {h.remarks && <div style={{ fontSize: '.9rem' }}>{h.remarks}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}