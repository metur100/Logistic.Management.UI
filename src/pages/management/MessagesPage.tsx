import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver { id: number; fullName: string }
interface Message {
  id: number; content: string; isFromDriver: boolean
  createdAt: string; isRead: boolean; senderName?: string
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [showDriverList, setShowDriverList] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get('/users?role=Driver')
      .then(r => setDrivers(Array.isArray(r.data) ? r.data : r.data.data ?? []))
      .catch(() => {})
  }, [])

  const loadMessages = (driverId: number) => {
    setLoadingMsgs(true)
    api.get(`/messages?driverId=${driverId}`)
      .then(r => {
        setMessages(r.data)
        api.post(`/messages/mark-read?driverId=${driverId}`).catch(() => {})
      })
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoadingMsgs(false))
  }

  useEffect(() => {
    if (!selectedDriver) return
    loadMessages(selectedDriver.id)
    const iv = setInterval(() => loadMessages(selectedDriver.id), 15000)
    return () => clearInterval(iv)
  }, [selectedDriver])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectDriver = (d: Driver) => {
    setSelectedDriver(d)
    setShowDriverList(false)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !selectedDriver) return
    setSending(true)
    try {
      await api.post('/messages', { content: text, toDriverId: selectedDriver.id })
      setText('')
      loadMessages(selectedDriver.id)
    } catch { toast.error(t('error')) }
    finally { setSending(false) }
  }

  return (
    <div>
      <style>{`
        .msg-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1.25rem;
          height: calc(100vh - 220px);
          min-height: 400px;
        }
        .msg-driver-list {
          display: flex;
          flex-direction: column;
        }
        .msg-chat-area {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .msg-back-btn { display: none; }
        @media (max-width: 700px) {
          .msg-layout {
            grid-template-columns: 1fr;
            height: auto;
          }
          .msg-driver-list {
            display: ${selectedDriver && !showDriverList ? 'none' : 'flex'};
          }
          .msg-chat-area {
            display: ${!selectedDriver || showDriverList ? 'none' : 'flex'};
            height: calc(100vh - 180px);
          }
          .msg-back-btn { display: flex !important; }
        }
        .driver-item {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .75rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          margin-bottom: .3rem;
          transition: all .15s;
          border: 1px solid transparent;
        }
        .driver-item:hover {
          background: var(--surface2);
        }
        .driver-item.active {
          background: var(--primary-light);
          border-color: var(--primary);
        }
        .driver-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: .9rem;
          flex-shrink: 0;
        }
        .msg-bubble-driver {
          background: var(--surface2);
          color: var(--text);
          border-radius: 16px 16px 16px 4px;
          border: 1px solid var(--border);
        }
        .msg-bubble-manager {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          border-radius: 16px 16px 4px 16px;
        }
      `}</style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>💬 {t('messages')}</h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.2rem' }}>
          {t('communicate_with_drivers')}
        </p>
      </div>

      <div className="msg-layout">

        {/* Driver list */}
        <div className="msg-driver-list">
          <div className="card" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
            <div style={{
              fontWeight: 700, fontSize: '.75rem',
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '.07em', marginBottom: '.75rem'
            }}>
              {t('drivers')}
            </div>
            {drivers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', padding: '1rem' }}>—</p>
            ) : drivers.map(d => (
              <div
                key={d.id}
                className={`driver-item ${selectedDriver?.id === d.id ? 'active' : ''}`}
                onClick={() => selectDriver(d)}>
                <div className="driver-avatar">{d.fullName[0].toUpperCase()}</div>
                <div style={{ fontWeight: 600, fontSize: '.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.fullName}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="msg-chat-area">
          {!selectedDriver ? (
            <div className="card" style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <div style={{ fontWeight: 600 }}>{t('select_driver_to_chat')}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="card" style={{
                marginBottom: '.75rem', padding: '.85rem 1.1rem',
                display: 'flex', alignItems: 'center', gap: '.75rem'
              }}>
                <button
                  className="msg-back-btn btn btn-ghost btn-icon"
                  onClick={() => setShowDriverList(true)}
                  style={{ display: 'none' }}>
                  ←
                </button>
                <div className="driver-avatar" style={{ width: 34, height: 34, fontSize: '.8rem' }}>
                  {selectedDriver.fullName[0].toUpperCase()}
                </div>
                <div style={{ fontWeight: 700, flex: 1 }}>{selectedDriver.fullName}</div>
              </div>

              {/* Messages area */}
              <div style={{
                flex: 1, overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                gap: '.6rem', padding: '1rem',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                marginBottom: '.75rem'
              }}>
                {loadingMsgs ? (
                  <div className="loading-spinner"><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center', color: 'var(--text-muted)',                    margin: 'auto'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
                    <div>{t('no_messages_yet')}</div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} style={{
                      display: 'flex',
                      justifyContent: msg.isFromDriver ? 'flex-start' : 'flex-end'
                    }}>
                      <div
                        className={msg.isFromDriver ? 'msg-bubble-driver' : 'msg-bubble-manager'}
                        style={{ maxWidth: '72%', padding: '.75rem 1rem', boxShadow: 'var(--shadow-sm)' }}>
                        {msg.isFromDriver && (
                          <div style={{ fontSize: '.7rem', fontWeight: 700, marginBottom: '.25rem', opacity: .6 }}>
                            {selectedDriver.fullName}
                          </div>
                        )}
                        <div style={{ fontSize: '.9rem', lineHeight: 1.5 }}>{msg.content}</div>
                        <div style={{ fontSize: '.68rem', marginTop: '.3rem', opacity: .6, textAlign: 'right' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={send} style={{ display: 'flex', gap: '.65rem' }}>
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
                  style={{ borderRadius: 999, padding: '.65rem 1.4rem', whiteSpace: 'nowrap' }}>
                  {sending ? '...' : '➤ ' + t('send')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}