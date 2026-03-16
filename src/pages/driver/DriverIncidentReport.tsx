import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const INCIDENT_TYPES = [
  'Breakdown', 'Accident', 'Delay', 'Road Closure',
  'Cargo Damage', 'Weather', 'Border Delay', 'Other'
]

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

  const severityColors: Record<string, string> = {
    Low: '#16a34a', Medium: '#d97706', High: '#dc2626'
  }

  return (
    <div>
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

      <div style={{
        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        color: 'white', marginBottom: '1.5rem'
      }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '.25rem' }}>
          🚨 {t('report_incident')}
        </h1>
        <p style={{ opacity: .8, fontSize: '.875rem' }}>{t('report_incident_subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>{t('incident_type')}</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '.65rem'
          }}>
            {INCIDENT_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, type })}
                style={{
                  padding: '.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${form.type === type ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.type === type ? 'var(--primary-light)' : 'var(--surface2)',
                  color: form.type === type ? 'var(--primary)' : 'var(--text)',
                  cursor: 'pointer', fontWeight: 600, fontSize: '.82rem',
                  transition: 'all .15s', textAlign: 'center'
                }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>{t('severity')}</h2>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            {(['Low', 'Medium', 'High'] as const).map(sev => (
              <button
                key={sev}
                type="button"
                onClick={() => setForm({ ...form, severity: sev })}
                style={{
                  flex: 1, padding: '.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${form.severity === sev ? severityColors[sev] : 'var(--border)'}`,
                  background: form.severity === sev ? `${severityColors[sev]}15` : 'var(--surface2)',
                  color: form.severity === sev ? severityColors[sev] : 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: 700, fontSize: '.875rem',
                  transition: 'all .15s'
                }}>
                {sev === 'Low' ? '🟢' : sev === 'Medium' ? '🟡' : '🔴'} {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label>{t('current_location')}</label>
            <input
              className="form-control"
              placeholder={t('location_placeholder')}
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>{t('description')} *</label>
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

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-danger"
          style={{ width: '100%', padding: '.85rem', fontSize: '1rem', borderRadius: 'var(--radius)' }}>
          {submitting ? t('submitting') : `🚨 ${t('submit_report')}`}
        </button>
      </form>
    </div>
  )
}
