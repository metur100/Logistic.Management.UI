

// ── Types ──────────────────────────────────────────────────

import api from "../axios"

export interface DriverTrip {
  id: number
  tripNumber: string
  originLocation: string
  destinationLocation: string
  status: string
  distanceKm: number | null
  plannedDepartureDate: string | null
  expectedArrivalDate: string | null
  remarks: string | null
  vehicleRegistration: string | null
}

export interface DriverStats {
  totalTrips: number
  completedTrips: number
  inProgressTrips: number
  totalDistanceKm: number
}

export interface DriverActiveTrip {
  id: number
  originLocation: string
  destinationLocation: string
  status: string
  distanceKm: number | null
  vehicleRegistration: string | null
}

export interface TripDetail {
  id: number
  tripNumber: string
  originLocation: string
  destinationLocation: string
  status: string
  distanceKm: number | null
  plannedDepartureDate: string | null
  expectedArrivalDate: string | null
  actualDepartureDate: string | null
  actualArrivalDate: string | null
  remarks: string | null
  podNumber: string | null
  podReceived: boolean
  loadingArrivalTime: string | null
  loadingEndTime: string | null
  unloadingArrivalTime: string | null
  unloadingEndTime: string | null
  vehicle: { registrationNo: string } | null
  cargoItems: CargoItem[]
  statusHistory: StatusHistoryEntry[]
  fuelRequests: FuelRequest[]
}

export interface CargoItem {
  id: number
  description: string
  weightTons: number | null
  consignee: string | null
  type: string | null
  specialInstructions: string | null
}

export interface StatusHistoryEntry {
  id: number
  status: string
  remarks: string | null
  changedAt: string
}

export interface FuelRequest {
  id: number
  litersRequested: number
  status: string
  remarks: string | null
  requestedAt: string
  managerNote: string | null
  tripRoute: string | null
}

export interface CreateFuelRequestPayload {
  tripId: number | null
  litersRequested: number
  remarks: string
  pumpName: string
  route: string
}

export interface UpdateTripStatusPayload {
  status: TripStatus
  remarks: string
}

export interface SubmitPodPayload {
  podNumber: string
  remarks: string
  loadingArrivalTime: string | null
  loadingEndTime: string | null
  unloadingArrivalTime: string | null
  unloadingEndTime: string | null
}

// ── Constants ──────────────────────────────────────────────

export type TripStatus =
  | 'Assigned'
  | 'CargoLoading'
  | 'LoadingComplete'
  | 'InTransit'
  | 'NearDestination'
  | 'Unloading'
  | 'DeliveryCompleted'
  | 'Cancelled'

export const ACTIVE_STATUSES: TripStatus[] = [
  'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading'
]

export const ALL_STATUSES: TripStatus[] = [
  'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading',
  'DeliveryCompleted', 'Cancelled'
]

// next status the driver can transition to, keyed by current status
export const STATUS_FLOW: Record<TripStatus, { next: TripStatus; label: string; emoji: string } | null> = {
  Assigned:          { next: 'CargoLoading',      label: 'start_loading',     emoji: '📦' },
  CargoLoading:      { next: 'LoadingComplete',   label: 'loading_complete',  emoji: '✅' },
  LoadingComplete:   { next: 'InTransit',         label: 'start_transit',     emoji: '🚀' },
  InTransit:         { next: 'NearDestination',   label: 'near_destination',  emoji: '📍' },
  NearDestination:   { next: 'Unloading',         label: 'start_unloading',   emoji: '📤' },
  Unloading:         { next: 'DeliveryCompleted', label: 'complete_delivery', emoji: '🏁' },
  DeliveryCompleted: null,
  Cancelled:         null,
}

export const STATUS_COLORS: Record<string, string> = {
  Assigned:          '#6b7280',
  CargoLoading:      '#d97706',
  LoadingComplete:   '#f59e0b',
  InTransit:         '#2563eb',
  NearDestination:   '#7c3aed',
  Unloading:         '#0891b2',
  DeliveryCompleted: '#16a34a',
  Cancelled:         '#dc2626',
  // Fuel request statuses
  Pending:   '#d97706',
  Approved:  '#16a34a',
  Rejected:  '#dc2626',
  Fulfilled: '#2563eb',
}

export const STATUS_LABELS: Record<string, { en: string; bs: string }> = {
  Assigned:          { en: 'Assigned',          bs: 'Dodijeljeno'      },
  CargoLoading:      { en: 'Cargo Loading',     bs: 'Utovar tereta'    },
  LoadingComplete:   { en: 'Loading Complete',  bs: 'Utovar završen'   },
  InTransit:         { en: 'In Transit',        bs: 'U prijevozu'      },
  NearDestination:   { en: 'Near Destination',  bs: 'Blizu odredišta'  },
  Unloading:         { en: 'Unloading',         bs: 'Istovar'          },
  DeliveryCompleted: { en: 'Delivered',         bs: 'Dostavljeno'      },
  Cancelled:         { en: 'Cancelled',         bs: 'Otkazano'         },
}

// ── API calls ──────────────────────────────────────────────

/** GET /trips/my-trips */
export const getMyTrips = (status?: string): Promise<DriverTrip[]> =>
  api.get('/trips/my-trips', { params: status ? { status } : {} }).then(r => r.data)

/** GET /trips/my-stats */
export const getMyStats = (): Promise<DriverStats> =>
  api.get('/trips/my-stats').then(r => r.data)

/** GET /trips/my-active */
export const getMyActiveTrip = (): Promise<DriverActiveTrip | null> =>
  api.get('/trips/my-active').then(r => r.data)

/** GET /trips/:id */
export const getTripById = (id: number): Promise<TripDetail> =>
  api.get(`/trips/${id}`).then(r => r.data)

/** PUT /trips/:id/status  (matches your [HttpPut("{id}/status")] endpoint) */
export const updateTripStatus = (id: number, payload: UpdateTripStatusPayload): Promise<void> =>
  api.put(`/trips/${id}/status`, payload)

/** PUT /trips/:id/pod */
export const submitPod = (id: number, payload: SubmitPodPayload): Promise<void> =>
  api.put(`/trips/${id}/pod`, payload)

/** GET /fuel-requests/my-requests */
export const getMyFuelRequests = (): Promise<FuelRequest[]> =>
  api.get('/fuel-requests/my-requests').then(r => r.data)

/** POST /fuel-requests */
export const createFuelRequest = (payload: CreateFuelRequestPayload): Promise<void> =>
  api.post('/fuel-requests', payload)
