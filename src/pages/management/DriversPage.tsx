import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Ban, CheckCircle2, Copy, Loader2, Mail, MailCheck, Phone, RefreshCw,
  Send, ShieldCheck, Trash2, UserPlus, Users,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Driver } from '../../lib/types'
import { formatDate } from '../../lib/format'
import {
  Avatar, Badge, Card, ConfirmDialog, CopyButton, EmptyState, Field, Modal,
  PageHeader, PageLoader, Stat,
} from '../../components/ui'

interface InviteResult {
  driverName: string
  link: string
  emailSent: boolean
  emailError?: string | null
}

const emptyForm = { fullName: '', email: '', username: '', phone: '', licenseNumber: '' }

export default function DriversPage() {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<InviteResult | null>(null)
  const [action, setAction] = useState<{ driver: Driver; type: 'block' | 'unblock' | 'remove' } | null>(null)
  const [resending, setResending] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<Driver[]>('/company/drivers')
      .then(r => setRows(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const stats = useMemo(() => ({
    active: rows.filter(d => d.status === 'Active').length,
    invited: rows.filter(d => d.status === 'Invited').length,
    onTrip: rows.filter(d => d.activeTrips > 0).length,
  }), [rows])

  const inviteLink = (driver: Driver) =>
    driver.inviteToken ? `${window.location.origin}/accept-invite/${driver.inviteToken}` : ''

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const openInvite = () => {
    setForm(emptyForm)
    setResult(null)
    setOpen(true)
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.post('/company/drivers/invite', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        phone: form.phone.trim() || null,
        licenseNumber: form.licenseNumber.trim() || null,
      })
      setResult({
        driverName: data.fullName,
        link: data.inviteLink,
        emailSent: Boolean(data.emailSent),
        emailError: data.emailError,
      })
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const resend = async (driver: Driver) => {
    setResending(driver.id)
    try {
      const { data } = await api.post(`/company/drivers/${driver.id}/resend-invite`)
      setResult({
        driverName: driver.fullName,
        link: data.inviteLink,
        emailSent: Boolean(data.emailSent),
        emailError: data.emailError,
      })
      setOpen(true)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setResending(null)
    }
  }

  const runAction = async () => {
    if (!action) return
    const { driver, type } = action
    try {
      if (type === 'remove') await api.delete(`/company/drivers/${driver.id}`)
      else await api.patch(`/company/drivers/${driver.id}/${type}`)
      toast.success(t(`drivers.${type}_done`))
      setAction(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
      setAction(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('drivers.eyebrow')}
        title={t('drivers.title')}
        description={t('drivers.subtitle')}
        actions={<button className="btn btn-primary" onClick={openInvite}><UserPlus /> {t('drivers.invite')}</button>}
      />

      <div className="stat-grid cols-3">
        <Stat icon={Users} tone="green" label={t('drivers.active')} value={stats.active} />
        <Stat icon={Mail} tone="amber" label={t('drivers.invited')} value={stats.invited} hint={t('drivers.invited_hint')} />
        <Stat icon={ShieldCheck} tone="blue" label={t('drivers.on_trip')} value={stats.onTrip} />
      </div>

      <div className="alert info mb-3">
        <Mail />
        <span>{t('drivers.invite_explainer')}</span>
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : rows.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title={t('drivers.empty')} text={t('drivers.empty_text')} action={<button className="btn btn-outline btn-sm" onClick={openInvite}><UserPlus /> {t('drivers.invite')}</button>} />
        </Card>
      ) : (
        <div className="grid grid-2-eq">
          {rows.map(driver => (
            <article className="company-card" key={driver.id}>
              <div className="top">
                <Avatar name={driver.fullName} size="lg" />
                <div className="grow">
                  <div className="name">{driver.fullName}</div>
                  <div className="loc">@{driver.username} {driver.email ? `· ${driver.email}` : ''}</div>
                </div>
                <Badge tone={driver.status === 'Active' ? 'green' : driver.status === 'Invited' ? 'amber' : 'red'} dot>
                  {t(`drivers.status_${driver.status.toLowerCase()}`, driver.status)}
                </Badge>
              </div>

              <div className="row wrap" style={{ gap: 8 }}>
                {driver.phone && <span className="chip"><Phone size={12} /> {driver.phone}</span>}
                {driver.licenseNumber && <span className="chip"><ShieldCheck size={12} /> {driver.licenseNumber}</span>}
                {driver.email && <span className="chip"><Mail size={12} /> {driver.email}</span>}
              </div>

              <div className="metrics">
                <div className="metric"><div className="v">{driver.trips}</div><div className="k">{t('drivers.trips')}</div></div>
                <div className="metric"><div className="v">{driver.activeTrips}</div><div className="k">{t('drivers.active_trips')}</div></div>
                <div className="metric"><div className="v" style={{ fontSize: 11 }}>{driver.lastLoginAt ? formatDate(driver.lastLoginAt, i18n.language) : '—'}</div><div className="k">{t('drivers.last_login')}</div></div>
                <div className="metric"><div className="v" style={{ fontSize: 11 }}>{formatDate(driver.createdAt, i18n.language)}</div><div className="k">{t('drivers.since')}</div></div>
              </div>

              {driver.status === 'Invited' && (
                <div className="alert warn" style={{ padding: '8px 10px' }}>
                  <Mail size={14} />
                  <span className="grow">{t('drivers.invite_pending')}</span>
                  <CopyButton value={inviteLink(driver)} label={t('common.copy_link')} className="btn btn-outline btn-sm" />
                </div>
              )}

              <div className="row wrap" style={{ gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => resend(driver)} disabled={resending === driver.id || !driver.isActive}>
                  {resending === driver.id ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <RefreshCw size={13} />}
                  {t('drivers.send_link')}
                </button>
                {driver.isActive ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => setAction({ driver, type: 'block' })}><Ban size={13} /> {t('common.block')}</button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setAction({ driver, type: 'unblock' })}><CheckCircle2 size={13} /> {t('common.unblock')}</button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setAction({ driver, type: 'remove' })}><Trash2 size={13} /> {t('common.remove')}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setResult(null) }}
        title={result ? t('drivers.invite_ready') : t('drivers.invite')}
        description={result ? t('drivers.invite_ready_sub', { name: result.driverName }) : t('drivers.invite_form_sub')}
        footer={result ? (
          <button className="btn btn-primary" onClick={() => { setOpen(false); setResult(null) }}>{t('common.done')}</button>
        ) : (
          <>
            <button className="btn btn-outline" type="button" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" type="submit" form="invite-form" disabled={saving || !form.fullName || !form.email || !form.username}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Send size={15} />}
              {saving ? t('drivers.sending') : t('drivers.send_invite')}
            </button>
          </>
        )}
      >
        {result ? (
          <div>
            <div className={`alert ${result.emailSent ? 'success' : 'warn'} mb-3`}>
              {result.emailSent ? <MailCheck size={15} /> : <Mail size={15} />}
              <span>{result.emailSent ? t('drivers.email_sent', { name: result.driverName }) : t('drivers.email_failed')}</span>
            </div>
            <Field label={t('drivers.invite_link')} hint={t('drivers.invite_link_hint')}>
              <div className="row" style={{ gap: 8, alignItems: 'stretch' }}>
                <input className="input" value={result.link} readOnly onFocus={e => e.currentTarget.select()} />
                <CopyButton value={result.link} label="" className="btn btn-outline" />
              </div>
            </Field>
            {!result.emailSent && result.emailError && (
              <p className="tiny muted">{result.emailError}</p>
            )}
            <div className="alert info mt-2">
              <Copy size={15} />
              <span>{t('drivers.share_link_note')}</span>
            </div>
          </div>
        ) : (
          <form id="invite-form" onSubmit={invite}>
            <div className="form-grid">
              <Field label={t('drivers.full_name')} required className="span-2">
                <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="Amar Hodžić" required autoFocus />
              </Field>
              <Field label={t('drivers.email')} required>
                <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="amar@company.ba" required />
              </Field>
              <Field label={t('drivers.username')} required hint={t('drivers.username_hint')}>
                <input className="input" value={form.username} onChange={set('username')} placeholder="amar.hodzic" required autoCapitalize="none" />
              </Field>
              <Field label={t('drivers.phone')}>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="+387 61 000 000" />
              </Field>
              <Field label={t('drivers.license')}>
                <input className="input" value={form.licenseNumber} onChange={set('licenseNumber')} placeholder="B-884211" />
              </Field>
            </div>
            <div className="alert info">
              <Mail size={15} />
              <span>{t('drivers.invite_note')}</span>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        danger={action?.type !== 'unblock'}
        title={action?.type === 'remove' ? t('drivers.remove_title') : action?.type === 'block' ? t('drivers.block_title') : t('drivers.unblock_title')}
        text={action?.type === 'remove' ? t('drivers.remove_text') : action?.type === 'block' ? t('drivers.block_text') : t('drivers.unblock_text')}
        confirmLabel={action?.type === 'remove' ? t('common.remove') : action?.type === 'block' ? t('common.block') : t('common.unblock')}
      />
    </div>
  )
}


