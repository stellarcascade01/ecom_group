import React, { useState } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'
import landingImg from '../assets/hero3.jpg'

export default function Login({ onSuccess }){
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      const res = await fetch('http://localhost:5000/api/auth/login',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ identifier, password })
      })
      const data = await res.json()
      if(!res.ok){ throw new Error(data?.message || 'Login failed') }
      localStorage.setItem('user', JSON.stringify(data.user))
      onSuccess && onSuccess(data.user)
    }catch(err){
      setError(err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <main className="page landing-page">
      <section className="landing-hero" aria-label="Login">
        <div className="landing-hero__content">
          <div className="landing-hero__text">
            <div className="auth-card">
              <div className="auth-header">
                <p className="eyebrow">{t('welcomeBack')}</p>
                <h2>{t('signIn')}</h2>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="error auth-error">{error}</div>}

                <label>
                  {t('emailOrPhone')}
                  <input type="text" value={identifier} onChange={e=>setIdentifier(e.target.value)} required />
                </label>

                <label>
                  {t('password')}
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                </label>

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="btn-loader" aria-live="polite" aria-busy="true">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                      <span style={{ marginLeft: 6 }}>{t('signingIn')}</span>
                    </span>
                  ) : t('login')}
                </Button>
              </form>
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
