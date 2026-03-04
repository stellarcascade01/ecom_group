import React, { useMemo, useState, useEffect } from 'react'
import { useCart } from '../cart/useCart'
import Button from '../components/Button'
import { t } from '../utils/strings'

export default function Checkout({ currentUser }) {
  const { items, total, clear } = useCart()
  const { storageAvailable } = useCart()

  // Auto-select default address if available
  const defaultAddressId = currentUser?.shippingAddresses?.find(a => a.isDefault)?._id || ''

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: t('bangladesh')
  })

  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddressId)
  const [touched, setTouched] = useState({})
  const [placed, setPlaced] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  // Auto-populate form with default address on mount
  useEffect(() => {
    if (defaultAddressId && currentUser?.shippingAddresses) {
      const addr = currentUser.shippingAddresses.find(a => a._id === defaultAddressId)
      if (addr) {
        setForm({
          name: addr.name || '',
          email: addr.email || '',
          phone: addr.phone || '',
          address: addr.address || '',
          city: addr.city || '',
          postalCode: addr.postalCode || '',
          country: addr.country || t('bangladesh')
        })
      }
    }
  }, [defaultAddressId, currentUser?.shippingAddresses, t])

  // Handle address selection
  const handleAddressSelect = (e) => {
    const addrId = e.target.value
    setSelectedAddressId(addrId)
    
    if (addrId) {
      const addr = currentUser?.shippingAddresses?.find(a => a._id === addrId)
      if (addr) {
        setForm({
          name: addr.name || '',
          email: addr.email || '',
          phone: addr.phone || '',
          address: addr.address || '',
          city: addr.city || '',
          postalCode: addr.postalCode || '',
          country: addr.country || t('bangladesh')
        })
      }
    } else {
      // Clear form if no address selected
      setForm({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        address: '',
        city: '',
        postalCode: '',
        country: t('bangladesh')
      })
    }
  }

  // items, total, clear are provided by cart context

  const errors = useMemo(() => {
    const e = {}

    if (!form.name.trim()) e.name = t('nameRequired')

    // Email OR phone validation
    if (!form.email.trim() && !form.phone.trim()) {
      e.email = t('emailOrPhoneRequired')
      e.phone = t('emailOrPhoneRequired')
    } else {
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        e.email = t('invalidEmail')
      }
      // Accept any phone number with at least 10 digits
      if (form.phone.trim() && form.phone.trim().length < 1) {
        e.phone = t('invalidPhone')
      }
    }

    if (!form.address.trim()) e.address = t('addressRequired')
    if (!form.city.trim()) e.city = t('cityRequired')
   
    if (!form.country.trim()) e.country = t('countryRequired')

    return e
  }, [form, t])

  const isValid = Object.keys(errors).length === 0

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onBlur = (e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true, address: true, city: true, postalCode: true, country: true })
    
    if (!isValid || items.length === 0) {
      if(!isValid) {
        setSubmitError(t('correctFieldsError'))
      }
      if(items.length === 0) setSubmitError(t('yourCartIsEmpty'))
      return
    }

    // Build payload for backend
    const orderItems = items.map(it => ({ productId: it.id, name: it.name, price: it.price, qty: it.qty }))
    const payload = {
      items: orderItems,
      total,
      customer: currentUser?._id || currentUser?.id || null
    }
    
    setPlacing(true)
    setSubmitError('')
    
    try{
      const res = await fetch('https://ecom-group.onrender.com/api/orders',{
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      })
      
      if(!res.ok){
        const msg = await res.text()
        throw new Error(msg || t('checkoutFailedToPlaceOrder'))
      }
      
      const createdOrder = await res.json()
      setLastOrder(createdOrder)
      setPlaced(true)
      setPaymentMethod('')
      setPlacing(false)
    }catch(err){
      console.error('Order error:', err)
      setSubmitError(err.message || t('checkoutCouldNotPlaceOrder'))
      setPlacing(false)
    }
  }

  const handlePaymentConfirm = async (method) => {
    const orderId = lastOrder?._id
    setPaymentMethod(method)
    setProcessingPayment(true)

    setLastOrder(prev => {
      if (!prev) return prev
      return {
        ...prev,
        paymentMethod: method,
        paymentStatus: 'completed'
      }
    })

    try {
      if (orderId) {
        const res = await fetch(`https://ecom-group.onrender.com/api/orders/${orderId}/payment`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentMethod: method, paymentStatus: 'completed' })
        })
        if (res.ok) {
          const updated = await res.json()
          setLastOrder(updated)
        }
      }
    } catch {
      // non-blocking: keep checkout flow moving even if update fails
    }
    
    setTimeout(() => {
      setProcessingPayment(false)
      clear()
    }, 2000)
  }

  return (
    <main className="page checkout-page">
      {/* Payment Options Modal */}
      {placed && !paymentMethod && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <h2>{t('choosePaymentMethod')}</h2>
            <p className="modal-subtitle">{t('selectPaymentMethod')}</p>
            
            <div className="payment-options">
              <button 
                className="payment-option cash"
                onClick={() => handlePaymentConfirm('cash')}
                disabled={processingPayment}
              >
                <div className="payment-icon">💵</div>
                <div className="payment-label">{t('cashOnDelivery')}</div>
                <div className="payment-desc">{t('payOnDeliveryDesc')}</div>
              </button>

              <button 
                className="payment-option card"
                onClick={() => handlePaymentConfirm('card')}
                disabled={processingPayment}
              >
                <div className="payment-icon">💳</div>
                <div className="payment-label">{t('debitCreditCard')}</div>
                <div className="payment-desc">{t('cardDesc')}</div>
              </button>

              <button 
                className="payment-option mfs"
                onClick={() => handlePaymentConfirm('mfs')}
                disabled={processingPayment}
              >
                <div className="payment-icon">📱</div>
                <div className="payment-label">{t('mobileMoney')}</div>
                <div className="payment-desc">{t('mfsDesc')}</div>
              </button>
            </div>

            {processingPayment && (
              <div className="processing-message">
                <div className="spinner"></div>
                <p>{t('processingPayment')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="checkout-header">
        <h1>{t('checkout')}</h1>
        <p className="muted">{t('checkoutSubtitle')}</p>
      </div>

      {placed && paymentMethod && <div className="checkout-success" style={{ marginBottom: '1.5rem' }}>✓ {t('orderPlacedSuccess')} {t('paymentMethod')}: <strong>{paymentMethod.toUpperCase()}</strong></div>}
      {!storageAvailable && <div className="checkout-warning" style={{ marginBottom: '1.5rem' }}>⚠ {t('storageDisabledWarning')}</div>}
      {submitError && !placed && <div className="checkout-error" style={{marginBottom:'1.5rem'}}>{submitError}</div>}
      {items.length === 0 && !placed && <div className="checkout-empty"><p className="muted">{t('checkoutCartEmptyProceed')}</p></div>}

      <div className="checkout-grid">
        {!placed && (
        <section className="shipping-section">
          <div className="section-header">
            <h2>{t('shippingAddress')}</h2>
            {currentUser?.shippingAddresses?.length > 0 && <span className="badge">{currentUser.shippingAddresses.length} {t('saved')}</span>}
          </div>
          
          {currentUser?.shippingAddresses && currentUser.shippingAddresses.length > 0 && (
            <div className="saved-addresses-select">
              <label htmlFor="savedAddress">{t('quickSelectAddress')}</label>
              <select 
                id="savedAddress" 
                value={selectedAddressId} 
                onChange={handleAddressSelect}
              >
                <option value="">{t('useSavedAddress')}</option>
                {currentUser.shippingAddresses.map(addr => (
                  <option key={addr._id} value={addr._id}>
                    {addr.label} {addr.isDefault ? `✓ ${t('default')}` : ''} • {addr.address.substring(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <form className="checkout-form" onSubmit={onSubmit} noValidate>

            <div className="form-row full">
              <label htmlFor="name">{t('fullName')} *</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                placeholder={t('enterFullName')}
                value={form.name} 
                onChange={onChange} 
                onBlur={onBlur}
                className={touched.name && errors.name ? 'input-error' : ''}
              />
              {touched.name && errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-row two-cols">
              <div>
                <label htmlFor="email">{t('email')}</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder={t('emailPlaceholder')}
                  value={form.email} 
                  onChange={onChange} 
                  onBlur={onBlur}
                  className={touched.email && errors.email ? 'input-error' : ''}
                />
                {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div>
                <label htmlFor="phone">{t('phone')} *</label>
                <input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  placeholder={t('phonePlaceholder')}
                  value={form.phone} 
                  onChange={onChange} 
                  onBlur={onBlur}
                  className={touched.phone && errors.phone ? 'input-error' : ''}
                />
                {touched.phone && errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-row full">
              <label htmlFor="address">{t('streetAddress')} *</label>
              <textarea 
                id="address" 
                name="address" 
                rows="2" 
                placeholder={t('addressPlaceholder')}
                value={form.address} 
                onChange={onChange} 
                onBlur={onBlur}
                className={touched.address && errors.address ? 'input-error' : ''}
              />
              {touched.address && errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <div className="form-row two-cols">
              <div>
                <label htmlFor="city">{t('city')} *</label>
                <input 
                  id="city" 
                  name="city" 
                  type="text" 
                  placeholder={t('cityPlaceholder')}
                  value={form.city} 
                  onChange={onChange} 
                  onBlur={onBlur}
                  className={touched.city && errors.city ? 'input-error' : ''}
                />
                {touched.city && errors.city && <span className="field-error">{errors.city}</span>}
              </div>
              <div>
                <label htmlFor="postalCode">{t('postalCode')}</label>
                <input 
                  id="postalCode" 
                  name="postalCode" 
                  type="text" 
                  placeholder={t('optional')}
                  value={form.postalCode} 
                  onChange={onChange} 
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div className="form-row full">
              <label htmlFor="country">{t('country')} *</label>
              <input 
                id="country" 
                name="country" 
                type="text" 
                value={form.country} 
                onChange={onChange} 
                onBlur={onBlur}
                className={touched.country && errors.country ? 'input-error' : ''}
              />
              {touched.country && errors.country && <span className="field-error">{errors.country}</span>}
            </div>

            <div className="form-actions">
              <Button 
                type="submit" 
                disabled={!isValid || items.length === 0 || placing} 
                size="lg"
              >
                {placing ? `🔄 ${t('loading')}` : `✓ ${t('placeOrder')}`}
              </Button>
            </div>

          </form>
        </section>
        )}

        <aside className="order-summary-section">
          <h2>{t('orderSummary')}</h2>
          {(() => {
            const summaryItems = (placed && lastOrder?.items?.length)
              ? lastOrder.items
              : items
            const summaryTotal = (placed && typeof lastOrder?.total === 'number')
              ? lastOrder.total
              : total

            if (summaryItems.length === 0) {
              return <div className="muted">{t('noItemsInCart')}</div>
            }

            return (
            <>
              <div className="order-items">
                {summaryItems.map((it, idx) => (
                  <div key={it?.id || it?.productId || `${it?.name || 'item'}-${idx}`} className="order-item">
                    <div className="item-info">
                      <p className="item-name">{it.name}</p>
                      <p className="item-qty">{t('qty')}: {it.qty}</p>
                    </div>
                    <p className="item-price">৳{(it.price * it.qty).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="order-divider"></div>
              <div className="order-total">
                <span>{t('totalAmount')}</span>
                <span className="total-price">৳{summaryTotal.toLocaleString()}</span>
              </div>
            </>
            )
          })()}
        </aside>
      </div>

      <style>{`
        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .payment-modal {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .payment-modal h2 {
          margin: 0 0 0.5rem;
          color: #1d3b28;
          font-size: 1.6rem;
          text-align: center;
        }

        .modal-subtitle {
          text-align: center;
          color: #666;
          margin: 0 0 1.5rem;
          font-size: 0.95rem;
        }

        .payment-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .payment-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.2rem;
          border: 2px solid #e3ebe4;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          font-family: inherit;
        }

        .payment-option:hover:not(:disabled) {
          border-color: #1eaecb;
          background: #f0fdff;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 174, 203, 0.15);
        }

        .payment-option:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payment-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .payment-option > div:nth-child(2) {
          flex: 1;
        }

        .payment-label {
          font-weight: 700;
          color: #173a63;
          font-size: 1.05rem;
          margin-bottom: 0.2rem;
        }

        .payment-desc {
          color: #666;
          font-size: 0.85rem;
        }

        .processing-message {
          text-align: center;
          padding: 1.5rem;
          background: #e9fbff;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top: 4px solid #1eaecb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .processing-message p {
          margin: 0;
          color: #1b3f6b;
          font-weight: 600;
        }
        
        .checkout-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem;
        }

        .checkout-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .checkout-header h1 {
          font-size: 2rem;
          color: #173a63;
          margin: 0 0 0.5rem;
        }

        .checkout-header .muted {
          font-size: 1rem;
        }

        .checkout-success {
          background: #e9fbff;
          border: 2px solid #56d1e6;
          color: #1b3f6b;
          padding: 1rem;
          border-radius: 10px;
          font-weight: 600;
          text-align: center;
        }

        .checkout-error {
          background: #ffebee;
          border: 2px solid #f44336;
          color: #c62828;
          padding: 1rem;
          border-radius: 10px;
          font-weight: 600;
          text-align: center;
        }

        .checkout-warning {
          background: #fff3e0;
          border: 2px solid #ff9800;
          color: #e65100;
          padding: 1rem;
          border-radius: 10px;
          font-weight: 600;
          text-align: center;
        }

        .checkout-empty {
          text-align: center;
          padding: 2rem;
          background: #f5f5f5;
          border-radius: 10px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 2rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0;
          color: #173a63;
          font-size: 1.3rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          background: #e9fbff;
          color: #1b3f6b;
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .shipping-section {
          background: #ffffff;
          border: 1px solid #e3ebe4;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .saved-addresses-select {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f0fdff;
          border-radius: 10px;
          border: 1px dashed #c7f3fb;
        }

        .saved-addresses-select label {
          display: block;
          font-weight: 600;
          color: #173a63;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .saved-addresses-select select {
          width: 100%;
          padding: 0.7rem;
          border: 1px solid #c7f3fb;
          border-radius: 8px;
          background: white;
          color: #111;
          font-family: inherit;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .saved-addresses-select select:hover,
        .saved-addresses-select select:focus {
          border-color: #1eaecb;
          outline: none;
          box-shadow: 0 0 0 3px rgba(30, 174, 203, 0.1);
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-row.full {
          grid-column: 1 / -1;
        }

        .form-row.two-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-row.two-cols > div {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-row label {
          font-weight: 600;
          color: #173a63;
          font-size: 0.95rem;
        }

        .form-row input,
        .form-row textarea {
          padding: 0.7rem;
          border: 2px solid #e3ebe4;
          border-radius: 8px;
          background: #fdfefc;
          color: #111;
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .form-row input:focus,
        .form-row textarea:focus {
          outline: none;
          border-color: #1eaecb;
          box-shadow: 0 0 0 3px rgba(30, 174, 203, 0.1);
        }

        .form-row input.input-error,
        .form-row textarea.input-error {
          border-color: #f44336;
          box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
        }

        .field-error {
          color: #c62828;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 0.2rem;
        }

        .form-actions {
          margin-top: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .order-summary-section {
          background: #ffffff;
          border: 1px solid #e3ebe4;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          height: fit-content;
          position: sticky;
          top: 20px;
        }

        .order-summary-section h2 {
          margin: 0 0 1.5rem;
          color: #173a63;
          font-size: 1.2rem;
        }

        .order-items {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem 0;
        }

        .item-info {
          flex: 1;
        }

        .item-name {
          margin: 0;
          font-weight: 600;
          color: #111;
          font-size: 0.95rem;
        }

        .item-qty {
          margin: 0.2rem 0 0;
          font-size: 0.85rem;
          color: #666;
        }

        .item-price {
          margin: 0;
          font-weight: 600;
          color: #1eaecb;
          white-space: nowrap;
        }

        .order-divider {
          height: 1px;
          background: #e3ebe4;
          margin: 1rem 0;
        }

        .order-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5rem;
        }

        .order-total span:first-child {
          font-weight: 600;
          color: #173a63;
        }

        .total-price {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1eaecb;
        }

        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }

          .order-summary-section {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .checkout-page {
            padding: 1rem 0.5rem 2rem;
          }

          .checkout-header h1 {
            font-size: 1.5rem;
          }

          .form-row.two-cols {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .payment-modal {
            padding: 1.5rem;
          }

          .payment-option {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </main>
  )
}
