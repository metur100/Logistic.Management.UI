import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Admin { id: number; fullName: string; role: string }
interface Message {
  id: number; content: string; isFromDriver: boolean
  createdAt: string; isRead: boolean; senderName?: string
}

export default function DriverMessages() {
  const { t } = useTranslation()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [showList, setShowList] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load available admins
  useEffect(() => {
    api.get('/messages/my-threads')
      .then(r => setAdmins(r.data))
      .catch(() => {})
  }, [])

  const loadMessages = (adminId: number) => {
    setLoadingMsgs(true)
    api.get(`/messages?adminId=${adminId}`)
      .then(r => {
        setMessages(r.data)
        api.post(`/messages/mark-read?adminId=${adminId}`).catch(() => {})
      })
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoadingMsgs(false))
  }

  useEffect(() => {
    if (!selectedAdmin) return
    loadMessages(selectedAdmin.id)
    const iv = setInterval(() => loadMessages(selectedAdmin.id), 15000)
    return () => clearInterval(iv)
  }, [selectedAdmin])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectAdmin = (a: Admin) => {
    setSelectedAdmin(a)
    setShowList(false)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !selectedAdmin) return
    setSending(true)
    try {
      await api.post('/messages', { content: text, toAdminId: selectedAdmin.id })
      setText('')
      loadMessages(selectedAdmin.id)
    } catch { toast.error(t('error')) }
    finally { setSending(false) }
  }

  return (
    <div>
      <style>{`
        .msg-layout { display: grid; grid-template-columns: 220px 1fr; gap: 1.25rem; height: calc(100vh - 220px); min-height: 400px; }
        .msg-list { display: flex; flex-direction: column; }
        .msg-chat { display: flex; flex-direction: column; min-width: 0; }
        .msg-back-btn { display: none; }
        @media (max-width: 700px) {
          .msg-layout { grid-template-columns: 1fr; height: auto; }
          .msg-list { display: ${selectedAdmin && !showList ? 'none' : 'flex'}; }
          .msg-chat { display: ${!selectedAdmin || showList ? 'none' : 'flex'}; height: calc(100vh - 180px); }
          .msg-back-btn { display: flex !important; }
        }
        .contact-item { display: flex; align-items: center; gap: .75rem; padding: .75rem; border-radius: var(--radius-sm); cursor: pointer; margin-bottom: .3rem; transition: all .15s; border: 1px solid transparent; }
        .contact-item:hover { background: var(--surface2); }
        .contact-item.active { background: var(--primary-light); border-color: var(--primary); }
        .avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #3b82f6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .9rem; flex-shrink: 0; }
      `}</style>

      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>💬 {t('messages')}</h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.2rem' }}>{t('chat_with_dispatch')}</p>
      </div>

      <div className="msg-layout">
        {/* Admin list */}
        <div className="msg-list">
          <div className="card" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: '.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.75rem' }}>
              {t('dispatch_team')}
            </div>
            {admins.map(a => (
              <div key={a.id} className={`contact-item ${selectedAdmin?.id === a.id ? 'active' : ''}`} onClick={() => selectAdmin(a)}>
                <div className="avatar">{a.fullName[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{a.fullName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>{a.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="msg-chat">
          {!selectedAdmin ? (
            <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <div style={{ fontWeight: 600 }}>{t('select_contact_to_chat')}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="card" style={{ marginBottom: '.75rem', padding: '.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <button className="msg-back-btn btn btn-ghost btn-icon" onClick={() => setShowList(true)} style={{ display: 'none' }}>←</button>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: '.8rem' }}>{selectedAdmin.fullName[0].toUpperCase()}</div>
                <div style={{ fontWeight: 700, flex: 1 }}>{selectedAdmin.fullName}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{selectedAdmin.role}</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.6rem', padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '.75rem' }}>
                {loadingMsgs ? (
                  <div className="loading-spinner"><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
                    <div>{t('no_messages_yet')}</div>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.isFromDriver ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '72%', padding: '.75rem 1rem', boxShadow: 'var(--shadow-sm)',
                      background: msg.isFromDriver ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'var(--surface2)',
                      color: msg.isFromDriver ? '#fff' : 'var(--text)',
                      borderRadius: msg.isFromDriver ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      border: msg.isFromDriver ? 'none' : '1px solid var(--border)'
                    }}>
                      <div style={{ fontSize: '.9rem', lineHeight: 1.5 }}>{msg.content}</div>
                      <div style={{ fontSize: '.68rem', marginTop: '.3rem', opacity: .6, textAlign: 'right' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.isFromDriver && <span style={{ marginLeft: '.35rem' }}>{msg.isRead ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} style={{ display: 'flex', gap: '.65rem' }}>
                <input className="form-control" placeholder={t('type_message')} value={text} onChange={e => setText(e.target.value)} style={{ flex: 1, borderRadius: 999, padding: '.65rem 1.25rem' }} />
                <button type="submit" disabled={sending || !text.trim()} className="btn btn-primary" style={{ borderRadius: 999, padding: '.65rem 1.4rem' }}>
                  {sending ? '...' : '➤'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
