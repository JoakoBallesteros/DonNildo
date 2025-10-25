// api/src/lib/supabaseUserClient.mjs
import { createClient } from '@supabase/supabase-js'

export function supaAsUser(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
