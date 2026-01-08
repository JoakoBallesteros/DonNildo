// api/src/routes/auth.mjs
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

const router = Router();

// Supabase admin (service role)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// Config (recomendado)
const APP_BASE_URL = process.env.APP_BASE_URL; // ej: http://localhost:5173 | https://tudominio.com
const RESET_REDIRECT_URL = process.env.RESET_REDIRECT_URL; // ej: https://tudominio.com/reset (
const ALLOWED_RESET_ORIGINS = (process.env.ALLOWED_RESET_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function normalizeBaseUrl(url) {
  if (!url) return "";
  return String(url).trim().replace(/\/+$/, "");
}

function ensureResetUrl(urlOrBase) {
  const u = String(urlOrBase || "").trim();
  if (!u) return "";
  // Si ya termina en /reset (o /reset/)
  if (/\/reset\/?$/.test(u)) return u.replace(/\/+$/, "");
  return `${u.replace(/\/+$/, "")}/reset`;
}

function pickOriginFromRequest(req) {
  // fetch() desde el browser trae Origin; fallback a Referer
  const origin = req.get("origin");
  if (origin) return origin;

  const ref = req.get("referer") || "";
  try {
    if (ref) return new URL(ref).origin;
  } catch {
    // ignore
  }
  return "";
}

function isOriginAllowed(origin) {
  if (!origin) return false;

  // Si no seteaste allowlist:
  // - en DEV permitimos origin dinámico
  // - en PROD NO (para evitar open-redirect)
  if (ALLOWED_RESET_ORIGINS.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  return ALLOWED_RESET_ORIGINS.includes(origin);
}

function computeRedirectTo(req) {
  // 1) URL exacta (opcional)
  if (RESET_REDIRECT_URL) return ensureResetUrl(RESET_REDIRECT_URL);

  // 2) Base URL configurada
  if (APP_BASE_URL) return ensureResetUrl(normalizeBaseUrl(APP_BASE_URL));

  // 3) Inferir desde el request (útil en DEV)
  const origin = pickOriginFromRequest(req);
  if (origin && isOriginAllowed(origin)) return ensureResetUrl(origin);

  return "";
}

let supaAdmin = null;
function getSupaAdmin() {
  if (supaAdmin) return supaAdmin;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;

  supaAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return supaAdmin;
}

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

    const admin = getSupaAdmin();
    if (!admin) {
      return res.status(500).json({
        message:
          "Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE",
      });
    }

    const redirectTo = computeRedirectTo(req);
    if (!redirectTo) {
      return res.status(500).json({
        message:
          "No se pudo determinar redirectTo. Configurá APP_BASE_URL o RESET_REDIRECT_URL (o ALLOWED_RESET_ORIGINS para usar Origin en dev).",
      });
    }

    const { error } = await admin.auth.resetPasswordForEmail(email, {
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

// --- TOUCH-SESSION ---
router.post("/touch-session", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);

    const { data: u, error } = await s
      .from("usuarios")
      .select("id_usuario, nombre, estado, roles(nombre)")
      .eq("id_auth", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("[touch-session] error select usuarios:", error);
      return res
        .status(500)
        .json({ error: { message: "Error al validar la sesión." } });
    }

    if (!u) {
      return res.status(403).json({
        error: { message: "Tu usuario no está registrado en la aplicación." },
      });
    }

    if ((u.estado || "").toUpperCase() !== "ACTIVO") {
      return res.status(403).json({
        error: { message: "Tu usuario está inactivo." },
      });
    }

    // Actualizar timestamp (opcional, no bloqueante)
    await s
      .from("usuarios")
      .update({ session_started_at: new Date().toISOString() })
      .eq("id_usuario", u.id_usuario);

    // Auditoría
    try {
      registrarAuditoria(
        u.id_usuario,
        "LOGIN",
        "SEGURIDAD",
        `Inicio/Refresco de sesión OK para usuario ID ${u.id_usuario}`
      );
    } catch (logErr) {
      console.warn("[touch-session] auditoría warning:", logErr.message);
    }

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
    return res
      .status(500)
      .json({ error: { message: "Error al validar la sesión." } });
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
