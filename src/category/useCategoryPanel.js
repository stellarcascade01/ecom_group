import { useContext } from 'react'
import { CategoryContext } from './context.js'

export function useCategoryPanel() {
  const ctx = useContext(CategoryContext)
  if (!ctx) throw new Error('useCategoryPanel must be used within <CategoryProvider>')
  return ctx
}
