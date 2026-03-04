import React, { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { t } from '../utils/strings'
import heroImg from '../assets/hero.png'
import heroImg3 from '../assets/hero3.jpg'
import heroImg4 from '../assets/hero4.png'

export default function Home({products, onViewProduct, currentUser}){
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const heroImages = [heroImg3,heroImg, heroImg4]
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 2000) 
    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <main className="page home-page">
      <section className="hero-carousel">
        <div className="carousel-container">
          <img 
            src={heroImages[currentSlide]} 
            alt="Jute products and market" 
            className="hero-image carousel-image" 
          />
          <div className="hero-overlay">
            <h2>{t('heroTitle')}</h2>
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
      </section>

      <section style={{marginTop:'1rem'}}>
        <h3>{t('featured')}</h3>
        {/* <p className="section-subtitle">{translatedSubtitle}</p> */}
        <div className="grid">
          {products.map(p=> (
            <ProductCard key={p.id} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={false} />
          ))}
        </div>
      </section>
    </main>
  )
}
