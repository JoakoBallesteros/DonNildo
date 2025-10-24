import { createClient } from '@supabase/supabase-js'

export function supaAsUser(accessToken) {
  if (!accessToken) throw new Error('NO_TOKEN_FOR_USER_CLIENT')
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY, // <-- tu Publishable key
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } }, // <-- token del user
    }
  )
}