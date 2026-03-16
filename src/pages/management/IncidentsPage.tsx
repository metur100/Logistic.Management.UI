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
}

const SEV_COLOR = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }
const SEV_BG    = { Low: '#f0fdf4', Medium: '#fffbeb', High: '#fef2f2' }
const SEV_ICON  = { Low: '🟢', Medium: '🟡', High: '🔴' }

const TYPE_ICONS: Record<string, string> = {
  Breakdown: '🔧', Accident: '💥', Delay: '⏰',
  'Road Closure': '🚧', 'Cargo Damage': '📦',
  Weather: '🌧️', 'Border Delay': '🛂', Other: '📋'
}

export default function IncidentsPage() {
  const { t } = useTranslation()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('All')
  const [selected, setSelected] = useState<Incident | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolving, setResolving] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/incidents')
      .then(r => setIncidents(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

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

  const filtered = incidents.filter(i => filter === 'All' || i.status === filter)
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
          width: 100%; max-width: 560px;
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .65rem;
          margin-bottom: 1rem;
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
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          box-shadow: var(--shadow-sm);
          cursor: pointer;
          transition: box-shadow .15s, transform .15s;
        }
        .inc-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #9f1239)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: '0 6px 20px rgba(220,38,38,.3)'
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
          🚨 {t('incidents')}
        </h1>
        <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>
          {t('incidents_subtitle')}
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '.65rem', marginBottom: '1.25rem'
      }}>
        {[
          { label: t('open'),     value: openCount,     color: '#dc2626', bg: '#fef2f2', icon: '🔴' },
          { label: t('resolved'), value: resolvedCount, color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
          { label: t('high_priority'), value: highCount, color: '#f97316', bg: '#fff7ed', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '.75rem',
            boxShadow: 'var(--shadow-sm)', textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '.2rem' }}>
              {s.label}
            </div>
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
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
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
        <span style={{
          marginLeft: 'auto', fontSize: '.78rem',
          color: 'var(--text-muted)', fontWeight: 600
        }}>
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
            <div
              key={inc.id}
              className="inc-card"
              style={{ borderLeft: `4px solid ${SEV_COLOR[inc.severity]}` }}
              onClick={() => { setSelected(inc); setResolution(inc.resolution || '') }}>

              {/* Top row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: '.75rem', marginBottom: '.6rem'
              }}>
                <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    background: SEV_BG[inc.severity], color: SEV_COLOR[inc.severity],
                    padding: '.18rem .55rem', borderRadius: 999,
                    fontSize: '.68rem', fontWeight: 700
                  }}>
                    {SEV_ICON[inc.severity]} {inc.severity}
                  </span>
                  <span style={{
                    background: inc.status === 'Open' ? '#fef2f2' : '#f0fdf4',
                    color: inc.status === 'Open' ? '#dc2626' : '#16a34a',
                    padding: '.18rem .55rem', borderRadius: 999,
                    fontSize: '.68rem', fontWeight: 700
                  }}>
                    {inc.status === 'Open' ? '🔴 ' + t('open') : '✅ ' + t('resolved')}
                  </span>
                  <span style={{
                    background: 'var(--surface2)', color: 'var(--text-muted)',
                    padding: '.18rem .55rem', borderRadius: 999,
                    fontSize: '.68rem', fontWeight: 600
                  }}>
                    {TYPE_ICONS[inc.type] || '📋'} {inc.type}
                  </span>
                </div>
                <span style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>
                  {t('view')} →
                </span>
              </div>

              {/* Description */}
              <div style={{
                fontWeight: 700, fontSize: '.875rem', marginBottom: '.5rem',
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {inc.description}
              </div>

              {/* Meta chips */}
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {inc.tripNumber && (
                  <span style={{
                    background: 'var(--surface2)', color: 'var(--text-muted)',
                    padding: '.12rem .45rem', borderRadius: 999,
                    fontSize: '.68rem', fontWeight: 600
                  }}>
                    🚛 {inc.tripNumber}
                  </span>
                )}
                {inc.driverName && (
                  <span style={{
                    background: 'var(--surface2)', color: 'var(--text-muted)',
                    padding: '.12rem .45rem', borderRadius: 999,
                    fontSize: '.68rem', fontWeight: 600
                  }}>
                    👤 {inc.driverName}
                  </span>
                )}
                <span style={{
                  background: 'var(--surface2)', color: 'var(--text-muted)',
                  padding: '.12rem .45rem', borderRadius: 999,
                  fontSize: '.68rem', fontWeight: 600
                }}>
                  📅 {new Date(inc.reportedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="inc-modal-overlay"
          onClick={() => setSelected(null)}>
          <div className="inc-modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-drag-handle" />

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1rem'
            }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>
                  🚨 {t('incident_detail')}
                </h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  #{selected.id}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.9rem', flexShrink: 0
                }}>✕</button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{
                background: SEV_BG[selected.severity], color: SEV_COLOR[selected.severity],
                padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700
              }}>
                {SEV_ICON[selected.severity]} {selected.severity}
              </span>
              <span style={{
                background: selected.status === 'Open' ? '#fef2f2' : '#f0fdf4',
                color: selected.status === 'Open' ? '#dc2626' : '#16a34a',
                padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 700
              }}>
                {selected.status === 'Open' ? '🔴 ' + t('open') : '✅ ' + t('resolved')}
              </span>
              <span style={{
                background: 'var(--surface2)', color: 'var(--text-muted)',
                padding: '.22rem .7rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600
              }}>
                {TYPE_ICONS[selected.type] || '📋'} {selected.type}
              </span>
            </div>

            {/* Description */}
            <div style={{
              background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
              padding: '.85rem', marginBottom: '1rem',
              fontSize: '.875rem', lineHeight: 1.6, wordBreak: 'break-word'
            }}>
              {selected.description}
            </div>

            {/* Meta grid */}
            <div className="inc-detail-grid">
              {selected.tripNumber && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>
                    {t('trip')}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selected.tripNumber}</div>
                </div>
              )}
              {selected.driverName && (
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>
                    {t('driver')}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{selected.driverName}</div>
                </div>
              )}
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>
                  {t('reported_at')}
                </div>
                <div style={{ fontWeight: 700, fontSize: '.82rem' }}>
                  {new Date(selected.reportedAt).toLocaleString()}
                </div>
              </div>
              {selected.resolvedAt && (
                <div style={{ background: '#f0fdf4', borderRadius: 'var(--radius-sm)', padding: '.65rem .75rem' }}>
                  <div style={{ color: '#16a34a', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>
                    {t('resolved_at')}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>
                    {new Date(selected.resolvedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Resolve form */}
            {selected.status === 'Open' && (
              <>
                <div style={{ marginBottom: '.75rem' }}>
                  <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>
                    {t('resolution_notes')}
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    placeholder={t('describe_resolution')}
                  />
                </div>
                <button
                  className="btn btn-success"
                  disabled={resolving}
                  onClick={resolve}
                  style={{ width: '100%', padding: '.7rem', fontSize: '.9rem', fontWeight: 700 }}>
                  {resolving ? t('saving') : `✅ ${t('mark_resolved')}`}
                </button>
              </>
            )}

            {/* Resolution display */}
            {selected.status === 'Resolved' && selected.resolution && (
              <div style={{
                padding: '1rem', background: '#f0fdf4',
                borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0'
              }}>
                <div style={{
                  fontSize: '.72rem', fontWeight: 700, color: '#16a34a',
                  textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem'
                }}>
                  ✅ {t('resolution')}
                </div>
                <div style={{ fontSize: '.875rem', color: 'var(--text)', wordBreak: 'break-word' }}>
                  {selected.resolution}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
