import React, { useEffect, useRef, useState } from 'react'
import { t } from '../utils/strings'
import { useCart } from '../cart/useCart'
import CartPanel from './CartPanel'
import Button from './Button'
import CartIcon from './icons/CartIcon'
import HomeIcon from './icons/HomeIcon'
import logo from '../assets/logo.png'

export default function Header({onNavigate, onSearch, searchQuery = '', user, onLogout, onCheckout, currentPage = 'home'}){
  const { count, setIsOpen } = useCart()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const role = (user?.role || '').toLowerCase()
  const showCart = role === 'buyer' || !user
  const showFavorites = role === 'buyer'

  useEffect(()=>{
    function handleClickOutside(e){
      if(userMenuRef.current && !userMenuRef.current.contains(e.target)){
        setUserMenuOpen(false)
      }
    }
    if(userMenuOpen){
      document.addEventListener('mousedown', handleClickOutside)
    }
    return ()=> document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const dashboardRoute = role === 'producer'
    ? 'producer-dashboard'
    : role === 'admin'
      ? 'admin-dashboard'
      : role === 'buyer'
        ? 'buyer-dashboard'
        : null

  const homeTarget = role === 'producer'
    ? 'producer-dashboard'
    : role === 'admin'
      ? 'admin-dashboard'
      : 'home'

  const homeLabel = user?.role === 'producer' || user?.role === 'admin'
    ? t('dashboard')
    : t('nav.home')

  const brandText = String(t('brand') || '').trim() || 'ShopSphere'

  const initials = (user?.name || user?.email || 'A').split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase()

  const isActivePage = (page) => currentPage === page

  const handleBrandClick = () => {
    onNavigate?.('home')
    setUserMenuOpen(false)
  }

  return (
    <header className="site-header">
      
      <nav>
        <button type="button" className="brand brand-lockup brand-button" onClick={handleBrandClick} aria-label={t('nav.home') || 'Home'}>
          <span className="brand-mark" aria-hidden>
            <img className="brand-logo" src={logo} alt="" />
          </span>
          <span className="brand-text">{brandText}</span>
        </button>
        <Button
          variant="link"
          className="nav-icon-btn"
          active={isActivePage(homeTarget)}
          aria-label={homeLabel}
          title={homeLabel}
          onClick={()=>onNavigate(homeTarget)}
        >
          <HomeIcon size={18} />
        </Button>
        <input
          className="nav-search"
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e)=> onSearch && onSearch(e.target.value)}
        />
        {showCart && (
          <Button variant="link" onClick={()=>setIsOpen(true)}>
            <CartIcon size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
            ({count})
          </Button>
        )}
       
         <div className="user-menu" ref={userMenuRef}>
          <Button
            variant="link"
            size="sm"
            className="user-menu-toggle"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={()=>setUserMenuOpen(v=>!v)}
          >
            {user ? (
              <span className="user-chip">
                <span className="avatar-badge" aria-hidden>
                  {user.avatar ? <img src={user.avatar} alt="avatar" /> : initials}
                </span>
                <span>{user.name || user.email}{user.role ? ` (${user.role})` : ''}</span>
              </span>
            ) : t('account')} ▾
          </Button>
          {userMenuOpen && (
            <div className="dropdown-menu" role="menu">
              {!user ? (
                <>
                  <button className="dropdown-item" role="menuitem" onClick={()=>{ onNavigate('login'); setUserMenuOpen(false) }}>{t('login')}</button>
                  <button className="dropdown-item" role="menuitem" onClick={()=>{ onNavigate('signup'); setUserMenuOpen(false) }}>{t('signup')}</button>
                </>
              ) : (
                <>
                  <div className="dropdown-header">{t('signedInAs')}<br/><strong>{user.name || user.email}</strong></div>
                  {dashboardRoute && (
                    <button className="dropdown-item" role="menuitem" onClick={()=>{ onNavigate(dashboardRoute); setUserMenuOpen(false) }}>{t('dashboard')}</button>
                  )}
                  {showFavorites && (
                    <button className="dropdown-item" role="menuitem" onClick={()=>{ onNavigate('favorites'); setUserMenuOpen(false) }}>{t('favorites')}</button>
                  )}
                  <button className="dropdown-item" role="menuitem" onClick={()=>{ onLogout(); setUserMenuOpen(false) }}>{t('logout')}</button>
                </>
              )}
            </div>
          )}
        </div>
 
       
      </nav>

      {showCart && (
        <CartPanel onCheckout={()=>{ if(onCheckout) onCheckout(); setIsOpen(false) }} />
      )}
    </header>
  )
}
