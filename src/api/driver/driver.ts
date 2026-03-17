

// ── Types ──────────────────────────────────────────────────

import api from "../axios"

export interface DriverTrip {
  id: number
  tripNumber: string
  originLocation: string
  destinationLocation: string
  status: string
  distanceKm?: number
  plannedDepartureDate?: string
  expectedArrivalDate?: string
  vehicleRegistration?: string
  remarks?: string
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
  remarks?: string | null
  podNumber: string | null
  podReceived: boolean
  loadingArrivalTime: string | null
  loadingEndTime: string | null
  unloadingArrivalTime: string | null
  unloadingEndTime: string | null
  vehicle: { registrationNumber: string } | null
  cargoItems: CargoItem[]
  statusHistory: StatusHistoryEntry[]
}

export interface CargoItem {
  id: number
  description: string
  weightTons?: number
  consignee?: string
  consignor?: string         
  type?: string
  specialInstructions?: string
}


export interface StatusHistoryEntry {
  id: number
  status: string
  remarks: string | null
  changedAt: string
}

export interface UpdateTripStatusPayload {
  status: TripStatus
  remarks: string
  loadingArrivalTime?: string | null
  loadingEndTime?: string | null
  unloadingArrivalTime?: string | null
  unloadingEndTime?: string | null
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
  | 'UnloadingComplete'
  | 'DeliveryCompleted'
  | 'Cancelled'

export const ACTIVE_STATUSES: TripStatus[] = [
  'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading', 'UnloadingComplete'
]

export const ALL_STATUSES: TripStatus[] = [
  'Assigned', 'CargoLoading', 'LoadingComplete',
  'InTransit', 'NearDestination', 'Unloading', 'UnloadingComplete',
  'DeliveryCompleted', 'Cancelled'
]

// Add to existing driver.ts

export interface DriverTrip {
  id: number
  tripNumber: string
  originLocation: string
  destinationLocation: string
  status: string
  distanceKm?: number
  plannedDepartureDate?: string
  expectedArrivalDate?: string
  vehicleRegistration?: string
  remarks?: string
}

// Ensure STATUS_FLOW covers all transitions
export const STATUS_FLOW: Record<string, { next: TripStatus; label: string; emoji: string }> = {
  Assigned:         { next: 'CargoLoading',      label: 'start_loading',      emoji: '📦' },
  CargoLoading:     { next: 'LoadingComplete',    label: 'loading_complete',   emoji: '✅' },
  LoadingComplete:  { next: 'InTransit',          label: 'depart',             emoji: '🚛' },
  InTransit:        { next: 'NearDestination',    label: 'near_destination',   emoji: '📍' },
  NearDestination:  { next: 'Unloading',          label: 'start_unloading',    emoji: '📤' },
  Unloading:        { next: 'UnloadingComplete',  label: 'unloading_complete', emoji: '✅' },
  UnloadingComplete: { next: 'DeliveryCompleted', label: 'complete_delivery',  emoji: '🎉' },
}

export const STATUS_LABELS: Record<string, { en: string; bs: string }> = {
  Assigned:          { en: 'Assigned',           bs: 'Dodijeljeno' },
  CargoLoading:      { en: 'Cargo Loading',      bs: 'Utovarna' },
  LoadingComplete:   { en: 'Loading Complete',   bs: 'Utovar završen' },
  InTransit:         { en: 'In Transit',         bs: 'U tranzitu' },
  NearDestination:   { en: 'Near Destination',   bs: 'Blizu odredišta' },
  Unloading:         { en: 'Unloading',          bs: 'Istovar' },
  UnloadingComplete: { en: 'Unloading Complete', bs: 'Istovar završen' },
  DeliveryCompleted: { en: 'Delivered',          bs: 'Dostavljeno' },
  Cancelled:         { en: 'Cancelled',          bs: 'Otkazano' },
}

export const STATUS_COLORS: Record<string, string> = {
  Assigned:          '#6366f1',
  CargoLoading:      '#f59e0b',
  LoadingComplete:   '#3b82f6',
  InTransit:         '#8b5cf6',
  NearDestination:   '#ec4899',
  Unloading:         '#f97316',
  DeliveryCompleted: '#22c55e',
  Cancelled:         '#ef4444',
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
