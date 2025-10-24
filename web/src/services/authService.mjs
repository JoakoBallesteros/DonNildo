import { supa } from '../lib/supabaseClient'

// Mantener dn_token sincronizado con la sesión de Supabase
supa.auth.onAuthStateChange((_event, session) => {
  const t = session?.access_token || null
  if (t) localStorage.setItem('dn_token', t)
  else localStorage.removeItem('dn_token')
})

// Login directo con Supabase (sin pasar por tu API)
export async function signIn(email, password) {
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signOut() {
  await supa.auth.signOut()
}