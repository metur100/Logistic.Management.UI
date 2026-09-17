import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SupportTicketForm from '../../components/SupportTicketForm'
import MyTicketsList from '../../components/MyTicketsList'

export default function SupportPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'mine' | 'new'>('mine')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', color: '#fff', marginBottom: '1.25rem', boxShadow: '0 6px 20px rgba(37,99,235,.3)' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>🎫 {t('support')}</h1>
        <p style={{ opacity: .85, fontSize: '.82rem', margin: 0 }}>{t('support_subtitle')}</p>
      </div>

      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
        {(['mine', 'new'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{
            flex: 1, padding: '.6rem', borderRadius: 'var(--radius)', fontWeight: 700,
            fontSize: '.88rem', cursor: 'pointer', transition: 'all .15s',
            background: tab === tb ? 'var(--primary)' : 'var(--surface)',
            color: tab === tb ? '#fff' : 'var(--text-muted)',
            border: tab === tb ? 'none' : '1.5px solid var(--border)',
          }}>
            {tb === 'mine' ? `📋 ${t('my_tickets')}` : `➕ ${t('new_ticket')}`}
          </button>
        ))}
      </div>

      {tab === 'mine' && <MyTicketsList refreshKey={refreshKey} />}
      {tab === 'new' && <SupportTicketForm onCreated={() => { setRefreshKey(k => k + 1); setTab('mine') }} />}
    </div>
  )
}
