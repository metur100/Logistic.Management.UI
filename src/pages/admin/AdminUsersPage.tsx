import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Ban, CheckCircle2, Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, Users,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import { formatDate } from '../../lib/format'
import {
  Badge, Card, ConfirmDialog, DataTable, EmptyState, Field, Modal, PageHeader,
  PageLoader, PasswordField, SearchInput, Stat, type Column,
} from '../../components/ui'

interface AdminUser {
  id: number
  fullName: string
  username: string
  email?: string
  phone?: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  companyId?: number
  companyName?: string
  companyStatus?: string
  invitePending: boolean
}

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('All')
  const [action, setAction] = useState<{ user: AdminUser; type: 'block' | 'unblock' } | null>(null)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ user: string; password: string } | null>(null)

  const load = () => {
    setLoading(true)
    api.get<AdminUser[]>('/admin/users')
      .then(r => setRows(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const stats = useMemo(() => ({
    total: rows.length,
    drivers: rows.filter(u => u.role === 'Driver').length,
    managers: rows.filter(u => u.role === 'Manager').length,
    blocked: rows.filter(u => !u.isActive).length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(u => {
      if (role !== 'All' && u.role !== role) return false
      if (!q) return true
      return [u.fullName, u.username, u.email, u.companyName].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    })
  }, [rows, role, search])

  const runAction = async () => {
    if (!action) return
    setSaving(true)
    try {
      await api.patch(`/users/${action.user.id}/${action.type}`)
      toast.success(t(`admin.user_${action.type}_done`))
      setAction(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const generate = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
    const values = new Uint32Array(16)
    crypto.getRandomValues(values)
    return Array.from(values, v => alphabet[v % alphabet.length]).join('')
  }

  const reset = async () => {
    if (!resetUser) return
    setSaving(true)
    try {
      await api.post(`/users/${resetUser.id}/reset-password`, { newPassword: password })
      setResult({ user: resetUser.fullName, password })
      setResetUser(null)
      setPassword('')
      toast.success(t('admin.password_reset_done'))
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: 'user', header: t('admin.user'), label: t('admin.user'),
      cell: u => (
        <div>
          <div className="cell-main">{u.fullName}</div>
          <div className="cell-sub">@{u.username} · {u.email ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'company', header: t('admin.company'), label: t('admin.company'), hideOnMobile: true,
      cell: u => u.companyName ? <div><div className="small">{u.companyName}</div>{u.companyStatus && u.companyStatus !== 'Active' && <Badge tone="red">{t('admin.suspended')}</Badge>}</div> : <span className="muted">—</span>,
    },
    {
      key: 'role', header: t('admin.role'), label: t('admin.role'),
      cell: u => <Badge tone={u.role === 'Admin' ? 'violet' : u.role === 'Manager' ? 'blue' : 'slate'}>{t(`role.${u.role.toLowerCase()}`, u.role)}</Badge>,
    },
    {
      key: 'status', header: t('admin.status'), label: t('admin.status'),
      cell: u => <Badge tone={u.isActive ? 'green' : 'red'} dot>{u.isActive ? t('common.active') : t('common.blocked')}</Badge>,
    },
    {
      key: 'last', header: t('admin.last_login'), label: t('admin.last_login'), hideOnMobile: true,
      cell: u => <span className="small muted">{u.lastLoginAt ? formatDate(u.lastLoginAt, i18n.language) : '—'}</span>,
    },
    {
      key: 'actions', header: '', label: '', className: 'cell-actions',
      cell: u => (
        <div className="cell-actions">
          {u.role !== 'Admin' && (
            <>
              <button className="btn btn-ghost btn-icon" title={t('admin.reset_password')} onClick={() => { setResetUser(u); setPassword(''); setResult(null) }}><KeyRound size={14} /></button>
              {u.isActive
                ? <button className="btn btn-ghost btn-icon" title={t('common.block')} onClick={() => setAction({ user: u, type: 'block' })}><Ban size={14} /></button>
                : <button className="btn btn-ghost btn-icon" title={t('common.unblock')} onClick={() => setAction({ user: u, type: 'unblock' })}><CheckCircle2 size={14} /></button>}
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('admin.users_eyebrow')}
        title={t('admin.users_title')}
        description={t('admin.users_sub')}
      />

      <div className="stat-grid">
        <Stat icon={Users} label={t('admin.total_users')} value={stats.total} />
        <Stat icon={Users} tone="blue" label={t('role.manager')} value={stats.managers} />
        <Stat icon={Users} tone="orange" label={t('role.driver')} value={stats.drivers} />
        <Stat icon={Ban} tone={stats.blocked ? 'red' : 'slate'} label={t('admin.blocked')} value={stats.blocked} />
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder={t('admin.search_users')} />
        <select className="select filter-select" value={role} onChange={e => setRole(e.target.value)} aria-label={t('admin.role')}>
          <option value="All">{t('common.all')}</option>
          <option value="Manager">{t('role.manager')}</option>
          <option value="Driver">{t('role.driver')}</option>
          <option value="Admin">{t('role.admin')}</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> {t('common.refresh')}</button>
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      <Card bodyClass="">
        {loading ? <PageLoader /> : (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={u => u.id}
            empty={<EmptyState icon={Users} title={t('admin.no_users')} text={t('admin.no_users_text')} />}
          />
        )}
      </Card>

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        busy={saving}
        danger={action?.type === 'block'}
        title={action?.type === 'block' ? t('admin.block_user_title') : t('admin.unblock_user_title')}
        text={action?.type === 'block' ? t('admin.block_user_text', { name: action.user.fullName }) : t('admin.unblock_user_text', { name: action?.user.fullName ?? '' })}
        confirmLabel={action?.type === 'block' ? t('common.block') : t('common.unblock')}
      />

      <Modal
        open={resetUser !== null}
        onClose={() => setResetUser(null)}
        title={t('admin.reset_password')}
        description={resetUser ? `${resetUser.fullName} · @${resetUser.username}` : undefined}
        size="small"
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setResetUser(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={reset} disabled={saving || password.length < 8}>
              {saving && <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} />}
              {t('admin.reset_password')}
            </button>
          </>
        }
      >
        <Field label={t('admin.new_password')} required hint={t('admin.reset_hint')}>
          <div className="row" style={{ gap: 8, alignItems: 'stretch' }}>
            <div style={{ flex: 1 }}>
              <PasswordField value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <button className="btn btn-outline" type="button" onClick={() => setPassword(generate())}><RefreshCw size={14} /> {t('admin.generate')}</button>
          </div>
        </Field>
        <div className="alert warn"><ShieldCheck size={15} /><span>{t('admin.reset_note')}</span></div>
      </Modal>

      <Modal
        open={result !== null}
        onClose={() => setResult(null)}
        title={t('admin.password_reset_done')}
        size="small"
        footer={<button className="btn btn-primary" onClick={() => setResult(null)}>{t('common.done')}</button>}
      >
        <p className="small muted mb-2">{t('admin.reset_result_note', { name: result?.user ?? '' })}</p>
        <div className="row" style={{ gap: 8 }}>
          <input className="input mono" value={result?.password ?? ''} readOnly onFocus={e => e.currentTarget.select()} />
          <button className="btn btn-outline" onClick={() => { navigator.clipboard.writeText(result?.password ?? ''); toast.success(t('common.copied')) }} aria-label={t('common.copy')}><Copy size={15} /></button>
        </div>
      </Modal>
    </div>
  )
}

