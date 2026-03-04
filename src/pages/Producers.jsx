import React from 'react'
import { t } from '../utils/strings'

export default function Producers(){
  const items = [
    'List products with transparent pricing',
    'Share your production practices and certifications',
    'Get featured in our marketplace'
  ]
  return (
    <main className="page producers-page">
      <h2>{t('marketProducersTitle')}</h2>
      <p>{t('producersIntro')}</p>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
      <p className="cta">{t('contactCTA')}</p>
    </main>
  )
}
