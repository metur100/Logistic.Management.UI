import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface Driver {
  id: number
  fullName: string
  unreadCount: number
}

interface Message {
  id: number
  content: string
  isFromDriver: boolean
  createdAt: string
  isRead: boolean
  senderName?: string
}

export default function MessagesPage() {
  const { t } = useTranslation()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(true)
  const [showDriverList, setShowDriverList] = useState(true)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load driver list with unread counts
  const loadDrivers = () => {
    api.get('/messages/my-threads')
      .then(r => setDrivers(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadingDrivers(false))
  }

  useEffect(() => {
    loadDrivers()
    // Refresh driver list (unread badges) every 15s
    const iv = setInterval(loadDrivers, 15000)
    return () => clearInterval(iv)
  }, [])

  const loadMessages = (driverId: number) => {
    setLoadingMsgs(true)
    api.get(`/messages?driverId=${driverId}`)
      .then(r => {
        setMessages(r.data)
        api.post(`/messages/mark-read?driverId=${driverId}`)
          .then(() => {
            // Clear unread badge locally after marking read
            setDrivers(prev =>
              prev.map(d => d.id === driverId ? { ...d, unreadCount: 0 } : d)
            )
          })
          .catch(() => {})
      })
      .catch(() => toast.error(t('failed')))
      .finally(() => setLoadingMsgs(false))
  }

  useEffect(() => {
    if (!selectedDriver) return

    loadMessages(selectedDriver.id)

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => loadMessages(selectedDriver.id), 15000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [selectedDriver])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectDriver = (d: Driver) => {
    setSelectedDriver(d)
    setShowDriverList(false)
    setText('')
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !selectedDriver) return
    setSending(true)
    try {
      await api.post('/messages', { content: text, toDriverId: selectedDriver.id })
      setText('')
      loadMessages(selectedDriver.id)
    } catch {
      toast.error(t('error'))
    } finally {
      setSending(false)
    }
  }

  const filteredDrivers = drivers.filter(d =>
    d.fullName.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = drivers.reduce((sum, d) => sum + d.unreadCount, 0)

  return (
    <div>
      <style>{`
        .msg-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.25rem;
          height: calc(100vh - 210px);
          min-height: 420px;
        }
        .msg-driver-list { display: flex; flex-direction: column; }
        .msg-chat-area   { display: flex; flex-direction: column; min-width: 0; }
        .msg-back-btn    { display: none !important; }

        @media (max-width: 750px) {
          .msg-layout { grid-template-columns: 1fr; height: auto; }
          .msg-driver-list {
            display: ${selectedDriver && !showDriverList ? 'none' : 'flex'};
          }
          .msg-chat-area {
            display: ${!selectedDriver || showDriverList ? 'none' : 'flex'};
            height: calc(100vh - 160px);
          }
          .msg-back-btn { display: inline-flex !important; }
        }

        .driver-item {
          display: flex;
          align-items: center;
          gap: .75rem;
          padding: .7rem .85rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          margin-bottom: .25rem;
          transition: background .15s, border-color .15s;
          border: 1px solid transparent;
        }
        .driver-item:hover  { background: var(--surface2); }
        .driver-item.active { background: var(--primary-light); border-color: var(--primary); }

        .driver-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: .95rem;
          flex-shrink: 0;
          position: relative;
        }

        .unread-dot {
          position: absolute;
          top: -2px; right: -2px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid var(--surface);
        }

        .unread-badge {
          background: #ef4444;
          color: #fff;
          border-radius: 999px;
          font-size: .65rem;
          font-weight: 700;
          padding: 2px 7px;
          min-width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .msg-bubble-driver {
          background: var(--surface2);
          color: var(--text);
          border-radius: 16px 16px 16px 4px;
          border: 1px solid var(--border);
        }
        .msg-bubble-admin {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          border-radius: 16px 16px 4px 16px;
        }

        .msg-search {
          width: 100%;
          padding: .5rem .85rem;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--surface2);
          color: var(--text);
          font-size: .85rem;
          outline: none;
          margin-bottom: .75rem;
          box-sizing: border-box;
        }
        .msg-search:focus { border-color: var(--primary); }

        .online-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
        }
      `}</style>

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          💬 {t('messages')}
          {totalUnread > 0 && (
            <span className="unread-badge" style={{ fontSize: '.75rem', padding: '3px 10px' }}>
              {totalUnread}
            </span>
          )}
        </h1>
        <p style={{ opacity: .75, fontSize: '.875rem', marginTop: '.2rem' }}>
          {t('communicate_with_drivers')}
        </p>
      </div>

      <div className="msg-layout">

        {/* ── Driver list ── */}
        <div className="msg-driver-list">
          <div className="card" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            <div style={{
              fontWeight: 700, fontSize: '.72rem',
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '.07em', marginBottom: '.6rem'
            }}>
              {t('drivers')} {drivers.length > 0 && `(${drivers.length})`}
            </div>

            <input
              className="msg-search"
              placeholder={t('search') + '...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {loadingDrivers ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : filteredDrivers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', padding: '1rem 0' }}>
                {search ? t('no_results') : '—'}
              </p>
            ) : (
              filteredDrivers.map(d => (
                <div
                  key={d.id}
                  className={`driver-item ${selectedDriver?.id === d.id ? 'active' : ''}`}
                  onClick={() => selectDriver(d)}
                >
                  <div className="driver-avatar">
                    {d.fullName[0].toUpperCase()}
                    {d.unreadCount > 0 && <span className="unread-dot" />}
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: d.unreadCount > 0 ? 700 : 600,
                      fontSize: '.875rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {d.fullName}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                      {t('driver')}
                    </div>
                  </div>

                  {d.unreadCount > 0 && (
                    <span className="unread-badge">{d.unreadCount}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="msg-chat-area">
          {!selectedDriver ? (
            <div className="card" style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--text-muted)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>💬</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '.4rem' }}>
                  {t('select_driver_to_chat')}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="card" style={{
                marginBottom: '.75rem', padding: '.85rem 1.1rem',
                display: 'flex', alignItems: 'center', gap: '.75rem',
                flexShrink: 0
              }}>
                <button
                  className="msg-back-btn btn btn-ghost btn-icon"
                  onClick={() => setShowDriverList(true)}
                >
                  ←
                </button>

                <div className="driver-avatar" style={{ width: 36, height: 36, fontSize: '.85rem' }}>
                  {selectedDriver.fullName[0].toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>
                    {selectedDriver.fullName}
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <span className="online-dot" />
                    {t('driver')}
                  </div>
                </div>

                <button
                  className="btn btn-ghost btn-icon"
                  title={t('refresh')}
                  onClick={() => loadMessages(selectedDriver.id)}
                  style={{ fontSize: '1rem' }}
                >
                  ↻
                </button>
              </div>

              {/* Messages scroll area */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '.6rem',
                padding: '1rem',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                marginBottom: '.75rem'
              }}>
                {loadingMsgs ? (
                  <div className="loading-spinner"><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
                    <div style={{ fontWeight: 600 }}>{t('no_messages_yet')}</div>
                    <div style={{ fontSize: '.82rem', opacity: .7, marginTop: '.3rem' }}>
                      {t('send_first_message') || 'Send a message to start the conversation'}
                    </div>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: msg.isFromDriver ? 'flex-start' : 'flex-end'
                      }}
                    >
                      {/* Driver avatar on left */}
                      {msg.isFromDriver && (
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '.7rem', fontWeight: 700,
                          flexShrink: 0, marginRight: '.5rem', alignSelf: 'flex-end'
                        }}>
                          {selectedDriver.fullName[0].toUpperCase()}
                        </div>
                      )}

                      <div
                        className={msg.isFromDriver ? 'msg-bubble-driver' : 'msg-bubble-admin'}
                        style={{ maxWidth: '68%', padding: '.75rem 1rem', boxShadow: 'var(--shadow-sm)' }}
                      >
                        <div style={{ fontSize: '.9rem', lineHeight: 1.5 }}>{msg.content}</div>
                        <div style={{
                          fontSize: '.66rem', marginTop: '.3rem',
                          opacity: .6, textAlign: 'right',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'flex-end', gap: '.3rem'
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!msg.isFromDriver && (
                            <span style={{ fontWeight: 700 }}>{msg.isRead ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input form */}
              <form onSubmit={send} style={{ display: 'flex', gap: '.65rem', flexShrink: 0 }}>
                <input
                  className="form-control"
                  placeholder={t('type_message') + '...'}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send(e as unknown as React.FormEvent)
                    }
                  }}
                  style={{ flex: 1, borderRadius: 999, padding: '.65rem 1.25rem' }}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="btn btn-primary"
                  style={{ borderRadius: 999, padding: '.65rem 1.5rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {sending ? '...' : `➤ ${t('send')}`}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
