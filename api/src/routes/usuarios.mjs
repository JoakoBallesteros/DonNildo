// ==========================================
// Rutas: /v1/usuarios
// ==========================================
// Maneja usuarios de aplicación (tabla 'usuarios').
// Solo ADMIN puede crear, modificar o eliminar.
// ==========================================

import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.mjs";
import { allowRoles } from "../middlewares/allowRoles.mjs"; 
import { supaAsUser } from "../lib/supabaseUserClient.mjs";
import { supaAdmin } from "../lib/supaAdmin.mjs";

import {
  registrarAuditoria,
  getUserIdFromToken,
} from "../utils/auditoriaService.mjs";

const router = Router();

// Helpers
const SITE_URL = process.env.SITE_URL || "http://localhost:5173";
const RESET_PATH = "/auth/reset";
const redirectTo = `${SITE_URL}${RESET_PATH}`;

// ===============================
// LISTAR (solo ADMIN)
// ===============================
router.get("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const { data, error } = await s
      .from("usuarios")
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, roles(id_rol, nombre)"
      )
      .order("id_usuario", { ascending: false });

    if (error) throw error;

    res.set("Cache-Control", "no-store");
    res.json({ usuarios: data });
  } catch (e) {
    console.error("[usuarios] list error:", e);
    res.status(500).json({ error: { message: e.message } });
  }
});

// ===============================
// OBTENER UNO (ADMIN o el propio usuario)
// ===============================
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);

    // Verificamos si el usuario es admin o está pidiendo su propio perfil
    const { data: me } = await s
      .from("usuarios")
      .select("id_usuario, roles(nombre)")
      .eq("id_auth", req.user.id)
      .single();

    if (me.roles.nombre !== "ADMIN" && me.id_usuario !== id) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }

    const { data, error } = await s
      .from("usuarios")
      .select(
        "id_usuario, dni, nombre, mail, estado, id_rol, id_auth, roles(id_rol, nombre)"
      )
      .eq("id_usuario", id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error("[usuarios] get error:", e);
    res.status(400).json({ error: { message: e.message } });
  }
});

// ===============================
// CREAR (solo ADMIN)
// Envia invitación por correo para establecer contraseña
// ===============================
router.post("/", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const { dni, nombre, mail, id_rol, estado = "ACTIVO" } = req.body || {};

    if (!nombre || !mail || !id_rol)
      return res.status(400).json({ error: { message: "Faltan datos" } });

    const email = String(mail).trim().toLowerCase();

    // 1️⃣ Enviar invitación
    const { data: invited, error: e1 } =
      await supaAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { dni, nombre },
      });
    if (e1) throw e1;

    // 2️⃣ Insertar en tabla 'usuarios'
    const { data, error: e2 } = await s
      .from("usuarios")
      .insert([{ dni, nombre, mail: email, id_rol, estado, id_auth: invited.user.id }])
      .select()
      .single();
    if (e2) throw e2;

    // 3️⃣ Auditoría CREAR_USUARIO
    try {
      const adminId = await getUserIdFromToken(req.accessToken); // quién hizo la acción
      registrarAuditoria(
        adminId,
        "CREAR_USUARIO",
        "SEGURIDAD",
        `Usuario creado: ${data.nombre} (${data.mail}) con rol ID ${data.id_rol}`
      );
    } catch (logErr) {
      console.warn("[usuarios] auditoría create falló:", logErr.message);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error("[usuarios] crear error:", err);
    res.status(400).json({ error: { message: err.message } });
  }
});

// ===============================
// UPDATE (solo ADMIN)
// ===============================
router.put("/:id", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);
    const { dni, nombre, mail, id_rol, estado } = req.body || {};

    const { data, error } = await s
      .from("usuarios")
      .update({
        dni,
        nombre,
        mail: mail ? String(mail).trim().toLowerCase() : undefined,
        id_rol,
        estado,
      })
      .eq("id_usuario", id)
      .select()
      .single();

    if (error) throw error;

    // Auditoría MODIFICAR_USUARIO
    try {
      const adminId = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        adminId,
        "MODIFICAR_USUARIO",
        "SEGURIDAD",
        `Usuario ID ${id} modificado: ${data.nombre} (${data.mail}), estado=${data.estado}, rol ID=${data.id_rol}`
      );
    } catch (logErr) {
      console.warn("[usuarios] auditoría update falló:", logErr.message);
    }

    res.json(data);
  } catch (e) {
    console.error("[usuarios] update error:", e);
    res.status(400).json({ error: { message: e.message } });
  }
});

// ===============================
// DELETE (solo ADMIN)
// Usa RPC 'usuarios_delete' (borra fila y deshabilita usuario en Auth)
// ===============================
router.delete("/:id", requireAuth, allowRoles(["ADMIN"]), async (req, res) => {
  try {
    const s = supaAsUser(req.accessToken);
    const id = Number(req.params.id);

    const { error } = await s.rpc("usuarios_delete", { p_id: id });
    if (error) throw error;

    // Auditoría ELIMINAR_USUARIO
    try {
      const adminId = await getUserIdFromToken(req.accessToken);
      registrarAuditoria(
        adminId,
        "ELIMINAR_USUARIO",
        "SEGURIDAD",
        `Usuario ID ${id} eliminado vía RPC usuarios_delete`
      );
    } catch (logErr) {
      console.warn("[usuarios] auditoría delete falló:", logErr.message);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[usuarios] delete error:", err);
    res.status(500).json({ error: { message: err.message } });
  }
});

export default router;
