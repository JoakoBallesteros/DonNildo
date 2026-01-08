import { Router } from "express";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// Dominio del FRONT (fallback producción)
const APP_BASE_URL = (
  process.env.APP_BASE_URL ||
  "https://donnildo-production.up.railway.app"
).replace(/\/$/, "");

// URL directa que esta en railway
const RESET_REDIRECT_URL = process.env.RESET_REDIRECT_URL;

const supaAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const router = Router();

/**
 * POST /v1/auth/password/reset
 * Body: { email: string }
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

    // Manda al front a reset el mail
    const redirectTo =
      (RESET_REDIRECT_URL || `${APP_BASE_URL}/reset`).replace(/\/$/, "/reset");

    const { error } = await supaAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("[auth/password/reset] Supabase error:", error);
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
    const s = supaAsUser(req.accessToken);

    // 1) Buscar usuario de la tabla `usuarios` por id_auth
    const { data: u, error } = await s
      .from("usuarios")
      .select("id_usuario, nombre, estado, roles(nombre)")
      .eq("id_auth", req.user.id) // req.user.id = auth.uid() de Supabase
      .maybeSingle();

    if (error) {
      console.error("[touch-session] error select usuarios:", error);
      return res
        .status(500)
        .json({ error: { message: "Error al validar la sesión." } });
    }

    if (!u) {
      return res.status(403).json({
        error: {
          message:
            "Tu usuario no está registrado en la aplicación. Consultá con un administrador.",
        },
      });
    }

    // 2) Validar estado ACTIVO
    if ((u.estado || "").toUpperCase() !== "ACTIVO") {
      return res.status(403).json({
        error: {
          message:
            "Tu usuario está inactivo. Por favor, contactá a un administrador.",
        },
      });
    }

    // 3) Actualizar timestamp de sesión (opcional)
    const { error: updError } = await s
      .from("usuarios")
      .update({ session_started_at: new Date().toISOString() })
      .eq("id_usuario", u.id_usuario);

    if (updError) {
      console.error("[touch-session] error update usuarios:", updError);
    }

    // 4) Auditoría de LOGIN
    try {
      registrarAuditoria(
        u.id_usuario,
        "LOGIN",
        "SEGURIDAD",
        `Inicio/Refresco de sesión OK para usuario ID ${u.id_usuario}`
      );
    } catch (logErr) {
      console.warn("[touch-session] auditoría falló:", logErr.message);
    }

    // 5) Devolvemos datos básicos para el front
    return res.json({
      ok: true,
      usuario: {
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        rol: u.roles?.nombre || null,
      },
    });
  } catch (e) {
    console.error("[touch-session] unexpected:", e);
    return res.status(500).json({
      error: { message: "Error al validar la sesión." },
    });
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
