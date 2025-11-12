import { Router } from "express";
import { supaAdmin } from "../lib/supaAdmin.mjs";

export const adminUsers = Router();

// POST /v1/admin/users/invite
adminUsers.post("/invite", async (req, res) => {
  try {
    const { email, nombre, dni, rol } = req.body || {};
    if (!email || !rol) {
      return res.status(400).json({ ok: false, error: "MISSING_FIELDS" });
    }

    // Redirige a tu página de “establecer contraseña”
    // Usa la que ya tenés (por ejemplo /auth/reset o /auth/set-password)
    const redirectTo = `${process.env.APP_URL || "http://localhost:5173"}/auth/reset`;

    const { data, error } = await supaAdmin.auth.admin.inviteUserByEmail(email, {
      data: { nombre, dni, rol },   // metadata para el trigger
      redirectTo,
    });
    if (error) throw error;

    return res.json({ ok: true, user: data?.user ?? null });
  } catch (e) {
    console.error("[inviteUser]", e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default adminUsers;