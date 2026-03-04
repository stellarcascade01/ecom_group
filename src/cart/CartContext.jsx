import React, { useState, useEffect, createContext } from 'react'
import { isLocalStorageAvailable } from '../utils/storage'

const STORAGE_KEY = 'jute_cart_v1'

const CartContext = createContext()

export function CartProvider({ children }){
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)

  useEffect(()=>{
    const ok = isLocalStorageAvailable()
    setStorageAvailable(ok)
    if(!ok) return
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if(raw){
        setItems(JSON.parse(raw))
      }
    }catch{
      // ignore parse errors
    }
  }, [])

  useEffect(()=>{
    if(!storageAvailable) return
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }catch{
      // ignore
    }
  }, [items])

  const addItem = (product, qty = 1) =>{
    setItems(prev => {
      const found = prev.find(i=>i.id === product.id)
      if(found){
        return prev.map(i => i.id === product.id ? {...i, qty: i.qty + qty} : i)
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, producer: product.producer, qty }]
    })
    setIsOpen(true)
  }

  const removeItem = (id) => setItems(prev => prev.filter(i=>i.id !== id))

  const updateQty = (id, qty) => setItems(prev => prev.map(i=> i.id === id ? {...i, qty: Math.max(1, qty)} : i))

  const clear = ()=> setItems([])

  const count = items.reduce((s,i)=> s + i.qty, 0)
  const total = items.reduce((s,i)=> s + (i.qty * (i.price||0)), 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, count, total, isOpen, setIsOpen, storageAvailable }}>
      {children}
    </CartContext.Provider>
  )
}

// Note: `useCart` is provided from a separate helper module to avoid fast-refresh issues
export default CartContext
