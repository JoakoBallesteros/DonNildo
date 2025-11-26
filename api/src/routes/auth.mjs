// api/src/routes/auth.mjs
import { Router } from "express";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

// ✅ Cliente admin (service role) para operaciones server-side de Auth
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const APP_BASE_URL = (process.env.APP_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const supaAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const router = Router();

/**
 * POST /v1/auth/password/reset
 * Body: { email: string }
 * Env:
 *  - APP_BASE_URL: base del front (ej. http://localhost:5173)
 *  - SUPABASE_URL / SUPABASE_SERVICE_ROLE
 */
router.post("/password/reset", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Falta email" });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return res.status(500).json({
        message:
          "Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE",
      });
    }

    // Adónde redirige el link del correo (ruta del front que muestra el form de nueva contraseña)
    const redirectTo = `${APP_BASE_URL}/reset`;

    const { error } = await supaAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    return res.json({
      ok: true,
      message:
        "Si la cuenta existe, enviamos un correo con el enlace de restablecimiento.",
    });
  } catch (e) {
    console.error("[auth/password/reset] unexpected:", e);
    return res.status(500).json({ message: "Error interno" });
  }
});

// --- TOUCH-SESSION: se llama DESPUÉS de un login exitoso ---
router.post("/touch-session", requireAuth, async (req, res) => {
  try {
    // 1) Obtener id_usuario INT a partir del token
    const userId = await getUserIdFromToken(req.accessToken);

    // 2) Registrar auditoría de login (no esperamos resultado crítico)
    registrarAuditoria(
      userId,
      "LOGIN", // tipo de evento
      "SEGURIDAD", // módulo
      `Inicio/Refresco de sesión OK para usuario ID ${userId}`
    );

    // 3) (Opcional) actualizar un timestamp de sesión
    const s = supaAsUser(req.accessToken);
    const { error } = await s
      .from("usuarios")
      .update({ session_started_at: new Date().toISOString() })
      .eq("id_auth", req.user.id); // req.user.id = auth.uid()

    if (error) {
      console.error("[touch-session] error al actualizar usuario:", error);
      return res
        .status(400)
        .json({ error: { message: error.message || "UPDATE_FAILED" } });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("[touch-session] unexpected:", e);
    res.status(500).json({ error: { message: e.message } });
  }
});

// --- LOGOUT AUDIT ---
router.post("/logout-audit", requireAuth, async (req, res) => {
  try {
    const userId = await getUserIdFromToken(req.accessToken);

    registrarAuditoria(
      userId,
      "LOGOUT",
      "SEGURIDAD",
      `Cierre de sesión para usuario ID ${userId}`
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("[auth/logout-audit] unexpected:", e);
    res.status(500).json({ error: { message: e.message } });
  }
});

export default router;
