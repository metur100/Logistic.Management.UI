import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  Boxes, Loader2, Package, PackageCheck, Pencil, Plus, Trash2, Weight,
} from 'lucide-react'
import api, { apiError } from '../../api/axios'
import type { Cargo } from '../../lib/types'
import { formatDate, formatNumber, formatTons } from '../../lib/format'
import {
  Badge, Card, ConfirmDialog, DataTable, EmptyState, Field, Modal, PageHeader,
  PageLoader, SearchInput, Segmented, Stat, type Column,
} from '../../components/ui'

const TYPES = ['General', 'Fragile', 'Hazardous', 'Perishable', 'Oversized']

const emptyForm = {
  description: '',
  consignor: '',
  consignee: '',
  weightTons: '',
  volumeCbm: '',
  cargoType: 'General',
  specialInstructions: '',
}

export default function CargoPage() {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('all')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get<Cargo[]>('/cargo')
      .then(r => setRows(r.data))
      .catch(err => setError(apiError(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const stats = useMemo(() => ({
    total: rows.length,
    unassigned: rows.filter(c => !c.tripId).length,
    assigned: rows.filter(c => c.tripId).length,
    tons: rows.reduce((sum, c) => sum + (c.weightTons ?? 0), 0),
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(c => {
      if (filter === 'unassigned' && c.tripId) return false
      if (filter === 'assigned' && !c.tripId) return false
      if (!q) return true
      return [c.description, c.consignor, c.consignee, c.cargoType, c.tripNumber]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    })
  }, [rows, filter, search])

  const startCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const startEdit = (cargo: Cargo) => {
    setEditId(cargo.id)
    setForm({
      description: cargo.description,
      consignor: cargo.consignor ?? '',
      consignee: cargo.consignee ?? '',
      weightTons: cargo.weightTons != null ? String(cargo.weightTons) : '',
      volumeCbm: cargo.volumeCbm != null ? String(cargo.volumeCbm) : '',
      cargoType: cargo.cargoType ?? 'General',
      specialInstructions: cargo.specialInstructions ?? '',
    })
    setOpen(true)
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        description: form.description.trim(),
        consignor: form.consignor.trim() || null,
        consignee: form.consignee.trim() || null,
        weightTons: form.weightTons ? Number(form.weightTons) : null,
        volumeCbm: form.volumeCbm ? Number(form.volumeCbm) : null,
        cargoType: form.cargoType,
        specialInstructions: form.specialInstructions.trim() || null,
      }
      if (editId) await api.put(`/cargo/${editId}`, payload)
      else await api.post('/cargo', payload)
      toast.success(editId ? t('cargo.updated') : t('cargo.created'))
      setOpen(false)
      load()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/cargo/${deleteId}`)
      toast.success(t('cargo.deleted'))
      setDeleteId(null)
      load()
    } catch (err) {
      toast.error(apiError(err))
    }
  }

  const columns: Column<Cargo>[] = [
    {
      key: 'description', header: t('cargo.description'), label: t('cargo.description'),
      cell: c => (
        <div>
          <div className="cell-main">{c.description}</div>
          <div className="cell-sub">{c.cargoType ?? 'General'} · {formatDate(c.createdAt, i18n.language)}</div>
        </div>
      ),
    },
    {
      key: 'route', header: t('cargo.consignor_consignee'), label: t('cargo.consignor_consignee'), hideOnMobile: true,
      cell: c => <div><div className="small">{c.consignor ?? '—'}</div><div className="cell-sub">→ {c.consignee ?? '—'}</div></div>,
    },
    {
      key: 'weight', header: t('cargo.weight'), label: t('cargo.weight'),
      cell: c => <span className="mono">{formatTons(c.weightTons)}</span>,
    },
    {
      key: 'volume', header: t('cargo.volume'), label: t('cargo.volume'), hideOnMobile: true,
      cell: c => <span className="mono small">{c.volumeCbm ? `${formatNumber(c.volumeCbm, 1)} m³` : '—'}</span>,
    },
    {
      key: 'trip', header: t('cargo.assignment'), label: t('cargo.assignment'),
      cell: c => c.tripId
        ? <Link to={`/management/trips/${c.tripId}`} className="badge badge-blue">{c.tripNumber ?? t('cargo.assigned')}</Link>
        : <Badge tone="amber" dot>{t('cargo.unassigned')}</Badge>,
    },
    {
      key: 'actions', header: '', label: '', className: 'cell-actions',
      cell: c => (
        <div className="cell-actions">
          <button className="btn btn-ghost btn-icon" onClick={() => startEdit(c)} title={t('common.edit')}><Pencil size={14} /></button>
          <button className="btn btn-ghost btn-icon" onClick={() => setDeleteId(c.id)} title={t('common.delete')}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('cargo.eyebrow')}
        title={t('cargo.title')}
        description={t('cargo.subtitle')}
        actions={<button className="btn btn-primary" onClick={startCreate}><Plus /> {t('cargo.new')}</button>}
      />

      <div className="stat-grid">
        <Stat icon={Boxes} label={t('cargo.total_items')} value={stats.total} />
        <Stat icon={Weight} tone="blue" label={t('cargo.total_weight')} value={formatTons(stats.tons)} />
        <Stat icon={PackageCheck} tone="green" label={t('cargo.assigned')} value={stats.assigned} />
        <Stat icon={Package} tone="amber" label={t('cargo.unassigned')} value={stats.unassigned} />
      </div>

      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'unassigned', label: t('cargo.unassigned') },
            { value: 'assigned', label: t('cargo.assigned') },
          ]}
        />
        <div className="spacer" />
        <SearchInput value={search} onChange={setSearch} placeholder={t('cargo.search')} />
      </div>

      {error && <div className="alert error mb-3">{error}</div>}

      <Card bodyClass="" >
        {loading ? <PageLoader /> : (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={c => c.id}
            empty={
              <EmptyState
                icon={Package}
                title={t('cargo.empty')}
                text={t('cargo.empty_text')}
                action={<button className="btn btn-outline btn-sm" onClick={startCreate}><Plus /> {t('cargo.new')}</button>}
              />
            }
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? t('cargo.edit') : t('cargo.new')}
        description={t('cargo.form_sub')}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setOpen(false)} type="button">{t('common.cancel')}</button>
            <button className="btn btn-primary" type="submit" form="cargo-form" disabled={saving || !form.description.trim()}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin .7s linear infinite' }} /> : null}
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </>
        }
      >
        <form id="cargo-form" onSubmit={save}>
          <Field label={t('cargo.description')} required>
            <input className="input" value={form.description} onChange={set('description')} placeholder={t('cargo.description_placeholder')} required autoFocus />
          </Field>
          <div className="form-grid">
            <Field label={t('cargo.consignor')}>
              <input className="input" value={form.consignor} onChange={set('consignor')} placeholder="Tehnomax d.o.o." />
            </Field>
            <Field label={t('cargo.consignee')}>
              <input className="input" value={form.consignee} onChange={set('consignee')} placeholder="Media Market Sarajevo" />
            </Field>
            <Field label={t('cargo.weight_tons')}>
              <input className="input" type="number" step="0.1" min="0" value={form.weightTons} onChange={set('weightTons')} placeholder="8.5" />
            </Field>
            <Field label={t('cargo.volume_cbm')}>
              <input className="input" type="number" step="0.1" min="0" value={form.volumeCbm} onChange={set('volumeCbm')} placeholder="32" />
            </Field>
            <Field label={t('cargo.type')}>
              <select className="select" value={form.cargoType} onChange={set('cargoType')}>
                {TYPES.map(type => <option key={type} value={type}>{t(`cargo_type.${type.toLowerCase()}`, type)}</option>)}
              </select>
            </Field>
            <Field label={t('cargo.instructions')} className="span-2">
              <textarea className="textarea" value={form.specialInstructions} onChange={set('specialInstructions')} placeholder={t('cargo.instructions_placeholder')} maxLength={1000} />
            </Field>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        danger
        title={t('cargo.delete_title')}
        text={t('cargo.delete_text')}
        confirmLabel={t('common.delete')}
      />
    </div>
  )
}

