import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2 } from 'lucide-react'
import { api, apiError } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Field, PasswordField } from '../components/ui'
import AuthLayout from '../components/AuthLayout'
import type { AuthUser } from '../lib/types'

export default function RegisterPage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { login } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    companyName: '',
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirm: '',
    phone: '',
    city: '',
    country: 'Bosnia and Herzegovina',
  })

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password.length < 8) { setError(t('auth.password_min')); return }
    if (form.password !== form.confirm) { setError(t('auth.password_mismatch')); return }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<AuthUser>('/companies/register', {
        companyName: form.companyName,
        fullName: form.fullName,
        email: form.email,
        username: form.username,
        password: form.password,
        phone: form.phone,
        city: form.city,
        country: form.country,
      })
      login(data)
      toast.success(t('auth.company_created'))
      nav('/management', { replace: true })
    } catch (err) {
      setError(apiError(err, t('auth.register_failed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={t('auth.register_eyebrow')}
      title={t('auth.register_title')}
      lead={t('auth.register_lead')}
      footer={
        <div className="auth-alt">
          {t('auth.have_account')} <Link to="/login">{t('auth.sign_in')}</Link>
        </div>
      }
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="alert error mb-3">{error}</div>}
        <div className="form-grid">
          <Field label={t('auth.company_name')} required className="span-2">
            <input className="input" value={form.companyName} onChange={set('companyName')} placeholder="TransLog d.o.o." required />
          </Field>
          <Field label={t('auth.your_name')} required>
            <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="Selma Begić" autoComplete="name" required />
          </Field>
          <Field label={t('auth.work_email')} required>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="office@company.ba" autoComplete="email" required />
          </Field>
          <Field label={t('auth.username')} required>
            <input className="input" value={form.username} onChange={set('username')} placeholder="company.admin" autoComplete="username" autoCapitalize="none" required />
          </Field>
          <Field label={t('auth.phone')}>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="+387 33 000 000" autoComplete="tel" />
          </Field>
          <Field label={t('auth.password')} required hint={t('auth.password_hint')}>
            <PasswordField value={form.password} onChange={v => setForm(prev => ({ ...prev, password: v }))} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <Field label={t('auth.confirm_password')} required>
            <PasswordField value={form.confirm} onChange={v => setForm(prev => ({ ...prev, confirm: v }))} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <Field label={t('auth.city')}>
            <input className="input" value={form.city} onChange={set('city')} placeholder="Sarajevo" />
          </Field>
          <Field label={t('auth.country')}>
            <input className="input" value={form.country} onChange={set('country')} />
          </Field>
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? <Loader2 size={17} style={{ animation: 'spin .7s linear infinite' }} /> : <ArrowRight size={17} />}
          {busy ? t('auth.creating') : t('auth.create_company')}
        </button>
        <p className="auth-note">{t('auth.terms_note')}</p>
      </form>
    </AuthLayout>
  )
}

