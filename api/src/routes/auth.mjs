// api/src/routes/auth.mjs
import { Router } from "express";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

const router = Router();

// --- RESET PASSWORD (lo que ya tenías) ---
router.post("/password/reset", async (req, res) => {
  /* ... tu código actual ... */
});

// --- TOUCH-SESSION: se llama DESPUÉS de un login exitoso ---
router.post("/touch-session", requireAuth, async (req, res) => {
  try {
    // 1) Obtener id_usuario INT a partir del token
    const userId = await getUserIdFromToken(req.accessToken);

    // 2) Registrar auditoría de login (no esperamos resultado crítico)
    registrarAuditoria(
      userId,
      "LOGIN",         // tipo de evento
      "SEGURIDAD",     // módulo
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

 