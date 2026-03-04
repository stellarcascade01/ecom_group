import React, { useState } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'
import landingImg from '../assets/hero3.jpg'

export default function Signup({ onSuccess }){
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')    
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    setError('')

    const trimmedEmail = String(email || '').trim()
    const trimmedPhone = String(phone || '').trim()

    if (!trimmedEmail && !trimmedPhone ) {
      setError(t('emailOrPhoneRequired'))
      return
    }

    setLoading(true)
    try{
      const res = await fetch('https://ecom-group.onrender.com/api/users',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, email, phone, password, role })
      })
      const data = await res.json()
      if(!res.ok){ throw new Error(data?.message || 'Sign up failed') }
      localStorage.setItem('user', JSON.stringify(data))
      onSuccess && onSuccess(data)
    }catch(err){
      setError(err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <main className="page landing-page">
      <section className="landing-hero" aria-label="Signup">
        <div className="landing-hero__content">
          <div className="landing-hero__text">
            <div className="auth-card">
              <div className="auth-header">
                <p className="eyebrow">{t('joinMarketplace')}</p>
                <h2>{t('createAccount')}</h2>
                <p className="muted">{t('sellShareStories')}</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="error auth-error">{error}</div>}

                <label>
                  <span className="auth-label">
                    {t('name')} <span className="req" aria-hidden>*</span>
                  </span>
                  <input type="text" value={name} onChange={e=>setName(e.target.value)} required />
                </label>

                <label>
                  <span className="auth-label">
                    {t('email')} <span className="req" title="Email or phone is required" aria-hidden>*</span>
                  </span>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />
                </label>
                <label>
                  <span className="auth-label">
                    {t('phone')} <span className="req" title="Email or phone is required" aria-hidden>*</span>
                  </span>
                  <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} />
                </label>

                <label>
                  <span className="auth-label">
                    {t('accountType')} <span className="req" aria-hidden>*</span>
                  </span>
                  <select value={role} onChange={e=>setRole(e.target.value)}>
                    <option value="buyer">{t('buyer')}</option>
                    <option value="producer">{t('producer')}</option>
                  </select>
                </label>

                <label>
                  <span className="auth-label">
                    {t('password2')} <span className="req" aria-hidden>*</span>
                  </span>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                </label>

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <span className="btn-loader" aria-live="polite" aria-busy="true">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                      <span style={{ marginLeft: 6 }}>{t('creatingAccount')}</span>
                    </span>
                  ) : t('createBtn')}
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
