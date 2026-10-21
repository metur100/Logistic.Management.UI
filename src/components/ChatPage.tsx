import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Loader2, MessageSquare, RefreshCw, Send,
} from 'lucide-react'
import api, { apiError } from '../api/axios'
import type { Message, Thread } from '../lib/types'
import { formatTime } from '../lib/format'
import { Avatar, EmptyState, PageHeader, PageLoader, SearchInput } from './ui'

export default function ChatPage({ role }: { role: 'manager' | 'driver' }) {
  const { t, i18n } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [withId, setWithId] = useState<number | null>(() => {
    const raw = params.get('with')
    return raw ? Number(raw) : null
  })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await api.get<Thread[]>('/messages/threads')
      setThreads(data)
      setError('')
      return data
    } catch (err) {
      setError(apiError(err))
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadThreads().then(data => {
      if (withId === null && data.length > 0 && window.innerWidth > 860) {
        setWithId(data[0].userId)
      }
    })
  }, [loadThreads, withId])

  const loadMessages = useCallback(async () => {
    if (withId === null) return
    try {
      const { data } = await api.get<Message[]>('/messages', { params: { withUserId: withId } })
      setMessages(data)
      await api.post(`/messages/mark-read?withUserId=${withId}`).catch(() => { })
      setThreads(prev => prev.map(th => th.userId === withId ? { ...th, unread: 0 } : th))
    } catch (err) {
      setError(apiError(err))
    }
  }, [withId])

  useEffect(() => {
    if (withId === null) { setMessages([]); return }
    loadMessages()
    const id = window.setInterval(loadMessages, 8000)
    return () => window.clearInterval(id)
  }, [withId, loadMessages])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  const select = (id: number) => {
    setWithId(id)
    if (role) setParams({ with: String(id) }, { replace: true })
  }

  const back = () => {
    setWithId(null)
    setParams({}, { replace: true })
  }

  const send = async () => {
    if (!draft.trim() || withId === null || sending) return
    setSending(true)
    try {
      await api.post('/messages', { content: draft.trim(), toUserId: withId })
      setDraft('')
      await loadMessages()
      await loadThreads()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSending(false)
    }
  }

  const active = threads.find(th => th.userId === withId) ?? null
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return threads
    return threads.filter(th => th.fullName.toLowerCase().includes(q) || (th.lastMessage ?? '').toLowerCase().includes(q))
  }, [threads, search])

  if (loading) return <PageLoader />

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('messages.eyebrow')}
        title={t('messages.title')}
        description={role === 'driver' ? t('messages.driver_sub') : t('messages.manager_sub')}
        actions={<button className="btn btn-outline" onClick={() => { loadThreads(); loadMessages() }}><RefreshCw size={15} /> {t('common.refresh')}</button>}
      />

      {error && <div className="alert error mb-3">{error}</div>}

      <div className={`card chat ${withId !== null ? 'mobile-thread' : ''}`}>
        <aside className="chat-list">
          <div className="chat-list-head">
            <SearchInput value={search} onChange={setSearch} placeholder={t('messages.search_contacts')} />
          </div>
          <div className="chat-threads">
            {filtered.length === 0 ? (
              <EmptyState icon={MessageSquare} title={t('messages.no_contacts')} text={t('messages.no_contacts_text')} />
            ) : filtered.map(thread => (
              <button
                key={thread.userId}
                className={`thread ${thread.userId === withId ? 'active' : ''}`}
                onClick={() => select(thread.userId)}
              >
                <Avatar name={thread.fullName} size="sm" tone={thread.role === 'Manager' ? 'violet' : 'orange'} />
                <span className="meta">
                  <strong>{thread.fullName}</strong>
                  <span>{thread.lastMessage ?? t('messages.start_conversation')}</span>
                </span>
                {thread.unread > 0 && <span className="unread">{thread.unread}</span>}
                {thread.lastMessageAt && <span className="tiny faint nowrap">{formatTime(thread.lastMessageAt, i18n.language)}</span>}
              </button>
            ))}
          </div>
        </aside>

        {active ? (
          <section className="chat-main">
            <header className="chat-head">
              <button className="btn btn-ghost btn-icon chat-back" onClick={back} aria-label={t('common.back')}>
                <ArrowLeft size={16} />
              </button>
              <Avatar name={active.fullName} size="sm" tone={active.role === 'Manager' ? 'violet' : 'orange'} />
              <div className="meta">
                <strong>{active.fullName}</strong>
                <span>{active.role === 'Manager' ? t('role.manager') : t('role.driver')}{active.phone ? ` · ${active.phone}` : ''}</span>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={loadMessages} aria-label={t('common.refresh')}><RefreshCw size={15} /></button>
            </header>

            <div className="chat-body" ref={bodyRef}>
              {messages.length === 0 ? (
                <div className="empty" style={{ padding: '34px 16px' }}>
                  <div className="ico"><MessageSquare /></div>
                  <h3>{t('messages.empty_title')}</h3>
                  <p>{t('messages.empty_text')}</p>
                </div>
              ) : messages.map(msg => (
                <div className={`msg-row ${msg.isFromDriver === (role === 'driver') ? 'mine' : ''}`} key={msg.id}>
                  <div className="msg">
                    {msg.content}
                    <div className="time">{formatTime(msg.createdAt, i18n.language)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-compose">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={t('messages.placeholder')}
                rows={1}
                maxLength={4000}
              />
              <button className="btn btn-primary btn-icon" onClick={send} disabled={!draft.trim() || sending} aria-label={t('messages.send')}>
                {sending ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> : <Send size={16} />}
              </button>
            </div>
          </section>
        ) : (
          <section className="chat-main">
            <div className="chat-empty">
              <EmptyState icon={MessageSquare} title={t('messages.select_title')} text={t('messages.select_text')} />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

