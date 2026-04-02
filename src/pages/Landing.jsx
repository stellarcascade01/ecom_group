import { useEffect, useMemo, useState } from 'react'
import Button from '../components/Button'
import landingImg from '../assets/hero4.png'
import logo from '../assets/logo.png'
import { t } from '../utils/strings'

export default function Landing({ onNavigate }) {
  const WORD_DURATION_MS = 2500
  const words = useMemo(
    () => [
      { lead: t('landingWordFarmingLead'), tail: t('landingWordFarmingTail') },
      { lead: t('landingWordArtisanLead'), tail: t('landingWordArtisanTail') },
      { lead: t('landingWordSustainableLead'), tail: t('landingWordSustainableTail') }
    ],
    [t]
  )

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, WORD_DURATION_MS)
    return () => clearInterval(id)
  }, [words.length, WORD_DURATION_MS])

  const current = words[index]

  const brandText = String(t('brand') || '').trim() || 'ShopSphere'

  return (
    <main className="page landing-page">
      <section className="landing-hero" aria-label="Landing">
        <div
          className="landing-hero__content"
          style={{ '--landing-word-duration': `${WORD_DURATION_MS / 1000}s` }}
        >
          <div className="landing-hero__text">
            <h1 className="landing-hero__title">
              <span className="brand-lockup">
                <span className="brand-mark" aria-hidden>
                  <img className="brand-logo" src={logo} alt="" />
                </span>
                <span className="brand-text">{brandText}</span>
              </span>
            </h1>
            <p className="landing-hero__subtitle">
              {t('landingSubtitle')}{' '}
              <span className="landing-hero__animated" aria-live="polite">
                <span key={index} className="landing-hero__animatedWord">
                  {current.lead}
                  <span className="landing-hero__animatedTail">{current.tail}</span>
                </span>
              </span>
            </p>

            <div className="landing-hero__actions">
              <Button onClick={() => onNavigate && onNavigate('login')}>{t('login')}</Button>
              <Button variant="outline" onClick={() => onNavigate && onNavigate('signup')}>{t('signup')}</Button>
            </div>
          </div>

          <div className="landing-hero__media" aria-hidden>
            <img className="landing-hero__image" src={landingImg} alt="" />
          </div>
        </div>
      </section>
    </main>
  )
}
