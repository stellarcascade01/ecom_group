import { useState, useMemo } from 'react'
import { CategoryContext } from './context.js'

export function CategoryProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true)
  const value = useMemo(() => ({ isOpen, setIsOpen }), [isOpen])

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}
