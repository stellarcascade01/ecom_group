import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'
import CartIcon from '../components/icons/CartIcon'
import HeartIcon from '../components/icons/HeartIcon'
import { useFavorites } from '../favorites/useFavorites'
import { useCart } from '../cart/useCart'
import { apiUrl, fileUrl } from '../utils/api'

export default function BuyerDashboard({ user, onNavigate, onUserUpdate, products = [], routeParams = null }) {
  const { favIds, isFavorite, toggle } = useFavorites()
  const { addItem } = useCart()

  const name = user?.name || t('valuedBuyer')
  const userId = user?.id || user?._id
  const email = user?.email || ''
  const phone = user?.phone || ''

  const handledOpenRef = useRef(null)
  const [activeSection, setActiveSection] = useState('dashboard')

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const [addresses, setAddresses] = useState(user?.shippingAddresses || [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [addrForm, setAddrForm] = useState({
    label: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: t('bangladesh'),
    isDefault: (user?.shippingAddresses || []).length === 0
  })
  const [addrError, setAddrError] = useState('')
  const [savingAddr, setSavingAddr] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!userId) return
    setOrdersError('')
    setLoadingOrders(true)
    try {
      const res = await fetch(apiUrl(`/api/orders/customer/${userId}`))
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || t('failedToFetchOrders'))
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setOrdersError(err.message || t('failedToFetchOrders'))
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    setAddresses(user?.shippingAddresses || [])
  }, [user?.shippingAddresses])

  useEffect(() => {
    const open = routeParams?.open
    if (!open || handledOpenRef.current === open) return
    handledOpenRef.current = open

    if (open === 'orders') setActiveSection('orders')
  }, [routeParams?.open])

  async function addAddress() {
    setAddrError('')
    if (!addrForm.address.trim() || !addrForm.city.trim()) {
      setAddrError(t('buyerDash.addressCityRequired'))
      return
    }
    setSavingAddr(true)
    try {
      const res = await fetch(apiUrl(`/api/users/${userId}/addresses`), {
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
      setAddrForm({
        label: '',
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        postalCode: '',
        country: t('bangladesh'),
        isDefault: false
      })
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
      const res = await fetch(apiUrl(`/api/users/${userId}/addresses/${addrId}`), {
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
      const res = await fetch(apiUrl(`/api/users/${userId}/addresses/${addrId}`), {
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

  const ordersSorted = useMemo(() => {
    if (!Array.isArray(orders)) return []
    return [...orders].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
  }, [orders])

  const recentOrders = ordersSorted.slice(0, 4)

  const wishlistCount = Array.isArray(favIds) ? favIds.length : 0
  const ordersCount = loadingOrders ? '…' : String(Array.isArray(orders) ? orders.length : 0)
  const addressesCount = String(Array.isArray(addresses) ? addresses.length : 0)

  const favoriteProducts = useMemo(() => {
    const ids = Array.isArray(favIds) ? favIds : []
    const list = Array.isArray(products) ? products : []
    return list.filter(p => ids.includes(p?.id || p?._id))
  }, [favIds, products])

  const sidebarItems = [
    { key: 'dashboard', label: t('dashboard') || 'Dashboard' },
    { key: 'orders', label: t('myOrders') || 'Orders' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'addresses', label: t('myAddresses') || 'Addresses' },
    { key: 'payments', label: 'Payment Methods' },
    { key: 'settings', label: 'Account Settings' },
    { key: 'support', label: 'Support Tickets' }
  ]

  function handleLogout() {
    try {
      localStorage.removeItem('user')
    } catch {
      /* ignore */
    }
    if (onUserUpdate) onUserUpdate(null)
    if (onNavigate) onNavigate('landing')
  }

  const renderOrdersTable = (list, { showViewAll = false } = {}) => {
    if (loadingOrders) return <p className="muted">{t('loading')}</p>
    if (ordersError) return <div className="error small">{ordersError}</div>
    if (!list || list.length === 0) return <p className="muted">{t('noOrders')}</p>

    return (
      <>
        <div className="account-table">
          <div className="account-table-head">
            <div>{t('orderID') || 'Order ID'}</div>
            <div>{t('date') || 'Date'}</div>
            <div>{t('status') || 'Status'}</div>
            <div style={{ textAlign: 'right' }}>{t('total') || 'Total'}</div>
          </div>
          {list.map(o => {
            const created = o?.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
            const statusText = (o?.status || 'pending').toUpperCase()
            const total = typeof o?.total === 'number' ? o.total : 0
            return (
              <div key={o?._id} className="account-table-row">
                <div className="mono">#{String(o?._id || '').slice(-6)}</div>
                <div className="muted">{created}</div>
                <div><span className="pill">{statusText}</span></div>
                <div style={{ textAlign: 'right', fontWeight: 800 }}>৳{Number(total || 0).toLocaleString()}</div>
              </div>
            )
          })}
        </div>

        {showViewAll && (
          <div className="account-row" style={{ justifyContent: 'flex-end' }}>
            <Button size="sm" variant="outline" onClick={() => setActiveSection('orders')}>
              {t('view') || 'View'} {t('myOrders') || 'Orders'}
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <main className="page buyer-dashboard">
      <section className="account-layout" aria-label={t('account') || 'Account'}>
        <aside className="account-sidebar" aria-label="Account navigation">
          <div className="account-user">
            <div className="account-avatar" aria-hidden>
              {(name || 'U').split(' ').slice(0, 2).map(s => s?.[0]).join('').toUpperCase()}
            </div>
            <div className="account-user-meta">
              <div className="account-user-name">{name}</div>
              {email ? <div className="account-user-sub muted small">{email}</div> : null}
            </div>
          </div>

          <nav className="account-nav">
            {sidebarItems.map(it => (
              <button
                key={it.key}
                type="button"
                className={`account-nav-item ${activeSection === it.key ? 'is-active' : ''}`}
                onClick={() => setActiveSection(it.key)}
              >
                {it.label}
              </button>
            ))}

            <button type="button" className="account-nav-item is-danger" onClick={handleLogout}>
              {t('logout') || 'Logout'}
            </button>
          </nav>
        </aside>

        <div className="account-main">
          <div className="account-title">
            <h1 style={{ margin: 0 }}>{t('account') || 'My Account'}</h1>
          </div>

          {activeSection === 'dashboard' && (
            <>
              <section className="account-card account-greeting">
                <div>
                  <div className="account-greeting-title">Hello, {name}!</div>
                  {email ? <div className="muted small">{email}</div> : null}
                </div>
              </section>

              <section className="account-card">
                <div className="account-section-head">
                  <div>
                    <div className="account-section-title">{t('dashboard') || 'Dashboard'}</div>
                    <div className="muted small">{t('overview') || 'Account overview'}</div>
                  </div>
                </div>

                <div className="account-tiles">
                  <article className="account-tile">
                    <div className="account-tile-number">{ordersCount}</div>
                    <div className="account-tile-label">Total Orders</div>
                    <Button size="sm" variant="outline" onClick={() => setActiveSection('orders')}>View Orders</Button>
                  </article>
                  <article className="account-tile">
                    <div className="account-tile-number">{wishlistCount}</div>
                    <div className="account-tile-label">Wishlist</div>
                    <Button size="sm" variant="outline" onClick={() => setActiveSection('wishlist')}>View Wishlist</Button>
                  </article>
                  <article className="account-tile">
                    <div className="account-tile-number">0</div>
                    <div className="account-tile-label">Messages</div>
                    <Button size="sm" variant="outline" disabled>View Messages</Button>
                  </article>
                  <article className="account-tile">
                    <div className="account-tile-number">0</div>
                    <div className="account-tile-label">Support Tickets</div>
                    <Button size="sm" variant="outline" disabled>View Tickets</Button>
                  </article>
                </div>
              </section>

              <section className="account-card">
                <div className="account-section-head">
                  <div className="account-section-title">Recent Orders</div>
                </div>
                {renderOrdersTable(recentOrders, { showViewAll: true })}
              </section>

              <section className="account-card-grid">
                <section className="account-card">
                  <div className="account-section-head">
                    <div>
                      <div className="account-section-title">Manage Addresses</div>
                      <div className="muted small">{addressesCount} saved</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setActiveSection('addresses')}>
                      Manage Addresses
                    </Button>
                  </div>
                </section>

                <section className="account-card">
                  <div className="account-section-head">
                    <div>
                      <div className="account-section-title">Payment Methods</div>
                      <div className="muted small">No saved methods</div>
                    </div>
                    <Button size="sm" variant="outline" disabled>
                      Manage Payments
                    </Button>
                  </div>
                </section>
              </section>

              <section className="account-card">
                <div className="account-section-head">
                  <div>
                    <div className="account-section-title">Personal Information</div>
                    <div className="muted small">{t('accountInfo') || 'Account info'}</div>
                  </div>
                  <Button size="sm" variant="outline" disabled>{t('editProfile') || 'Edit Profile'}</Button>
                </div>

                <div className="account-info-grid">
                  <div>
                    <div className="muted small">{t('name') || 'Name'}</div>
                    <div style={{ fontWeight: 800 }}>{name}</div>
                  </div>
                  <div>
                    <div className="muted small">{t('email') || 'Email'}</div>
                    <div style={{ fontWeight: 800 }}>{email || '—'}</div>
                  </div>
                  <div>
                    <div className="muted small">{t('phone') || 'Phone'}</div>
                    <div style={{ fontWeight: 800 }}>{phone || '—'}</div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === 'orders' && (
            <section className="account-card">
              <div className="account-section-head">
                <div>
                  <div className="account-section-title">{t('myOrders') || 'My Orders'}</div>
                  <div className="muted small">{t('overview') || 'Overview'}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveSection('dashboard')}>Back</Button>
              </div>
              {renderOrdersTable(ordersSorted)}
            </section>
          )}

          {activeSection === 'wishlist' && (
            <section className="account-card">
              <div className="account-section-head">
                <div>
                  <div className="account-section-title">Wishlist</div>
                  <div className="muted small">{t('favorites') || 'Favorite Products'}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveSection('dashboard')}>Back</Button>
              </div>

              {favoriteProducts.length === 0 ? (
                <p className="muted">{t('noFavorites')}</p>
              ) : (
                <div className="account-list">
                  {favoriteProducts.map(p => {
                    const img = p?.image || null
                    const src = img ? fileUrl(img) : ''
                    const productId = p?.id || p?._id
                    const canOpen = Boolean(productId && onNavigate)
                    const price = typeof p?.price === 'number' ? p.price : Number(p?.price || 0)
                    const favActive = Boolean(productId && isFavorite && isFavorite(productId))

                    return (
                      <div
                        key={String(productId)}
                        className={`account-list-row ${canOpen ? 'clickable' : ''}`}
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
                        <div className="account-list-left">
                          {img ? (
                            <img className="account-thumb" src={src} alt={p?.name || ''} loading="lazy" />
                          ) : (
                            <div className="account-thumb placeholder" aria-hidden="true" />
                          )}
                          <div className="account-list-text">
                            <div className="account-list-title">{p?.name}</div>
                            <div className="muted small">৳{Number.isFinite(price) ? price.toLocaleString() : '0'}</div>
                          </div>
                        </div>

                        <div className="account-list-actions">
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
              )}
            </section>
          )}

          {activeSection === 'addresses' && (
            <section className="account-card">
              <div className="account-section-head">
                <div>
                  <div className="account-section-title">{t('myAddresses') || 'My Addresses'}</div>
                  <div className="muted small">{t('buyerDash.quickCheckout') || 'Quick checkout'}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveSection('dashboard')}>Back</Button>
              </div>

              {addrError && <div className="error small" style={{ marginBottom: '0.5rem' }}>{addrError}</div>}

              {addresses.length === 0 ? (
                <p className="muted" style={{ margin: '0.5rem 0' }}>{t('buyerDash.noSavedAddresses') || 'No saved addresses yet.'}</p>
              ) : (
                <div className="bd-addresses">
                  {addresses.map(addr => (
                    <div key={addr._id} className="bd-address-item">
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{addr.label || t('buyerDash.addressFallback') || 'Address'}</p>
                        <p className="muted small">{addr.address}, {addr.city}</p>
                        {addr.isDefault && <span className="pill" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{t('default') || 'Default'}</span>}
                      </div>
                      <div className="bd-addr-actions">
                        <Button size="sm" variant="outline" onClick={() => setDefault(addr._id)} disabled={savingAddr || addr.isDefault}>
                          {addr.isDefault ? (t('default') || 'Default') : (t('buyerDash.setDefault') || 'Set default')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteAddress(addr._id)} disabled={savingAddr}>{t('delete') || 'Delete'}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '0.75rem' }}>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? (t('cancel') || 'Cancel') : (t('buyerDash.addAddress') || 'Add address')}
                </Button>
              </div>

              {showAddForm && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="bd-form-group">
                    <label>{t('buyerDash.labelExample') || 'Label'}</label>
                    <input
                      type="text"
                      value={addrForm.label}
                      onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}
                      placeholder={t('buyerDash.labelPlaceholder') || 'Home'}
                    />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('fullName') || 'Full name'}</label>
                    <input type="text" value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('streetAddress') || 'Street address'}</label>
                    <textarea rows={2} value={addrForm.address} onChange={e => setAddrForm({ ...addrForm, address: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('city') || 'City'}</label>
                    <input type="text" value={addrForm.city} onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>{t('postalCode') || 'Postal code'}</label>
                    <input type="text" value={addrForm.postalCode} onChange={e => setAddrForm({ ...addrForm, postalCode: e.target.value })} />
                  </div>
                  <div className="bd-form-group">
                    <label>
                      <input type="checkbox" checked={addrForm.isDefault} onChange={e => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                      <span style={{ marginLeft: '0.4rem' }}>{t('buyerDash.setAsDefault') || 'Set as default'}</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>{t('cancel') || 'Cancel'}</Button>
                    <Button size="sm" onClick={addAddress} disabled={savingAddr}>{savingAddr ? (t('saving') || 'Saving…') : (t('buyerDash.saveAddress') || 'Save address')}</Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === 'payments' && (
            <section className="account-card">
              <div className="account-section-head">
                <div>
                  <div className="account-section-title">Payment Methods</div>
                  <div className="muted small">No saved payment methods yet.</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveSection('dashboard')}>Back</Button>
              </div>
            </section>
          )}

          {activeSection === 'settings' && (
            <section className="account-card">
              <div className="account-section-head">
                <div>
                  <div className="account-section-title">Account Settings</div>
                  <div className="muted small">Profile editing is not available yet.</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveSection('dashboard')}>Back</Button>
              </div>
            </section>
          )}

          {activeSection === 'support' && (
            <section className="account-card">
              <div className="account-section-head">
                <div>
                  <div className="account-section-title">Support Tickets</div>
                  <div className="muted small">No tickets yet.</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveSection('dashboard')}>Back</Button>
              </div>
            </section>
          )}
        </div>
      </section>

      <style>{`
        .buyer-dashboard{
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }

        .account-layout{
          display:grid;
          grid-template-columns: 260px 1fr;
          gap: 1rem;
          align-items:start;
        }

        .account-sidebar{
          position: sticky;
          top: 76px;
          background: var(--bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 0.85rem;
        }

        .account-user{
          display:flex;
          gap: 0.7rem;
          align-items:center;
          padding-bottom: 0.85rem;
          margin-bottom: 0.85rem;
          border-bottom: 1px solid var(--card-border);
        }

        .account-avatar{
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: var(--hero-start);
          border: 1px solid var(--border);
          color: var(--link);
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .account-user-name{ font-weight: 900; line-height: 1.1; }
        .account-user-sub{ margin-top: 2px; }

        .account-nav{ display:flex; flex-direction:column; gap: 0.25rem; }
        .account-nav-item{
          width:100%;
          text-align:left;
          border: 1px solid transparent;
          background: transparent;
          padding: 0.55rem 0.65rem;
          border-radius: 10px;
          cursor:pointer;
          font-weight: 700;
          color: var(--text);
          font-family: inherit;
        }
        .account-nav-item:hover{ background: rgba(234,88,12,0.08); }
        .account-nav-item.is-active{ background: rgba(234,88,12,0.12); border-color: rgba(234,88,12,0.18); color: #c2410c; }
        .account-nav-item.is-danger{ color: #b42318; }
        .account-nav-item.is-danger:hover{ background: rgba(180,35,24,0.08); }

        .account-main{ display:flex; flex-direction:column; gap: 1rem; }
        .account-title h1{ font-size: 2rem; font-weight: 900; }

        .account-card{
          background: var(--bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1rem;
        }

        .account-greeting{
          background: linear-gradient(135deg, var(--hero-start), #ffffff);
          border-color: var(--border);
        }
        .account-greeting-title{ font-weight: 900; font-size: 1.2rem; }

        .account-section-head{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 0.75rem;
          margin-bottom: 0.85rem;
        }
        .account-section-title{ font-weight: 900; font-size: 1.1rem; }

        .account-tiles{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .account-tile{
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 0.85rem;
          background: linear-gradient(180deg, #ffffff, var(--hero-start));
          display:flex;
          flex-direction:column;
          gap: 0.4rem;
          min-height: 140px;
        }
        .account-tile-number{ font-size: 1.6rem; font-weight: 900; color: var(--text); line-height:1; }
        .account-tile-label{ font-weight: 800; color: var(--muted); font-size: 0.9rem; }

        .account-card-grid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .account-info-grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .account-table{ border: 1px solid var(--card-border); border-radius: 12px; overflow:hidden; }
        .account-table-head, .account-table-row{
          display:grid;
          grid-template-columns: 1.1fr 1fr 1fr 1fr;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          align-items:center;
        }
        .account-table-head{ background: #f8fafc; font-weight: 900; color: var(--text); }
        .account-table-row{ background: #ffffff; border-top: 1px solid var(--card-border); }

        .mono{ font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }

        .pill{
          display: inline-flex;
          align-items: center;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          border: 1px solid var(--card-border);
          background: var(--hero-start);
          font-weight: 900;
          font-size: 0.78rem;
          color: var(--text);
          white-space: nowrap;
        }

        .account-row{ display:flex; align-items:center; gap: 0.5rem; margin-top: 0.75rem; }

        .account-list{ display:flex; flex-direction:column; gap: 0.5rem; }
        .account-list-row{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 0.75rem;
          padding: 0.55rem;
          border: 1px solid var(--card-border);
          border-radius: 12px;
          background: #ffffff;
        }
        .account-list-row.clickable{ cursor:pointer; }
        .account-list-row.clickable:hover{ border-color: var(--border); background: rgba(234,88,12,0.03); }

        .account-list-left{ display:flex; align-items:center; gap: 0.65rem; min-width:0; }
        .account-list-text{ min-width:0; }
        .account-list-title{ font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 520px; }
        .account-list-actions{ display:flex; align-items:center; gap: 0.35rem; flex: 0 0 auto; }

        .account-thumb{
          width: 44px;
          height: 44px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid var(--card-border);
          background: #f8fbf8;
          flex: 0 0 auto;
        }
        .account-thumb.placeholder{ background: #eef2f7; }

        .icon-btn{ background:none; border:none; padding:0.25rem; color:#6b7280; cursor:pointer }
        .icon-btn:hover{ color:#374151 }
        .icon-btn.fav-active{ color:#e53935 }

        .bd-addresses{ display:flex; flex-direction:column; gap: 0.65rem; }
        .bd-address-item{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 0.75rem;
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 0.75rem;
          background: #ffffff;
        }
        .bd-addr-actions{ display:flex; align-items:center; gap: 0.5rem; flex-wrap: wrap; justify-content:flex-end; }
        .bd-form-group{ display:flex; flex-direction:column; gap: 0.35rem; margin-bottom: 0.6rem; }
        .bd-form-group label{ font-weight: 800; color: var(--text); }
        .bd-form-group input, .bd-form-group textarea{
          border: 1px solid var(--card-border);
          border-radius: 10px;
          padding: 0.55rem 0.65rem;
          font: inherit;
          background: #ffffff;
        }
        .bd-form-group input:focus, .bd-form-group textarea:focus{ outline: none; box-shadow: 0 0 0 2px rgba(234,88,12,0.18); border-color: rgba(234,88,12,0.25); }

        .small{ font-size: 0.9rem; }

        @media (max-width: 980px){
          .account-layout{ grid-template-columns: 1fr; }
          .account-sidebar{ position: static; }
          .account-tiles{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .account-info-grid{ grid-template-columns: 1fr; }
          .account-card-grid{ grid-template-columns: 1fr; }
          .account-table-head, .account-table-row{ grid-template-columns: 1fr 1fr; }
          .account-table-head > :nth-child(3),
          .account-table-head > :nth-child(4),
          .account-table-row > :nth-child(3),
          .account-table-row > :nth-child(4){ display:none; }
        }
      `}</style>
    </main>
  )
}
