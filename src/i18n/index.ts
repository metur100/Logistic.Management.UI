import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import bs from './bs.json'

/**
 * English is the source language, Bosnian is the second UI language.
 * Keys missing from a language fall back to a readable label derived from the
 * key (e.g. `dashboard.live_operations` → "Live operations"), never a raw key.
 */
const NAMESPACE_LABEL: Record<string, string> = {
  dashboard: 'Dashboard',
  trips: 'Transports',
  trip: 'Transport',
  cargo: 'Cargo',
  fleet: 'Fleet',
  drivers: 'Drivers',
  driver: 'Driver',
  messages: 'Messages',
  incidents: 'Incidents',
  calendar: 'Calendar',
  support: 'Support',
  settings: 'Settings',
  admin: 'Platform',
  auth: 'Account',
  invite: 'Invitation',
  common: 'General',
  nav: 'Navigation',
  role: 'Role',
  status: 'Status',
}

const NAMESPACE_DESCRIPTION: Record<string, string> = {
  dashboard: "Your company's transport operations at a glance.",
  trips: 'All transports for your company.',
  trip: 'Transport details, schedule and cargo.',
  cargo: 'Cargo available for your transports.',
  fleet: 'Vehicles in your company fleet.',
  drivers: 'Your company drivers and invitations.',
  messages: 'Conversations with your team.',
  incidents: 'Reported operational incidents.',
  calendar: 'Transport schedule for the coming weeks.',
  support: 'Help and support tickets.',
  settings: 'Company profile, security and team settings.',
  admin: 'Platform administration and company oversight.',
  auth: 'Sign in or create a company account.',
  invite: 'Activate your driver account.',
  driver: 'Your transports and daily work.',
  common: '',
}

const TERMS: Record<string, string> = {
  smtp: 'SMTP', pod: 'POD', cmr: 'CMR', eta: 'ETA', api: 'API', id: 'ID',
  km: 'km', cbm: 'm³', url: 'URL', ssl: 'SSL', gps: 'GPS',
}

const SUFFIXES = ['_placeholder', '_eyebrow', '_subtitle', '_sub', '_text', '_hint', '_note', '_title', '_done']

function titleWords(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(word => TERMS[word.toLowerCase()] ?? (word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

function humanize(key: string): string {
  const [ns, ...rest] = key.split('.')
  const leaf = rest.join('.') || ns
  const suffix = SUFFIXES.find(s => leaf.endsWith(s)) ?? ''
  const base = suffix ? leaf.slice(0, -suffix.length) : leaf

  if (suffix === '_eyebrow' || suffix === '_title') {
    return base && base !== 'title' ? titleWords(base) : (NAMESPACE_LABEL[ns] ?? titleWords(ns))
  }
  if (suffix === '_sub' || suffix === '_subtitle' || suffix === '_text') {
    return NAMESPACE_DESCRIPTION[ns] ?? titleWords(base)
  }
  if (suffix === '_placeholder') return `Enter ${titleWords(base).toLowerCase()}`
  if (suffix === '_hint' || suffix === '_note') return titleWords(base)
  if (suffix === '_done') return 'Done'

  return titleWords(base)
}

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, bs: { translation: bs } },
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    parseMissingKeyHandler: humanize,
  })

export default i18n
