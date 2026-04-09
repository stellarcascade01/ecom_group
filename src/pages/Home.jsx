import React, { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { t } from '../utils/strings'
import heroImg from '../assets/hero.png'
import heroImg3 from '../assets/hero3.png'
import heroImg4 from '../assets/hero4.png'

export default function Home({
  products,
  onViewProduct,
  currentUser,
  onSelectCategory,
  onSortChange,
  onResetPrice,
  onResetSearch,
  onNavigate
}){
  const [currentSlide, setCurrentSlide] = useState(0)
  const featuredRef = React.useRef(null)

  const featuredProducts = (products || []).slice(0, 8)
  const allProducts = (products || [])
  
  const heroImages = [heroImg3,heroImg, heroImg4]
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 2000) 
    return () => clearInterval(interval)
  }, [heroImages.length])

  const scrollToFeatured = () => {
    try {
      featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      featuredRef.current?.scrollIntoView()
    }
  }

  const applyPromo = ({ category = null, sort = null, reset = false } = {}) => {
    if (reset) {
      onResetSearch?.()
      onResetPrice?.()
    }
    if (category) onSelectCategory?.(category)
    if (sort) onSortChange?.(sort)
    scrollToFeatured()
  }

  return (
    <main className="page home-page">
      <section className="home-top">
        <div className="hero-carousel home-hero">
          <div className="carousel-container">
          <img 
            src={heroImages[currentSlide]} 
            alt=" products and market" 
            className="hero-image carousel-image" 
          />
            <div className="hero-overlay home-hero-overlay">
              <div className="home-hero-copy">
                <div className="home-hero-eyebrow">{t('featured') || 'Featured'}</div>
                <h2 className="home-hero-title">Big Summer Sale</h2>
                <p className="home-hero-sub">Up to 50% Off</p>
                <div className="home-hero-actions">
                  <button type="button" className="home-hero-cta" onClick={() => (onNavigate ? onNavigate('shop-now') : scrollToFeatured())}>
                    Shop Now
                  </button>
                </div>
              </div>
            </div>
          
          <div className="carousel-dots">
            {heroImages.map((_, index) => (
              <div
                key={index}
                className={`dot ${currentSlide === index ? 'active' : ''}`}
              />
            ))}
          </div>
          </div>
        </div>

        <div className="home-promo-tiles" aria-label="Promotions">
          <button
            type="button"
            className="promo-tile"
            onClick={() => applyPromo({ reset: true })}
          >
            <div className="promo-icon" aria-hidden>🚚</div>
            <div className="promo-text">
              <div className="promo-title">Free Shipping</div>
              <div className="promo-sub">On orders over ৳500</div>
            </div>
          </button>

          <button
            type="button"
            className="promo-tile"
            onClick={() => applyPromo({ category: 'Digital & Deals', sort: 'price-asc', reset: true })}
          >
            <div className="promo-icon" aria-hidden>⚡</div>
            <div className="promo-text">
              <div className="promo-title">Flash Deals</div>
              <div className="promo-sub">Up to 70% Off</div>
            </div>
          </button>

          <button
            type="button"
            className="promo-tile"
            onClick={() => applyPromo({ sort: 'rating-desc' })}
          >
            <div className="promo-icon" aria-hidden>🎁</div>
            <div className="promo-text">
              <div className="promo-title">New Arrivals</div>
              <div className="promo-sub">Latest collection</div>
            </div>
          </button>
        </div>
      </section>

      <section style={{marginTop:'1rem'}} ref={featuredRef}>
        <h3>{t('featured') || 'Featured Products'}</h3>
        {/* <p className="section-subtitle">{translatedSubtitle}</p> */}
        <div className="grid">
          {featuredProducts.map(p=> (
            <ProductCard key={p.id} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={true} />
          ))}
        </div>
      </section>

      <section style={{marginTop:'1.25rem'}}>
        <h3>{t('allProducts') || 'All Products'}</h3>
        <div className="grid">
          {allProducts.map(p=> (
            <ProductCard key={`${p.id}-all`} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={true} />
          ))}
        </div>
      </section>
    </main>
  )
}
