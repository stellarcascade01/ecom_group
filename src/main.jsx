import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './cart/CartContext'
import { FavoritesProvider } from './favorites/FavoritesContext'
import { CategoryProvider } from './category/CategoryProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider>
      <FavoritesProvider>
        <CategoryProvider>
          <App />
        </CategoryProvider>
      </FavoritesProvider>
    </CartProvider>
  </StrictMode>,
)
