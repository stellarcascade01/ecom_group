import React, { createContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'jute_favorites_v1'
const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }){
  const [favIds, setFavIds] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }catch{ return [] }
  })

  useEffect(()=>{
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(favIds)) }
    catch{ /* ignore persistence errors */ }
  }, [favIds])

  const add = (id)=> setFavIds(prev => prev.includes(id) ? prev : [...prev, id])
  const remove = (id)=> setFavIds(prev => prev.filter(x=> x !== id))
  const toggle = (id)=> setFavIds(prev => prev.includes(id) ? prev.filter(x=> x !== id) : [...prev, id])
  const isFavorite = (id)=> favIds.includes(id)
  const clear = ()=> setFavIds([])

  return (
    <FavoritesContext.Provider value={{ favIds, add, remove, toggle, isFavorite, clear }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export default FavoritesContext
