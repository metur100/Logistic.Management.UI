import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft, Check, Copy, Eye, EyeOff, Loader2, Search, X,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { avatarTone, initials } from '../lib/format'

/* ── Brand ─────────────────────────────────────────────────── */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 17.5 9.2 6.7a1 1 0 0 1 1.8 0l5.2 10.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.4 13.4h11.2" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
          <circle cx="19.2" cy="6.2" r="2.3" fill="currentColor" />
        </svg>
      </div>
      {!compact && (
        <div>
          <div className="brand-name">Logisti<span>Track</span></div>
          <div className="brand-sub">Transport operations</div>
        </div>
      )}
    </div>
  )
}

/* ── Page header ───────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <>
      {back && (
        <Link to={back.to} className="back-link">
          <ArrowLeft size={14} /> {back.label}
        </Link>
      )}
      <div className="page-head">
        <div className="titles">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          {description && <div className="desc">{description}</div>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </>
  )
}

/* ── Badge / avatar ────────────────────────────────────────── */

export function Badge({
  tone = 'slate',
  dot = false,
  children,
  className = '',
}: {
  tone?: string
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span className={`badge badge-${tone} ${className}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}

export function Avatar({ name, size = '', tone }: { name?: string | null; size?: '' | 'sm' | 'lg'; tone?: string }) {
  return (
    <span className={`avatar ${tone ?? avatarTone(name)} ${size}`.trim()}>
      {initials(name)}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const tones: Record<string, string> = {
    Assigned: 'violet', CargoLoading: 'amber', LoadingComplete: 'blue',
    InTransit: 'green', NearDestination: 'teal', Unloading: 'orange',
    UnloadingComplete: 'blue', DeliveryCompleted: 'green', Cancelled: 'red',
  }
  return <Badge tone={tones[status] ?? 'slate'} dot>{t(`status.${status}`, status)}</Badge>
}

/* ── Stat ──────────────────────────────────────────────────── */

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = '',
  onClick,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: string
  onClick?: () => void
}) {
  return (
    <div
      className="stat"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter') onClick() } : undefined}
    >
      <div className={`icon ${tone}`}><Icon /></div>
      <div>
        <div className="value num">{value}</div>
        <div className="label">{label}</div>
        {hint && <div className="hint">{hint}</div>}
      </div>
    </div>
  )
}

/* ── Card ──────────────────────────────────────────────────── */

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClass = '',
  footer,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
  footer?: ReactNode
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      <div className={`card-body ${bodyClass}`}>{children}</div>
      {footer && <div className="card-foot">{footer}</div>}
    </section>
  )
}

/* ── Empty / loading ───────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="ico"><Icon /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Loading({ text }: { text?: string }) {
  return (
    <div className="loading">
      <div className="spinner" />
      {text && <span>{text}</span>}
    </div>
  )
}

export function PageLoader() {
  const { t } = useTranslation()
  return <Loading text={t('common.loading')} />
}

/* ── Search ────────────────────────────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="search-box">
      <Search />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  )
}

/* ── Field ─────────────────────────────────────────────────── */

export function Field({
  label,
  required,
  hint,
  error,
  children,
  htmlFor,
  className = '',
}: {
  label?: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  htmlFor?: string
  className?: string
}) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {error ? <span className="error">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}

/* ── Modal ─────────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = '',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: '' | 'wide' | 'small'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal ${size}`.trim()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="grow">
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel,
  danger = false,
  busy = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  text?: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>{t('common.cancel')}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 size={15} className="spin" />}
            {confirmLabel ?? t('common.confirm')}
          </button>
        </>
      }
    >
      {text && <p className="small muted">{text}</p>}
    </Modal>
  )
}

/* ── Copy ──────────────────────────────────────────────────── */

export function CopyButton({
  value,
  label,
  className = 'btn btn-outline btn-sm',
  onCopied,
}: {
  value: string
  label?: string
  className?: string
  onCopied?: () => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const el = document.createElement('textarea')
      el.value = value
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      el.remove()
    }
    setCopied(true)
    toast.success(t('common.copied'))
    onCopied?.()
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label ?? (copied ? t('common.copied') : t('common.copy'))}
    </button>
  )
}

/* ── Language select ───────────────────────────────────────── */

export function LanguageSelect({ dark = false }: { dark?: boolean }) {
  const { i18n } = useTranslation()
  return (
    <select
      className={dark ? 'select-mini' : 'select'}
      style={dark ? undefined : { height: 34, width: 100, fontSize: 11.5 }}
      value={i18n.language.startsWith('bs') ? 'bs' : 'en'}
      onChange={e => {
        i18n.changeLanguage(e.target.value)
        localStorage.setItem('lang', e.target.value)
      }}
      aria-label="Language"
    >
      <option value="bs">BS</option>
      <option value="en">EN</option>
    </select>
  )
}

/* ── Data table ────────────────────────────────────────────── */

export interface Column<T> {
  key: string
  header: ReactNode
  label?: string
  cell: (row: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
  width?: string
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  empty,
  loading = false,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  empty?: ReactNode
  loading?: boolean
}) {
  if (loading) return <Loading />
  if (!rows.length) return <>{empty}</>

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={col.hideOnMobile ? 'hide-mobile' : ''} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? 'is-clickable' : ''}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  data-label={col.label ?? (typeof col.header === 'string' ? col.header : '')}
                  className={`${col.className ?? ''} ${col.hideOnMobile ? 'hide-mobile' : ''}`.trim()}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Segmented ─────────────────────────────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="btn-group" role="tablist">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          role="tab"
          aria-selected={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ── Small spinner for buttons ─────────────────────────────── */

export function InlineSpinner() {
  return <Loader2 size={15} className="spin" style={{ animation: 'spin .7s linear infinite' }} />
}

/* ── Password field ────────────────────────────────────────── */

export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  const generated = useId()
  const [show, setShow] = useState(false)
  return (
    <div className="input-wrap">
      <input
        id={id ?? generated}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="trailing"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

