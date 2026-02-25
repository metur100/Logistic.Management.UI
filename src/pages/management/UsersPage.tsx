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

const empty: UserForm = { fullName: '', username: '', password: '', role: 'Driver', phone: '', licenseNumber: '' }

export default function UsersPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [modal, setModal] = useState<boolean>(false)
  const [form, setForm] = useState<UserForm>(empty)
  const [editId, setEditId] = useState<number | null>(null)

  const load = () => api.get('/users').then(r => setUsers(r.data)).catch(() => toast.error(t('failed')))
  useEffect(() => { load() }, [])

  const openNew = () => { setForm(empty); setEditId(null); setModal(true) }

  const openEdit = (u: User) => {
    setForm({ fullName: u.fullName, username: u.username, password: '', role: u.role, phone: u.phone || '', licenseNumber: u.licenseNumber || '' })
    setEditId(u.id)
    setModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editId) await api.put(`/users/${editId}`, { fullName: form.fullName, phone: form.phone, licenseNumber: form.licenseNumber, isActive: true })
      else await api.post('/users', form)
      toast.success(t('saved'))
      setModal(false)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e.response?.data?.message || t('error'))
    }
  }

  const toggle = async (id: number, active: boolean) => {
    try {
      const u = users.find(x => x.id === id)
      if (!u) return
      await api.put(`/users/${id}`, { fullName: u.fullName, phone: u.phone, licenseNumber: u.licenseNumber, isActive: !active })
      load()
      toast.success(t('updated'))
    } catch { toast.error(t('error')) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('users')}</h1>
        <button className="btn btn-primary" onClick={openNew}>{t('add_user')}</button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>{t('name')}</th><th>{t('username')}</th><th>{t('role')}</th>
              <th>{t('phone')}</th><th>{t('license_no')}</th><th>{t('status_label')}</th><th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                <td>{u.username}</td>
                <td>
                  <span className="badge" style={{ background: u.role === 'Driver' ? '#dbeafe' : '#f3e8ff', color: u.role === 'Driver' ? '#1e40af' : '#7e22ce' }}>{u.role}</span>
                </td>
                <td>{u.phone || '—'}</td>
                <td>{u.licenseNumber || '—'}</td>
                <td>
                  <span className="badge" style={{ background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#166534' : '#991b1b' }}>
                    {u.isActive ? t('active') : t('inactive')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-outline" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => openEdit(u)}>{t('edit')}</button>
                    <button className="btn btn-outline" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => toggle(u.id, u.isActive)}>
                      {u.isActive ? t('deactivate') : t('activate')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>{editId ? t('edit_user') : t('new_user')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>{t('full_name_required')}</label>
                <input className="form-control" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>
              {!editId && <>
                <div className="form-group">
                  <label>{t('username_required')}</label>
                  <input className="form-control" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('password_required')}</label>
                  <input className="form-control" type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('role')}</label>
                  <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option>Driver</option><option>Manager</option><option>Admin</option>
                  </select>
                </div>
              </>}
              <div className="form-row">
                <div className="form-group">
                  <label>{t('phone')}</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('license_no')}</label>
                  <input className="form-control" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary">{editId ? t('update') : t('create')}</button>
                <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}