import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarTripBlock } from '../api/calendar'
import { STATUS_COLORS, STATUS_LABELS } from '../api/driver/driver'

interface TransportTimelineProps {
  blocks: CalendarTripBlock[]
  loading: boolean
  rangeStart: Date
  days: number
  onBlockClick: (tripId: number) => void
}

interface ResourceRow {
  resourceId: string
  resourceLabel: string
  trips: CalendarTripBlock[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function dayIndex(date: Date, rangeStart: Date): number {
  return Math.floor((startOfDay(date).getTime() - rangeStart.getTime()) / MS_PER_DAY)
}

function shortLoc(s: string): string {
  if (!s) return '—'
  return s.length > 14 ? s.slice(0, 13) + '…' : s
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function TransportTimeline({ blocks, loading, rangeStart, days, onBlockClick }: TransportTimelineProps) {
  const { t, i18n } = useTranslation()
  const today = startOfDay(new Date())
  const start = startOfDay(rangeStart)

  const columns: Date[] = Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * MS_PER_DAY))

  const dowFmt = new Intl.DateTimeFormat(i18n.language === 'bs' ? 'bs-BA' : 'en-GB', { weekday: 'short' })
  const dateFmt = new Intl.DateTimeFormat(i18n.language === 'bs' ? 'bs-BA' : 'en-GB', { day: '2-digit', month: '2-digit' })

  // Group blocks into resource rows
  const rowMap = new Map<string, ResourceRow>()
  blocks.forEach(b => {
    const key = String(b.resourceId)
    if (!rowMap.has(key)) rowMap.set(key, { resourceId: key, resourceLabel: b.resourceLabel, trips: [] })
    rowMap.get(key)!.trips.push(b)
  })
  const rows = Array.from(rowMap.values()).sort((a, b) => a.resourceLabel.localeCompare(b.resourceLabel))

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  if (rows.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', textAlign: 'center',
        padding: '3rem 1rem', color: 'var(--text-muted)'
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗓️</div>
        <div style={{ fontWeight: 600 }}>{t('calendar_no_trips')}</div>
      </div>
    )
  }

  const minColWidth = days <= 3 ? 220 : days <= 7 ? 130 : 90
  const labelWidth = 170

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden'
    }}>
      <style>{`
        .tt-scroll { overflow-x: auto; }
        .tt-grid {
          display: grid;
          grid-template-columns: ${labelWidth}px repeat(${days}, minmax(${minColWidth}px, 1fr));
          min-width: ${labelWidth + days * minColWidth}px;
        }
        .tt-header-label, .tt-header-day {
          background: var(--surface2);
          padding: .55rem .65rem;
          font-size: .68rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .04em;
          border-bottom: 2px solid var(--border);
          border-right: 1px solid var(--border);
          text-align: center;
        }
        .tt-header-label { position: sticky; left: 0; z-index: 3; text-align: left; }
        .tt-resource-cell {
          padding: .65rem .75rem;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          font-weight: 700;
          font-size: .82rem;
          display: flex;
          align-items: center;
          position: sticky; left: 0;
          background: var(--surface);
          z-index: 2;
        }
        .tt-track {
          display: grid;
          grid-template-columns: repeat(${days}, 1fr);
          grid-auto-flow: row dense;
          grid-auto-rows: minmax(46px, auto);
          border-bottom: 1px solid var(--border);
          position: relative;
        }
        .tt-track-cell {
          border-right: 1px solid var(--border);
          grid-row: 1 / -1;
        }
        .tt-block {
          margin: 4px 3px;
          border-radius: 8px;
          padding: .3rem .5rem;
          color: #fff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: .1rem;
          min-width: 0;
          box-shadow: var(--shadow-sm);
          transition: transform .1s, box-shadow .1s;
        }
        .tt-block:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
        .tt-block-top { display: flex; justify-content: space-between; gap: .3rem; font-weight: 700; font-size: .72rem; }
        .tt-block-bottom { font-size: .64rem; opacity: .9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      `}</style>

      <div className="tt-scroll">
        <div className="tt-grid">
          {/* Header row */}
          <div className="tt-header-label">{t('calendar_resource')}</div>
          {columns.map((d, i) => {
            const isToday = d.getTime() === today.getTime()
            return (
              <div key={i} className="tt-header-day" style={isToday ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
                {dowFmt.format(d)}<br />{dateFmt.format(d)}
              </div>
            )
          })}

          {/* Resource rows */}
          {rows.map(row => (
            <Fragment key={row.resourceId}>
              <div className="tt-resource-cell">{row.resourceLabel}</div>
              <div className="tt-track" style={{ gridColumn: `2 / span ${days}` }}>
                {columns.map((_, i) => (
                  <div key={i} className="tt-track-cell" style={{ gridColumn: i + 1 }} />
                ))}
                {row.trips.map(trip => {
                  const s = new Date(trip.start)
                  const e = new Date(trip.end)
                  let colStart = dayIndex(s, start)
                  let colEnd = dayIndex(e, start)
                  if (colEnd < colStart) colEnd = colStart
                  colStart = Math.max(0, Math.min(colStart, days - 1))
                  colEnd = Math.max(0, Math.min(colEnd, days - 1))
                  const span = colEnd - colStart + 1
                  const color = STATUS_COLORS[trip.status] || '#64748b'
                  return (
                    <div
                      key={trip.tripId}
                      className="tt-block"
                      title={`${trip.tripNumber}: ${trip.originLocation} → ${trip.destinationLocation} (${STATUS_LABELS[trip.status]?.[i18n.language === 'bs' ? 'bs' : 'en'] || trip.status})`}
                      style={{ gridColumn: `${colStart + 1} / span ${span}`, background: color }}
                      onClick={() => onBlockClick(trip.tripId)}>
                      <div className="tt-block-top">
                        <span>{shortLoc(trip.originLocation)}</span>
                        <span>{shortLoc(trip.destinationLocation)}</span>
                      </div>
                      <div className="tt-block-bottom">{trip.tripNumber} · {fmtTime(trip.start)}–{fmtTime(trip.end)}</div>
                    </div>
                  )
                })}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
