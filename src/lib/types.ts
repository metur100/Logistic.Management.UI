export type Role = 'Admin' | 'Manager' | 'Driver'

export interface AuthUser {
  token: string
  role: Role | string
  userId: number
  fullName: string
  companyId?: number | null
  companyName?: string | null
  email?: string | null
}

export interface Me {
  id: number
  fullName: string
  username: string
  email?: string
  role: string
  phone?: string
  licenseNumber?: string
  companyId?: number | null
  companyName?: string | null
  companyStatus?: string | null
}

export interface Company {
  id: number
  name: string
  legalName?: string
  taxId?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  status: string
  isVerified: boolean
  createdAt: string
  drivers?: number
  vehicles?: number
  cargo?: number
  trips?: number
}

export interface Vehicle {
  id: number
  registrationNumber: string
  fleetName?: string
  type?: string
  capacity?: number
  ownershipType?: string
  ownerName?: string
  ownerPhone?: string
  isActive: boolean
  activeTrips?: number
  totalTrips?: number
  createdAt?: string
}

export interface Cargo {
  id: number
  description: string
  consignor?: string
  consignee?: string
  weightTons?: number
  volumeCbm?: number
  cargoType?: string
  specialInstructions?: string
  createdAt: string
  tripId?: number | null
  tripNumber?: string | null
}

export interface TripCargo {
  id: number
  description: string
  consignor?: string
  consignee?: string
  weightTons?: number
  volumeCbm?: number
  cargoType?: string
  specialInstructions?: string
}

export interface StatusHistory {
  id: number
  status: string
  remarks?: string
  changedAt: string
  changedByUserId?: number
}

export interface Trip {
  id: number
  tripNumber: string
  companyId: number
  driverId?: number | null
  driver?: { id: number; fullName: string; username?: string; phone?: string; email?: string } | null
  vehicleId?: number | null
  vehicle?: { id: number; registrationNumber: string; type?: string; capacity?: number } | null
  originLocation: string
  destinationLocation: string
  distanceKm?: number | null
  estimatedDurationMinutes?: number | null
  status: string
  plannedDepartureDate?: string | null
  actualDepartureDate?: string | null
  expectedArrivalDate?: string | null
  actualArrivalDate?: string | null
  loadingArrivalTime?: string | null
  loadingEndTime?: string | null
  unloadingArrivalTime?: string | null
  unloadingEndTime?: string | null
  remarks?: string | null
  podNumber?: string | null
  podReceived: boolean
  cmrNumber?: string | null
  createdAt: string
  updatedAt: string
  cargoItems: TripCargo[]
  statusHistory?: StatusHistory[]
}

export interface Driver {
  id: number
  fullName: string
  username: string
  email?: string
  phone?: string
  licenseNumber?: string
  isActive: boolean
  inviteToken?: string | null
  inviteExpiresAt?: string | null
  lastLoginAt?: string | null
  createdAt: string
  status: 'Active' | 'Invited' | 'Blocked' | string
  trips: number
  activeTrips: number
}

export interface Incident {
  id: number
  tripId?: number | null
  tripNumber?: string | null
  route?: string | null
  type: string
  description: string
  severity: string
  status: string
  location?: string | null
  reportedAt: string
  resolvedAt?: string | null
  resolution?: string | null
  reporterName?: string | null
}

export interface SupportTicket {
  id: number
  subject: string
  description: string
  status: string
  priority: string
  companyId: number
  companyName?: string | null
  createdByUserId: number
  createdByName?: string | null
  assignedToUserId?: number | null
  assignedToName?: string | null
  resolution?: string | null
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
}

export interface Message {
  id: number
  content: string
  isFromDriver: boolean
  isRead: boolean
  createdAt: string
  senderId: number
  senderName?: string
}

export interface Thread {
  userId: number
  fullName: string
  role: string
  email?: string
  phone?: string
  lastMessage?: string
  lastMessageAt?: string
  unread: number
}

export interface DashboardStats {
  tripsTotal: number
  activeTrips: number
  deliveredThisMonth: number
  pending: number
  vehiclesTotal: number
  vehiclesAvailable: number
  driversTotal: number
  driversActive: number
  driversInvited: number
  cargoTotal: number
  unassignedCargo: number
  tonsInTransit: number
  openIncidents: number
  unreadMessages: number
}

export interface DashboardData {
  company: { id: number; name: string; status: string; isVerified: boolean }
  stats: DashboardStats
  activeTrips: Array<{
    id: number
    tripNumber: string
    originLocation: string
    destinationLocation: string
    status: string
    distanceKm?: number
    plannedDepartureDate?: string
    expectedArrivalDate?: string
    driverName?: string
    vehicleReg?: string
    cargoCount: number
    weightTons: number
  }>
  upcoming: Array<{
    id: number
    tripNumber: string
    originLocation: string
    destinationLocation: string
    plannedDepartureDate?: string
    driverName?: string
  }>
  recent: Array<{
    id: number
    tripNumber: string
    originLocation: string
    destinationLocation: string
    status: string
    distanceKm?: number
    createdAt: string
    driverName?: string
    vehicleReg?: string
  }>
  fleet: Array<{ id: number; registrationNumber: string; type?: string; capacity?: number; onTrip: boolean }>
  monthly: Array<{ monthKey: number; total: number; delivered: number }>
}

export interface RouteDistance {
  origin: string
  destination: string
  distanceKm: number
  durationMinutes: number
  originLabel: string
  destinationLabel: string
  originLat: number
  originLon: number
  destinationLat: number
  destinationLon: number
  source: string
}

export interface AdminOverview {
  stats: {
    companiesTotal: number
    companiesActive: number
    companiesVerified: number
    companiesNew: number
    drivers: number
    managers: number
    admins: number
    blockedUsers: number
    vehicles: number
    cargoItems: number
    cargoTons: number
    tripsTotal: number
    tripsActive: number
    tripsDelivered: number
    tripsMonth: number
    openTickets: number
    openIncidents: number
  }
  monthly: Array<{ monthKey: number; total: number; delivered: number }>
  topCompanies: Array<{
    id: number
    name: string
    city?: string
    status: string
    drivers: number
    vehicles: number
    cargo: number
    trips: number
    activeTrips: number
  }>
  recentCompanies: Array<{
    id: number
    name: string
    city?: string
    country?: string
    status: string
    isVerified: boolean
    createdAt: string
  }>
  recentTickets: Array<{
    id: number
    subject: string
    status: string
    priority: string
    createdAt: string
    companyName?: string
  }>
}

export interface CompanyDetail {
  company: Company & { notes?: string }
  counts: {
    drivers: number
    driversActive: number
    vehicles: number
    cargo: number
    cargoUnassigned: number
    cargoTons: number
    trips: number
    tripsActive: number
    tripsDelivered: number
    tickets: number
    openTickets: number
    openIncidents: number
  }
  monthly: Array<{ monthKey: number; total: number; delivered: number }>
  drivers: Driver[]
  vehicles: Vehicle[]
  recentTrips: Array<{
    id: number
    tripNumber: string
    originLocation: string
    destinationLocation: string
    status: string
    distanceKm?: number
    plannedDepartureDate?: string
    actualArrivalDate?: string
    createdAt: string
    driverName?: string
    vehicleReg?: string
    cargoCount: number
    weightTons: number
  }>
  cargo: Cargo[]
  incidents: Incident[]
  readOnly: boolean
}
