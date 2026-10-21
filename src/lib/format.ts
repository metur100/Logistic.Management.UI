const localeMap: Record<string, string> = {
  bs: 'bs-BA',
  en: 'en-GB',
}

export function getLocale(language?: string) {
  return localeMap[language ?? 'bs'] ?? 'bs-BA'
}

export function formatDate(value?: string | null, language = 'bs') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatShortDate(value?: string | null, language = 'bs') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: 'short',
  }).format(d)
}

export function formatDateTime(value?: string | null, language = 'bs') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatTime(value?: string | null, language = 'bs') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat(getLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatNumber(value?: number | null, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatTons(value?: number | null) {
  if (!value) return '0 t'
  return `${formatNumber(value, 1)} t`
}

export function formatDistance(value?: number | null, _language = 'bs') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${formatNumber(value, 0)} km`
}

export function shortPlace(value?: string | null) {
  if (!value) return '—'
  return value.split(',')[0].trim() || value
}

export function toDateInput(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

export function toDateTimeInput(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDateTimeInput(value: string) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function mapsUrl(origin?: string | null, destination?: string | null) {
  const params = new URLSearchParams({ api: '1', travelmode: 'driving' })
  if (origin) params.set('origin', origin)
  if (destination) params.set('destination', destination)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function monthLabel(key: number, language = 'bs') {
  const year = Math.floor(key / 100)
  const month = key % 100
  const d = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat(getLocale(language), { month: 'short' }).format(d)
}

export function lastMonthKeys(count = 6) {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1)
    return d.getFullYear() * 100 + d.getMonth() + 1
  })
}

export function initials(name?: string | null) {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

const AVATAR_TONES = ['orange', 'green', 'blue', 'violet', 'amber']
export function avatarTone(name?: string | null) {
  if (!name) return 'orange'
  const sum = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_TONES[sum % AVATAR_TONES.length]
}

export function todayLabel(language = 'bs') {
  return new Intl.DateTimeFormat(getLocale(language), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}
