const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_API_KEY || localStorage.getItem('smarthire_api_key') || 'dev-smarthire-2025'

const headers = (isForm = false) => {
  const h = { 'X-API-Key': API_KEY }
  if (!isForm) h['Content-Type'] = 'application/json'
  return h
}

export const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, { headers: headers() })
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`)
    return res.json()
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`)
    return res.json()
  },
  postForm: async (path, formData) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'X-API-Key': API_KEY },
      body: formData
    })
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`)
    return res.json()
  },
  delete: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: headers()
    })
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`)
    return res.json()
  }
}
