import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ExternalLink, ImagePlus, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import api, { apiError } from '../api/axios'

type DocumentType = 'cmr' | 'delivery-note'

interface Props {
  tripId: number
  type: DocumentType
  title: string
  url?: string | null
  thumbUrl?: string | null
  onChanged: () => void
}

export default function DocumentUpload({ tripId, type, title, url, thumbUrl, onChanged }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState(false)

  const chooseFile = () => inputRef.current?.click()

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t('trip.image_too_large'))
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(t('trip.image_type'))
      return
    }
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post(`/trips/${tripId}/documents/${type}`, form)
      toast.success(t('trip.image_uploaded'))
      onChanged()
    } catch (err) {
      toast.error(apiError(err, t('trip.image_upload_failed')))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`${t('trip.remove_image')}?`)) return
    setRemoving(true)
    try {
      await api.delete(`/trips/${tripId}/documents/${type}`)
      toast.success(t('trip.image_removed'))
      onChanged()
    } catch (err) {
      toast.error(apiError(err))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="doc-upload">
      <div className="doc-preview">
        {thumbUrl ? (
          <a href={url ?? thumbUrl} target="_blank" rel="noreferrer" aria-label={title}>
            <img src={thumbUrl} alt={title} className="doc-thumb" loading="lazy" />
          </a>
        ) : (
          <button type="button" className="doc-empty" onClick={chooseFile} aria-label={t('trip.upload_cmr')}>
            <ImagePlus size={22} />
          </button>
        )}
      </div>
      <div className="doc-body">
        <div className="doc-title">{title}</div>
        <div className="doc-actions">
          {thumbUrl ? (
            <>
              <a className="btn btn-ghost btn-sm" href={url ?? thumbUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> {t('common.open')}
              </a>
              <button type="button" className="btn btn-ghost btn-sm" onClick={chooseFile} disabled={busy}>
                {busy ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />} {t('trip.replace_image')}
              </button>
              <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={remove} disabled={removing}>
                {removing ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} {t('trip.remove_image')}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={chooseFile} disabled={busy}>
              {busy ? <Loader2 size={13} className="spin" /> : <ImagePlus size={13} />}
              {busy ? t('trip.uploading') : type === 'cmr' ? t('trip.upload_cmr') : t('trip.upload_delivery_note')}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={upload}
      />
    </div>
  )
}
