import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  CheckCircle2, Globe2, KeyRound, Loader2, Mail, Save, Send, Server,
  ShieldCheck,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import { formatDateTime } from '../../lib/format'
import {
  Badge, Card, Field, PageHeader, PageLoader, PasswordField,
} from '../../components/ui'

interface SmtpSettings {
  host: string
  port: number
  enableSsl: boolean
  username: string
  fromAddress: string
  fromName: string
  reportsTo?: string
  hasPassword: boolean
  updatedAt: string
}

export default function AdminSettingsPage() {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [smtp, setSmtp] = useState<SmtpSettings | null>(null)
  const [form, setForm] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    enableSsl: true,
    username: '',
    password: '',
    fromAddress: '',
    fromName: 'LogistiTrack',
    reportsTo: '',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    api.get<SmtpSettings | null>('/admin/settings/smtp')
      .then(r => {
        setSmtp(r.data)
        if (r.data) {
          setForm({
            host: r.data.host,
            port: r.data.port,
            enableSsl: r.data.enableSsl,
            username: r.data.username,
            password: '',
            fromAddress: r.data.fromAddress,
            fromName: r.data.fromName,
            reportsTo: r.data.reportsTo ?? '',
          })
        }
      })
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/settings/smtp', {
        ...form,
        port: Number(form.port),
        password: form.password.trim() || null,
      })
      toast.success(t('admin.smtp_saved'))
      setForm(prev => ({ ...prev, password: '' }))
      const { data } = await api.get<SmtpSettings | null>('/admin/settings/smtp')
      setSmtp(data)
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      const { data } = await api.post('/admin/settings/smtp/test')
      toast.success(data.message ?? t('admin.smtp_test_ok'))
    } catch (err) {
      toast.error(apiError(err, t('admin.smtp_test_failed')))
    } finally {
      setTesting(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.next.length < 8) { toast.error(t('auth.password_min')); return }
    if (passwords.next !== passwords.confirm) { toast.error(t('auth.password_mismatch')); return }
    setChanging(true)
    try {
      await api.post('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.next })
      toast.success(t('settings.password_changed'))
      setPasswords({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setChanging(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page narrow">
      <PageHeader
        eyebrow={t('admin.system_eyebrow')}
        title={t('admin.system_title')}
        description={t('admin.system_sub')}
        actions={<Badge tone="violet" dot><ShieldCheck size={11} /> {t('role.admin')}</Badge>}
      />

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card
            title={t('admin.smtp_title')}
            subtitle={t('admin.smtp_sub')}
            actions={smtp?.hasPassword ? <Badge tone="green" dot>{t('admin.smtp_configured')}</Badge> : <Badge tone="amber" dot>{t('admin.smtp_missing')}</Badge>}
          >
            <form onSubmit={save}>
              <div className="form-grid">
                <Field label={t('admin.smtp_host')} required>
                  <input className="input" value={form.host} onChange={set('host')} placeholder="smtp.gmail.com" required />
                </Field>
                <Field label={t('admin.smtp_port')} required>
                  <input className="input" type="number" value={form.port} onChange={set('port')} placeholder="587" required />
                </Field>
                <Field label={t('admin.smtp_username')} required>
                  <input className="input" type="email" value={form.username} onChange={set('username')} placeholder="certidevelopment@gmail.com" required />
                </Field>
                <Field label={t('admin.smtp_password')} hint={smtp?.hasPassword ? t('admin.smtp_password_keep') : undefined}>
                  <input className="input" type="password" value={form.password} onChange={set('password')} placeholder={smtp?.hasPassword ? '••••••••' : t('admin.smtp_password')} autoComplete="new-password" />
                </Field>
                <Field label={t('admin.smtp_from')} required>
                  <input className="input" type="email" value={form.fromAddress} onChange={set('fromAddress')} placeholder="certidevelopment@gmail.com" required />
                </Field>
                <Field label={t('admin.smtp_from_name')} required>
                  <input className="input" value={form.fromName} onChange={set('fromName')} placeholder="LogistiTrack" required />
                </Field>
                <Field label={t('admin.smtp_reports')} className="span-2">
                  <input className="input" type="email" value={form.reportsTo} onChange={set('reportsTo')} placeholder="certidevelopment@gmail.com" />
                </Field>
                <Field label={t('admin.smtp_ssl')} className="span-2">
                  <label className="checkbox-row">
                    <input type="checkbox" checked={form.enableSsl} onChange={e => setForm(p => ({ ...p, enableSsl: e.target.checked }))} />
                    {t('admin.smtp_ssl_text')}
                  </label>
                </Field>
              </div>
              <div className="row between wrap" style={{ gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={test} disabled={testing || !smtp?.hasPassword}>
                  {testing ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Send size={15} />}
                  {t('admin.smtp_test')}
                </button>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Save size={15} />}
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
            <div className="alert info mt-3">
              <Mail size={15} />
              <span>{t('admin.smtp_sender_note')}</span>
            </div>
          </Card>

          <Card title={t('admin.admin_password')} subtitle={t('admin.admin_password_sub')}>
            <form onSubmit={changePassword}>
              <Field label={t('settings.current_password')} required>
                <PasswordField value={passwords.current} onChange={v => setPasswords(p => ({ ...p, current: v }))} />
              </Field>
              <div className="form-grid">
                <Field label={t('settings.new_password')} required>
                  <PasswordField value={passwords.next} onChange={v => setPasswords(p => ({ ...p, next: v }))} autoComplete="new-password" />
                </Field>
                <Field label={t('settings.confirm_password')} required>
                  <PasswordField value={passwords.confirm} onChange={v => setPasswords(p => ({ ...p, confirm: v }))} autoComplete="new-password" />
                </Field>
              </div>
              <button className="btn btn-outline" disabled={changing || !passwords.current || !passwords.next}>
                {changing ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <KeyRound size={15} />}
                {t('settings.change_password')}
              </button>
            </form>
          </Card>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('admin.platform_info')} subtitle={t('admin.platform_info_sub')}>
            <div className="list">
              <div className="list-row">
                <div className="icon" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}><Globe2 size={15} className="muted" /></div>
                <div className="grow"><div className="t">{t('admin.web_app')}</div><div className="s">logistic-management-ui.pages.dev</div></div>
                <CheckCircle2 size={15} className="muted" />
              </div>
              <div className="list-row">
                <div className="icon" style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}><Server size={15} className="muted" /></div>
                <div className="grow"><div className="t">{t('admin.api')}</div><div className="s">logistic-management.runasp.net</div></div>
                <CheckCircle2 size={15} className="muted" />
              </div>
              {smtp && (
                <div className="list-row">
                  <div className="grow"><div className="t">{t('admin.last_smtp_update')}</div><div className="s">{formatDateTime(smtp.updatedAt, i18n.language)}</div></div>
                </div>
              )}
            </div>
          </Card>

          <Card title={t('admin.admin_scope')} subtitle={t('admin.admin_scope_sub')}>
            <p className="small muted" style={{ lineHeight: 1.65 }}>{t('admin.admin_scope_text')}</p>
            <div className="divider" />
            <div className="stack-sm small">
              <div className="row between"><span className="muted">{t('admin.read_only')}</span><Badge tone="green">{t('common.yes')}</Badge></div>
              <div className="row between"><span className="muted">{t('admin.manage_company_data')}</span><Badge tone="red">{t('common.no')}</Badge></div>
              <div className="row between"><span className="muted">{t('admin.manage_companies')}</span><Badge tone="green">{t('common.yes')}</Badge></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

