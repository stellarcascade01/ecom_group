import React, { useEffect, useRef, useState } from 'react'
import Button from '../components/Button'
import { t } from '../utils/strings'

export default function ProducerDashboard({ user, onNavigate, onUserUpdate, routeParams = null }){
  const name = user?.name || 'Producer'
  const producerName = user?.name || user?.email || ''
  const userId = user?.id || user?._id
  const ordersSectionRef = useRef(null)
  const handledOpenRef = useRef(null)
  const [liveCount, setLiveCount] = useState(null)
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [avatarInput, setAvatarInput] = useState(user?.avatar || '')
  const [avatarError, setAvatarError] = useState('')
  const [avatarMessage, setAvatarMessage] = useState('')
  const [savingAvatar, setSavingAvatar] = useState(false)
  const fileInputRef = useRef(null)
  
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [ordersExpanded, setOrdersExpanded] = useState(false)
  const [salesData, setSalesData] = useState([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [updatingItemKey, setUpdatingItemKey] = useState(null)

  useEffect(() => {
    const next = user?.avatar || ''
    setAvatar(next)
    setAvatarInput(next)
  }, [user?.avatar])

  useEffect(() => {
    let active = true
    async function load(){
      try{
        const res = await fetch('http://localhost:5000/api/products')
        if(!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        if(!active) return
        const producerKeys = [user?.name, user?.email, producerName]
          .filter(Boolean)
          .map(s => String(s).trim().toLowerCase())
        const mine = Array.isArray(data)
          ? data.filter(p => producerKeys.includes(String(p?.producer || '').trim().toLowerCase()))
          : []
        setLiveCount(mine.length)
      }catch(err){
        if(active) setLiveCount(0)
      }
    }
    if(producerName) load()
    return () => { active = false }
  }, [producerName, user?.name, user?.email])

  async function updateOrderItemStatus(orderId, productId, action) {
    if (!orderId || !productId || !action) return
    const key = `${orderId}:${productId}:${action}`
    setUpdatingItemKey(key)
    setOrdersError('')
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/items/${productId}/${action}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': user?.role || 'guest',
          'X-User-Id': user?.id || user?._id || ''
        }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to update order')

      const nextItemStatus = (
        action === 'accept' ? 'accepted'
          : action === 'reject' ? 'rejected'
          : action === 'ship' ? 'shipped'
          : null
      )

      setOrders(list => list.map(o => {
        const id = o._id || o.id
        if (id !== orderId) return o
        const updated = { ...o }
        if (data?.status) updated.status = data.status
        if (nextItemStatus) {
          updated.items = (Array.isArray(o.items) ? o.items : []).map(it => {
            const itPid = it?.productId?._id || it?.productId
            return String(itPid) === String(productId)
              ? { ...it, producerStatus: nextItemStatus }
              : it
          })
        }
        return updated
      }))
    } catch (err) {
      setOrdersError(err.message || 'Failed to update order')
    } finally {
      setUpdatingItemKey(null)
    }
  }

  useEffect(() => {
    let active = true
    async function loadOrders(){
      setOrdersLoading(true)
      setOrdersError('')
      try{
        const res = await fetch(`http://localhost:5000/api/orders/producer/${encodeURIComponent(producerName)}`)
        if(!res.ok) throw new Error('Failed to load orders')
        const data = await res.json()
        if(!active) return
        setOrders(Array.isArray(data) ? data : [])
        const newCount = (Array.isArray(data) ? data : []).filter(o => o.status === 'pending').length
        setNewOrdersCount(newCount)
        
        // Calculate sales trends and revenue
        const total = (Array.isArray(data) ? data : []).reduce((sum, o) => sum + (o.total || 0), 0)
        setTotalRevenue(total)
        
        // Group orders by date for sales trends
        const trends = new Map()
        ;(Array.isArray(data) ? data : []).forEach(order => {
          const createdAt = order?.createdAt ? new Date(order.createdAt) : null
          if (!createdAt || Number.isNaN(createdAt.getTime())) return
          const key = createdAt.toISOString().slice(0, 10) // YYYY-MM-DD
          const entry = trends.get(key) || { key, label: createdAt.toLocaleDateString(), count: 0 }
          entry.count += 1
          trends.set(key, entry)
        })
        const series = Array.from(trends.values())
          .sort((a, b) => String(a.key).localeCompare(String(b.key)))
          .slice(-7)
        setSalesData(series)
      }catch(err){
        if(active) setOrdersError(err.message || 'Failed to load orders')
      }finally{
        if(active) setOrdersLoading(false)
      }
    }
    if(producerName) loadOrders()
    return () => { active = false }
  }, [producerName])

  useEffect(() => {
    const open = routeParams?.open
    if (!open || handledOpenRef.current === open) return
    handledOpenRef.current = open

    if (open === 'orders') {
      setOrdersExpanded(true)
      // Smooth scroll to help users land exactly on the order list.
      try {
        ordersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch {
        ordersSectionRef.current?.scrollIntoView()
      }
    }
  }, [routeParams?.open])

  async function saveProfile() {
    setProfileError('')
    setProfileMessage('')
    if (!profileForm.name.trim()) { setProfileError('Name is required'); return }
    setSavingProfile(true)
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': user?.role || 'guest' },
        body: JSON.stringify(profileForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to update profile')
      setProfileMessage('Profile updated')
      setEditProfile(false)
      if (onUserUpdate) onUserUpdate(data)
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  function initials(){ return (producerName || 'P').split(' ').slice(0,2).map(s=>s[0]).join('').toUpperCase() }

  function handleAvatarClick(){ if(fileInputRef.current) fileInputRef.current.click() }

  function handleAvatarFile(e){
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onloadend = async () => {
      const next = reader.result || ''
      setAvatarInput(next)
      await saveAvatar(next)
      if(fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  async function saveAvatar(nextAvatar){
    setAvatarError('')
    setAvatarMessage('')
    const value = nextAvatar || avatarInput
    if(!value) { setAvatarError('Please select an image first'); return }
    if(!userId){ setAvatarError('Missing user id for update'); return }
    setSavingAvatar(true)
    try{
      const res = await fetch(`http://localhost:5000/api/users/${userId}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Role': user?.role || 'guest' },
        body: JSON.stringify({ avatar: value })
      })
      const data = await res.json()
      if(!res.ok) throw new Error(data?.message || 'Failed to update avatar')
      const saved = data.avatar || value
      setAvatar(saved)
      setAvatarInput(saved)
      setAvatarMessage('Profile photo updated')
      if(onUserUpdate) onUserUpdate(data)
    }catch(err){
      setAvatarError(err.message || 'Failed to update avatar')
    }finally{
      setSavingAvatar(false)
    }
  }

  return (
    <main className="producer-dashboard">
      <header className="pd-header">
        <div className="pd-header-content">
          <div className="pd-avatar-section">
            <div className="pd-avatar-large">
              {avatar ? <img src={avatar} alt="Avatar" /> : <span>{initials()}</span>}
            </div>
            <div className="pd-user-info">
              <h1>{name}</h1>
              {user?.email && <p>{user.email}</p>}
            </div>
          </div>
          <div className="pd-header-actions">
            <Button variant="primary" onClick={() => onNavigate?.('manage-products')}>📦 {t('manageProducts')}</Button>
            <Button variant="primary" onClick={() => onNavigate?.('upload-product')}>➕ {t('uploadProduct')}</Button>
            <Button onClick={() => setEditProfile(!editProfile)} variant="outline">✏️ {t('editProfile')}</Button>
          </div>
        </div>
      </header>

      <div className="pd-container">
        <div className="pd-top-row">
          <section className="pd-card pd-stats">
            <h2>{t('overview')}</h2>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-number">{liveCount === null ? '…' : liveCount}</div>
                <div className="stat-label">{t('products')}</div>
              </div>
              <div className="stat">
                <div className="stat-number">{ordersLoading ? '…' : newOrdersCount}</div>
                <div className="stat-label">{t('newOrders')}</div>
              </div>
              <div className="stat">
                <div className="stat-number">৳{totalRevenue.toLocaleString()}</div>
                <div className="stat-label">{t('totalRevenue')}</div>
              </div>
            </div>
          </section>

          <section className="pd-card">
            <h2>{t('salesTrends')}</h2>
            {salesData.length === 0 ? (
              <p className="pd-muted">{t('noSalesData')}</p>
            ) : (
              (() => {
                function buildPoints(values, labels) {
                  const width = 640
                  const height = 150
                  const padding = 28
                  const maxValue = Math.max(1, ...values.map(v => Number(v) || 0))
                  const n = values.length
                  const xStep = n <= 1 ? 0 : (width - padding * 2) / (n - 1)
                  const points = values.map((v, i) => {
                    const x = padding + xStep * i
                    const y = height - padding - ((Number(v) || 0) / maxValue) * (height - padding * 2)
                    return { x, y, value: Number(v) || 0, label: labels[i] }
                  })
                  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
                  const area = `M ${padding} ${height - padding} L ${polyline.split(',').join(' ')} L ${width - padding} ${height - padding} Z`
                  return { width, height, padding, points, polyline, area }
                }

                const labels = salesData.map(d => d.label)
                const countSeries = salesData.map(d => d.count || 0)

                const salesChart = buildPoints(countSeries, labels)

                const renderLabels = (points) => (
                  <div className="sales-graph-labels" aria-hidden="true">
                    {points.map((p, idx) => {
                      const parts = String(p.label || '').split('/')
                      const shortLabel = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : String(p.label || '')
                      return (
                        <div key={idx} className="sales-graph-label">{shortLabel}</div>
                      )
                    })}
                  </div>
                )

                return (
                  <div className="pd-trends-grid">
                    <div className="pd-trend-card">
                      <div className="pd-trend-head">
                        <h3 className="pd-trend-title">{t('dailySales')}</h3>
                        <div className="pd-trend-pill">{countSeries.reduce((s, v) => s + (Number(v) || 0), 0)}</div>
                      </div>
                      <div className="sales-graph" aria-label={t('dailySales')}>
                        <svg className="sales-graph-svg" viewBox={`0 0 ${salesChart.width} ${salesChart.height}`} role="img" aria-label={t('dailySales')}>
                          <line x1={salesChart.padding} y1={salesChart.height - salesChart.padding} x2={salesChart.width - salesChart.padding} y2={salesChart.height - salesChart.padding} className="sales-graph-axis" />
                          <line x1={salesChart.padding} y1={salesChart.padding} x2={salesChart.padding} y2={salesChart.height - salesChart.padding} className="sales-graph-axis" />
                          <path d={salesChart.area} className="pd-graph-area pd-graph-area--sales" />
                          <polyline points={salesChart.polyline} className="sales-graph-line" />
                          {salesChart.points.map((p, idx) => (
                            <circle key={idx} cx={p.x} cy={p.y} r="4" className="sales-graph-point" />
                          ))}
                        </svg>
                        {renderLabels(salesChart.points)}
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </section>
          
          <section className="pd-card" ref={ordersSectionRef}>
            <div className="pd-card-header">
              <button
                type="button"
                className="pd-collapse-toggle"
                onClick={() => setOrdersExpanded(v => !v)}
                aria-expanded={ordersExpanded}
              >
                <span className="pd-collapse-title">{t('receivedOrders')}</span>
                <span className="pd-collapse-meta">
                  {newOrdersCount > 0 && <span className="pd-badge">{newOrdersCount} {t('new')}</span>}
                  <span className="pd-collapse-caret" aria-hidden="true">{ordersExpanded ? '▴' : '▾'}</span>
                </span>
              </button>
            </div>
            {ordersError && <div className="pd-alert error">{ordersError}</div>}
            {ordersLoading ? (
              <p className="pd-muted">{t('loading')}</p>
            ) : orders.length === 0 ? (
              <p className="pd-muted">{t('noOrdersYet')}</p>
            ) : !ordersExpanded ? (
              <p className="pd-muted">{t('tapToExpand') || 'Tap to expand'}</p>
            ) : (
              <div className="orders-list">
                {orders.map(order => {
                  const orderId = order._id || order.id
                  const isNew = order.status === 'pending'
                  const statusKey = String(order.status || '').toLowerCase()
                  const statusLabel = (
                    statusKey === 'pending' ? t('pending')
                      : statusKey === 'accepted' ? (t('accepted') || 'Accepted')
                      : statusKey === 'rejected' ? (t('rejected') || 'Rejected')
                      : statusKey === 'processing' ? t('processing')
                      : statusKey === 'shipped' ? t('shipped')
                      : statusKey === 'delivered' ? t('delivered')
                      : statusKey === 'completed' ? t('completed')
                      : (order.status || '')
                  )
                  const orderItems = Array.isArray(order.items) ? order.items : []
                  return (
                    <div key={orderId} className={`order-item ${isNew ? 'new' : ''}`}>
                      <div className="order-header">
                        <strong>{t('orderNumber', { num: orderId.slice(-6) })}</strong>
                        <span className={`order-status ${order.status}`}>{statusLabel}</span>
                      </div>
                      <div className="order-details">
                        <p className="pd-muted">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="pd-muted">{t('orderItemsCount', { count: orderItems.length })} • ৳{order.total}</p>
                      </div>

                      <div className="order-products">
                        {orderItems.map((it, idx) => {
                          const pid = it?.productId?._id || it?.productId
                          const itemStatusKey = String(it?.producerStatus || 'pending').toLowerCase()
                          const itemStatusLabel = (
                            itemStatusKey === 'pending' ? t('pending')
                              : itemStatusKey === 'accepted' ? (t('accepted') || 'Accepted')
                              : itemStatusKey === 'rejected' ? (t('rejected') || 'Rejected')
                              : itemStatusKey === 'shipped' ? (t('shipped') || 'Shipped')
                              : (it?.producerStatus || '')
                          )
                          const acceptKey = `${orderId}:${pid}:accept`
                          const rejectKey = `${orderId}:${pid}:reject`
                          const shipKey = `${orderId}:${pid}:ship`
                          return (
                            <div key={`${String(pid) || 'p'}-${idx}`} className="order-product-row">
                              <div className="order-product-main">
                                <div className="order-product-name">{it?.name || t('product')}</div>
                                <div className="pd-muted">Qty: {(Number(it?.qty) || 0)}</div>
                              </div>
                              <span className={`order-item-status ${itemStatusKey}`}>{itemStatusLabel}</span>
                              <div className="order-product-actions">
                                {itemStatusKey === 'pending' && (
                                  <>
                                    <Button size="sm" variant="outline" disabled={updatingItemKey === acceptKey} onClick={() => updateOrderItemStatus(orderId, pid, 'accept')}>
                                      {t('accept') || 'Accept'}
                                    </Button>
                                    <Button size="sm" variant="danger" disabled={updatingItemKey === rejectKey} onClick={() => updateOrderItemStatus(orderId, pid, 'reject')}>
                                      {t('reject') || 'Reject'}
                                    </Button>
                                  </>
                                )}

                                {itemStatusKey === 'accepted' && (
                                  <Button size="sm" variant="outline" disabled={updatingItemKey === shipKey} onClick={() => updateOrderItemStatus(orderId, pid, 'ship')}>
                                    {t('markShipped') || 'Mark shipped'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

        </div>

        {editProfile && (
          <section className="pd-card pd-edit-profile">
            <h2>{t('editProfile') || 'Edit Profile'}</h2>
            {profileError && <div className="pd-alert error">{profileError}</div>}
            {profileMessage && <div className="pd-alert success">{profileMessage}</div>}
            <input type="text" className="pd-input" placeholder="Name" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
            <input type="email" className="pd-input" placeholder="Email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
            <input type="text" className="pd-input" placeholder="Phone" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />

            <div className="pd-section-divider">{t('profilePhoto') || 'Profile photo'}</div>
            {avatarError && <div className="pd-alert error">{avatarError}</div>}
            {avatarMessage && <div className="pd-alert success">{avatarMessage}</div>}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
            <div className="pd-button-group pd-button-group--profile-actions">
              <Button size="sm" variant="outline" onClick={handleAvatarClick} disabled={savingAvatar}>
                {savingAvatar ? (t('uploading') || 'Uploading...') : (t('uploadFile') || 'Upload file')}
              </Button>
              <Button size="sm" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => setEditProfile(false)}>
                {t('cancel') || 'Cancel'}
              </Button>
            </div>
          </section>
        )}
      </div>

      <style>{`
        .producer-dashboard { background: #f1fdff; min-height: 100vh; padding-bottom: 3rem; }
        .pd-header { background: linear-gradient(135deg, #1eaecb, #147d94); color: white; padding: 2rem; }
        .pd-header-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; flex-wrap: wrap; }
        .pd-avatar-section { display: flex; gap: 1.5rem; align-items: center; flex: 1; min-width: 250px; }
        .pd-avatar-large { width: 100px; height: 100px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 2.5rem; font-weight: 800; flex-shrink: 0; }
        .pd-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
        .pd-user-info h1 { margin: 0; font-size: 2rem; font-weight: 800; }
        .pd-user-info p { margin: 0.3rem 0 0; opacity: 0.95; font-size: 0.95rem; }
        .pd-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .pd-container { max-width: 1400px; margin: 2rem auto; padding: 0 1rem; }
        .pd-top-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; align-items: start; }
        .pd-top-row > .pd-card { margin-bottom: 0; }
        .pd-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 2rem; }
        .pd-row-two { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
        .pd-row-two > .pd-card { margin-bottom: 0; }
        .pd-card h2 { margin: 0 0 1.5rem; font-size: 1.3rem; color: #147d94; }
        .pd-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; }
        .pd-card-header h2 { margin: 0; }
        .pd-collapse-toggle { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; background: transparent; border: none; padding: 0; cursor: pointer; text-align: left; }
        .pd-collapse-title { font-size: 1.3rem; font-weight: 800; color: #147d94; }
        .pd-collapse-meta { display: inline-flex; align-items: center; gap: 0.5rem; }
        .pd-collapse-caret { font-size: 1.1rem; opacity: 0.8; }
        .pd-badge { background: #ff5722; color: white; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .stat { background: #f1fdff; padding: 1.25rem; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: 800; color: #1eaecb; margin-bottom: 0.5rem; }
        .stat-label { color: #666; font-size: 0.9rem; font-weight: 600; }
        .sales-graph { padding: 0.75rem 0 0.25rem; }
        .sales-graph-svg { width: 100%; height: 160px; display: block; }
        .sales-graph-axis { stroke: #d7ddd8; stroke-width: 2; }
        .sales-graph-line { fill: none; stroke: #1eaecb; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
        .sales-graph-point { fill: #147d94; stroke: #ffffff; stroke-width: 2; }
        .sales-graph-value { font-size: 14px; font-weight: 800; fill: #147d94; }
        .sales-graph-labels { display: grid; grid-template-columns: repeat(auto-fit, minmax(44px, 1fr)); gap: 0.25rem; margin-top: 0.4rem; }
        .sales-graph-label { text-align: center; font-size: 0.8rem; color: #666; }

        .pd-trends-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .pd-trend-card { background: linear-gradient(180deg, #ffffff, #fbfffd); border: 1px solid #e0e0e0; border-radius: 12px; padding: 1rem; }
        .pd-trend-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.5rem; }
        .pd-trend-title { margin: 0; font-size: 1rem; font-weight: 800; color: #147d94; }
        .pd-trend-pill { background: #e9fbff; color: #147d94; border: 1px solid #c7f3fb; border-radius: 999px; padding: 0.25rem 0.6rem; font-weight: 800; font-size: 0.85rem; }

        .pd-graph-area { opacity: 0.18; }
        .pd-graph-area--sales { fill: #1eaecb; }
        .pd-graph-area--income { fill: #147d94; }
        .pd-graph-line--income { stroke: #147d94; }
        .pd-graph-point--income { fill: #1eaecb; }
        .sales-chart { display: flex; gap: 1rem; align-items: flex-end; height: 200px; padding: 1rem 0; }
        .chart-bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
        .bar-container { width: 100%; height: 150px; background: #f0f0f0; border-radius: 6px; display: flex; align-items: flex-end; justify-content: center; }
        .bar { width: 70%; background: linear-gradient(180deg, #1eaecb, #147d94); border-radius: 4px 4px 0 0; min-height: 10px; transition: all 0.3s; }
        .bar-label { font-size: 0.8rem; color: #666; }
        .bar-value { font-weight: 700; color: #1eaecb; font-size: 0.9rem; }
        .analytics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .analytics-item { background: linear-gradient(135deg, #e9fbff, #f6feff); padding: 1rem; border-radius: 8px; text-align: center; }
        .analytics-label { color: #666; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; }
        .analytics-value { font-size: 1.8rem; font-weight: 800; color: #1eaecb; }
        .stat-label { color: #666; font-size: 0.9rem; font-weight: 600; }
        .order-item { display: block; border: 1px solid #e0e0e0; border-radius: 10px; padding: 1rem; transition: all 0.2s; }
        .order-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .order-item.new { border-color: #ff5722; background: #fff8f6; }
        .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 1rem; }
        .order-status { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; }
        .order-status.pending { background: #fff3cd; color: #856404; }
        .order-status.accepted { background: #cfe2ff; color: #084298; }
        .order-status.rejected { background: #f8d7da; color: #842029; }
        .order-status.processing { background: #cfe2ff; color: #084298; }
        .order-status.shipped, .order-status.delivered { background: #d1e7dd; color: #0f5132; }
        .order-details { margin-bottom: 0.75rem; }
        .order-details p { margin: 0.2rem 0; font-size: 0.9rem; }
        .order-details strong { color: #147d94; }
        .order-payment { font-size: 0.85rem; font-weight: 600; color: #1eaecb; }
        .order-products { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
        .order-product-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding-top: 0.6rem; border-top: 1px dashed rgba(0,0,0,0.08); }
        .order-product-row:first-child { border-top: none; padding-top: 0; }
        .order-product-main { min-width: 0; flex: 1; }
        .order-product-name { font-weight: 800; color: #147d94; }
        .order-product-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }
        .order-product-actions .btn { padding: 0.2rem 0.55rem; font-size: 0.78rem; border-radius: 6px; }
        .order-item-status { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 800; text-transform: capitalize; white-space: nowrap; }
        .order-item-status.pending { background: #fff3cd; color: #856404; }
        .order-item-status.accepted { background: #cfe2ff; color: #084298; }
        .order-item-status.rejected { background: #f8d7da; color: #842029; }
        .order-item-status.shipped { background: #d1e7dd; color: #0f5132; }
        .pd-muted { color: #999; font-size: 0.9rem; margin: 0; }
        .pd-alert { padding: 0.75rem 1rem; border-radius: 10px; margin-bottom: 1rem; font-size: 0.9rem; }
        .pd-alert.error { background: #fdecea; color: #b23b31; border: 1px solid #f5c2c0; }
        .pd-alert.success { background: #e6fbff; color: #147d94; border: 1px solid #c7f3fb; }
        .pd-input { width: 100%; padding: 0.75rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 0.95rem; }
        .pd-input:focus { outline: 2px solid #1eaecb; border-color: #1eaecb; box-shadow: 0 0 0 3px rgba(30,174,203,0.15); }
        .pd-button-group { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
        .pd-button-group--profile-actions { align-items: center; }
        .pd-section-divider { font-weight: 700; color: #1eaecb; margin: 1.5rem 0 1rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.95rem; }
        .pd-edit-profile { position: sticky; top: 20px; }
        @media (max-width: 1024px) {
          .pd-top-row { grid-template-columns: 1fr; }
          .pd-row-two { grid-template-columns: 1fr; }
          .pd-edit-profile { position: static; }
        }
        @media (max-width: 768px) {
          .pd-header-content { flex-direction: column; }
          .pd-header-actions { width: 100%; flex-direction: column; }
          .pd-header-actions button { width: 100%; }
          .stats-grid { grid-template-columns: 1fr; }
          .order-header { flex-direction: column; align-items: flex-start; }
        }
        @media (min-width: 769px) {
          .pd-button-group--profile-actions { flex-wrap: nowrap; }
        }
      `}</style>
    </main>
  )
}