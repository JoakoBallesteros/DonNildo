import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE
if (!url || !serviceRole) throw new Error('[supaAdmin] faltan envs')

export const supaAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
})