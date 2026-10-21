import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  CheckCircle2, Clock, LifeBuoy, Loader2, MessageSquare, Plus, Send,
} from 'lucide-react'
import api, { apiError } from '../api/axios'
import type { SupportTicket } from '../lib/types'
import { formatDateTime } from '../lib/format'
import {
  Badge, Card, EmptyState, Field, Modal, PageHeader, PageLoader, SearchInput,
  Segmented, Stat,
} from '../components/ui'

export default function SupportView({ mode, role }: { mode: 'company' | 'admin'; role: 'manager' | 'driver' }) {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'Open' | 'InProgress' | 'Resolved'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', priority: 'Medium' })
  const [edit, setEdit] = useState({ status: 'Open', priority: 'Medium', resolution: '' })

  const load = () => {
    setLoading(true)
    api.get<SupportTicket[]>('/support-tickets')
      .then(r => setRows(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const stats = useMemo(() => ({
    open: rows.filter(t => t.status === 'Open' || t.status === 'InProgress').length,
    resolved: rows.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
    high: rows.filter(t => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(ticket => {
      if (filter !== 'all' && ticket.status !== filter) return false
      if (!q) return true
      return [ticket.subject, ticket.description, ticket.companyName, ticket.createdByName]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    })
  }, [rows, filter, search])

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket)
    setEdit({
      status: ticket.status,
      priority: ticket.priority,
      resolution: ticket.resolution ?? '',
    })
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/support-tickets', {
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
      })
      toast.success(t('support.created'))
      setCreateOpen(false)
      setForm({ subject: '', description: '', priority: 'Medium' })
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const update = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await api.put(`/support-tickets/${selected.id}`, {
        status: edit.status,
        priority: edit.priority,
        resolution: edit.resolution.trim() || null,
      })
      toast.success(t('support.updated'))
      setSelected(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={mode === 'admin' ? t('support.admin_eyebrow') : t('support.eyebrow')}
        title={mode === 'admin' ? t('support.admin_title') : t('support.title')}
        description={mode === 'admin' ? t('support.admin_sub') : role === 'driver' ? t('support.driver_sub') : t('support.manager_sub')}
        actions={mode === 'company' ? <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus /> {t('support.new')}</button> : undefined}
      />

      <div className="stat-grid cols-3">
        <Stat icon={Clock} tone={stats.open ? 'amber' : 'green'} label={t('support.open')} value={stats.open} />
        <Stat icon={LifeBuoy} tone={stats.high ? 'red' : 'slate'} label={t('support.high_priority')} value={stats.high} />
        <Stat icon={CheckCircle2} tone="green" label={t('support.resolved')} value={stats.resolved} />
      </div>

      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'Open', label: t('support.status_Open') },
            { value: 'InProgress', label: t('support.status_InProgress') },
            { value: 'Resolved', label: t('support.status_Resolved') },
          ]}
        />
        <div className="spacer" />
        <SearchInput value={search} onChange={setSearch} placeholder={t('support.search')} />
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={LifeBuoy} title={t('support.empty')} text={t('support.empty_text')} action={mode === 'company' ? <button className="btn btn-outline btn-sm" onClick={() => setCreateOpen(true)}><Plus /> {t('support.new')}</button> : undefined} />
        </Card>
      ) : (
        <div className="stack">
          {filtered.map(ticket => (
            <article
              key={ticket.id}
              className="card pad"
              style={{ cursor: 'pointer' }}
              onClick={() => openTicket(ticket)}
            >
              <div className="row wrap between mb-1">
                <div className="row wrap" style={{ gap: 8 }}>
                  <Badge tone={ticket.status === 'Open' ? 'red' : ticket.status === 'InProgress' ? 'amber' : ticket.status === 'Resolved' ? 'green' : 'slate'} dot>
                    {t(`support.status_${ticket.status}`, ticket.status)}
                  </Badge>
                  <Badge tone={ticket.priority === 'High' ? 'red' : ticket.priority === 'Medium' ? 'amber' : 'slate'}>
                    {t(`support.priority_${ticket.priority}`, ticket.priority)}
                  </Badge>
                  {mode === 'admin' && ticket.companyName && <span className="small strong">{ticket.companyName}</span>}
                </div>
                <span className="tiny faint">{formatDateTime(ticket.createdAt, i18n.language)}</span>
              </div>
              <h3 style={{ fontSize: 14 }}>{ticket.subject}</h3>
              <p className="small muted mt-1" style={{ lineHeight: 1.55 }}>{ticket.description}</p>
              <div className="row wrap tiny faint mt-2" style={{ gap: 12 }}>
                <span>{ticket.createdByName ?? '—'}</span>
                {ticket.resolution && <span className="inline"><CheckCircle2 size={12} /> {ticket.resolution}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('support.new')}
        description={t('support.new_sub')}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" type="submit" form="ticket-form" disabled={saving || !form.subject.trim() || !form.description.trim()}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Send size={15} />}
              {saving ? t('common.sending') : t('support.submit')}
            </button>
          </>
        }
      >
        <form id="ticket-form" onSubmit={create}>
          <Field label={t('support.subject')} required>
            <input className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder={t('support.subject_placeholder')} maxLength={200} required autoFocus />
          </Field>
          <Field label={t('support.description')} required>
            <textarea className="textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t('support.description_placeholder')} maxLength={2000} required />
          </Field>
          <Field label={t('support.priority')}>
            <select className="select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
              <option value="Low">{t('support.priority_Low')}</option>
              <option value="Medium">{t('support.priority_Medium')}</option>
              <option value="High">{t('support.priority_High')}</option>
            </select>
          </Field>
        </form>
      </Modal>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.subject ?? ''}
        description={selected ? `${selected.companyName ?? ''} · ${selected.createdByName ?? ''}` : undefined}
        footer={mode === 'admin' ? (
          <>
            <button className="btn btn-outline" type="button" onClick={() => setSelected(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={update} disabled={saving}>
              {saving && <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} />}
              {t('support.save_update')}
            </button>
          </>
        ) : <button className="btn btn-outline" onClick={() => setSelected(null)}>{t('common.close')}</button>}
      >
        {selected && (
          <div>
            <div className="row wrap mb-2" style={{ gap: 8 }}>
              <Badge tone={selected.status === 'Open' ? 'red' : selected.status === 'InProgress' ? 'amber' : 'green'}>{t(`support.status_${selected.status}`, selected.status)}</Badge>
              <Badge tone={selected.priority === 'High' ? 'red' : 'slate'}>{t(`support.priority_${selected.priority}`, selected.priority)}</Badge>
              <span className="tiny faint">{formatDateTime(selected.createdAt, i18n.language)}</span>
            </div>
            <p className="small" style={{ lineHeight: 1.65, marginBottom: 16 }}>{selected.description}</p>
            {selected.resolution && (
              <div className="alert success mb-3"><CheckCircle2 size={15} /><span>{selected.resolution}</span></div>
            )}
            {mode === 'admin' ? (
              <div className="form-grid">
                <Field label={t('support.status')}>
                  <select className="select" value={edit.status} onChange={e => setEdit(p => ({ ...p, status: e.target.value }))}>
                    {['Open', 'InProgress', 'Resolved', 'Closed'].map(s => <option key={s} value={s}>{t(`support.status_${s}`, s)}</option>)}
                  </select>
                </Field>
                <Field label={t('support.priority')}>
                  <select className="select" value={edit.priority} onChange={e => setEdit(p => ({ ...p, priority: e.target.value }))}>
                    {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{t(`support.priority_${p}`, p)}</option>)}
                  </select>
                </Field>
                <Field label={t('support.resolution')} className="span-2">
                  <textarea className="textarea" value={edit.resolution} onChange={e => setEdit(p => ({ ...p, resolution: e.target.value }))} placeholder={t('support.resolution_placeholder')} maxLength={2000} />
                </Field>
              </div>
            ) : (
              <div className="alert info"><MessageSquare size={15} /><span>{t('support.reply_note')}</span></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}


