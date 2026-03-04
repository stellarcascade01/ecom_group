import React, { useCallback, useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'
import CartIcon from '../components/icons/CartIcon'
import HeartIcon from '../components/icons/HeartIcon'
import { useFavorites } from '../favorites/useFavorites'
import { useCart } from '../cart/useCart'

export default function BuyerDashboard({ user, onNavigate, onUserUpdate, products = [], routeParams = null }){
  const { favIds, isFavorite, toggle } = useFavorites()
  const { addItem } = useCart()
  const name = user?.name || t('valuedBuyer')
  const userId = user?.id || user?._id

  const handledOpenRef = useRef(null)

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [ordersModalOpen, setOrdersModalOpen] = useState(false)
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false)

  const [addresses, setAddresses] = useState(user?.shippingAddresses || [])
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addrForm, setAddrForm] = useState({ label: '', name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: '', city: '', postalCode: '', country: t('bangladesh'), isDefault: addresses.length === 0 })
  const [addrError, setAddrError] = useState('')
  const [savingAddr, setSavingAddr] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!userId) return
    setOrdersError('')
    setLoadingOrders(true)
    try {
      const res = await fetch(`https://ecom-group.onrender.com/api/orders/customer/${userId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || t('failedToFetchOrders'))
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setOrdersError(err.message || t('failedToFetchOrders'))
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [userId, t])

  useEffect(() => {
    if (!ordersModalOpen) return
    fetchOrders()
  }, [fetchOrders, ordersModalOpen])

  useEffect(() => {
    const open = routeParams?.open
    if (!open || handledOpenRef.current === open) return
    handledOpenRef.current = open

    if (open === 'orders') setOrdersModalOpen(true)
  }, [routeParams?.open])

  async function addAddress() {
    setAddrError('')
    if (!addrForm.address.trim() || !addrForm.city.trim()) {
      setAddrError(t('buyerDash.addressCityRequired'))
      return
    }
    setSavingAddr(true)
    try {
      const res = await fetch(`https://ecom-group.onrender.com/api/users/${userId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user?.role || 'guest'
        },
        body: JSON.stringify(addrForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || t('buyerDash.failedAddAddress'))
      setAddresses(data.shippingAddresses || [])
      setAddrForm({ label: '', name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: '', city: '', postalCode: '', country: t('bangladesh'), isDefault: false })
      setShowAddForm(false)
      if (onUserUpdate) onUserUpdate(data)
    } catch (err) {
      setAddrError(err.message || t('buyerDash.failedAddAddress'))
    } finally {
      setSavingAddr(false)
    }
  }

  async function setDefault(addrId) {
    setSavingAddr(true)
    try {
      const addr = addresses.find(a => a._id === addrId)
      const res = await fetch(`https://ecom-group.onrender.com/api/users/${userId}/addresses/${addrId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user?.role || 'guest'
        },
        body: JSON.stringify({ ...addr, isDefault: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || t('buyerDash.failedUpdateAddress'))
      setAddresses(data.shippingAddresses || [])
      if (onUserUpdate) onUserUpdate(data)
    } catch (err) {
      setAddrError(err.message)
    } finally {
      setSavingAddr(false)
    }
  }

  async function deleteAddress(addrId) {
    if (!window.confirm(t('buyerDash.deleteAddressConfirm'))) return
    setSavingAddr(true)
    try {
      const res = await fetch(`https://ecom-group.onrender.com/api/users/${userId}/addresses/${addrId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Role': user?.role || 'guest'
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || t('buyerDash.failedDeleteAddress'))
      setAddresses(addresses.filter(a => a._id !== addrId))
    } catch (err) {
      setAddrError(err.message)
    } finally {
      setSavingAddr(false)
    }
  }

  return (
    <main className="page buyer-dashboard">
      <section className="bd-hero">
        <div>
          <p className="eyebrow">{t('buyerDash.workspace')}</p>
          <div className="bd-hero-row">
            <h1 style={{ margin: 0 }}>{t('buyerDash.welcomeBack', { name })}</h1>
            <div className="bd-hero-actions">
              <Button size="sm" variant="outline" onClick={() => setAddressModalOpen(true)}>
                {t('myAddresses')}
              </Button>
            </div>
          </div>
          {/* <p className="muted">{t('buyerDash.heroSubtitle')}</p> */}
        </div>
      </section>

      {ordersModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('myOrders')} onMouseDown={(e) => {
          if (e.target === e.currentTarget) setOrdersModalOpen(false)
        }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{t('myOrders')}</h3>
                <div className="muted">{t('status')}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setOrdersModalOpen(false)}>{t('close')}</Button>
            </div>

            <div className="modal-body">
              {loadingOrders && <p className="muted">{t('loading')}</p>}
              {!loadingOrders && ordersError && <div className="error small">{ordersError}</div>}
              {!loadingOrders && !ordersError && orders.length === 0 && <p className="muted">{t('noOrders')}</p>}

              {!loadingOrders && !ordersError && orders.length > 0 && (
                <div className="bd-orders-list">
                  {orders.map((o) => {
                    const created = o?.createdAt ? new Date(o.createdAt).toLocaleString() : ''
                    const statusText = (o?.status || 'pending').toUpperCase()
                    const paymentText = (o?.paymentStatus || 'pending').toUpperCase()
                    const showPaymentPill = String(o?.paymentStatus || 'pending').toLowerCase() !== 'pending'
                    const itemsCount = Array.isArray(o?.items) ? o.items.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0) : 0
                    const total = typeof o?.total === 'number' ? o.total : 0

                    return (
                      <article key={o?._id} className="bd-card bd-order-card">
                        <div className="bd-order-top">
                          <div>
                            <div className="bd-order-title">
                              <span style={{ fontWeight: 800 }}>{t('orderID')}</span>
                              <span className="muted small">#{String(o?._id || '').slice(-6)}</span>
                            </div>
                            {created && <div className="muted small">{created}</div>}
                          </div>

                          <div className="bd-order-status">
                            <span className="pill">{statusText}</span>
                            {showPaymentPill && <span className="pill ghost">{paymentText}</span>}
                          </div>
                        </div>

                        <div className="bd-order-meta">
                          <span className="muted small">{t('items')}: {itemsCount}</span>
                          <span style={{ fontWeight: 800 }}>৳{total.toLocaleString()}</span>
                        </div>

                        {Array.isArray(o?.items) && o.items.length > 0 && (
                          <div className="bd-order-items">
                            {o.items.map((it, idx) => {
                              const p = it?.productId
                              const img = (typeof p === 'object' && p?.image) ? p.image : null
                              const src = img ? `http://localhost:5000${img}` : ''
                              const unitPrice = typeof it?.price === 'number' ? it.price : 0
                              const productId = (typeof p === 'object' && (p?.id || p?._id)) ? (p.id || p._id) : (it?.productId || null)
                              const canOpen = Boolean(productId && onNavigate)

                              return (
                                <div
                                  key={it?.productId?._id || it?.productId || `${it?.name || 'item'}-${idx}`}
                                  className={`bd-order-item-row ${canOpen ? 'clickable' : ''}`}
                                  role={canOpen ? 'button' : undefined}
                                  tabIndex={canOpen ? 0 : undefined}
                                  onClick={canOpen ? () => onNavigate('product', { productId }) : undefined}
                                  onKeyDown={canOpen ? (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      onNavigate('product', { productId })
                                    }
                                  } : undefined}
                                >
                                  <div className="bd-order-item-left">
                                    {img ? (
                                      <img className="bd-order-thumb" src={src} alt={it?.name || ''} loading="lazy" />
                                    ) : (
                                      <div className="bd-order-thumb placeholder" aria-hidden="true" />
                                    )}
                                    <div>
                                      <div className="bd-order-item-name">{it?.name}</div>
                                      <div className="muted small">৳{unitPrice.toLocaleString()} • {t('qty')}: {it?.qty}</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {favoritesModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('favorites')} onMouseDown={(e) => {
          if (e.target === e.currentTarget) setFavoritesModalOpen(false)
        }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{t('favorites')}</h3>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFavoritesModalOpen(false)}>{t('close')}</Button>
            </div>

            <div className="modal-body">
              {(() => {
                const ids = Array.isArray(favIds) ? favIds : []
                const list = Array.isArray(products) ? products : []
                const favProducts = list.filter(p => ids.includes(p?.id || p?._id))

                if (favProducts.length === 0) return <p className="muted">{t('noFavorites')}</p>

                return (
                  <div className="bd-order-items" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                    {favProducts.map((p) => {
                      const img = p?.image || null
                      const src = img ? (String(img).startsWith('http') ? img : `http://localhost:5000${img}`) : ''
                      const productId = p?.id || p?._id
                      const canOpen = Boolean(productId && onNavigate)
                      const price = typeof p?.price === 'number' ? p.price : Number(p?.price || 0)
                      const favActive = Boolean(productId && isFavorite && isFavorite(productId))

                      return (
                        <div
                          key={String(productId)}
                          className={`bd-order-item-row ${canOpen ? 'clickable' : ''}`}
                          role={canOpen ? 'button' : undefined}
                          tabIndex={canOpen ? 0 : undefined}
                          onClick={canOpen ? () => onNavigate('product', { productId }) : undefined}
                          onKeyDown={canOpen ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onNavigate('product', { productId })
                            }
                          } : undefined}
                        >
                          <div className="bd-order-item-left">
                            {img ? (
                              <img className="bd-order-thumb" src={src} alt={p?.name || ''} loading="lazy" />
                            ) : (
                              <div className="bd-order-thumb placeholder" aria-hidden="true" />
                            )}
                            <div>
                              <div className="bd-order-item-name">{p?.name}</div>
                              <div className="muted small">৳{Number.isFinite(price) ? price.toLocaleString() : '0'}</div>
                            </div>
                          </div>

                          <div className="bd-order-item-actions">
                            <button
                              className={`icon-btn ${favActive ? 'fav-active' : ''}`}
                              aria-label={t('favorites')}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!productId) return
                                toggle(productId)
                              }}
                              type="button"
                            >
                              <HeartIcon size={18} filled={favActive} />
                            </button>

                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={t('addToCart')}
                              onClick={(e) => {
                                e.stopPropagation()
                                addItem(p, 1)
                              }}
                            >
                              <CartIcon size={16} style={{ verticalAlign: 'text-bottom' }} />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      

      {addressModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={t('myAddresses')} onMouseDown={(e) => {
          if (e.target === e.currentTarget) setAddressModalOpen(false)
        }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{t('myAddresses')}</h3>
                <div className="muted">{t('buyerDash.quickCheckout')}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddressModalOpen(false)}>{t('close')}</Button>
            </div>
            <div className="modal-body">
              {addrError && <div className="error small" style={{ marginBottom: '0.5rem' }}>{addrError}</div>}

              {addresses.length === 0 ? (
                <p className="muted" style={{ margin: '0.5rem 0' }}>{t('buyerDash.noSavedAddresses')}</p>
              ) : (
                <div className="bd-addresses">
                  {addresses.map(addr => (
                    <div key={addr._id} className="bd-address-item">
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{addr.label || t('buyerDash.addressFallback')}</p>
                        <p className="muted small">{addr.address}, {addr.city}</p>
                        {addr.isDefault && <span className="pill" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{t('default')}</span>}
                      </div>
                      <div className="bd-addr-actions">
                        <Button size="sm" variant="outline" onClick={() => setDefault(addr._id)} disabled={savingAddr || addr.isDefault}>
                          {addr.isDefault ? t('default') : t('buyerDash.setDefault')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteAddress(addr._id)} disabled={savingAddr}>{t('delete')}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '0.75rem' }}>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? t('cancel') : t('buyerDash.addAddress')}
                </Button>
              </div>

              {showAddForm && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="bd-form-group">
                    <label>{t('buyerDash.labelExample')}</label>
                    <input type="text" value={addrForm.label} onChange={e => setAddrForm({ ...addrForm, label: e.target.value })} placeholder={t('buyerDash.labelPlaceholder')} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('fullName')}</label>
                    <input type="text" value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('streetAddress')}</label>
                    <textarea rows={2} value={addrForm.address} onChange={e => setAddrForm({ ...addrForm, address: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('city')}</label>
                    <input type="text" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('postalCode')}</label>
                    <input type="text" value={addrForm.postalCode} onChange={e => setAddrForm({ ...addrForm, postalCode: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>
                      <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                      <span style={{ marginLeft: '0.4rem' }}>{t('buyerDash.setAsDefault')}</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>{t('cancel')}</Button>
                    <Button size="sm" onClick={addAddress} disabled={savingAddr}>{savingAddr ? t('saving') : t('buyerDash.saveAddress')}</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="bd-grid" aria-label={t('buyerDash.moreShortcuts')}>
        <article className="bd-card">
          <h3>{t('buyerDash.savedItemsTitle')}</h3>
          <div className="bd-row">
            <Button size="sm" variant="outline" onClick={() => setFavoritesModalOpen(true)}>{t('view')}</Button>
          </div>
        </article>

        <article className="bd-card">
          <h3>{t('myOrders')}</h3>
          <div className="bd-row">
            <Button size="sm" variant="outline" onClick={() => setOrdersModalOpen(true)}>{t('view')}</Button>
          </div>
        </article>
      </section>

      <style>{`
        .buyer-dashboard {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .bd-hero-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 0.75rem;
        }

        .bd-hero-actions{
          display:flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content:flex-end;
        }

        .bd-hero {
          background: linear-gradient(135deg, #e9fbff, #f6feff);
          border: 1px solid #c7f3fb;
          border-radius: 14px;
          padding: 1.5rem;
        }

        .bd-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #ffffff, #f0fdff);
          border: 1px solid #dfe9e1;
          border-radius: 12px;
          padding: 0.85rem 0.85rem 0.75rem;
          box-shadow: 0 10px 24px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          min-height: 96px;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .bd-card::before{
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 10%, rgba(30,174,203,0.10), transparent 45%);
          pointer-events: none;
        }

        .bd-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 34px rgba(0,0,0,0.08);
          border-color: #b4eef6;
        }

        .bd-card:focus-within {
          border-color: #1eaecb;
        }

        .bd-card h3 {
          margin: 0;
          color: #173a63;
          font-size: 1.15rem;
          line-height: 1.25;
        }

        .bd-orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .bd-order-card {
          padding: 0.9rem 1rem;
        }

        .bd-order-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .bd-order-title {
          display: flex;
          align-items: baseline;
          gap: 0.35rem;
        }

        .bd-order-status {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .bd-order-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-top: 0.6rem;
        }

        .bd-order-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #e3ebe4;
        }

        .bd-order-item-row {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.75rem;
          padding: 0.35rem;
          border-radius: 10px;
        }

        .bd-order-item-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex: 0 0 auto;
        }

        .bd-order-item-row.clickable {
          cursor: pointer;
        }

        .bd-order-item-row.clickable:hover {
          background: #f5f9ff;
        }

        .bd-order-item-row.clickable:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(30, 174, 203, 0.15);
        }

        .bd-order-item-left {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 0;
        }

        .bd-order-thumb {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid #e3ebe4;
          background: #f8fbf8;
          flex: 0 0 auto;
        }

        .bd-order-thumb.placeholder {
          background: #eef2f7;
        }

        .bd-order-item-name {
          font-weight: 700;
          color: #111;
          max-width: 520px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .bd-grid {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        }

        .bd-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: auto;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: #e9fbff;
          color: #1b3f6b;
          font-weight: 700;
          font-size: 0.9rem;
          white-space: nowrap;
        }

        .pill.ghost { background: #eef2f7; color: #2c3e50; }

        .bd-info { margin: 0.5rem 0; }
        .bd-info p { margin: 0.1rem 0; }

        .bd-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .bd-form-group label {
          font-weight: 600;
          color: #173a63;
          font-size: 0.95rem;
        }

        .bd-form-group input,
        .bd-form-group textarea {
          border: 1px solid #cfe6d5;
          border-radius: 8px;
          padding: 0.5rem;
          background: #fdfefc;
          color: #111;
          font-family: inherit;
        }

        .bd-form-group input:focus,
        .bd-form-group textarea:focus {
          outline: none;
          border-color: #1eaecb;
          box-shadow: 0 0 0 2px rgba(30, 174, 203, 0.1);
        }

        .bd-addresses {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 0.75rem 0;
        }

        .bd-address-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #f8fbf8;
          border: 1px solid #e3ebe4;
          border-radius: 8px;
        }

        .bd-addr-actions {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .small { font-size: 0.9rem; }

        .bd-profile-photo{
          border: 1px solid #e3ebe4;
          background: #f8fbf8;
          border-radius: 12px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .bd-profile-photo__header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .bd-profile-photo__row{
          display:flex;
          align-items:center;
          gap: 0.75rem;
        }

        .bd-avatar{
          width: 54px;
          height: 54px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e3ebe4;
          background: #ffffff;
          display:flex;
          align-items:center;
          justify-content:center;
          flex: 0 0 auto;
        }

        .bd-avatar img{ width: 100%; height: 100%; object-fit: cover; display:block; }

        @media (max-width: 768px) {
          .bd-hero { grid-template-columns: 1fr; }
          .bd-hero-row{ flex-direction: column; align-items: flex-start; }
          .bd-hero-actions{ width: 100%; justify-content: flex-start; }
          .bd-address-item { flex-direction: column; }
          .bd-addr-actions { width: 100%; }

          .bd-order-top {
            flex-direction: column;
            align-items: flex-start;
          }
          .bd-order-status {
            justify-content: flex-start;
          }

          .bd-order-item-name {
            max-width: 220px;
          }
        }
      `}</style>
    </main>
  )
}
