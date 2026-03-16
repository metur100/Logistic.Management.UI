import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Message {
  id: number
  content: string
  isFromDriver: boolean
  createdAt: string
  isRead: boolean
  senderName?: string
}

export default function DriverMessages() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = () => {
    api.get('/messages')
      .then(r => {
        setMessages(r.data)
        // Mark as read
        api.post('/messages/mark-read').catch(() => {})
      })
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await api.post('/messages', { content: text })
      setText('')
      load()
    } catch { toast.error(t('error')) }
    finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>💬 {t('messages')}</h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.25rem' }}>{t('chat_with_dispatch')}</p>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: '.75rem', padding: '1rem',
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', marginBottom: '1rem'
      }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <div>{t('no_messages_yet')}</div>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: msg.isFromDriver ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '75%',
                background: msg.isFromDriver
                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  : 'var(--surface2)',
                color: msg.isFromDriver ? '#fff' : 'var(--text)',
                borderRadius: msg.isFromDriver
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                padding: '.75rem 1rem',
                border: msg.isFromDriver ? 'none' : '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {!msg.isFromDriver && msg.senderName && (
                  <div style={{ fontSize: '.7rem', fontWeight: 700, marginBottom: '.3rem', opacity: .7 }}>
                    {msg.senderName}
                  </div>
                )}
                <div style={{ fontSize: '.9rem', lineHeight: 1.5 }}>{msg.content}</div>
                <div style={{
                  fontSize: '.68rem', marginTop: '.35rem',
                  opacity: .65, textAlign: 'right'
                }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.isFromDriver && (
                    <span style={{ marginLeft: '.35rem' }}>{msg.isRead ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{ display: 'flex', gap: '.75rem' }}>
        <input
          className="form-control"
          placeholder={t('type_message')}
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ flex: 1, borderRadius: 999, padding: '.65rem 1.25rem' }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn btn-primary"
          style={{ borderRadius: 999, padding: '.65rem 1.5rem' }}>
          {sending ? '...' : '➤'}
        </button>
      </form>
    </div>
  )
}
