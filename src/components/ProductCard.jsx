import React, { useEffect, useMemo, useState } from 'react'
import { useCart } from '../cart/useCart'
import Button from './Button'
import CartIcon from './icons/CartIcon'
import HeartIcon from './icons/HeartIcon'
import StarRating from './StarRating'
import { useFavorites } from '../favorites/useFavorites'
import { fileUrl } from '../utils/api'

function PlaceholderImage({title}){
  const initials = title.split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase()
  return (
    <div className="placeholder-image" aria-hidden>
      {initials}
    </div>
  )
}

export default function ProductCard({product, onView, currentUser, showReviews = true}){
  const { addItem } = useCart()
  const { isFavorite, toggle } = useFavorites()
  const [imageFailed, setImageFailed] = useState(false)
  const effectiveUser = currentUser ?? (() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })()
  const isBuyer = (effectiveUser?.role || '').toLowerCase() === 'buyer'
  const canShop = isBuyer || !effectiveUser

  const imageSrc = useMemo(() => {
    const image = product?.image
    if (!image) return null
    return fileUrl(image)
  }, [product?.image])

  useEffect(() => {
    setImageFailed(false)
  }, [imageSrc])

  const price = Number(product?.price || 0)
  const freeShippingEligible = price >= 500
  const offerPercent = price >= 2000 ? 25 : price >= 1000 ? 15 : price >= 500 ? 10 : 0
  const voucherCode = offerPercent > 0 ? 'SUMMER10' : null

  const benefits = [
    offerPercent > 0 ? { key: 'offer', label: `-${offerPercent}%` } : null,
    freeShippingEligible ? { key: 'ship', label: 'Free Shipping' } : null,
    voucherCode ? { key: 'voucher', label: `Voucher ${voucherCode}` } : null
  ].filter(Boolean)

  return (
    <div
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={()=> onView && onView(product)}
      onKeyDown={(e)=>{
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault()
          onView && onView(product)
        }
      }}
    >
      <div className="product-media">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <PlaceholderImage title={product.name || 'Product'} />
        )}

        {offerPercent > 0 && (
          <div className="product-discount" aria-label={`Discount ${offerPercent}%`}>-{offerPercent}%</div>
        )}

        <button
          type="button"
          className={`product-fav ${isFavorite(product.id) ? 'is-active' : ''}`}
          aria-label={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e)=>{ e.stopPropagation(); toggle(product.id) }}
        >
          <HeartIcon size={18} filled={isFavorite(product.id)} />
        </button>
      </div>
      <div className="product-body">
        <h4>{product.name}</h4>
        {product.producer ? <p className="muted">{product.producer}</p> : null}
        {showReviews && (
          <div className="product-rating-row">
            <StarRating value={Number(product.ratingAvg || 0)} readOnly size={16} />
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              ({Number(product.ratingCount || 0)})
            </span>
          </div>
        )}

        {benefits.length > 0 && (
          <div className="product-benefit-row" aria-label="Benefits">
            {benefits.map(b => (
              <span
                key={b.key}
                className={`benefit-pill ${b.key === 'offer' ? 'is-offer' : ''}`}
                title={b.label}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}
        <div className="meta">
          <div className="product-price">
            <span className="price-current">৳ {price.toLocaleString()}</span>
          </div>
          <div>
            {canShop && (
              <>
                <Button
                  size="sm"
                  onClick={(e)=>{ e.stopPropagation(); addItem(product, 1) }}
                  className="add-to-cart-icon-btn"
                  aria-label="Add to cart"
                >
                  <CartIcon size={18} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
