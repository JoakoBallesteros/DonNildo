import { supa } from '../lib/supabaseClient'

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

async function getAccessToken() {
  const { data: { session } } = await supa.auth.getSession()
  return session?.access_token || localStorage.getItem('dn_token') || null
}

async function request(url, options = {}, retry = true) {
  const token = await getAccessToken()
  const resp = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  // Si expira y el backend devuelve 401, intentamos refrescar y reintentar 1 vez
  if (resp.status === 401 && retry) {
    await supa.auth.refreshSession().catch(() => {})
    return request(url, options, /*retry*/ false)
  }

  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(data?.error || data?.message || 'Error en la solicitud')
  return data
}

export async function listarUsuarios() {
  const { usuarios } = await request(`${BASE}/v1/usuarios`)
  return usuarios
}
export async function listarRoles() {
  const { roles } = await request(`${BASE}/v1/roles`)
  return roles
}
export async function crearUsuario(payload) {
  return request(`${BASE}/v1/usuarios`, { method: 'POST', body: JSON.stringify(payload) })
}
export async function actualizarUsuario(id, payload) {
  return request(`${BASE}/v1/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}
export async function eliminarUsuario(id) {
  return request(`${BASE}/v1/usuarios/${id}`, { method: 'DELETE' })
}