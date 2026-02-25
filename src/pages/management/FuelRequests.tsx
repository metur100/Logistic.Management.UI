import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

interface FuelRequest {
  id: number
  tripId: number | null
  litersRequested: number
  pumpName: string | null
  route: string | null
  remarks: string | null
  status: string
  requestedAt: string
}

export default function FuelRequests() {
  const { t } = useTranslation()
  const [items, setItems] = useState<FuelRequest[]>([])
  const [filter, setFilter] = useState('')
  const { user } = useAuth()

  const load = () => {
    const q = filter ? `?status=${filter}` : ''
    api.get(`/fuelrequests${q}`)
      .then(r => setItems(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .catch(() => toast.error(t('failed')))
  }
  useEffect(() => { load() }, [filter])

  const approve = async (id: number, status: string) => {
    try {
      await api.put(`/fuelrequests/${id}/approve`, { status, approvedByUserId: user?.userId })
      load()
      toast.success(status === 'Approved' ? t('request_approved') : t('request_rejected'))
    } catch { toast.error(t('error')) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('fuel_requests')}</h1>
        <select className="form-control" style={{ maxWidth: 180 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">{t('all')}</option>
          <option value="Pending">{t('pending')}</option>
          <option value="Approved">{t('approved')}</option>
          <option value="Rejected">{t('rejected')}</option>
        </select>
      </div>
      <div className="card">
        {items.length === 0
          ? <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>{t('no_fuel_requests')}</p>
          : (
            <table>
              <thead>
                <tr>
                  <th>{t('trip')}</th><th>{t('liters')}</th><th>{t('pump')}</th>
                  <th>{t('route')}</th><th>{t('remarks')}</th><th>{t('status')}</th>
                  <th>{t('requested')}</th><th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(f => (
                  <tr key={f.id}>
                    <td>{f.tripId ? `#${f.tripId}` : '\u2014'}</td>
                    <td style={{ fontWeight: 600 }}>{f.litersRequested} L</td>
                    <td>{f.pumpName || '\u2014'}</td>
                    <td>{f.route || '\u2014'}</td>
                    <td>{f.remarks || '\u2014'}</td>
                    <td><span className={`badge badge-${f.status.toLowerCase()}`}>{f.status}</span></td>
                    <td style={{ fontSize: '.85rem' }}>{new Date(f.requestedAt).toLocaleString()}</td>
                    <td>
                      {f.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                          <button className="btn btn-success" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => approve(f.id, 'Approved')}>{t('approve')}</button>
                          <button className="btn btn-danger" style={{ padding: '.3rem .6rem', fontSize: '.8rem' }} onClick={() => approve(f.id, 'Rejected')}>{t('reject')}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  )
}