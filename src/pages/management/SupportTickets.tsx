import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import {
  getTickets, updateTicket, SupportTicket, TicketStatus, TicketPriority,
  TICKET_STATUSES, TICKET_PRIORITIES,
  TICKET_STATUS_COLORS, TICKET_STATUS_ICONS,
  TICKET_PRIORITY_COLORS, TICKET_PRIORITY_ICONS,
} from '../../api/tickets'

interface UserOption { id: number; fullName: string }

export default function SupportTickets() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | TicketStatus>('All')
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [editStatus, setEditStatus] = useState<TicketStatus>('Open')
  const [editPriority, setEditPriority] = useState<TicketPriority>('Medium')
  const [editAssignee, setEditAssignee] = useState<string>('')
  const [editResolution, setEditResolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])

  const load = useCallback(() => {
    setLoading(true)
    getTickets(filter === 'All' ? undefined : filter)
      .then(r => setTickets(Array.isArray(r) ? r : []))
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
  }, [filter, t])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/users').then(r => setUsers(Array.isArray(r.data) ? r.data : r.data?.data ?? [])).catch(() => {})
  }, [])

  const openTicket = (tk: SupportTicket) => {
    setSelected(tk)
    setEditStatus(tk.status)
    setEditPriority(tk.priority)
    setEditAssignee(tk.assignedToUserId ? String(tk.assignedToUserId) : '')
    setEditResolution(tk.resolution || '')
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await updateTicket(selected.id, {
        status: editStatus,
        priority: editPriority,
        assignedToUserId: editAssignee ? Number(editAssignee) : null,
        resolution: editResolution || null,
      })
      toast.success(t('ticket_updated'))
      setSelected(null)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || t('error'))
    } finally {
      setSaving(false)
    }
  }

  if (user && user.role !== 'Admin') return <Navigate to="/management" replace />

  const openCount = tickets.filter(t2 => t2.status === 'Open').length
  const inProgressCount = tickets.filter(t2 => t2.status === 'InProgress').length
  const resolvedCount = tickets.filter(t2 => t2.status === 'Resolved' || t2.status === 'Closed').length

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .stk-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.55);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 999; padding: 0; backdrop-filter: blur(3px);
        }
        .stk-modal-box {
          background: var(--surface); border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem; width: 100%; max-width: 600px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
        }
        @media (min-width: 640px) {
          .stk-modal-overlay { align-items: center; padding: 1rem; }
          .stk-modal-box { border-radius: 20px; max-height: 90vh; }
        }
        .modal-drag-handle { width: 40px; height: 4px; background: var(--border); border-radius: 999px; margin: 0 auto .75rem; }
        .stk-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1rem;
          box-shadow: var(--shadow-sm); cursor: pointer;
          transition: box-shadow .15s, transform .15s;
        }
        .stk-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .stk-edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: .75rem; }
        @media (max-width: 480px) { .stk-edit-row { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: '0 6px 20px rgba(67,56,202,.3)',
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>🎫 {t('support_tickets')}</h1>
        <p style={{ opacity: .85, fontSize: '.82rem', margin: 0 }}>{t('support_tickets_subtitle')}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.65rem', marginBottom: '1.25rem' }}>
        {[
          { label: t('ticket_status_open'), value: openCount, color: '#dc2626', icon: '🔴' },
          { label: t('ticket_status_inprogress'), value: inProgressCount, color: '#d97706', icon: '🟡' },
          { label: t('resolved'), value: resolvedCount, color: '#16a34a', icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.75rem', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.75rem 1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
        {(['All', ...TICKET_STATUSES] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '.35rem .9rem', borderRadius: 999, cursor: 'pointer',
            border: filter === f ? 'none' : '1.5px solid var(--border)',
            background: filter === f ? (f === 'All' ? 'var(--primary)' : TICKET_STATUS_COLORS[f as TicketStatus]) : 'var(--surface2)',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            fontSize: '.78rem', fontWeight: 700, transition: 'all .15s'
          }}>
            {f === 'All' ? t('all') : `${TICKET_STATUS_ICONS[f as TicketStatus]} ${t(`ticket_status_${f.toLowerCase()}`)}`}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {tickets.length} {t('tickets')}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : tickets.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎫</div>
          <div style={{ fontWeight: 600 }}>{t('no_tickets')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          {tickets.map(tk => (
            <div key={tk.id} className="stk-card" style={{ borderLeft: `4px solid ${TICKET_STATUS_COLORS[tk.status]}` }} onClick={() => openTicket(tk)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem', marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                  <span style={{ background: `${TICKET_STATUS_COLORS[tk.status]}20`, color: TICKET_STATUS_COLORS[tk.status], padding: '.15rem .5rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 700 }}>
                    {TICKET_STATUS_ICONS[tk.status]} {t(`ticket_status_${tk.status.toLowerCase()}`)}
                  </span>
                  <span style={{ background: `${TICKET_PRIORITY_COLORS[tk.priority]}20`, color: TICKET_PRIORITY_COLORS[tk.priority], padding: '.15rem .5rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 700 }}>
                    {TICKET_PRIORITY_ICONS[tk.priority]} {t(`priority_${tk.priority.toLowerCase()}`)}
                  </span>
                </div>
                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(tk.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.3rem' }}>{tk.subject}</div>
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                  👤 {tk.createdByName}
                </span>
                {tk.assignedToName && (
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                    🧑‍💼 {tk.assignedToName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {selected && (
        <div className="stk-modal-overlay" onClick={() => setSelected(null)}>
          <div className="stk-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>🎫 {t('ticket_detail')}</h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>#{selected.id} · {selected.createdByName}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
            </div>

            <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.5rem' }}>{selected.subject}</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.85rem', marginBottom: '1rem', fontSize: '.875rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
              {selected.description}
            </div>

            <div className="stk-edit-row">
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('status')}</label>
                <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value as TicketStatus)}>
                  {TICKET_STATUSES.map(s => <option key={s} value={s}>{t(`ticket_status_${s.toLowerCase()}`)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('priority')}</label>
                <select className="form-control" value={editPriority} onChange={e => setEditPriority(e.target.value as TicketPriority)}>
                  {TICKET_PRIORITIES.map(p => <option key={p} value={p}>{t(`priority_${p.toLowerCase()}`)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('assigned_to')}</label>
              <select className="form-control" value={editAssignee} onChange={e => setEditAssignee(e.target.value)}>
                <option value="">— {t('unassigned')} —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('resolution_notes')}</label>
              <textarea className="form-control" rows={3} value={editResolution} onChange={e => setEditResolution(e.target.value)} placeholder={t('describe_resolution')} />
            </div>

            <button className="btn btn-primary" disabled={saving} onClick={handleSave} style={{ width: '100%', padding: '.7rem', fontSize: '.9rem', fontWeight: 700 }}>
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
