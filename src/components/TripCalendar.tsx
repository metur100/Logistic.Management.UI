import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays, ChevronLeft, ChevronRight, CircleDot, Truck, User,
} from 'lucide-react'
import api, { apiError } from '../api/axios'
import { formatDate, formatTime, toDateInput, getLocale } from '../lib/format'
import {
  Badge, Card, EmptyState, PageHeader, PageLoader, Segmented,
} from '../components/ui'

interface CalendarBlock {
  resourceId: number
  resourceLabel?: string
  tripId: number
  tripNumber: string
  start: string
  end: string
  originLocation: string
  destinationLocation: string
  status: string
}

export default function TripCalendar({ role }: { role: 'manager' | 'driver' }) {
  const { t, i18n } = useTranslation()
  const [resource, setResource] = useState<'vehicle' | 'driver'>('vehicle')
  const [range, setRange] = useState<'7' | '14' | '30'>('14')
  const [start, setStart] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [blocks, setBlocks] = useState<CalendarBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const from = new Date(start)
    const to = new Date(start)
    to.setDate(to.getDate() + Number(range) - 1)
    to.setHours(23, 59, 59, 999)
    api.get<CalendarBlock[]>('/trips/calendar', {
      params: { from: from.toISOString(), to: to.toISOString(), resource },
    }).then(r => { if (active) setBlocks(r.data) })
      .catch(err => { if (active) setError(apiError(err)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [start, range, resource])

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarBlock[]>()
    for (const block of blocks) {
      const key = new Date(block.start).toDateString()
      map.set(key, [...(map.get(key) ?? []), block])
    }
    return [...map.entries()]
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([key, items]) => [new Date(key), items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())] as const)
  }, [blocks])

  const move = (direction: number) => {
    const next = new Date(start)
    next.setDate(next.getDate() + direction * Number(range))
    setStart(next)
  }

  const today = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setStart(d)
  }

  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + Number(range) - 1)
  const rangeLabel = `${formatDate(start.toISOString(), i18n.language)} – ${formatDate(endDate.toISOString(), i18n.language)}`

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('calendar.eyebrow')}
        title={t('calendar.title')}
        description={role === 'driver' ? t('calendar.driver_sub') : t('calendar.manager_sub')}
        actions={
          <div className="btn-group">
            <button className="btn" onClick={() => move(-1)} aria-label={t('calendar.previous')}><ChevronLeft size={15} /></button>
            <button className="btn" onClick={today}>{t('calendar.today')}</button>
            <button className="btn" onClick={() => move(1)} aria-label={t('calendar.next')}><ChevronRight size={15} /></button>
          </div>
        }
      />

      <div className="cal-toolbar">
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: '7', label: t('calendar.week') },
            { value: '14', label: t('calendar.two_weeks') },
            { value: '30', label: t('calendar.month') },
          ]}
        />
        <Segmented
          value={resource}
          onChange={setResource}
          options={[
            { value: 'vehicle', label: t('calendar.by_vehicle') },
            { value: 'driver', label: t('calendar.by_driver') },
          ]}
        />
        <span className="small muted" style={{ marginLeft: 'auto' }}>{rangeLabel}</span>
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      {loading ? <PageLoader /> : (
        <Card>
          {grouped.length === 0 ? (
            <EmptyState icon={CalendarDays} title={t('calendar.empty')} text={t('calendar.empty_text')} />
          ) : (
            <div className="agenda">
              {grouped.map(([date, items]) => (
                <div className="agenda-day" key={date.toISOString()}>
                  <div className="agenda-date">
                    <div className="dow">{new Intl.DateTimeFormat(getLocale(i18n.language), { weekday: 'long' }).format(date)}</div>
                    <div className="day">{date.getDate()}</div>
                    <div className="mon">{new Intl.DateTimeFormat(getLocale(i18n.language), { month: 'short' }).format(date)}</div>
                  </div>
                  <div className="agenda-items">
                    {items.map(item => (
                      <Link key={`${item.tripId}-${item.resourceId}`} to={`/${role === 'manager' ? 'management' : 'driver'}/trips/${item.tripId}`} className={`cal-block status-${item.status}`}>
                        <div className="time">{formatTime(item.start, i18n.language)} – {formatTime(item.end, i18n.language)}</div>
                        <div>
                          <div className="route">{item.originLocation.split(',')[0]} → {item.destinationLocation.split(',')[0]}</div>
                          <div className="res inline">
                            {resource === 'vehicle' ? <Truck size={11} /> : <User size={11} />}
                            {item.resourceLabel ?? '—'} · <CircleDot size={9} /> {item.tripNumber}
                          </div>
                        </div>
                        <Badge tone={item.status === 'InTransit' ? 'green' : item.status === 'Cancelled' ? 'red' : 'slate'}>{t(`status.${item.status}`, item.status)}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
