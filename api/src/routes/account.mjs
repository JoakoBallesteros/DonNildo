// api/src/routes/account.mjs
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
// opcional: si querés sync de metadata en Auth
import { supaAdmin } from "../lib/supaAdmin.mjs";

const router = Router();

/**
 * GET /v1/account/me
 * Devuelve datos del usuario logueado (desde tabla usuarios + rol)
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    // req.user.id es el id de auth.users (uuid) seteado por requireAuth/attachRole
    const idAuth = req.user?.id;
    if (!idAuth) return res.status(401).json({ error: { message: "NO_AUTH" } });

    const { data, error } = await s
      .from("usuarios")
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, roles(nombre)"
      )
      .eq("id_auth", idAuth)
      .single();

    if (error) return res.status(400).json({ error: { message: error.message } });

    const payload = {
      id_usuario: data.id_usuario,
      nombre: data.nombre,
      dni: data.dni,
      mail: data.mail,
      estado: data.estado,
      rol: data.roles?.nombre || "—",
    };
    res.json(payload);
  } catch (e) {
    console.error("[account/me] unexpected:", e);
    res.status(500).json({ error: { message: "INTERNAL" } });
  }
});

/**
 * PUT /v1/account/me
 * Permite actualizar SOLO datos propios básicos (nombre, dni).
 * El mail lo dejamos solo lectura (cambiarlo suele requerir confirmación).
 */
router.put("/me", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const idAuth = req.user?.id;
    if (!idAuth) return res.status(401).json({ error: { message: "NO_AUTH" } });

    const { nombre, dni } = req.body || {};
    if (!nombre && !dni) {
      return res.status(400).json({ error: { message: "Sin cambios" } });
    }

    const { data, error } = await s
      .from("usuarios")
      .update({ nombre, dni })
      .eq("id_auth", idAuth)
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, roles(nombre)"
      )
      .single();

    if (error) return res.status(400).json({ error: { message: error.message } });

    // (Opcional) sincronizar metadata en Auth (nombre/dni)
    try {
      await supaAdmin.auth.admin.updateUserById(idAuth, {
        user_metadata: { nombre: data.nombre, dni: data.dni },
      });
    } catch (e) {
      // si falla metadata, no cortamos el flujo
      console.warn("[account/me] sync metadata warn:", e.message);
    }

    const payload = {
      id_usuario: data.id_usuario,
      nombre: data.nombre,
      dni: data.dni,
      mail: data.mail,
      estado: data.estado,
      rol: data.roles?.nombre || "—",
    };
    res.json(payload);
  } catch (e) {
    console.error("[account/me] unexpected:", e);
    res.status(500).json({ error: { message: "INTERNAL" } });
  }
});

export default router;