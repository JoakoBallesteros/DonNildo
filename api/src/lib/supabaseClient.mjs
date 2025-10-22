import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
// Usá SUPABASE_KEY (Publishable). Si no está, cae a SERVICE_ROLE.
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE

export const supa = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null

