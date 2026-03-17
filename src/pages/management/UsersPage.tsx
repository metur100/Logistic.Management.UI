import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'

interface User {
  id: number
  fullName: string
  username: string
  role: string
  phone?: string
  licenseNumber?: string
  isActive: boolean
}

interface UserForm {
  fullName: string
  username: string
  password: string
  role: string
  phone: string
  licenseNumber: string
}

const empty: UserForm = {
  fullName: '', username: '', password: '',
  role: 'Driver', phone: '', licenseNumber: ''
}

const ROLE_LABELS: Record<string, string> = {
  Driver: 'role_driver', Manager: 'role_manager', Admin: 'role_admin',
}


const ROLE_META: Record<string, { color: string; bg: string; icon: string }> = {
  Driver:  { color: '#1e40af', bg: '#dbeafe', icon: '🚛' },
  Manager: { color: '#7e22ce', bg: '#f3e8ff', icon: '📋' },
  Admin:   { color: '#9d174d', bg: '#fce7f3', icon: '⚙️' },
}

const ROLES = ['Driver', 'Manager', 'Admin']

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation()
  const m = ROLE_META[role] || { color: '#64748b', bg: 'var(--surface2)', icon: '👤' }
  return (
    <span style={{ background: m.bg, color: m.color, padding: '.18rem .55rem', borderRadius: 999, fontSize: '.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '.25rem' }}>
      {m.icon} {t(ROLE_LABELS[role] || role)}
    </span>
  )
}

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<UserForm>(empty)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () =>
    api.get('/users').then(r => setUsers(r.data)).catch(() => toast.error(t('failed')))
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setEditId(null); setModal(true) }
  const openEdit = (u: User) => {
    setForm({
      fullName: u.fullName, username: u.username, password: '',
      role: u.role, phone: u.phone || '', licenseNumber: u.licenseNumber || ''
    })
    setEditId(u.id)
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editId) {
        await api.put(`/users/${editId}`, {
          fullName: form.fullName, phone: form.phone,
          licenseNumber: form.licenseNumber, isActive: true
        })
      } else {
        await api.post('/users', form)
      }
      toast.success(t('saved'))
      setModal(false)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = async (id: number, active: boolean) => {
    try {
      const u = users.find(x => x.id === id)
      if (!u) return
      await api.put(`/users/${id}`, {
        fullName: u.fullName, phone: u.phone,
        licenseNumber: u.licenseNumber, isActive: !active
      })
      load()
      toast.success(t('updated'))
    } catch { toast.error(t('error')) }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <style>{`
        .users-table-wrap { display: block; overflow-x: auto; }
        .users-cards-wrap { display: none; }
        @media (max-width: 700px) {
          .users-table-wrap { display: none; }
          .users-cards-wrap { display: block; }
        }
        .user-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem;
          margin-bottom: .65rem;
          box-shadow: var(--shadow-sm);
          transition: box-shadow .15s;
        }
        .user-card:hover { box-shadow: var(--shadow); }
        .usr-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.55);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 999;
          padding: 0;
          backdrop-filter: blur(3px);
        }
        .usr-modal-box {
          background: var(--surface);
          border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.25rem;
          width: 100%;
          max-width: 520px;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 -8px 40px rgba(0,0,0,.18);
          animation: usrSlideUp .22s ease;
        }
        @keyframes usrSlideUp {
          from { transform: translateY(60px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 640px) {
          .usr-modal-overlay { align-items: center; padding: 1rem; }
          .usr-modal-box { border-radius: 20px; max-height: 90vh; }
        }
        .usr-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .75rem;
        }
        @media (max-width: 480px) {
          .usr-form-row { grid-template-columns: 1fr; }
          .usr-modal-box { padding: 1.25rem 1rem; }
        }
        .role-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: .5rem;
        }
        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .25rem;
          padding: .6rem .35rem;
          border-radius: 10px;
          border: 2px solid var(--border);
          background: var(--surface2);
          cursor: pointer;
          transition: all .15s;
          font-size: .68rem;
          font-weight: 700;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.2;
        }
        .role-btn:hover:not(.active) {
          border-color: var(--text-muted);
          background: var(--surface);
        }
        .modal-drag-handle {
          width: 40px;
          height: 4px;
          background: var(--border);
          border-radius: 999px;
          margin: 0 auto .75rem;
        }
      `}</style>

      {/* Page header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed, #db2777)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
        color: '#fff', marginBottom: '1.5rem',
        boxShadow: '0 6px 20px rgba(124,58,237,.25)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '.15rem' }}>
            👥 {t('users')}
          </h1>
          <p style={{ opacity: .8, fontSize: '.82rem', margin: 0 }}>
            {users.length} {t('users').toLowerCase()}
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
            background: 'rgba(255,255,255,.2)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.35)',
            borderRadius: 10, padding: '.55rem 1.1rem',
            cursor: 'pointer', fontWeight: 700,
            fontSize: '.875rem', whiteSpace: 'nowrap'
          }}>
           {t('add_user')}
        </button>
      </div>

      {/* Desktop table */}
      <div
        className="users-table-wrap"
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👤</div>
            <div style={{ fontWeight: 600 }}>—</div>
          </div>
        ) : (
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('username')}</th>
                <th>{t('role')}</th>
                <th>{t('phone')}</th>
                <th>{t('license_no')}</th>
                <th>{t('status_label')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>@{u.username}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.licenseNumber || '—'}</td>
                  <td>
                    <span style={{
                      background: u.isActive ? '#dcfce7' : '#fee2e2',
                      color: u.isActive ? '#166534' : '#991b1b',
                      padding: '.18rem .55rem', borderRadius: 999,
                      fontSize: '.72rem', fontWeight: 700
                    }}>
                      {u.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '.3rem .6rem', fontSize: '.75rem' }}
                        onClick={() => openEdit(u)}>
                        {t('edit')}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: '.3rem .6rem', fontSize: '.75rem',
                          color: u.isActive ? '#dc2626' : '#16a34a',
                          borderColor: u.isActive ? '#fca5a5' : '#86efac'
                        }}
                        onClick={() => toggle(u.id, u.isActive)}>
                        {u.isActive ? t('deactivate') : t('activate')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="users-cards-wrap">
        {users.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', textAlign: 'center',
            padding: '3rem 1rem', color: 'var(--text-muted)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👤</div>
            <div style={{ fontWeight: 600 }}>—</div>
          </div>
        ) : users.map(u => {
          const rm = ROLE_META[u.role] || { color: '#64748b', bg: 'var(--surface2)', icon: '👤' }
          return (
            <div key={u.id} className="user-card">
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem', marginBottom: '.6rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: rm.bg, color: rm.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem'
                }}>
                  {rm.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: '.95rem', marginBottom: '.1rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {u.fullName}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.3rem' }}>
                    @{u.username}
                  </div>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    <RoleBadge role={u.role} />
                    <span style={{
                      background: u.isActive ? '#dcfce7' : '#fee2e2',
                      color: u.isActive ? '#166534' : '#991b1b',
                      padding: '.18rem .55rem', borderRadius: 999,
                      fontSize: '.72rem', fontWeight: 700
                    }}>
                      {u.isActive ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              {(u.phone || u.licenseNumber) && (
                <div style={{
                  display: 'flex', gap: '.4rem', flexWrap: 'wrap',
                  marginBottom: '.6rem'
                }}>
                  {u.phone && (
                    <span style={{
                      background: 'var(--surface2)', color: 'var(--text-muted)',
                      padding: '.15rem .5rem', borderRadius: 999,
                      fontSize: '.72rem', fontWeight: 600
                    }}>
                      📞 {u.phone}
                    </span>
                  )}
                  {u.licenseNumber && (
                    <span style={{
                      background: 'var(--surface2)', color: 'var(--text-muted)',
                      padding: '.15rem .5rem', borderRadius: 999,
                      fontSize: '.72rem', fontWeight: 600
                    }}>
                      🪪 {u.licenseNumber}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }}
                  onClick={() => openEdit(u)}>
                  ✏️ {t('edit')}
                </button>
                <button
                  className="btn btn-outline"
                  style={{
                    flex: 1, padding: '.4rem', fontSize: '.8rem',
                    color: u.isActive ? '#dc2626' : '#16a34a',
                    borderColor: u.isActive ? '#fca5a5' : '#86efac'
                  }}
                  onClick={() => toggle(u.id, u.isActive)}>
                  {u.isActive ? `🔒 ${t('deactivate')}` : `✅ ${t('activate')}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      {modal && (
        <div
          className="usr-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="usr-modal-box">

            <div className="modal-drag-handle" />

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '1.25rem'
            }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.1rem' }}>
                  {editId ? `✏️ ${t('edit_user')}` : `👤 ${t('new_user')}`}
                </h2>
                <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {editId ? t('edit_user') : t('add_user')}
                </p>
              </div>
              <button
                onClick={() => setModal(false)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '50%', width: 34, height: 34, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '.9rem', flexShrink: 0
                }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Full name */}
              <div className="form-group">
                <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('full_name_required')}</label>
                <input
                  className="form-control"
                  required
                  placeholder="e.g. Ermin Sacirovic"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                />
              </div>

              {/* New user only fields */}
              {!editId && (
                <>
                  <div className="usr-form-row">
                    <div className="form-group">
                      <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('username_required')}</label>
                      <input
                        className="form-control"
                        required
                        placeholder="e.g. ermin"
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('password_required')}</label>
                      <input
                        className="form-control"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Role — visual selector */}
                  <div className="form-group">
                    <label style={{ fontSize: '.8rem', fontWeight: 700, display: 'block', marginBottom: '.5rem' }}>
                      {t('role')}
                    </label>
                    <div className="role-grid">
{ROLES.map(r => {
  const m = ROLE_META[r]
  const isActive = form.role === r
  return (
    <button
      key={r}
      type="button"
      className={`role-btn${isActive ? ' active' : ''}`}
      onClick={() => setForm({ ...form, role: r })}
      style={isActive ? { borderColor: m.color, background: m.bg, color: m.color } : {}}>
      <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>
      {t(`role_${r.toLowerCase()}`)}
    </button>
  )
})}
                    </div>
                  </div>
                </>
              )}

              {/* Phone + License */}
              <div className="usr-form-row">
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('phone')}</label>
                  <input
                    className="form-control"
                    placeholder="+387 61 123 456"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '.8rem', fontWeight: 700 }}>{t('license_no')}</label>
                  <input
                    className="form-control"
                    placeholder="e.g. TA 213 22"
                    value={form.licenseNumber}
                    onChange={e => setForm({ ...form, licenseNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '1.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ flex: 1, padding: '.7rem', fontSize: '.9rem', fontWeight: 700 }}>
                  {submitting
                    ? t('saving')
                    : editId ? `✏️ ${t('update')}` : `👤 ${t('create')}`}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModal(false)}
                  style={{ padding: '.7rem 1.25rem', fontSize: '.9rem' }}>
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
