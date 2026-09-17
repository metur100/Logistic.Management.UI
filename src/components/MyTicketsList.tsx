import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { getTickets, SupportTicket, TICKET_STATUS_COLORS, TICKET_STATUS_ICONS, TICKET_PRIORITY_COLORS, TICKET_PRIORITY_ICONS } from '../api/tickets'

interface MyTicketsListProps {
  refreshKey?: number
}

export default function MyTicketsList({ refreshKey }: MyTicketsListProps) {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SupportTicket | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    getTickets()
      .then(r => setTickets(Array.isArray(r) ? r : []))
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div>
      <style>{`
        .mtl-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1rem;
          box-shadow: var(--shadow-sm); cursor: pointer;
          transition: box-shadow .15s, transform .15s;
        }
        .mtl-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .mtl-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.55);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 999; padding: 0; backdrop-filter: blur(3px);
        }
        .mtl-modal-box {
          background: var(--surface); border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem; width: 100%; max-width: 560px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
        }
        @media (min-width: 640px) {
          .mtl-modal-overlay { align-items: center; padding: 1rem; }
          .mtl-modal-box { border-radius: 20px; max-height: 90vh; }
        }
        .modal-drag-handle { width: 40px; height: 4px; background: var(--border); border-radius: 999px; margin: 0 auto .75rem; }
      `}</style>

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
            <div key={tk.id} className="mtl-card" style={{ borderLeft: `4px solid ${TICKET_STATUS_COLORS[tk.status]}` }} onClick={() => setSelected(tk)}>
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
              <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                {tk.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="mtl-modal-overlay" onClick={() => setSelected(null)}>
          <div className="mtl-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>🎫 {t('ticket_detail')}</h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>#{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: '.9rem' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ background: `${TICKET_STATUS_COLORS[selected.status]}20`, color: TICKET_STATUS_COLORS[selected.status], padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700 }}>
                {TICKET_STATUS_ICONS[selected.status]} {t(`ticket_status_${selected.status.toLowerCase()}`)}
              </span>
              <span style={{ background: `${TICKET_PRIORITY_COLORS[selected.priority]}20`, color: TICKET_PRIORITY_COLORS[selected.priority], padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700 }}>
                {TICKET_PRIORITY_ICONS[selected.priority]} {t(`priority_${selected.priority.toLowerCase()}`)}
              </span>
            </div>

            <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.5rem' }}>{selected.subject}</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.85rem', marginBottom: '1rem', fontSize: '.875rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
              {selected.description}
            </div>

            {selected.assignedToName && (
              <div style={{ marginBottom: '.75rem', padding: '.65rem .85rem', background: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', fontSize: '.82rem', color: '#1d4ed8', fontWeight: 600 }}>
                👤 {t('assigned_to')}: {selected.assignedToName}
              </div>
            )}

            {selected.resolution && (
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>✅ {t('resolution')}</div>
                <div style={{ fontSize: '.875rem', color: 'var(--text)', wordBreak: 'break-word' }}>{selected.resolution}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
