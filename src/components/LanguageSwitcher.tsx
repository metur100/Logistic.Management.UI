import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  {
    code: 'bs',
    flag: '🇧🇦',
    label: 'BS'
  },
  {
    code: 'en',
    flag: '🇬🇧',
    label: 'EN'
  }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language === 'bs' ? 'bs' : 'en'

  return (
    <div style={{
      display: 'flex',
      gap: '.3rem',
      background: 'rgba(255,255,255,.08)',
      borderRadius: 999,
      padding: '.25rem'
    }}>
      {LANGUAGES.map(lang => {
        const isActive = current === lang.code
        return (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            title={lang.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '.3rem',
              padding: '.25rem .55rem',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1,
              transition: 'all .15s',
              background: isActive ? 'rgba(255,255,255,.22)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,.45)',
              boxShadow: isActive ? '0 1px 4px rgba(0,0,0,.2)' : 'none'
            }}>
            <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
            <span style={{ fontSize: '.7rem', letterSpacing: '.04em' }}>{lang.label}</span>
          </button>
        )
      })}
    </div>
  )
}
