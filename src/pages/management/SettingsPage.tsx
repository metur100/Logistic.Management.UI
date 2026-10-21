import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Building2, CheckCircle2, KeyRound, Loader2, Save, ShieldCheck,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import type { Company } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { Badge, Card, Field, PageHeader, PageLoader, PasswordField } from '../../components/ui'

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { user, refresh } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', legalName: '', taxId: '', email: '', phone: '', address: '', city: '', country: 'Bosnia and Herzegovina',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    api.get<Company>('/company')
      .then(r => {
        setCompany(r.data)
        setForm({
          name: r.data.name ?? '',
          legalName: r.data.legalName ?? '',
          taxId: r.data.taxId ?? '',
          email: r.data.email ?? '',
          phone: r.data.phone ?? '',
          address: r.data.address ?? '',
          city: r.data.city ?? '',
          country: r.data.country ?? 'Bosnia and Herzegovina',
        })
      })
      .catch(err => toast.error(apiError(err)))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/company', form)
      toast.success(t('settings.company_saved'))
      await refresh()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
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
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.subtitle')}
      />

      <div className="grid grid-2">
        <div className="stack" style={{ gap: 16 }}>
          <Card
            title={t('settings.company_profile')}
            subtitle={t('settings.company_profile_sub')}
            actions={company ? <Badge tone={company.isVerified ? 'green' : 'amber'}>{company.isVerified ? t('settings.verified') : t('settings.unverified')}</Badge> : undefined}
          >
            <form onSubmit={saveCompany}>
              <div className="form-grid">
                <Field label={t('settings.company_name')} required className="span-2">
                  <input className="input" value={form.name} onChange={set('name')} required />
                </Field>
                <Field label={t('settings.legal_name')} className="span-2">
                  <input className="input" value={form.legalName} onChange={set('legalName')} />
                </Field>
                <Field label={t('settings.tax_id')}>
                  <input className="input" value={form.taxId} onChange={set('taxId')} placeholder="4201987650004" />
                </Field>
                <Field label={t('settings.email')}>
                  <input className="input" type="email" value={form.email} onChange={set('email')} />
                </Field>
                <Field label={t('settings.phone')}>
                  <input className="input" value={form.phone} onChange={set('phone')} />
                </Field>
                <Field label={t('settings.city')}>
                  <input className="input" value={form.city} onChange={set('city')} />
                </Field>
                <Field label={t('settings.address')} className="span-2">
                  <input className="input" value={form.address} onChange={set('address')} />
                </Field>
                <Field label={t('settings.country')} className="span-2">
                  <input className="input" value={form.country} onChange={set('country')} />
                </Field>
              </div>
              <div className="row between">
                <span className="tiny faint">{company ? `${t('settings.member_since')} ${formatDate(company.createdAt, i18n.language)}` : ''}</span>
                <button className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <Save size={15} />}
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </Card>

          <Card title={t('settings.security')} subtitle={t('settings.security_sub')}>
            <form onSubmit={changePassword}>
              <Field label={t('settings.current_password')} required>
                <PasswordField value={passwords.current} onChange={v => setPasswords(p => ({ ...p, current: v }))} placeholder="••••••••" />
              </Field>
              <div className="form-grid">
                <Field label={t('settings.new_password')} required>
                  <PasswordField value={passwords.next} onChange={v => setPasswords(p => ({ ...p, next: v }))} placeholder="••••••••" autoComplete="new-password" />
                </Field>
                <Field label={t('settings.confirm_password')} required>
                  <PasswordField value={passwords.confirm} onChange={v => setPasswords(p => ({ ...p, confirm: v }))} placeholder="••••••••" autoComplete="new-password" />
                </Field>
              </div>
              <button className="btn btn-outline" disabled={changing || !passwords.current || !passwords.next}>
                {changing ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : <KeyRound size={15} />}
                {changing ? t('common.saving') : t('settings.change_password')}
              </button>
            </form>
          </Card>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <Card title={t('settings.account')} subtitle={t('settings.account_sub')}>
            <div className="list">
              <div className="list-row"><div className="grow"><div className="t">{user?.fullName}</div><div className="s">{user?.email ?? '—'} · {t('role.manager')}</div></div><Badge tone="violet">{t('role.manager')}</Badge></div>
              <div className="list-row"><div className="grow"><div className="t">{t('settings.company')}</div><div className="s">{user?.companyName ?? t('common.company')}</div></div><Building2 size={16} className="faint" /></div>
              <div className="list-row"><div className="grow"><div className="t">{t('settings.verification')}</div><div className="s">{company?.isVerified ? t('settings.verified_text') : t('settings.unverified_text')}</div></div>{company?.isVerified ? <ShieldCheck size={16} className="muted" /> : <CheckCircle2 size={16} className="faint" />}</div>
            </div>
          </Card>

          <Card title={t('settings.team')} subtitle={t('settings.team_sub')}>
            <p className="small muted" style={{ lineHeight: 1.65 }}>{t('settings.team_text')}</p>
            <div className="alert info mt-2"><ShieldCheck size={15} /><span>{t('settings.team_note')}</span></div>
          </Card>

          <Card title={t('settings.help')} subtitle={t('settings.help_sub')}>
            <p className="small muted" style={{ lineHeight: 1.65 }}>{t('settings.help_text')}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

