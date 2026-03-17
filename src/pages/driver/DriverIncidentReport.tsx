import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

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

const SEV_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }
const SEV_BG    = { Low: '#f0fdf4', Medium: '#fffbeb', High: '#fef2f2' }
const SEV_ICON  = { Low: '🟢', Medium: '🟡', High: '🔴' }

const TYPE_ICONS: Record<string, string> = {
  Breakdown: '🔧', Accident: '💥', Delay: '⏰',
  'Road Closure': '🚧', 'Cargo Damage': '📦',
  Weather: '🌧️', 'Border Delay': '🛂', Other: '📋'
}

interface MyTrip { id: number; tripNumber: string; originLocation: string; destinationLocation: string; status: string }
interface MyIncident {
  id: number; tripId?: number; tripNumber?: string
  type: string; description: string
  severity: 'Low' | 'Medium' | 'High'
  status: 'Open' | 'Resolved'
  location?: string; reportedAt: string
  resolvedAt?: string; resolution?: string
}

export default function DriverIncidentReport() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { tripId } = useParams<{ tripId: string }>()

  const [tab, setTab] = useState<'report' | 'mine'>(tripId ? 'report' : 'mine')
  const [trips, setTrips] = useState<MyTrip[]>([])
  const [myIncidents, setMyIncidents] = useState<MyIncident[]>([])
  const [loadingIncidents, setLoadingIncidents] = useState(false)
  const [selected, setSelected] = useState<MyIncident | null>(null)

  const [form, setForm] = useState({
    tripId: tripId || '',
    type: 'Delay',
    severity: 'Medium',
    description: '',
    location: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/trips/my-trips').then(r => {
      const data = Array.isArray(r.data) ? r.data : []
      setTrips(data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'mine') {
      setLoadingIncidents(true)
      api.get('/incidents').then(r => {
        setMyIncidents(Array.isArray(r.data) ? r.data : [])
      }).catch(() => toast.error(t('failed')))
        .finally(() => setLoadingIncidents(false))
    }
  }, [tab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tripId) { toast.error(t('select_trip')); return }
    setSubmitting(true)
    try {
      await api.post('/incidents', {
        type: form.type,
        severity: form.severity,
        description: form.description,
        location: form.location,
        tripId: Number(form.tripId),
      })
      toast.success(t('incident_reported'))
      setForm({ tripId: '', type: 'Delay', severity: 'Medium', description: '', location: '' })
      setTab('mine')
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTrip = trips.find(tr => tr.id === Number(form.tripId))

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .inc-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .55rem; }
        @media (max-width: 480px) { .inc-type-grid { grid-template-columns: repeat(2, 1fr); } }
        .inc-type-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: .3rem; padding: .75rem .4rem; border-radius: 10px;
          border: 2px solid var(--border); background: var(--surface2);
          cursor: pointer; transition: all .15s;
          font-size: .7rem; font-weight: 700; color: var(--text-muted);
          text-align: center; line-height: 1.2;
        }
        .inc-type-btn:hover:not(.active) { border-color: var(--text-muted); background: var(--surface); }
        .inc-sev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .65rem; }
        .inc-sev-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: .3rem; padding: .85rem .5rem; border-radius: 10px;
          border: 2px solid var(--border); background: var(--surface2);
          cursor: pointer; transition: all .15s;
          font-size: .78rem; font-weight: 700; color: var(--text-muted); text-align: center;
        }
        .inc-sev-btn:hover:not(.active) { border-color: var(--text-muted); }
        .inc-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 1rem;
          box-shadow: var(--shadow-sm); cursor: pointer;
          transition: box-shadow .15s, transform .15s;
        }
        .inc-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
        .inc-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.55);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 999; padding: 0; backdrop-filter: blur(3px);
        }
        .inc-modal-box {
          background: var(--surface); border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem; width: 100%; max-width: 560px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
          animation: incUp .22s ease;
        }
        @keyframes incUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (min-width: 640px) {
          .inc-modal-overlay { align-items: center; padding: 1rem; }
          .inc-modal-box { border-radius: 20px; max-height: 90vh; }
        }
        .modal-drag-handle { width: 40px; height: 4px; background: var(--border); border-radius: 999px; margin: 0 auto .75rem; }
      `}</style>

      {/* Back */}
      <button onClick={() => nav(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginBottom: '1rem', padding: 0, fontSize: '.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
        ← {t('back')}
      </button>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #dc2626, #9f1239)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', color: '#fff', marginBottom: '1.25rem', boxShadow: '0 6px 20px rgba(220,38,38,.3)' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>🚨 {t('incidents')}</h1>
        <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>{t('report_incident_subtitle')}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
        {(['mine', 'report'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            flex: 1, padding: '.6rem', borderRadius: 'var(--radius)', fontWeight: 700,
            fontSize: '.88rem', cursor: 'pointer', transition: 'all .15s',
            background: tab === tb ? '#dc2626' : 'var(--surface)',
            color: tab === tb ? '#fff' : 'var(--text-muted)',
            border: tab === tb ? 'none' : '1.5px solid var(--border)',
          }}>
            {tb === 'mine' ? `📋 ${t('my_incidents')}` : `🚨 ${t('report_incident')}`}
          </button>
        ))}
      </div>

      {/* ── MY INCIDENTS TAB ── */}
      {tab === 'mine' && (
        <>
          {loadingIncidents ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : myIncidents.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
              <div style={{ fontWeight: 600 }}>{t('no_incidents')}</div>
              <button onClick={() => setTab('report')} style={{ marginTop: '1rem', padding: '.5rem 1.25rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 700, cursor: 'pointer', fontSize: '.88rem' }}>
                🚨 {t('report_incident')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {myIncidents.map(inc => (
                <div key={inc.id} className="inc-card"
                  style={{ borderLeft: `4px solid ${SEV_COLOR[inc.severity]}` }}
                  onClick={() => setSelected(inc)}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem', marginBottom: '.6rem' }}>
                    <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: SEV_BG[inc.severity], color: SEV_COLOR[inc.severity], padding: '.15rem .5rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 700 }}>
                        {SEV_ICON[inc.severity]} {t(`severity_${inc.severity.toLowerCase()}`)}
                      </span>
                      <span style={{ background: inc.status === 'Open' ? '#fef2f2' : '#f0fdf4', color: inc.status === 'Open' ? '#dc2626' : '#16a34a', padding: '.15rem .5rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 700 }}>
                        {inc.status === 'Open' ? `🔴 ${t('open')}` : `✅ ${t('resolved')}`}
                      </span>
                      <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.15rem .5rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                        {TYPE_ICONS[inc.type] || '📋'} {t(`incident_type_${inc.type.toLowerCase().replace(/ /g, '_')}`)}
                      </span>
                    </div>
                    <span style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>{t('view')} →</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '.875rem', marginBottom: '.45rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                    {inc.description}
                  </div>

                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    {inc.tripNumber && (
                      <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.1rem .4rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                        🚛 {inc.tripNumber}
                      </span>
                    )}
                    <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.1rem .4rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                      📅 {new Date(inc.reportedAt).toLocaleDateString()}
                    </span>
                    {inc.location && (
                      <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.1rem .4rem', borderRadius: 999, fontSize: '.68rem', fontWeight: 600 }}>
                        📍 {inc.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REPORT TAB ── */}
      {tab === 'report' && (
        <form onSubmit={handleSubmit}>

          {/* Transport selector */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
              <span>🚛</span>
              <h2 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{t('select_trip')} *</h2>
            </div>

            {trips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                {t('no_trips_found')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {trips.map(tr => {
                  const isSelected = String(tr.id) === String(form.tripId)
                  return (
                    <button key={tr.id} type="button"
                      onClick={() => setForm({ ...form, tripId: String(tr.id) })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '.75rem',
                        padding: '.75rem .9rem', borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid #dc2626' : '1.5px solid var(--border)',
                        background: isSelected ? '#fef2f2' : 'var(--surface2)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                      }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: isSelected ? '#dc2626' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                        🚛
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '.85rem', color: isSelected ? '#dc2626' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tr.tripNumber}
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tr.originLocation} → {tr.destinationLocation}
                        </div>
                      </div>
                      {isSelected && <span style={{ color: '#dc2626', fontSize: '1rem', flexShrink: 0 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedTrip && (
              <div style={{ marginTop: '.75rem', padding: '.6rem .85rem', background: '#fef2f2', borderRadius: 'var(--radius-sm)', border: '1px solid #fecaca', fontSize: '.8rem', color: '#dc2626', fontWeight: 600 }}>
                ✓ {selectedTrip.tripNumber} — {selectedTrip.originLocation} → {selectedTrip.destinationLocation}
              </div>
            )}
          </div>

          {/* Incident type */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
              <span>📋</span>
              <h2 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{t('incident_type')}</h2>
            </div>
            <div className="inc-type-grid">
              {INCIDENT_TYPES.map(({ key, icon, labelKey }) => {
                const isActive = form.type === key
                return (
                  <button key={key} type="button"
                    className={`inc-type-btn${isActive ? ' active' : ''}`}
                    onClick={() => setForm({ ...form, type: key })}
                    style={isActive ? { borderColor: 'var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)' } : {}}>
                    <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Severity */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
              <span>⚠️</span>
              <h2 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{t('severity')}</h2>
            </div>
            <div className="inc-sev-grid">
              {(Object.entries(SEV_META) as [string, typeof SEV_META.Low][]).map(([key, m]) => {
                const isActive = form.severity === key
                return (
                  <button key={key} type="button"
                    className={`inc-sev-btn${isActive ? ' active' : ''}`}
                    onClick={() => setForm({ ...form, severity: key })}
                    style={isActive ? { borderColor: m.color, background: m.bg, color: m.color } : {}}>
                    <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                    {t(m.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
              <span>📝</span>
              <h2 style={{ fontWeight: 700, fontSize: '.95rem', margin: 0 }}>{t('details')}</h2>
            </div>
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>📍 {t('current_location')}</label>
              <input className="form-control" placeholder={t('location_placeholder')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>📋 {t('description')} *</label>
              <textarea className="form-control" rows={4} required placeholder={t('incident_description_placeholder')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {/* Preview */}
          {form.description && form.tripId && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '.85rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '.4rem' }}>{t('report_preview')}</div>
              <div style={{ fontSize: '.82rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                <span style={{ background: SEV_META[form.severity as keyof typeof SEV_META].bg, color: SEV_META[form.severity as keyof typeof SEV_META].color, padding: '.15rem .5rem', borderRadius: 999, fontWeight: 700, fontSize: '.7rem' }}>
                  {SEV_META[form.severity as keyof typeof SEV_META].icon} {t(`severity_${form.severity.toLowerCase()}`)}
                </span>
                <span style={{ background: 'var(--surface)', color: 'var(--text-muted)', padding: '.15rem .5rem', borderRadius: 999, fontWeight: 600, fontSize: '.7rem', border: '1px solid var(--border)' }}>
                  {INCIDENT_TYPES.find(x => x.key === form.type)?.icon} {t(`incident_type_${form.type.toLowerCase().replace(/ /g, '_')}`)}
                </span>
                {selectedTrip && (
                  <span style={{ background: 'var(--surface)', color: 'var(--text-muted)', padding: '.15rem .5rem', borderRadius: 999, fontWeight: 600, fontSize: '.7rem', border: '1px solid var(--border)' }}>
                    🚛 {selectedTrip.tripNumber}
                  </span>
                )}
              </div>
              {form.location && <div style={{ fontSize: '.8rem', color: '#dc2626', marginTop: '.4rem' }}>📍 {form.location}</div>}
            </div>
          )}

          <button type="submit" disabled={submitting || !form.tripId} style={{ width: '100%', padding: '.85rem', fontSize: '1rem', fontWeight: 800, borderRadius: 'var(--radius)', border: 'none', background: submitting || !form.tripId ? '#fca5a5' : 'linear-gradient(135deg, #dc2626, #9f1239)', color: '#fff', cursor: submitting || !form.tripId ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(220,38,38,.35)', transition: 'all .2s' }}>
            {submitting ? t('submitting') : `🚨 ${t('submit_report')}`}
          </button>
        </form>
      )}

      {/* ── Incident detail modal ── */}
      {selected && (
        <div className="inc-modal-overlay" onClick={() => setSelected(null)}>
          <div className="inc-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>🚨 {t('incident_detail')}</h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>#{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ background: SEV_BG[selected.severity], color: SEV_COLOR[selected.severity], padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700 }}>
                {SEV_ICON[selected.severity]} {t(`severity_${selected.severity.toLowerCase()}`)}
              </span>
              <span style={{ background: selected.status === 'Open' ? '#fef2f2' : '#f0fdf4', color: selected.status === 'Open' ? '#dc2626' : '#16a34a', padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700 }}>
                {selected.status === 'Open' ? `🔴 ${t('open')}` : `✅ ${t('resolved')}`}
              </span>
              <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>
                {TYPE_ICONS[selected.type] || '📋'} {t(`incident_type_${selected.type.toLowerCase().replace(/ /g, '_')}`)}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.65rem', marginBottom: '1rem' }}>
              {selected.tripNumber && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('trip')}</div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selected.tripNumber}</div>
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

            {selected.status === 'Resolved' && selected.resolution && (
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>✅ {t('resolution')}</div>
                <div style={{ fontSize: '.875rem', color: 'var(--text)', wordBreak: 'break-word' }}>{selected.resolution}</div>
              </div>
            )}

            {selected.status === 'Open' && (
              <div style={{ marginTop: '.75rem', padding: '.75rem', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', fontSize: '.82rem', color: '#92400e', fontWeight: 600 }}>
                ⏳ {t('incident_pending_review')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}