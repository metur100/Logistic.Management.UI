import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  BadgeCheck, Building2, ChevronRight, Loader2, Search, ShieldOff,
  ShieldCheck, SlidersHorizontal,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Company } from '../../lib/types'
import { formatDate } from '../../lib/format'
import {
  Badge, Card, ConfirmDialog, EmptyState, PageHeader, PageLoader, SearchInput, Stat,
} from '../../components/ui'

export default function CompaniesPage() {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [busy, setBusy] = useState(false)
  const [action, setAction] = useState<{ company: Company; type: 'suspend' | 'activate' | 'verify' | 'unverify' } | null>(null)

  const load = () => {
    setLoading(true)
    api.get<Company[]>('/admin/companies')
      .then(r => setRows(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter(c => c.status === 'Active').length,
    suspended: rows.filter(c => c.status === 'Suspended').length,
    verified: rows.filter(c => c.isVerified).length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(c => {
      if (status !== 'All' && c.status !== status) return false
      if (!q) return true
      return [c.name, c.email, c.city, c.taxId].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    })
  }, [rows, status, search])

  const runAction = async () => {
    if (!action) return
    const { company, type } = action
    setBusy(true)
    try {
      if (type === 'suspend' || type === 'activate') {
        await api.patch(`/admin/companies/${company.id}/status`, { status: type === 'suspend' ? 'Suspended' : 'Active' })
      } else {
        await api.patch(`/admin/companies/${company.id}/verify`, { isVerified: type === 'verify' })
      }
      toast.success(t('admin.company_updated'))
      setAction(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('admin.companies_eyebrow')}
        title={t('admin.companies_title')}
        description={t('admin.companies_sub')}
      />

      <div className="stat-grid">
        <Stat icon={Building2} label={t('admin.companies')} value={stats.total} />
        <Stat icon={BadgeCheck} tone="green" label={t('admin.active')} value={stats.active} />
        <Stat icon={ShieldOff} tone="red" label={t('admin.suspended')} value={stats.suspended} />
        <Stat icon={ShieldCheck} tone="blue" label={t('admin.verified')} value={stats.verified} />
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder={t('admin.search_companies')} />
        <select className="select filter-select" value={status} onChange={e => setStatus(e.target.value)} aria-label={t('admin.status')}>
          <option value="All">{t('common.all')}</option>
          <option value="Active">{t('admin.active')}</option>
          <option value="Suspended">{t('admin.suspended')}</option>
        </select>
        <span className="small faint" style={{ marginLeft: 'auto' }}>{filtered.length} {filtered.length === 1 ? 'result' : t('admin.results')}</span>
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <Card><EmptyState icon={Search} title={t('admin.no_companies')} text={t('admin.no_companies_text')} /></Card>
      ) : (
        <div className="grid grid-2-eq">
          {filtered.map(company => (
            <article className="company-card" key={company.id}>
              <div className="top">
                <div className="icon" style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Building2 size={19} className="muted" />
                </div>
                <div className="grow">
                  <div className="name">{company.name}</div>
                  <div className="loc">{company.city ?? '—'}{company.country ? `, ${company.country}` : ''}</div>
                </div>
                <div className="stack-sm" style={{ alignItems: 'flex-end' }}>
                  <Badge tone={company.status === 'Active' ? 'green' : 'red'} dot>{company.status === 'Active' ? t('admin.active') : t('admin.suspended')}</Badge>
                  {company.isVerified && <Badge tone="blue"><ShieldCheck size={10} /> {t('admin.verified')}</Badge>}
                </div>
              </div>

              <div className="metrics">
                <div className="metric"><div className="v">{company.drivers ?? 0}</div><div className="k">{t('admin.drivers_short')}</div></div>
                <div className="metric"><div className="v">{company.vehicles ?? 0}</div><div className="k">{t('admin.vehicles_short')}</div></div>
                <div className="metric"><div className="v">{company.cargo ?? 0}</div><div className="k">{t('admin.cargo_short')}</div></div>
                <div className="metric"><div className="v">{company.trips ?? 0}</div><div className="k">{t('admin.trips_short')}</div></div>
              </div>

              <div className="row between tiny muted">
                <span>{company.email ?? '—'}</span>
                <span>{t('admin.since')} {formatDate(company.createdAt, i18n.language)}</span>
              </div>

              <div className="row wrap" style={{ gap: 6 }}>
                <Link className="btn btn-outline btn-sm" to={`/admin/companies/${company.id}`}>{t('admin.view_company')} <ChevronRight size={13} /></Link>
                <button className="btn btn-ghost btn-sm" onClick={() => setAction({ company, type: company.isVerified ? 'unverify' : 'verify' })}>
                  <ShieldCheck size={13} /> {company.isVerified ? t('admin.unverify') : t('admin.verify')}
                </button>
                <button
                  className={`btn btn-ghost btn-sm ${company.status === 'Active' ? '' : ''}`}
                  onClick={() => setAction({ company, type: company.status === 'Active' ? 'suspend' : 'activate' })}
                  style={company.status === 'Active' ? { color: 'var(--red)' } : { color: 'var(--green)' }}
                >
                  {busy && action?.company.id === company.id ? <Loader2 size={13} style={{ animation: 'spin .7s linear infinite' }} /> : company.status === 'Active' ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                  {company.status === 'Active' ? t('admin.suspend') : t('admin.activate')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="row mt-2 tiny faint"><SlidersHorizontal size={12} /> {t('admin.companies_note')}</div>

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        busy={busy}
        danger={action?.type === 'suspend' || action?.type === 'unverify'}
        title={
          action?.type === 'suspend' ? t('admin.suspend_title')
            : action?.type === 'activate' ? t('admin.activate_title')
              : action?.type === 'verify' ? t('admin.verify_title') : t('admin.unverify_title')
        }
        text={
          action?.type === 'suspend' ? t('admin.suspend_text', { name: action.company.name })
            : action?.type === 'activate' ? t('admin.activate_text', { name: action.company.name })
              : action?.type === 'verify' ? t('admin.verify_text', { name: action.company.name }) : t('admin.unverify_text', { name: action?.company.name ?? '' })
        }
        confirmLabel={
          action?.type === 'suspend' ? t('admin.suspend')
            : action?.type === 'activate' ? t('admin.activate')
              : action?.type === 'verify' ? t('admin.verify') : t('admin.unverify')
        }
      />
    </div>
  )
}

