import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Incident {
  id: number
  tripId: number
  tripNumber?: string
  type: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'Resolved'
  reportedAt: string
  resolvedAt?: string
  driverName?: string
  resolution?: string
  location?: string
}

const SEV_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }
const SEV_BG    = { Low: '#f0fdf4', Medium: '#fffbeb', High: '#fef2f2' }
const SEV_ICON  = { Low: '🟢', Medium: '🟡', High: '🔴' }

const TYPE_ICONS: Record<string, string> = {
  Breakdown: '🔧', Accident: '💥', Delay: '⏰',
  'Road Closure': '🚧', 'Cargo Damage': '📦',
  Weather: '🌧️', 'Border Delay': '🛂', Other: '📋'
}

const INCIDENT_TYPES: { key: string; icon: string; labelKey: string }[] = [
  { key: 'Breakdown',    icon: '🔧', labelKey: 'incident_type_breakdown' },
  { key: 'Accident',     icon: '💥', labelKey: 'incident_type_accident' },
  { key: 'Delay',        icon: '⏰', labelKey: 'incident_type_delay' },
  { key: 'Road Closure', icon: '🚧', labelKey: 'incident_type_road_closure' },
  { key: 'Cargo Damage', icon: '📦', labelKey: 'incident_type_cargo_damage' },
  { key: 'Weather',      icon: '🌧️', labelKey: 'incident_type_weather' },
  { key: 'Border Delay', icon: '🛂', labelKey: 'incident_type_border_delay' },
  { key: 'Other',        icon: '📋', labelKey: 'incident_type_other' },
]

const SEV_META = {
  Low:    { icon: '🟢', color: '#16a34a', bg: '#f0fdf4', labelKey: 'severity_low' },
  Medium: { icon: '🟡', color: '#d97706', bg: '#fffbeb', labelKey: 'severity_medium' },
  High:   { icon: '🔴', color: '#dc2626', bg: '#fef2f2', labelKey: 'severity_high' },
}

const emptyForm = { type: 'Delay', severity: 'Medium', description: '', location: '', tripId: '', driverUserId: '' }

export default function IncidentsPage() {
  const { t } = useTranslation()
  const [incidents, setIncidents]   = useState<Incident[]>([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<'All' | 'Open' | 'Resolved'>('All')
  const [selected, setSelected]     = useState<Incident | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolving, setResolving]   = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportForm, setReportForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [trips, setTrips]           = useState<{ id: number; tripNumber: string }[]>([])
  const [drivers, setDrivers]       = useState<{ id: number; fullName: string }[]>([])

  const load = () => {
    setLoading(true)
    api.get('/incidents')
      .then(r => setIncidents(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    api.get('/trips').then(r => setTrips(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
    api.get('/users?role=Driver').then(r => setDrivers(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
  }, [])

  const resolve = async () => {
    if (!selected) return
    setResolving(true)
    try {
      await api.put(`/incidents/${selected.id}/resolve`, { resolution })
      toast.success(t('incident_resolved'))
      setSelected(null)
      setResolution('')
      load()
    } catch { toast.error(t('error')) }
    finally { setResolving(false) }
  }

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/incidents', {
        ...reportForm,
        tripId: reportForm.tripId ? Number(reportForm.tripId) : undefined,
        driverUserId: reportForm.driverUserId ? Number(reportForm.driverUserId) : undefined,
      })
      toast.success(t('incident_reported'))
      setShowReport(false)
      setReportForm(emptyForm)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error'))
    } finally { setSubmitting(false) }
  }

  const filtered      = incidents.filter(i => filter === 'All' || i.status === filter)
  const openCount     = incidents.filter(i => i.status === 'Open').length
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length
  const highCount     = incidents.filter(i => i.severity === 'High' && i.status === 'Open').length

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .inc-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.55);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 999; padding: 0;
          backdrop-filter: blur(3px);
        }
        .inc-modal-box {
          background: var(--surface);
          border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem;
          width: 100%; max-width: 600px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
          animation: incSlideUp .22s ease;
        }
        @keyframes incSlideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 640px) {
          .inc-modal-overlay { align-items: center; padding: 1rem; }
          .inc-modal-box { border-radius: 20px; max-height: 90vh; }
        }
        .inc-detail-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: .65rem; margin-bottom: 1rem;
        }
        @media (max-width: 400px) {
          .inc-detail-grid { grid-template-columns: 1fr; }
          .inc-modal-box { padding: 1.25rem 1rem; }
        }
        .modal-drag-handle {
          width: 40px; height: 4px;
          background: var(--border); border-radius: 999px;
          margin: 0 auto .75rem;
        }
        .inc-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1rem;
          box-shadow: var(--shadow-sm); cursor: pointer;
          transition: box-shadow .15s, transform .15s;
        }
        .inc-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .inc-type-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem;
        }
        @media (max-width: 480px) { .inc-type-grid { grid-template-columns: repeat(2, 1fr); } }
        .inc-type-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: .25rem; padding: .65rem .35rem; border-radius: 10px;
          border: 2px solid var(--border); background: var(--surface2);
          cursor: pointer; transition: all .15s;
          font-size: .68rem; font-weight: 700;
          color: var(--text-muted); text-align: center; line-height: 1.2;
        }
        .inc-type-btn:hover:not(.active) { border-color: var(--text-muted); background: var(--surface); }
        .inc-sev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .55rem; }
        .inc-sev-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: .25rem; padding: .75rem .5rem; border-radius: 10px;
          border: 2px solid var(--border); background: var(--surface2);
          cursor: pointer; transition: all .15s;
          font-size: .75rem; font-weight: 700;
          color: var(--text-muted); text-align: center;
        }
        .inc-sev-btn:hover:not(.active) { border-color: var(--text-muted); }
        .inc-form-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: .75rem;
          margin-bottom: .75rem;
        }
        @media (max-width: 480px) { .inc-form-row { grid-template-columns: 1fr; } }
      `}</style>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #9f1239)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: '0 6px 20px rgba(220,38,38,.3)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
            🚨 {t('incidents')}
          </h1>
          <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>
            {t('incidents_subtitle')}
          </p>
        </div>
        <button onClick={() => setShowReport(true)} style={{
          background: 'rgba(255,255,255,.2)', color: '#fff',
          border: '1px solid rgba(255,255,255,.35)',
          borderRadius: 10, padding: '.55rem 1.1rem',
          cursor: 'pointer', fontWeight: 700,
          fontSize: '.875rem', whiteSpace: 'nowrap'
        }}>
          🚨 {t('report_incident')}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.65rem', marginBottom: '1.25rem' }}>
        {[
          { label: t('open'),          value: openCount,     color: '#dc2626', icon: '🔴' },
          { label: t('resolved'),      value: resolvedCount, color: '#16a34a', icon: '✅' },
          { label: t('high_priority'), value: highCount,     color: '#f97316', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '.75rem',
            boxShadow: 'var(--shadow-sm)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '.75rem 1rem',
        marginBottom: '1rem', boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap'
      }}>
        {(['All', 'Open', 'Resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '.35rem .9rem', borderRadius: 999, cursor: 'pointer',
            border: filter === f ? 'none' : '1.5px solid var(--border)',
            background: filter === f
              ? (f === 'Open' ? '#dc2626' : f === 'Resolved' ? '#16a34a' : 'var(--primary)')
              : 'var(--surface2)',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            fontSize: '.78rem', fontWeight: 700, transition: 'all .15s'
          }}>
            {f === 'All' ? t('all') : f === 'Open' ? `🔴 ${t('open')}` : `✅ ${t('resolved')}`}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filtered.length} {t('incidents_count')}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', textAlign: 'center',
          padding: '3rem 1rem', color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
          <div style={{ fontWeight: 600 }}>{t('no_incidents')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          {filtered.map(inc => (
            <div key={inc.id} className="inc-card"
              style={{ borderLeft: `4px solid ${SEV_COLOR[inc.severity]}` }}
              onClick={() => { setSelected(inc); setResolution(inc.resolution || '') }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem', marginBottom: '.6rem' }}>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: SEV_BG[inc.severity], color: SEV_COLOR[inc.severity], padding: '.18rem .55rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 700 }}>
                    {SEV_ICON[inc.severity]} {t(`severity_${inc.severity.toLowerCase()}`)}
                  </span>
                  <span style={{ background: inc.status === 'Open' ? '#fef2f2' : '#f0fdf4', color: inc.status === 'Open' ? '#dc2626' : '#16a34a', padding: '.18rem .55rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 700 }}>
                    {inc.status === 'Open' ? `🔴 ${t('open')}` : `✅ ${t('resolved')}`}
                  </span>
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.18rem .55rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                    {TYPE_ICONS[inc.type]} {t(`incident_type_${inc.type.toLowerCase().replace(/ /g, '_')}`)}
                  </span>
                </div>
                <span style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>{t('view')} →</span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '.875rem', marginBottom: '.5rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                {inc.description}
              </div>

              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {inc.tripNumber && (
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                    🚛 {inc.tripNumber}
                  </span>
                )}
                {inc.driverName && (
                  <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                    👤 {inc.driverName}
                  </span>
                )}
                {inc.location && (
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                    📍 {inc.location}
                  </span>
                )}
                <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.12rem .45rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                  📅 {new Date(inc.reportedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* \u2500\u2500 Detail modal \u2500\u2500 */}
      {selected && (
        <div className="inc-modal-overlay" onClick={() => setSelected(null)}>
          <div className="inc-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>🚨 {t('incident_detail')}</h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>#{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>X</button>
            </div>

            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ background: SEV_BG[selected.severity], color: SEV_COLOR[selected.severity], padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700 }}>
                {SEV_ICON[selected.severity]} {t(`severity_${selected.severity.toLowerCase()}`)}
              </span>
              <span style={{ background: selected.status === 'Open' ? '#fef2f2' : '#f0fdf4', color: selected.status === 'Open' ? '#dc2626' : '#16a34a', padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700 }}>
                {selected.status === 'Open' ? `🔴 ${t('open')}` : `✅ ${t('resolved')}`}
              </span>
              <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>
                {TYPE_ICONS[selected.type] || '\uD83D\uDCCB'} {t(`incident_type_${selected.type.toLowerCase().replace(/ /g, '_')}`)}
              </span>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.85rem', marginBottom: '1rem', fontSize: '.875rem', lineHeight: 1.6, wordBreak: 'break-word' }}>
              {selected.description}
            </div>

            {selected.location && (
              <div style={{ marginBottom: '1rem', padding: '.65rem .85rem', background: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe', fontSize: '.82rem', color: '#1d4ed8', fontWeight: 600 }}>
                📍 {selected.location}
              </div>
            )}

            <div className="inc-detail-grid">
              {selected.tripNumber && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('trip')}</div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selected.tripNumber}</div>
                </div>
              )}
              {selected.driverName && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('driver')}</div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selected.driverName}</div>
                </div>
              )}
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('reported_at')}</div>
                <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{new Date(selected.reportedAt).toLocaleString()}</div>
              </div>
              {selected.resolvedAt && (
                <div style={{ background: '#f0fdf4', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: '#16a34a', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('resolved_at')}</div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{new Date(selected.resolvedAt).toLocaleString()}</div>
                </div>
              )}
            </div>

            {selected.status === 'Open' && (
              <>
                <div style={{ marginBottom: '.75rem' }}>
                  <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>{t('resolution_notes')}</label>
                  <textarea className="form-control" rows={3} value={resolution} onChange={e => setResolution(e.target.value)} placeholder={t('describe_resolution')} />
                </div>
                <button className="btn btn-success" disabled={resolving} onClick={resolve} style={{ width: '100%', padding: '.7rem', fontSize: '.9rem', fontWeight: 700 }}>
                  {resolving ? t('saving') : ` ${t('mark_resolved')}`}
                </button>
              </>
            )}

            {selected.status === 'Resolved' && selected.resolution && (
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>X {t('resolution')}</div>
                <div style={{ fontSize: '.875rem', color: 'var(--text)', wordBreak: 'break-word' }}>{selected.resolution}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* \u2500\u2500 Report modal \u2500\u2500 */}
      {showReport && (
        <div className="inc-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="inc-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>🚨 {t('report_incident')}</h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>{t('report_incident_subtitle')}</p>
              </div>
              <button onClick={() => setShowReport(false)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>X</button>
            </div>

            <form onSubmit={handleReport}>

              {/* Transport + Driver selectors */}
              <div className="inc-form-row">
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>🚛 {t('trip')}</label>
                  <select className="form-control"
                    value={reportForm.tripId}
                    onChange={e => setReportForm({ ...reportForm, tripId: e.target.value })}>
                    <option value="">— {t('select_trip')} —</option>
                    {trips.map(tr => (
                      <option key={tr.id} value={tr.id}>{tr.tripNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>👤 {t('driver')}</label>
                  <select className="form-control"
                    value={reportForm.driverUserId}
                    onChange={e => setReportForm({ ...reportForm, driverUserId: e.target.value })}>
                    <option value="">— {t('select_driver')} —</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Incident type */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>{t('incident_type')}</label>
                <div className="inc-type-grid">
                  {INCIDENT_TYPES.map(({ key, icon, labelKey }) => {
                    const isActive = reportForm.type === key
                    return (
                      <button key={key} type="button"
                        className={`inc-type-btn${isActive ? ' active' : ''}`}
                        onClick={() => setReportForm({ ...reportForm, type: key })}
                        style={isActive ? { borderColor: 'var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)' } : {}}>
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        {t(labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Severity */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>{t('severity')}</label>
                <div className="inc-sev-grid">
                  {(Object.entries(SEV_META) as [string, typeof SEV_META.Low][]).map(([key, m]) => {
                    const isActive = reportForm.severity === key
                    return (
                      <button key={key} type="button"
                        className={`inc-sev-btn${isActive ? ' active' : ''}`}
                        onClick={() => setReportForm({ ...reportForm, severity: key })}
                        style={isActive ? { borderColor: m.color, background: m.bg, color: m.color } : {}}>
                        <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
                        {t(m.labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Location */}
              <div style={{ marginBottom: '.75rem' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>📍 {t('current_location')}</label>
                <input className="form-control" placeholder={t('location_placeholder')} value={reportForm.location} onChange={e => setReportForm({ ...reportForm, location: e.target.value })} />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>📋 {t('description')} *</label>
                <textarea className="form-control" rows={4} required placeholder={t('incident_description_placeholder')} value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '.75rem' }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '.7rem', fontSize: '.9rem', fontWeight: 800, borderRadius: 'var(--radius)', border: 'none', background: submitting ? '#fca5a5' : 'linear-gradient(135deg, #dc2626, #9f1239)', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? t('submitting') : `🚨 ${t('submit_report')}`}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowReport(false)} style={{ padding: '.7rem 1.25rem', fontSize: '.9rem' }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}