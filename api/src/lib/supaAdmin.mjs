import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE; 

if (!url || !serviceRoleKey) {
  throw new Error("[supaAdmin] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE");
}

export const supaAdmin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});