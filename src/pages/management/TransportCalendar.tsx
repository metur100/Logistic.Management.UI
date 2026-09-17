import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import TransportTimeline from '../../components/TransportTimeline'
import { getTripCalendar, CalendarTripBlock, CalendarResourceType } from '../../api/calendar'

const RANGE_OPTIONS: { days: number; labelKey: string }[] = [
  { days: 1, labelKey: 'calendar_range_1d' },
  { days: 3, labelKey: 'calendar_range_3d' },
  { days: 7, labelKey: 'calendar_range_week' },
  { days: 30, labelKey: 'calendar_range_month' },
]

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

export default function TransportCalendar() {
  const { t, i18n } = useTranslation()
  const nav = useNavigate()
  const [rangeStart, setRangeStart] = useState(() => startOfDay(new Date()))
  const [days, setDays] = useState(3)
  const [resource, setResource] = useState<CalendarResourceType>('vehicle')
  const [blocks, setBlocks] = useState<CalendarTripBlock[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const from = format(rangeStart, 'yyyy-MM-dd')
    const to = format(new Date(rangeStart.getTime() + days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    getTripCalendar(from, to, resource)
      .then(r => setBlocks(Array.isArray(r) ? r : []))
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
  }, [rangeStart, days, resource, t])

  useEffect(() => { load() }, [load])

  const shift = (dir: 1 | -1) => {
    setRangeStart(prev => new Date(prev.getTime() + dir * days * 24 * 60 * 60 * 1000))
  }

  const rangeEnd = new Date(rangeStart.getTime() + (days - 1) * 24 * 60 * 60 * 1000)
  const dateFmt = (d: Date) => format(d, i18n.language === 'bs' ? 'dd.MM.yyyy' : 'MM/dd/yyyy')

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .cal-toolbar { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
        .cal-pill-group { display: flex; gap: .3rem; background: var(--surface2); border-radius: 999px; padding: .2rem; }
        .cal-pill {
          padding: .35rem .8rem; border-radius: 999px; border: none; cursor: pointer;
          font-size: .78rem; font-weight: 700; background: transparent; color: var(--text-muted);
          transition: all .15s; white-space: nowrap;
        }
        .cal-pill.active { background: var(--primary); color: #fff; }
        @media (max-width: 700px) { .cal-toolbar { flex-direction: column; align-items: stretch; } }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e, #0369a1)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.25rem',
        boxShadow: '0 6px 20px rgba(3,105,161,.25)',
      }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
          🗓️ {t('transport_calendar')}
        </h1>
        <p style={{ opacity: .85, fontSize: '.82rem', margin: 0 }}>
          {dateFmt(rangeStart)} – {dateFmt(rangeEnd)}
        </p>
      </div>

      {/* Toolbar */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '.85rem 1rem',
        marginBottom: '1rem', boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="cal-toolbar">
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <button className="btn btn-outline" style={{ padding: '.4rem .7rem' }} onClick={() => shift(-1)}>←</button>
            <button className="btn btn-outline" style={{ padding: '.4rem .9rem' }} onClick={() => setRangeStart(startOfDay(new Date()))}>{t('calendar_today')}</button>
            <button className="btn btn-outline" style={{ padding: '.4rem .7rem' }} onClick={() => shift(1)}>→</button>
          </div>

          <div className="cal-pill-group">
            {RANGE_OPTIONS.map(o => (
              <button key={o.days} className={`cal-pill${days === o.days ? ' active' : ''}`} onClick={() => setDays(o.days)}>
                {t(o.labelKey)}
              </button>
            ))}
          </div>

          <div className="cal-pill-group" style={{ marginLeft: 'auto' }}>
            {(['vehicle', 'driver'] as CalendarResourceType[]).map(r => (
              <button key={r} className={`cal-pill${resource === r ? ' active' : ''}`} onClick={() => setResource(r)}>
                {r === 'vehicle' ? `🚛 ${t('calendar_resource_vehicles')}` : `👤 ${t('calendar_resource_drivers')}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <TransportTimeline
        blocks={blocks}
        loading={loading}
        rangeStart={rangeStart}
        days={days}
        onBlockClick={(tripId) => nav(`/management/trips/${tripId}`)}
      />
    </div>
  )
}
