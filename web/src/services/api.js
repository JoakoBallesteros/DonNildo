//define la baseURL y funciones para login.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function login(mail, password) {
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mail, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}