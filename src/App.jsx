import React, {useState, useEffect, useCallback} from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Producers from './pages/Producers'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Checkout from './pages/Checkout'
import Favorites from './pages/Favorites'
import BuyerDashboard from './pages/BuyerDashboard'
import ProducerDashboard from './pages/ProducerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProducersManagement from './pages/ProducersManagement'
import { t } from './utils/strings'
import { useCart } from './cart/useCart'
import Button from './components/Button'
import CartIcon from './components/icons/CartIcon'
import CategoryPanel from './components/CategoryPanel'
import ProductCard from './components/ProductCard'
import StarRating from './components/StarRating'
import UploadProduct from './pages/UploadProduct'
import ProducerShop from './pages/ProducerShop'
import ProductManagement from './pages/ProductManagement'
import { useCategoryPanel } from './category/useCategoryPanel'
import Landing from './pages/Landing'
import { apiUrl, fileUrl } from './utils/api'

const ROUTE_STORAGE_KEY = 'route'

const TOP_CATEGORIES = [
  'All',
  'Electronics',
  'Fashion & Apparel',
  'Home & Living',
  'Beauty & Personal Care',
  'Sports & Outdoor',
  'Toys & Games',
  'Groceries & Daily Needs',
  'Books & Education',
  'Automotive',
  'Digital & Deals'
]

const CATEGORY_ALIASES = {
  Electronics: ['Smartphones', 'Laptops & Computers', 'Tablets', 'Cameras', 'Headphones & Audio', 'Smart Gadgets'],
  'Fashion & Apparel': ["Men's Clothing", "Women's Clothing", "Kid's Fashion", 'Shoes', 'Bags & Wallets', 'Watches', 'Bags', 'Wallets', 'Accessories'],
  'Home & Living': ['Furniture', 'Home Decor', 'Kitchen Appliances', 'Lighting', 'Storage & Organization', 'Rugs', 'Mats', 'Planters', 'Kitchen', 'Garden', 'Wall Hangings', 'Decor', 'Home'],
  'Beauty & Personal Care': ['Skincare', 'Makeup', 'Hair Care', 'Perfumes', 'Personal Hygiene', 'Health & Wellness', 'Supplements', 'Medical Devices'],
  'Sports & Outdoor': ['Fitness Equipment', 'Outdoor Gear', 'Sportswear', 'Cycling Accessories', 'Camping Equipment', 'Fitness Products'],
  'Toys & Games': ['Educational Toys', 'Board Games', 'Action Figures', 'Puzzles'],
  'Groceries & Daily Needs': ['Fruits & Vegetables', 'Packaged Food', 'Beverages', 'Snacks', 'Fresh Goods'],
  'Books & Education': ['Academic Books', 'Novels', 'Stationery', 'Educational Materials'],
  Automotive: ['Car Accessories', 'Bike Accessories', 'Vehicle Tools'],
  'Digital & Deals': ['Digital Products', 'Software', 'Online Courses', 'E-books', 'Deals & Offers', 'Flash Sale', 'Discounted Products', 'Clearance Items']
}

function normalizeCategoryKey(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const CATEGORY_ALIAS_TO_TOP = (() => {
  const map = new Map()
  for (const [top, aliases] of Object.entries(CATEGORY_ALIASES)){
    map.set(normalizeCategoryKey(top), top)
    for (const alias of aliases){
      map.set(normalizeCategoryKey(alias), top)
    }
  }
  for (const top of TOP_CATEGORIES){
    map.set(normalizeCategoryKey(top), top)
  }
  return map
})()

function normalizeCategory(rawCategory){
  const key = normalizeCategoryKey(rawCategory)
  return CATEGORY_ALIAS_TO_TOP.get(key) || null
}

const KNOWN_PAGES = new Set([
  'landing',
  'login',
  'signup',
  'home',
  'product',
  'producer-shop',
  'producers-list',
  'checkout',
  'favorites',
  'buyer-dashboard',
  'producer-dashboard',
  'admin-dashboard',
  'producers',
  'producers-management',
  'upload-product',
  'manage-products'
])

const getStoredUser = () => {
  try {
    return normalizeUser(JSON.parse(localStorage.getItem('user') || 'null'))
  } catch {
    return null
  }
}

const defaultRouteForUser = (user) => {
  if (!user) return { page: 'landing', params: null }
  const dashboard = dashboardRouteForRole(user?.role)
  return { page: dashboard || 'home', params: null }
}

const serializeRoute = (route) => {
  const page = route?.page || 'home'
  const params = route?.params || null

  if (page === 'product') {
    const productId = params?.product?.id || params?.product?._id || params?.productId
    return { page, params: productId ? { productId } : null }
  }

  if (page === 'producer-shop') {
    const producerName = params?.producerName
    return { page, params: producerName ? { producerName } : null }
  }

  return { page, params }
}

const loadStoredRoute = () => {
  try {
    const raw = localStorage.getItem(ROUTE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.page !== 'string') return null
    if (!KNOWN_PAGES.has(parsed.page)) return null
    return {
      page: parsed.page,
      params: parsed.params ?? null
    }
  } catch {
    return null
  }
}

const dashboardRouteForRole = (role) => {
  if(role === 'producer') return 'producer-dashboard'
  if(role === 'admin') return 'admin-dashboard'
  return null
}

const normalizeUser = (user) => {
  if(!user) return null
  const id = user.id || user._id
  return { ...user, id, role: user.role || 'buyer' }
}

function ProductDetail({ product, products = [], onViewProduct, onNavigate, currentUser }){
  const { addItem } = useCart()
  const [form, setForm] = useState({ rating: 0, comment: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [full, setFull] = useState(product)
  const isBuyer = (currentUser?.role || '').toLowerCase() === 'buyer'
  const canShop = isBuyer || !currentUser

  useEffect(()=>{
    let active = true
    async function load(){
      if(!product?.id) return
      try{
        const res = await fetch(apiUrl(`/api/products/${product.id}`))
        if(!res.ok) throw new Error('Failed to load product details')
        const json = await res.json()
        if(active) setFull({ ...product, ...json, id: json.id || json._id || product.id })
      }catch(err){
        console.error(err)
      }
    }
    load()
    return ()=> { active = false }
  }, [product?.id, product])

  if(!product) return (
    <main className="page product-detail">
      <p>{t('productNotFound')}</p>
    </main>
  )

  async function onSubmitReview(e){
    e.preventDefault()
    setError(null)
    setSuccess('')
    if(!isBuyer){
      setError(t('loginToReview') || 'Please log in as a buyer to leave a review.')
      return
    }
    try{
      if(!form.rating) throw new Error(t('selectStarRating'))
      const reviewerName = (currentUser?.name || currentUser?.email || t('anonymous') || 'Anonymous')
      const res = await fetch(apiUrl(`/api/products/${product.id}/reviews`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': (currentUser?.role || 'guest'),
          'X-User-Id': (currentUser?.id || currentUser?._id || '')
        },
        body: JSON.stringify({ name: reviewerName, rating: form.rating, comment: form.comment })
      })
      if(!res.ok){
        const j = await res.json().catch(()=>({ message: t('failedSubmitReview') }))
        throw new Error(j.message || t('failedSubmitReview'))
      }
      const updated = await res.json()
      setFull(prev => ({ ...(prev||{}), ...updated, id: updated.id || updated._id || product.id }))
      setForm({ rating: 0, comment: '' })
      setSuccess(t('reviewSuccess'))
    }catch(err){
      setError(err.message || t('failedSubmitReview'))
    }
  }

  const base = full || product
  const sameProducer = (products || []).filter(p => p.id !== base.id && p.producer && p.producer === base.producer)
  const others = (products || []).filter(p => p.id !== base.id && !sameProducer.includes(p))
  const recommendations = [...sameProducer, ...others].slice(0, 4)

  const getImageUrl = (image) => {
    if (!image) return null
    return fileUrl(image)
  }

  return (
    <main className="page product-detail">
      <div className="product-detail-grid">
        <div className="product-media">
          {base.image ? (
            <img src={getImageUrl(base.image)} alt={base.name} />
          ) : (
            <div className="placeholder-image" aria-hidden>{(base.name||'').split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase()}</div>
          )}
        </div>
        <div className="product-info" style={{ textAlign: 'left' }}>
          <h2 style={{ marginTop: 0 }}>{base.name}</h2>
          {base.producer && (
            <div className="producer-info">
              <div className="producer-label">{t('soldBy')} <strong>{base.producer}</strong></div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onNavigate && onNavigate('producer-shop', {producerName: base.producer})}
              >
                {t('visitShop')}
              </Button>
            </div>
          )}
          <div className="rating-row">
            <StarRating value={Number(full?.ratingAvg || 0)} readOnly size={22} />
            <span className="muted">{(full?.ratingCount||0) ? `${Number(full?.ratingAvg||0).toFixed(1)} • ${full?.ratingCount} ${full?.ratingCount > 1 ? t('reviews') : t('review')}` : t('noReviewsYet')}</span>
          </div>
          <div className="price">৳ {base.price}</div>
          {base.category && <div className="muted">{t('category')}: {base.category}</div>}
          {typeof full?.stock === 'number' && <div className="muted">{t('inStock')}: {full.stock}</div>}
          <p style={{ marginTop: '0.5rem' }}>{base.description || t('productDetails')}</p>
          {canShop && (
            <div style={{marginTop: '0.75rem'}}>
              <Button onClick={() => addItem(base, 1)}>
                <CartIcon size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                {t('addToCart')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <section className="reviews-section" style={{ textAlign: 'left' }}>
        <h3>{t('reviews')}</h3>

        {isBuyer ? (
          <>
            {success && <div className="success" style={{ marginBottom: '0.5rem' }}>{success}</div>}
            {error && <div className="error" style={{ color: '#a11', marginBottom: '0.5rem' }}>{error}</div>}

            <form className="review-form" onSubmit={onSubmitReview}>
              <div>
                <div style={{ marginBottom: 4 }}>{t('yourRating')}</div>
                <StarRating value={form.rating} onChange={(r)=> setForm(f=>({ ...f, rating: r }))} size={24} />
              </div>

              <label htmlFor="review-comment">{t('yourReview')}</label>
              <textarea id="review-comment" rows={4} value={form.comment} onChange={e=>setForm(f=>({ ...f, comment: e.target.value }))} placeholder={t('shareExperience')} />

              <div>
                <Button type="submit">{t('submitReview')}</Button>
              </div>
            </form>
          </>
        ) : (
          <div className="muted" style={{ marginBottom: '0.75rem' }}>
            {t('loginToReview') || 'Please log in as a buyer to leave a review.'}
          </div>
        )}

        <div className="review-list">
          {(full?.reviews?.length || 0) === 0 ? (
            <div className="muted">{t('noReviewsYetMessage')}</div>
          ) : full.reviews.map((r, idx) => (
            <div className="review-item" key={r.id || `${r?.name || 'review'}-${idx}`}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <strong>{r.name || t('anonymous')}</strong>
                <small className="muted">{r.date ? new Date(r.date).toLocaleDateString() : ''}</small>
              </div>
              <StarRating value={Number(r.rating || 0)} readOnly size={16} />
              {r.comment && <p style={{ margin: '0.25rem 0 0.1rem' }}>{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="recommended-section">
          <h3 style={{ textAlign: 'left' }}>{t('recommendedProducts')}</h3>
          <div className="grid">
            {recommendations.map(p => (
              <ProductCard key={p.id} product={p} onView={onViewProduct} currentUser={currentUser} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

function App(){
  const storedUser = getStoredUser()
  const [route, setRoute] = useState(() => {
    if (!storedUser) return { page: 'landing', params: null }
    return loadStoredRoute() || defaultRouteForUser(storedUser)
  })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(storedUser)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' })
  const [sortOption, setSortOption] = useState('none')
  const { isOpen: isCategoryPanelOpen } = useCategoryPanel()
  const role = (currentUser?.role || '').toLowerCase()
  const hideCategoryPanel = role === 'producer' || role === 'admin'

  const isAllowedWhenLoggedOut = useCallback((page) => [
    'landing',
    'login',
    'signup',
    'home',
    'product',
    'producer-shop',
    'producers-list'
  ].includes(page), [])

  const updateUserAndStore = (nextUser) => {
    const normalized = normalizeUser(nextUser)
    setCurrentUser(normalized)
    try{ localStorage.setItem('user', JSON.stringify(normalized)) }catch{
      /* ignore storage failures */
    }
    return normalized
  }

  const navigate = useCallback((page, params = null, effectiveUser = null) => {
    const userForGuard = effectiveUser ?? currentUser
    const next = (!userForGuard && !isAllowedWhenLoggedOut(page))
      ? { page: 'landing', params: null }
      : { page, params }
    setRoute(next)
    try {
      localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(serializeRoute(next)))
    } catch {
      /* ignore storage failures */
    }
  }, [currentUser, isAllowedWhenLoggedOut])
  const handleAuthSuccess = (user)=>{
    const safeUser = updateUserAndStore(user)
    const destination = dashboardRouteForRole(safeUser?.role) || 'home'
    navigate(destination, null, safeUser)
  }
  const handleLoginSuccess = handleAuthSuccess
  const handleSignupSuccess = handleAuthSuccess
  const logout = ()=>{
    localStorage.removeItem('user')
    setCurrentUser(null)
    navigate('landing')
  }

  const onViewProduct = (product) => navigate('product', {product})
  const goToCheckout = () => navigate('checkout')

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      setError(null)
      try{
        const [pRes] = await Promise.all([
          fetch(apiUrl('/api/products'))
        ])
        if(!pRes.ok) throw new Error('Failed to load products')
        const pJson = await pRes.json()
        if(!mounted) return
        // map backend _id to id for frontend components
        const mappedProducts = pJson.map(p => ({ ...p, id: p.id || p._id }))
        setProducts(mappedProducts)
      }catch(err){
        console.error(err)
        if(mounted) setError(err.message)
      }finally{
        if(mounted) setLoading(false)
      }
    }
    load()
    return ()=> { mounted = false }
  }, [])

  // Hydrate product routes from stored IDs after data loads
  useEffect(() => {
    if (loading) return
    if (route.page === 'product' && route.params?.productId && !route.params?.product) {
      const found = products.find(p => (p.id || p._id) === route.params.productId)
      if (found) {
        setRoute(r => ({ ...r, params: { product: found } }))
      }
    }
  }, [loading, route.page, route.params, products])

  // If a user is already logged in on load, ensure a sensible default page exists.
  useEffect(() => {
    if (!currentUser) return
    if (!route?.page) {
      const fallback = defaultRouteForUser(currentUser)
      navigate(fallback.page, fallback.params)
    }
  }, [currentUser, route?.page, navigate])

  // If logged out, always keep the app on the landing/auth routes.
  useEffect(() => {
    if (currentUser) return
    if (!isAllowedWhenLoggedOut(route?.page)) {
      navigate('landing')
    }
  }, [currentUser, route?.page, isAllowedWhenLoggedOut, navigate])

  const {page, params} = route

  // Filter data by search query (case-insensitive)
  const q = search.trim().toLowerCase()
  const bySearch = (list)=> q
    ? list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.producer && p.producer.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      )
    : list
  const byCategory = (list)=> selectedCategory && selectedCategory !== 'All'
    ? list.filter(p => (normalizeCategory(p.category) || 'All') === selectedCategory)
    : list
  const byPrice = (list)=> list.filter(p => {
    const price = Number(p.price || 0)
    if(priceFilter.min !== '' && price < Number(priceFilter.min)) return false
    if(priceFilter.max !== '' && price > Number(priceFilter.max)) return false
    return true
  })
  const sortProducts = (list)=> {
    if(sortOption === 'price-asc') return [...list].sort((a,b)=>Number(a.price||0)-Number(b.price||0))
    if(sortOption === 'price-desc') return [...list].sort((a,b)=>Number(b.price||0)-Number(a.price||0))
    if(sortOption === 'rating-desc'){
      return [...list].sort((a,b)=>{
        const aAvg = Number(a.ratingAvg || 0)
        const bAvg = Number(b.ratingAvg || 0)
        if(bAvg !== aAvg) return bAvg - aAvg

        const aCount = Number(a.ratingCount || 0)
        const bCount = Number(b.ratingCount || 0)
        if(bCount !== aCount) return bCount - aCount

        return (a.name||'').localeCompare(b.name||'')
      })
    }
    if(sortOption === 'name-asc') return [...list].sort((a,b)=>(a.name||'').localeCompare(b.name||''))
    return list
  }

  const visibleProducts = sortProducts(bySearch(byPrice(byCategory(products))))

  const categories = TOP_CATEGORIES

  // Inline dashboard access checks (keeps linter happy by avoiding unused helper params)

  return (
          <div className="app-root">
  <Header onNavigate={navigate} onSearch={setSearch} searchQuery={search} user={currentUser} onLogout={logout} onCheckout={goToCheckout} currentPage={page} />

    {!hideCategoryPanel && (
      <CategoryPanel
        categories={categories}
        onSelect={setSelectedCategory}
        priceFilter={priceFilter}
        onPriceChange={setPriceFilter}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />
      
    )}
        <div className={`container ${!hideCategoryPanel && isCategoryPanelOpen ? 'with-category-panel' : ''}`}>
          {page === 'landing' && <Landing onNavigate={navigate} />}
          {page === 'home' && <Home products={visibleProducts} onViewProduct={onViewProduct} currentUser={currentUser} />}
          {page === 'login' && <Login onSuccess={handleLoginSuccess} />}
          {page === 'signup' && <Signup onSuccess={handleSignupSuccess} />}
          {loading && <div className="muted">Loading…</div>}
          {error && <div style={{color: 'red'}}>Error: {error}</div>} 
          {page === 'product' && (
            <ProductDetail product={params?.product} products={products} onViewProduct={onViewProduct} onNavigate={navigate} currentUser={currentUser} />
          )}
          {page === 'producer-shop' && (
            <ProducerShop producerName={params?.producerName} products={products} onViewProduct={onViewProduct} onNavigate={navigate} currentUser={currentUser} />
          )}
          {page === 'upload-product' && (
            (currentUser && currentUser.role === 'producer') ? (
              <UploadProduct currentUser={currentUser} onNavigate={navigate} categories={categories} />
            ) : (
              <div className="page"><p>Access denied. Only producers can upload products.</p></div>
            )
          )}
          {page === 'manage-products' && (
            (currentUser && currentUser.role === 'producer') ? (
              <ProductManagement currentUser={currentUser} onNavigate={navigate} />
            ) : (
              <div className="page"><p>Access denied. Only producers can manage products.</p></div>
            )
          )}
          {page === 'checkout' && (
            <Checkout currentUser={currentUser} onNavigate={navigate} />
          )}
          {page === 'favorites' && (
            !currentUser ? <div className="page"><p>Please log in to view favorites.</p></div> :
            currentUser.role !== 'buyer' ? <div className="page"><p>Access denied.</p></div> :
            <Favorites products={products} onViewProduct={onViewProduct} currentUser={currentUser} />
          )}
          {page === 'buyer-dashboard' && (
            !currentUser ? <div className="page"><p>Please log in to view this dashboard.</p></div> :
            currentUser.role !== 'buyer' ? <div className="page"><p>Access denied.</p></div> :
            <BuyerDashboard user={currentUser} onNavigate={navigate} onUserUpdate={updateUserAndStore} products={products} routeParams={params} />
          )}
          {page === 'producer-dashboard' && (
            !currentUser ? <div className="page"><p>Please log in to view this dashboard.</p></div> :
            currentUser.role !== 'producer' ? <div className="page"><p>Access denied.</p></div> :
            <ProducerDashboard user={currentUser} onNavigate={navigate} onUserUpdate={updateUserAndStore} routeParams={params} />
          )}
          {page === 'admin-dashboard' && (
            !currentUser ? <div className="page"><p>Please log in to view this dashboard.</p></div> :
            currentUser.role !== 'admin' ? <div className="page"><p>Access denied.</p></div> :
            <AdminDashboard user={currentUser} onNavigate={navigate} />
          )}
          {(page === 'producers' || page === 'producers-management') && (
            !currentUser ? <div className="page"><p>Please log in to view this.</p></div> :
            currentUser.role !== 'admin' ? <div className="page"><p>Access denied. Only admins can manage producers.</p></div> :
            <ProducersManagement currentUser={currentUser} onNavigate={navigate} />
          )}
          {page === 'producers-list' && <Producers />}
        </div>

          <Footer />
          </div>
  )
}

export default App