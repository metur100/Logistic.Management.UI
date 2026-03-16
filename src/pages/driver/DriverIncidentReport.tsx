import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const INCIDENT_TYPES: { key: string; icon: string }[] = [
  { key: 'Breakdown',     icon: '🔧' },
  { key: 'Accident',      icon: '💥' },
  { key: 'Delay',         icon: '⏰' },
  { key: 'Road Closure',  icon: '🚧' },
  { key: 'Cargo Damage',  icon: '📦' },
  { key: 'Weather',       icon: '🌧️' },
  { key: 'Border Delay',  icon: '🛂' },
  { key: 'Other',         icon: '📋' },
]

const SEV_META = {
  Low:    { icon: '🟢', color: '#16a34a', bg: '#f0fdf4', label: 'Low' },
  Medium: { icon: '🟡', color: '#d97706', bg: '#fffbeb', label: 'Medium' },
  High:   { icon: '🔴', color: '#dc2626', bg: '#fef2f2', label: 'High' },
}

export default function DriverIncidentReport() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { tripId } = useParams<{ tripId: string }>()
  const [form, setForm] = useState({
    type: 'Delay',
    severity: 'Medium',
    description: '',
    location: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/incidents', {
        ...form,
        tripId: tripId ? Number(tripId) : undefined
      })
      toast.success(t('incident_reported'))
      nav(tripId ? `/driver/trips/${tripId}` : '/driver')
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .inc-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: .55rem;
        }
        @media (max-width: 480px) {
          .inc-type-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .inc-type-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .3rem;
          padding: .75rem .4rem;
          border-radius: 10px;
          border: 2px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          transition: all .15s;
          font-size: .7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.2;
        }
        .inc-type-btn:hover:not(.active) {
          border-color: var(--text-muted);
          background: var(--surface);
        }
        .inc-sev-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .65rem;
        }
        .inc-sev-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .3rem;
          padding: .85rem .5rem;
          border-radius: 10px;
          border: 2px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          transition: all .15s;
          font-size: .78rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
        }
        .inc-sev-btn:hover:not(.active) {
          border-color: var(--text-muted);
        }
      `}</style>

      {/* Back */}
      <button
        onClick={() => nav(-1)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--primary)', marginBottom: '1rem', padding: 0,
          fontSize: '.875rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '.35rem'
        }}>
        ← {t('back')}
      </button>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #9f1239)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: '0 6px 20px rgba(220,38,38,.3)'
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
          🚨 {t('report_incident')}
        </h1>
        <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>
          {t('report_incident_subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Incident type */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1rem',
          marginBottom: '1rem', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>📋</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('incident_type')}</h2>
          </div>
          <div className="inc-type-grid">
            {INCIDENT_TYPES.map(({ key, icon }) => {
              const isActive = form.type === key
              return (
                <button
                  key={key}
                  type="button"
                  className={`inc-type-btn${isActive ? ' active' : ''}`}
                  onClick={() => setForm({ ...form, type: key })}
                  style={isActive ? {
                    borderColor: 'var(--primary)',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)'
                  } : {}}>
                  <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                  {key}
                </button>
              )
            })}
          </div>
        </div>

        {/* Severity */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1rem',
          marginBottom: '1rem', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>⚠️</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('severity')}</h2>
          </div>
          <div className="inc-sev-grid">
            {(Object.entries(SEV_META) as [string, typeof SEV_META.Low][]).map(([key, m]) => {
              const isActive = form.severity === key
              return (
                <button
                  key={key}
                  type="button"
                  className={`inc-sev-btn${isActive ? ' active' : ''}`}
                  onClick={() => setForm({ ...form, severity: key })}
                  style={isActive ? {
                    borderColor: m.color,
                    background: m.bg,
                    color: m.color
                  } : {}}>
                  <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Details */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '1rem',
          marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.85rem' }}>
            <span>📝</span>
            <h2 style={{ fontWeight: 700, fontSize: '.95rem' }}>{t('details')}</h2>
          </div>

          <div style={{ marginBottom: '.75rem' }}>
            <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>
              📍 {t('current_location')}
            </label>
            <input
              className="form-control"
              placeholder={t('location_placeholder')}
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.4rem' }}>
              📋 {t('description')} *
            </label>
            <textarea
              className="form-control"
              rows={4}
              required
              placeholder={t('incident_description_placeholder')}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        {/* Summary preview */}
        {form.description && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 'var(--radius)', padding: '.85rem 1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '.4rem' }}>
              {t('report_preview')}
            </div>
            <div style={{ fontSize: '.82rem', display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              <span style={{
                background: SEV_META[form.severity as keyof typeof SEV_META].bg,
                color: SEV_META[form.severity as keyof typeof SEV_META].color,
                padding: '.15rem .5rem', borderRadius: 999, fontWeight: 700, fontSize: '.7rem'
              }}>
                {SEV_META[form.severity as keyof typeof SEV_META].icon} {form.severity}
              </span>
              <span style={{
                background: 'var(--surface)', color: 'var(--text-muted)',
                padding: '.15rem .5rem', borderRadius: 999, fontWeight: 600, fontSize: '.7rem',
                border: '1px solid var(--border)'
              }}>
                {INCIDENT_TYPES.find(x => x.key === form.type)?.icon} {form.type}
              </span>
            </div>
            {form.location && (
              <div style={{ fontSize: '.8rem', color: '#dc2626', marginTop: '.4rem' }}>
                📍 {form.location}
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%', padding: '.85rem',
            fontSize: '1rem', fontWeight: 800,
            borderRadius: 'var(--radius)', border: 'none',
            background: submitting ? '#fca5a5' : 'linear-gradient(135deg, #dc2626, #9f1239)',
            color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(220,38,38,.35)',
            transition: 'all .2s'
          }}>
          {submitting ? t('submitting') : `🚨 ${t('submit_report')}`}
        </button>
      </form>
    </div>
  )
}
