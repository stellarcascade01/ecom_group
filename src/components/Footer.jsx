import React from 'react'
import { t } from '../utils/strings'

export default function Footer(){
  return (
    <footer className="site-footer">
      <div dangerouslySetInnerHTML={{__html: t('footer', { year: new Date().getFullYear() })}} />
    </footer>
  )
}
