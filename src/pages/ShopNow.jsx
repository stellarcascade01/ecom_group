import React, { useEffect, useMemo, useRef, useState } from 'react'
import ProductCard from '../components/ProductCard'
import { t } from '../utils/strings'
import heroImg3 from '../assets/hero3.png'

const PAGE_SIZE = 24

function safeDateValue(value) {
  const time = value ? new Date(value).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

function pickDistinct(list, usedIds, count) {
  const out = []
  for (const item of list) {
    const id = item?.id || item?._id
    if (!id) continue
    if (usedIds.has(String(id))) continue
    usedIds.add(String(id))
    out.push(item)
    if (out.length >= count) break
  }
  return out
}

export default function ShopNow({
  products,
  onViewProduct,
  currentUser,
  onSelectCategory,
  onSortChange,
  sortOption,
  onResetPrice,
  onResetSearch
}) {
  const gridRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [products])

  const total = Array.isArray(products) ? products.length : 0
  const shown = Math.min(visibleCount, total)

  const items = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    return list.slice(0, visibleCount)
  }, [products, visibleCount])

  const scrollToGrid = () => {
    try {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      gridRef.current?.scrollIntoView()
    }
  }

  const applyPromo = ({ category = null, sort = null, reset = false } = {}) => {
    if (reset) {
      onResetSearch?.()
      onResetPrice?.()
    }
    if (category) onSelectCategory?.(category)
    if (sort) onSortChange?.(sort)
    scrollToGrid()
  }

  const canLoadMore = shown < total

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, total))
  }

  const baseList = Array.isArray(products) ? products : []
  const byPriceAsc = [...baseList].sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0))
  const byBestSellers = [...baseList].sort((a, b) => {
    const aCount = Number(a?.ratingCount || 0)
    const bCount = Number(b?.ratingCount || 0)
    if (bCount !== aCount) return bCount - aCount
    const aAvg = Number(a?.ratingAvg || 0)
    const bAvg = Number(b?.ratingAvg || 0)
    if (bAvg !== aAvg) return bAvg - aAvg
    return Number(b?.price || 0) - Number(a?.price || 0)
  })
  const byNewest = [...baseList].sort((a, b) => safeDateValue(b?.createdAt) - safeDateValue(a?.createdAt))

  const used = new Set()
  const hotDeals = pickDistinct(byPriceAsc, used, 6)
  const bestSellers = pickDistinct(byBestSellers, used, 6)
  const newArrivals = pickDistinct(byNewest, used, 6)

  return (
    <main className="page shop-now-page">
      <section className="shop-now-hero">
        <img className="shop-now-hero__image" src={heroImg3} alt="Big Summer Sale" />
        <div className="shop-now-hero__overlay">
          <div className="shop-now-hero__copy">
            <div className="shop-now-hero__title">Big Summer Sale</div>
            <div className="shop-now-hero__sub">Up to 50% OFF on selected products</div>
            <div className="shop-now-hero__meta">Limited Time Offer</div>
          </div>
        </div>
      </section>

      <section className="shop-now-tiles" aria-label="Campaign shortcuts">
        <button type="button" className="promo-tile" onClick={() => applyPromo({ category: 'Digital & Deals', sort: 'price-asc', reset: true })}>
          <div className="promo-icon" aria-hidden>⚡</div>
          <div className="promo-text">
            <div className="promo-title">Flash Deals</div>
            <div className="promo-sub">Up to 70% Off</div>
          </div>
        </button>

        <button type="button" className="promo-tile" onClick={() => applyPromo({ reset: true })}>
          <div className="promo-icon" aria-hidden>🚚</div>
          <div className="promo-text">
            <div className="promo-title">Free Shipping</div>
            <div className="promo-sub">Orders over ৳500</div>
          </div>
        </button>

        <button type="button" className="promo-tile" onClick={() => applyPromo({ sort: 'rating-desc' })}>
          <div className="promo-icon" aria-hidden>🎁</div>
          <div className="promo-text">
            <div className="promo-title">New Arrivals</div>
            <div className="promo-sub">Latest summer collection</div>
          </div>
        </button>
      </section>

      <section className="shop-now-toolbar" aria-label="Product list controls">
        <div className="shop-now-toolbar__left">
          <span className="muted">
            Showing 1-{shown} of {total} products
          </span>
        </div>
        <div className="shop-now-toolbar__right">
          <label className="shop-now-sort">
            <span className="muted">Sort by:</span>
            <select value={sortOption || 'none'} onChange={(e) => onSortChange?.(e.target.value)}>
              <option value="none">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: High to Low</option>
              <option value="name-asc">Name: A → Z</option>
            </select>
          </label>
        </div>
      </section>

      <section className="shop-now-grid" ref={gridRef}>
        <div className="grid">
          {items.map(p => (
            <ProductCard key={p.id} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={false} />
          ))}
        </div>

        <div className="shop-now-load">
          {canLoadMore ? (
            <button type="button" className="shop-now-load__btn" onClick={handleLoadMore}>
              Load More Products
            </button>
          ) : (
            <div className="muted">{total ? (t('endOfResults') || 'End of results') : (t('noProducts') || 'No products')}</div>
          )}
        </div>
      </section>

      <section className="shop-now-coupon" aria-label="Coupon">
        <div className="shop-now-coupon__bar">
          <strong>Extra 10% Off for First Order</strong>
          <span className="shop-now-coupon__code">Use Code: <strong>SUMMER10</strong></span>
        </div>
      </section>

      <section className="shop-now-strips" aria-label="More sections">
        <div className="shop-now-strip">
          <div className="shop-now-strip__head">
            <h3>Hot Deals</h3>
          </div>
          <div className="grid">
            {hotDeals.map(p => (
              <ProductCard key={`${p.id}-hot`} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={false} />
            ))}
          </div>
        </div>

        <div className="shop-now-strip">
          <div className="shop-now-strip__head">
            <h3>Best Sellers</h3>
          </div>
          <div className="grid">
            {bestSellers.map(p => (
              <ProductCard key={`${p.id}-best`} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={false} />
            ))}
          </div>
        </div>

        <div className="shop-now-strip">
          <div className="shop-now-strip__head">
            <h3>New Summer Arrivals</h3>
          </div>
          <div className="grid">
            {newArrivals.map(p => (
              <ProductCard key={`${p.id}-new`} product={p} onView={onViewProduct} currentUser={currentUser} showReviews={false} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
