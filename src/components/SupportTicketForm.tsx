import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { createTicket, TicketPriority, TICKET_PRIORITY_ICONS } from '../api/tickets'

const PRIORITIES: TicketPriority[] = ['Low', 'Medium', 'High']

const PRIO_META: Record<TicketPriority, { color: string; bg: string }> = {
  Low:    { color: '#16a34a', bg: '#f0fdf4' },
  Medium: { color: '#d97706', bg: '#fffbeb' },
  High:   { color: '#dc2626', bg: '#fef2f2' },
}

interface SupportTicketFormProps {
  onCreated?: () => void
}

export default function SupportTicketForm({ onCreated }: SupportTicketFormProps) {
  const { t } = useTranslation()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('Medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await createTicket({ subject, description, priority })
      toast.success(t('ticket_created'))
      setSubject('')
      setDescription('')
      setPriority('Medium')
      onCreated?.()
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } }
      toast.error(e2.response?.data?.message || t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <style>{`
        .stf-prio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .55rem; }
        .stf-prio-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: .3rem; padding: .75rem .5rem; border-radius: 10px;
          border: 2px solid var(--border); background: var(--surface2);
          cursor: pointer; transition: all .15s;
          font-size: .78rem; font-weight: 700; color: var(--text-muted); text-align: center;
        }
        .stf-prio-btn:hover:not(.active) { border-color: var(--text-muted); }
      `}</style>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>📝 {t('ticket_subject')} *</label>
          <input className="form-control" required placeholder={t('ticket_subject_placeholder')} value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>📋 {t('description')} *</label>
          <textarea className="form-control" rows={5} required placeholder={t('ticket_description_placeholder')} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>⚠️ {t('priority')}</label>
        <div className="stf-prio-grid">
          {PRIORITIES.map(p => {
            const isActive = priority === p
            const m = PRIO_META[p]
            return (
              <button key={p} type="button"
                className={`stf-prio-btn${isActive ? ' active' : ''}`}
                onClick={() => setPriority(p)}
                style={isActive ? { borderColor: m.color, background: m.bg, color: m.color } : {}}>
                <span style={{ fontSize: '1.3rem' }}>{TICKET_PRIORITY_ICONS[p]}</span>
                {t(`priority_${p.toLowerCase()}`)}
              </button>
            )
          })}
        </div>
      </div>

      <button type="submit" disabled={submitting} style={{
        width: '100%', padding: '.85rem', fontSize: '1rem', fontWeight: 800,
        borderRadius: 'var(--radius)', border: 'none',
        background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
        color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 14px rgba(37,99,235,.3)', transition: 'all .2s'
      }}>
        {submitting ? t('submitting') : `🎫 ${t('submit_ticket')}`}
      </button>
    </form>
  )
}
