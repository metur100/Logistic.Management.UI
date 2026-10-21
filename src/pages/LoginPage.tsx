import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowRight, Info, Loader2 } from 'lucide-react'
import { api, apiError } from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Field, PasswordField } from '../components/ui'
import AuthLayout from '../components/AuthLayout'
import type { AuthUser } from '../lib/types'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { login, user, loading } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      nav(user.role === 'Admin' ? '/admin' : user.role === 'Manager' ? '/management' : '/driver', { replace: true })
    }
  }, [loading, user, nav])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<AuthUser>('/auth/login', { username, password })
      login(data)
      toast.success(t('auth.welcome', { name: data.fullName.split(' ')[0] }))
      nav(data.role === 'Admin' ? '/admin' : data.role === 'Manager' ? '/management' : '/driver', { replace: true })
    } catch (err) {
      setError(apiError(err, t('auth.invalid')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      eyebrow={t('auth.sign_in_eyebrow')}
      title={t('auth.sign_in_title')}
      lead={t('auth.sign_in_lead')}
      footer={
        <div className="auth-alt">
          {t('auth.new_company')} <Link to="/register">{t('auth.register_company')}</Link>
        </div>
      }
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="alert error mb-3">{error}</div>}
        <Field label={t('auth.username')} required htmlFor="username">
          <input
            id="username"
            className="input"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t('auth.username_placeholder')}
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </Field>
        <Field label={t('auth.password')} required htmlFor="password">
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            placeholder={t('auth.password_placeholder')}
            autoComplete="current-password"
          />
        </Field>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy || !username || !password}>
          {busy ? <Loader2 size={17} style={{ animation: 'spin .7s linear infinite' }} /> : <ArrowRight size={17} />}
          {busy ? t('auth.signing_in') : t('auth.sign_in')}
        </button>
      </form>
      <div className="auth-help">
        <Info size={14} />
        {t('auth.driver_help')}
      </div>
    </AuthLayout>
  )
}

