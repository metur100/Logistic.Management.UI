import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowRight, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { api, apiError } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Field, PasswordField } from '../components/ui'
import AuthLayout from '../components/AuthLayout'
import type { AuthUser } from '../lib/types'

interface InviteInfo {
  fullName: string
  username: string
  email?: string
  companyName: string
  expiresAt?: string
}

export default function AcceptInvitePage() {
  const { token = '' } = useParams()
  const { t } = useTranslation()
  const nav = useNavigate()
  const { login } = useAuth()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [loadError, setLoadError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/companies/invite/${token}`)
      .then(r => { if (active) setInfo(r.data) })
      .catch(err => { if (active) setLoadError(apiError(err, t('invite.invalid'))) })
    return () => { active = false }
  }, [token, t])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError(t('auth.password_min')); return }
    if (password !== confirm) { setError(t('auth.password_mismatch')); return }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<AuthUser>(`/companies/invite/${token}/accept`, { newPassword: password })
      login(data)
      toast.success(t('invite.welcome', { name: data.fullName.split(' ')[0] }))
      nav('/driver', { replace: true })
    } catch (err) {
      setError(apiError(err, t('invite.failed')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={t('invite.eyebrow')}
      title={info ? t('invite.title', { company: info.companyName }) : t('invite.loading')}
      lead={info ? t('invite.lead') : undefined}
      footer={
        <div className="auth-alt">
          {t('invite.have_account')} <Link to="/login">{t('auth.sign_in')}</Link>
        </div>
      }
    >
      {loadError && (
        <div className="alert error">
          <AlertTriangle size={16} />
          <div>{loadError}</div>
        </div>
      )}

      {!info && !loadError && <div className="loading"><div className="spinner" /></div>}

      {info && (
        <>
          <div className="card pad mb-3" style={{ background: 'var(--surface-2)' }}>
            <div className="row">
              <div className="icon" style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent-dark)', display: 'grid', placeItems: 'center' }}>
                <ShieldCheck size={18} />
              </div>
              <div className="grow">
                <div className="strong">{info.fullName}</div>
                <div className="small muted">{info.companyName} · @{info.username}</div>
              </div>
            </div>
          </div>
          <form onSubmit={submit} noValidate>
            {error && <div className="alert error mb-3">{error}</div>}
            <Field label={t('invite.new_password')} required hint={t('auth.password_hint')}>
              <PasswordField value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <Field label={t('auth.confirm_password')} required>
              <PasswordField value={confirm} onChange={setConfirm} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <Loader2 size={17} style={{ animation: 'spin .7s linear infinite' }} /> : <ArrowRight size={17} />}
              {busy ? t('invite.activating') : t('invite.activate')}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}

