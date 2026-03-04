import React, { useEffect, useRef } from 'react'
import { useCart } from '../cart/useCart'
import Button from './Button'
import { t } from '../utils/strings'

export default function CartPanel({ onCheckout }){
  const { items, isOpen, setIsOpen, removeItem, updateQty, total, clear } = useCart()
  const panelRef = useRef(null)

  useEffect(()=>{
    if(!isOpen) return
    const onClickOutside = (e)=>{
      if(panelRef.current && !panelRef.current.contains(e.target)){
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return ()=> document.removeEventListener('mousedown', onClickOutside)
  }, [isOpen, setIsOpen])

  if(!isOpen) return null

  return (
    <aside className="cart-panel" role="dialog" aria-label={t('cart')} ref={panelRef}>
      <div className="cart-header">
  <h4>{t('cart')}</h4>
  <Button variant="outline" size="sm" onClick={()=>setIsOpen(false)}>{t('close')}</Button>
      </div>

      <div className="cart-body">
        {items.length === 0 && <div className="muted">{t('yourCartIsEmpty')}</div>}
        {items.map(item => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-main">
              <div className="cart-item-title">{item.name}</div>
              <div className="muted small">{item.producer}</div>
            </div>
            <div className="cart-item-actions">
              <div className="qty-controls">
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Decrease quantity"
                  onClick={()=>updateQty(item.id, Math.max(1, (item.qty||1) - 1))}
                >
                  -
                </Button>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e)=>{
                    const next = Math.max(1, parseInt(e.target.value, 10) || 1)
                    updateQty(item.id, next)
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Increase quantity"
                  onClick={()=>updateQty(item.id, (item.qty||1) + 1)}
                >
                  +
                </Button>
              </div>
              <div className="cart-item-price">৳{item.price * item.qty}</div>
              <Button variant="link" onClick={()=>removeItem(item.id)}>🗑️</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total">{t('totalAmount')}: <strong>৳{total}</strong></div>
        <div className="cart-actions">
          <Button size="sm" variant="outline" onClick={clear}>{t('clearCart')}</Button>
          <Button size="sm" onClick={()=>{ if(onCheckout) onCheckout() }}>{t('checkout')}</Button>
        </div>
      </div>
    </aside>
  )
}
