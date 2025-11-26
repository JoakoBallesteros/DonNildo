import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE; 

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.warn("[supabase] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE en .env");
}

export const supaAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});