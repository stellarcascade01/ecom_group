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
      <div className="product-body">
        <h4>{product.name}</h4>
        <p className="muted">{product.producer}</p>
        {showReviews && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <StarRating value={Number(product.ratingAvg || 0)} readOnly size={16} />
            <span className="muted" style={{ fontSize: '0.9rem' }}>
              ({Number(product.ratingCount || 0)})
            </span>
          </div>
        )}
        <div className="meta">
          <strong>৳ {product.price}</strong>
          <div>
            {canShop && (
              <>
                <button
                  className={`icon-btn ${isFavorite(product.id) ? 'fav-active' : ''}`}
                  aria-label={isFavorite(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={(e)=>{ e.stopPropagation(); toggle(product.id) }}
                >
                  <HeartIcon size={18} filled={isFavorite(product.id)} />
                </button>
                <Button
                  size="sm"
                  onClick={(e)=>{ e.stopPropagation(); addItem(product, 1) }}
                  style={{marginLeft:8}}
                  aria-label="Add to cart"
                >
                  <CartIcon size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
