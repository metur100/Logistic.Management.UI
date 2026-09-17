import api from './axios'

// ── Types ──────────────────────────────────────────────────

export type CalendarResourceType = 'vehicle' | 'driver'

export interface CalendarTripBlock {
  resourceId: number | string
  resourceLabel: string
  tripId: number
  tripNumber: string
  start: string
  end: string
  originLocation: string
  destinationLocation: string
  status: string
}

// ── API calls ──────────────────────────────────────────────

/** GET /trips/calendar?from=&to=&resource= */
export const getTripCalendar = (
  from: string,
  to: string,
  resource: CalendarResourceType
): Promise<CalendarTripBlock[]> =>
  api.get('/trips/calendar', { params: { from, to, resource } }).then(r => r.data)
