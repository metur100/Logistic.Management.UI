import type { ReactNode } from 'react'
import { Route, ShieldCheck, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Logo, LanguageSelect } from './ui'

export default function AuthLayout({
  eyebrow,
  title,
  lead,
  children,
  footer,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="auth">
      <section className="auth-art">
        <Logo />
        <div className="auth-copy">
          <div className="eyebrow" style={{ color: '#f39a63' }}>{t('auth.art_eyebrow')}</div>
          <h1 style={{ marginTop: 12 }}>
            {t('auth.art_title_1')} <em>{t('auth.art_title_2')}</em>
          </h1>
          <p>{t('auth.art_text')}</p>
          <div className="auth-points">
            <div className="auth-point"><span className="dot"><Route /></span>{t('auth.point_1')}</div>
            <div className="auth-point"><span className="dot"><Truck /></span>{t('auth.point_2')}</div>
            <div className="auth-point"><span className="dot"><ShieldCheck /></span>{t('auth.point_3')}</div>
          </div>
        </div>
        <div className="foot">© {new Date().getFullYear()} LogistiTrack · {t('auth.foot')}</div>
        <svg className="auth-route-svg" viewBox="0 0 420 260" fill="none" aria-hidden="true">
          <path d="M18 228C78 228 86 154 142 154s72 52 124 52 58-86 136-86" stroke="rgba(255,255,255,.22)" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="18" cy="228" r="5" fill="#e8590c" />
          <circle cx="402" cy="120" r="5" fill="#e8590c" />
          <circle cx="142" cy="154" r="4" fill="rgba(255,255,255,.5)" />
          <circle cx="266" cy="206" r="4" fill="rgba(255,255,255,.5)" />
        </svg>
      </section>

      <main className="auth-panel">
        <div className="auth-top">
          <LanguageSelect />
        </div>
        <div className="auth-mobile-brand"><Logo /></div>
        <div className="auth-box">
          <div className="eyebrow">{eyebrow}</div>
          <h2>{title}</h2>
          {lead && <p className="lead">{lead}</p>}
          {children}
          {footer}
          <div className="auth-legal">
            <a href="/privacy">Privacy</a>
            <span>·</span>
            <a href="/delete-account">Delete account</a>
          </div>
        </div>
      </main>
    </div>
  )
}
