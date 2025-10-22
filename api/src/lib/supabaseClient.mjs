import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
// Usá SIEMPRE el ANON/PUBLISHABLE para auth de usuarios.
// (SERVICE_ROLE sólo en acciones server-side que lo requieran, nunca en el browser)
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY

export const supa = url && key
  ? createClient(url, key, { auth: { persistSession: false } })
  : null

