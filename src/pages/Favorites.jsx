import React from 'react'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../favorites/useFavorites'
import { t } from '../utils/strings'

export default function Favorites({ products, onViewProduct, currentUser }){
  const { favIds } = useFavorites()
  const favProducts = products.filter(p => favIds.includes(p.id))

  return (
    <main className="page favorites-page">
      <h2>{t('favorites')}</h2>
      {favProducts.length === 0 ? (
        <p className="muted">{t('noFavorites')}</p>
      ) : (
        <div className="grid">
          {favProducts.map(p => (
            <ProductCard key={p.id} product={p} onView={onViewProduct} currentUser={currentUser} />
          ))}
        </div>
      )}
    </main>
  )
}
