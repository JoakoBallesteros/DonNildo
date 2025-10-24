import { createClient } from '@supabase/supabase-js'

export const supa = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,      // guarda sesión
      autoRefreshToken: true,    // renueva access_token solo
      detectSessionInUrl: true,
    },
  }
)