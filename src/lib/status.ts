export const TRIP_FLOW = [
  'Assigned',
  'CargoLoading',
  'LoadingComplete',
  'InTransit',
  'NearDestination',
  'Unloading',
  'UnloadingComplete',
  'DeliveryCompleted',
] as const

export const TRIP_STATUSES = [...TRIP_FLOW, 'Cancelled'] as const
export const ACTIVE_STATUSES = TRIP_FLOW.slice(0, 7) as unknown as string[]

export const TRIP_NEXT: Record<string, { next: string; key: string } | undefined> = {
  Assigned: { next: 'CargoLoading', key: 'trip.start_loading' },
  CargoLoading: { next: 'LoadingComplete', key: 'trip.loading_complete' },
  LoadingComplete: { next: 'InTransit', key: 'trip.depart' },
  InTransit: { next: 'NearDestination', key: 'trip.near_destination' },
  NearDestination: { next: 'Unloading', key: 'trip.start_unloading' },
  Unloading: { next: 'UnloadingComplete', key: 'trip.unloading_complete' },
  UnloadingComplete: { next: 'DeliveryCompleted', key: 'trip.complete_delivery' },
}

export const TRIP_TONE: Record<string, string> = {
  Assigned: 'violet',
  CargoLoading: 'amber',
  LoadingComplete: 'blue',
  InTransit: 'green',
  NearDestination: 'teal',
  Unloading: 'orange',
  UnloadingComplete: 'blue',
  DeliveryCompleted: 'green',
  Cancelled: 'red',
}

export const INCIDENT_TONE: Record<string, string> = {
  Low: 'slate',
  Medium: 'amber',
  High: 'red',
}

export const TICKET_TONE: Record<string, string> = {
  Open: 'red',
  InProgress: 'amber',
  Resolved: 'green',
  Closed: 'slate',
}

export const DRIVER_TONE: Record<string, string> = {
  Active: 'green',
  Invited: 'amber',
  Blocked: 'red',
}

export const isActiveStatus = (status: string) => ACTIVE_STATUSES.includes(status)

export const tripProgress = (status: string) => {
  const index = TRIP_FLOW.indexOf(status as (typeof TRIP_FLOW)[number])
  return index < 0 ? 0 : index
}

export const statusKey = (status: string) => `status.${status}`
export const incidentTypeKey = (type: string) =>
  `incident_type.${type.replace(/ /g, '_').toLowerCase()}`
