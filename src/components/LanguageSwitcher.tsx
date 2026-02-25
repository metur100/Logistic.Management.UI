import { useTranslation } from 'react-i18next'
import type { CSSProperties } from 'react'

interface Props {
  style?: CSSProperties
}

export default function LanguageSwitcher({ style = {} }: Props) {
  const { i18n } = useTranslation()

  const toggle = () => {
    const next = i18n.language === 'en' ? 'bs' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <button
      onClick={toggle}
      style={{
        background: 'rgba(255,255,255,.15)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,.3)',
        borderRadius: 8,
        padding: '.35rem .75rem',
        cursor: 'pointer',
        fontSize: '.85rem',
        fontWeight: 600,
        ...style
      }}
    >
      {i18n.language === 'en' ? '🇧🇦 BS' : '🇬🇧 EN'}
    </button>
  )
}
