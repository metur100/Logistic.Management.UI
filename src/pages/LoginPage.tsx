import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import LanguageSwitcher from '../components/LanguageSwitcher'
import api from '../api/axios'

interface LoginForm {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  role: string
  fullName: string
  userId: number
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({ username: '', password: '' })
  const [loading, setLoading] = useState<boolean>(false)
  const { login } = useAuth()
  const nav = useNavigate()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post<LoginResponse>('/auth/login', form)
      login(res.data)
      toast.success(t('welcome', { name: res.data.fullName }))
      nav(res.data.role === 'Driver' ? '/driver' : '/management')
    } catch {
      toast.error(t('invalid_credentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg,#3b4fd8 0%,#1a1a2e 100%)',
      padding: '1rem'
    }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <LanguageSwitcher />
      </div>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '2.5rem',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🚛</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e' }}>{t('logistics_system')}</h1>
          <p style={{ color: '#64748b', marginTop: '.25rem' }}>{t('sign_in_account')}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('username')}</label>
            <input
              className="form-control"
              value={form.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })}
              required
              placeholder={t('enter_username')}
            />
          </div>
          <div className="form-group">
            <label>{t('password')}</label>
            <input
              className="form-control"
              type="password"
              value={form.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
              required
              placeholder={t('enter_password')}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '.75rem', marginTop: '.5rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? t('signing_in') : t('sign_in')}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.85rem', color: '#64748b' }}>
          {t('default_admin')}
        </p>
      </div>
    </div>
  )
}