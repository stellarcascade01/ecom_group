const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')

// Set this at build time on Render (or in local .env) to point the frontend at the backend.
// Examples:
// - Local dev:   VITE_API_BASE_URL=http://localhost:5000
// - Render:      VITE_API_BASE_URL=https://ecom-group.onrender.com
const API_BASE = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL)

export function apiUrl(path){
  if (!path) return ''
  const value = String(path)
  if (/^https?:\/\//i.test(value)) return value

  if (!API_BASE) {
    // Use relative URLs (ideal with Vite dev proxy or same-origin deployments)
    return value.startsWith('/') ? value : `/${value}`
  }

  return value.startsWith('/') ? `${API_BASE}${value}` : `${API_BASE}/${value}`
}

export function fileUrl(path){
  if (!path) return ''
  return apiUrl(path)
}
