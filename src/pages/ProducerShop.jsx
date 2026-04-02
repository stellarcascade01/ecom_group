import React, { useState, useEffect } from 'react'
import Button from '../components/Button'
import ProductCard from '../components/ProductCard'
import { t } from '../utils/strings'
import StarRating from '../components/StarRating'
import { apiUrl, fileUrl } from '../utils/api'

export default function ProducerShop({ producerName, products = [], onViewProduct, onNavigate, currentUser }){
  const isBuyer = (currentUser?.role || '').toLowerCase() === 'buyer'
  const [producerProducts, setProducerProducts] = useState([])
  const [producerRating, setProducerRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [producerUser, setProducerUser] = useState(null)

  const closeAbout = () => setAboutOpen(false)

  const getImageUrl = (image) => {
    if (!image) return null
    return fileUrl(image)
  }

  const producerInitials = String(producerName || '?')
    .split(' ')
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if(!producerName) return
    const filtered = (products || []).filter(p => p.producer === producerName)
    const byId = new Map()
    for (const p of filtered) {
      const key = p?.id || p?._id || `${p?.producer || ''}::${p?.name || ''}::${p?.price || ''}`
      if (!byId.has(key)) byId.set(key, p)
    }
    setProducerProducts(Array.from(byId.values()))
    // Stop blocking the page forever if the producer simply has no products.
    setLoading(false)
  }, [producerName, products])

  useEffect(() => {
    if (!producerName) return
    const controller = new AbortController()
    const loadProducerUser = async () => {
      try {
        const res = await fetch(apiUrl('/api/users'), { signal: controller.signal })
        if (!res.ok) return
        const users = await res.json()
        const match = (Array.isArray(users) ? users : []).find(u => {
          const n = String(u?.name || '').toLowerCase()
          return n && n === String(producerName).toLowerCase()
        })
        setProducerUser(match || null)
      } catch {
        setProducerUser(null)
      }
    }
    loadProducerUser()
    return () => controller.abort()
  }, [producerName])

  useEffect(() => {
    if(!producerName) return
    // Calculate rating from products
    if(producerProducts.length > 0){
      const avgRating = producerProducts.reduce((sum, p) => sum + Number(p.ratingAvg || p.rating || 0), 0) / producerProducts.length
      setProducerRating(Math.round(avgRating * 10) / 10)
    } else {
      setProducerRating(0)
    }
  }, [producerName, producerProducts])

  if(loading || !producerName){
    return (
      <main className="page producer-shop">
        <p className="muted">{t('loadingShop')}</p>
      </main>
    )
  }

  return (
    <main className="page producer-shop">
      <section className="hero producer-shop__hero">
        <div>
          <div className="muted" style={{ fontWeight: 700 }}>{t('juteShop')}</div>
          <div className="producer-shop__titleRow">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              <span className="avatar-badge" aria-hidden>
                {producerUser?.avatar ? (
                  <img src={getImageUrl(producerUser.avatar)} alt="" />
                ) : (
                  producerInitials
                )}
              </span>
              <h1 style={{ margin: '0.25rem 0 0.25rem' }}>{t('shopTitle', { name: producerName || '' })}</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAboutOpen(true)}
            >
              {t('aboutProducer')}
            </Button>
          </div>
          <div className="muted">
            {t('productsAvailableCount', { count: producerProducts.length })}
          </div>
          {isBuyer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <StarRating value={producerRating} readOnly size={18} />
              <span className="muted">{t('ratingLabel')}: {producerRating.toFixed(1)}/5</span>
            </div>
          )}
        </div>
        <div>
          <Button variant="outline" onClick={()=>onNavigate && onNavigate('home')}>
            {t('backToMarketplace')}
          </Button>
        </div>
      </section>

      {producerProducts.length === 0 ? (
        <section className="empty-state">
          <p>{t('thisShopHasNoProducts')}</p>
          <Button onClick={()=>onNavigate && onNavigate('home')}>{t('continueShopping')}</Button>
        </section>
      ) : (
        <section className="products-section">
          <div className="grid">
            {producerProducts.map(product => (
              <ProductCard key={product.id} product={product} onView={onViewProduct} currentUser={currentUser} />
            ))}
          </div>
        </section>
      )}

      {aboutOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAbout()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeAbout()
          }}
          tabIndex={-1}
        >
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <div className="muted" style={{ fontWeight: 700 }}>{producerName}</div>
                <h2 style={{ margin: '0.25rem 0 0' }}>{t('aboutThisProducer')}</h2>
              </div>
              <Button variant="outline" size="sm" onClick={closeAbout}>
                {t('close')}
              </Button>
            </div>

            <div className="modal-body producer-shop__columns">
              <div>
                <h3 style={{ marginTop: 0 }}>{t('producerProfile')}</h3>
                <div className="producer-shop__facts">
                  <div><strong>{t('productsLabel')}:</strong> {producerProducts.length}</div>
                  <div><strong>{t('averageRating')}:</strong> {producerRating.toFixed(1)}/5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
