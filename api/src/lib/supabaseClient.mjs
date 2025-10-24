import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;   // 👈 SIEMPRE SR

export const supa = createClient(url, key, { auth: { persistSession: false } });