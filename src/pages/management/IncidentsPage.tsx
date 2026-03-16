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

const SEVERITY_COLORS = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' }
const SEVERITY_BG = { Low: '#f0fdf4', Medium: '#fffbeb', High: '#fef2f2' }

export default function IncidentsPage() {
  const { t } = useTranslation()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Open' | 'Resolved'>('All')
  const [selected, setSelected] = useState<Incident | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolving, setResolving] = useState(false)

  const load = () => {
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

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🚨 {t('incidents')}</h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.25rem' }}>{t('incidents_subtitle')}</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        {(['All', 'Open', 'Resolved'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '.35rem .9rem', borderRadius: 999, cursor: 'pointer',
            border: filter === f ? 'none' : '1.5px solid var(--border)',
            background: filter === f
              ? (f === 'Open' ? '#dc2626' : f === 'Resolved' ? '#16a34a' : 'var(--primary)')
              : 'var(--surface)',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            fontSize: '.8rem', fontWeight: 600
          }}>
            {f === 'All' ? t('all') : t(f.toLowerCase())}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {filtered.length} {t('incidents_count')}
        </span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
              <div style={{ fontWeight: 600 }}>{t('no_incidents')}</div>
            </div>
          ) : filtered.map(inc => (
            <div
              key={inc.id}
              className="card"
              style={{
                cursor: 'pointer',
                borderLeft: `4px solid ${SEVERITY_COLORS[inc.severity]}`,
                transition: 'all .18s'
              }}
              onClick={() => { setSelected(inc); setResolution(inc.resolution || '') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: SEVERITY_BG[inc.severity], color: SEVERITY_COLORS[inc.severity],
                      padding: '.2rem .65rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700
                    }}>
                      {inc.severity}
                    </span>
                    <span style={{
                      background: inc.status === 'Open' ? '#fef2f2' : '#f0fdf4',
                      color: inc.status === 'Open' ? '#dc2626' : '#16a34a',
                      padding: '.2rem .65rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700
                    }}>
                      {inc.status === 'Open' ? '🔴 ' + t('open') : '✅ ' + t('resolved')}
                    </span>
                    <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {inc.type}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '.35rem' }}>{inc.description}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {inc.tripNumber && <span>🚛 {inc.tripNumber}</span>}
                    {inc.driverName && <span>👤 {inc.driverName}</span>}
                    <span>📅 {new Date(inc.reportedAt).toLocaleString()}</span>
                  </div>
                </div>
                <span style={{ fontSize: '.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {t('view')} →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>🚨 {t('incident_detail')}</h2>
              <button onClick={() => setSelected(null)} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span style={{
                background: SEVERITY_BG[selected.severity], color: SEVERITY_COLORS[selected.severity],
                padding: '.25rem .75rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 700
              }}>{selected.severity}</span>
              <span style={{ background: 'var(--surface2)', color: 'var(--text-muted)', padding: '.25rem .75rem', borderRadius: 999, fontSize: '.78rem', fontWeight: 600 }}>
                {selected.type}
              </span>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1rem', fontSize: '.9rem' }}>
              {selected.description}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem', fontSize: '.85rem' }}>
              {selected.tripNumber && (
                <div><div style={{ color: 'var(--text-muted)', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('trip')}</div><div style={{ fontWeight: 600 }}>{selected.tripNumber}</div></div>
              )}
              {selected.driverName && (
                <div><div style={{ color: 'var(--text-muted)', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('driver')}</div><div style={{ fontWeight: 600 }}>{selected.driverName}</div></div>
              )}
              <div><div style={{ color: 'var(--text-muted)', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('reported_at')}</div><div style={{ fontWeight: 600 }}>{new Date(selected.reportedAt).toLocaleString()}</div></div>
              {selected.resolvedAt && (
                <div><div style={{ color: 'var(--text-muted)', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.2rem' }}>{t('resolved_at')}</div><div style={{ fontWeight: 600 }}>{new Date(selected.resolvedAt).toLocaleString()}</div></div>
              )}
            </div>

            {selected.status === 'Open' && (
              <>
                <div className="form-group">
                  <label>{t('resolution_notes')}</label>
                  <textarea className="form-control" rows={3} value={resolution} onChange={e => setResolution(e.target.value)} placeholder={t('describe_resolution')} />
                </div>
                <button className="btn btn-success" disabled={resolving} onClick={resolve} style={{ width: '100%' }}>
                  {resolving ? t('saving') : `✅ ${t('mark_resolved')}`}
                </button                >
              </>
            )}

            {selected.status === 'Resolved' && selected.resolution && (
              <div style={{
                padding: '1rem', background: '#f0fdf4',
                borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: '.4rem' }}>
                  {t('resolution')}
                </div>
                <div style={{ fontSize: '.9rem', color: 'var(--text)' }}>{selected.resolution}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

