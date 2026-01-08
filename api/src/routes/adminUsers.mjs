// api/src/routes/adminUsers.mjs
import { Router } from "express";
import { supaAdmin } from "../lib/supaAdmin.mjs";

export const adminUsers = Router();

function normalizeBaseUrl(url) {
  if (!url) return "";
  return String(url).trim().replace(/\/+$/, "");
}

// POST /api/v1/admin/users/invite  (según cómo lo montes)
adminUsers.post("/invite", async (req, res) => {
  try {
    const { email, nombre, dni, rol } = req.body || {};
    if (!email || !rol) {
      return res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
    }

    // ✅ Dominio del FRONT (web) — en Railway usás APP_BASE_URL
    const FRONT_BASE =
      normalizeBaseUrl(process.env.APP_BASE_URL) ||
      normalizeBaseUrl(process.env.APP_URL) || // por compat si existiera
      "http://localhost:5173";

    // ✅ Ruta pública donde tu app hace exchangeCodeForSession + updateUser(password)
    // Elegí UNA y listo:
    const redirectTo = `${FRONT_BASE}/reset`; // o `${FRONT_BASE}/auth/reset`

    const { data, error } = await supaAdmin.auth.admin.inviteUserByEmail(email, {
      data: { nombre, dni, rol },
      redirectTo,
    });

    if (error) {
      console.error("[inviteUser] Supabase error:", error);
      return res.status(400).json({ ok: false, error: error.message });
    }

    return res.json({ ok: true, user: data?.user ?? null, redirectTo });
  } catch (e) {
    console.error("[inviteUser] unexpected:", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default adminUsers;
