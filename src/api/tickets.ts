import api from './axios'

// ── Types ──────────────────────────────────────────────────

export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High'

export interface SupportTicket {
  id: number
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  createdByUserId: number
  createdByName: string
  assignedToUserId: number | null
  assignedToName: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

export interface CreateTicketPayload {
  subject: string
  description: string
  priority: TicketPriority
}

export interface UpdateTicketPayload {
  status: TicketStatus
  priority: TicketPriority
  assignedToUserId: number | null
  resolution: string | null
}

export interface ResetPasswordPayload {
  newPassword: string
}

// ── Constants ──────────────────────────────────────────────

export const TICKET_STATUSES: TicketStatus[] = ['Open', 'InProgress', 'Resolved', 'Closed']
export const TICKET_PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High']

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  Open: '#dc2626',
  InProgress: '#d97706',
  Resolved: '#16a34a',
  Closed: '#64748b',
}

export const TICKET_STATUS_ICONS: Record<TicketStatus, string> = {
  Open: '🔴',
  InProgress: '🟡',
  Resolved: '✅',
  Closed: '⬛',
}

export const TICKET_PRIORITY_COLORS: Record<TicketPriority, string> = {
  Low: '#16a34a',
  Medium: '#d97706',
  High: '#dc2626',
}

export const TICKET_PRIORITY_ICONS: Record<TicketPriority, string> = {
  Low: '🟢',
  Medium: '🟡',
  High: '🔴',
}

// ── Support ticket API calls ────────────────────────────────

/** GET /support-tickets?status= */
export const getTickets = (status?: TicketStatus): Promise<SupportTicket[]> =>
  api.get('/support-tickets', { params: status ? { status } : {} }).then(r => r.data)

/** GET /support-tickets/:id */
export const getTicketById = (id: number): Promise<SupportTicket> =>
  api.get(`/support-tickets/${id}`).then(r => r.data)

/** POST /support-tickets */
export const createTicket = (payload: CreateTicketPayload): Promise<SupportTicket> =>
  api.post('/support-tickets', payload).then(r => r.data)

/** PUT /support-tickets/:id (Admin only) */
export const updateTicket = (id: number, payload: UpdateTicketPayload): Promise<void> =>
  api.put(`/support-tickets/${id}`, payload)

// ── User admin API calls ────────────────────────────────────

/** PATCH /users/:id/block (Admin only) */
export const blockUser = (id: number): Promise<void> =>
  api.patch(`/users/${id}/block`)

/** PATCH /users/:id/unblock (Admin only) */
export const unblockUser = (id: number): Promise<void> =>
  api.patch(`/users/${id}/unblock`)

/** POST /users/:id/reset-password (Admin only) */
export const resetUserPassword = (id: number, payload: ResetPasswordPayload): Promise<void> =>
  api.post(`/users/${id}/reset-password`, payload)
